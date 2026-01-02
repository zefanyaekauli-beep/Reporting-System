# backend/app/divisions/cleaning/routes.py

from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
    Form,
    Body,
)
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.attendance import Attendance, AttendanceStatus
from app.models.shift import Shift, ShiftStatus
from app.models.site import Site
from . import models, schemas
from app.divisions.security.models import Checklist, ChecklistItem, ChecklistStatus, ChecklistItemStatus, ChecklistTemplate, SecurityReport
from app.divisions.security import schemas as security_schemas
import os

router = APIRouter(tags=["cleaning"])

# Create media directories
MEDIA_BASE = "media"
CLEANING_REPORTS_DIR = f"{MEDIA_BASE}/cleaning_reports"
CLEANING_ATTENDANCE_DIR = f"{MEDIA_BASE}/cleaning_attendance"

for dir_path in [CLEANING_REPORTS_DIR, CLEANING_ATTENDANCE_DIR]:
    os.makedirs(dir_path, exist_ok=True)

# ---- Cleaning Zones ----

@router.get("/zones", response_model=List[schemas.CleaningZoneBase])
def list_cleaning_zones(
    site_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(True),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all cleaning zones for a site."""
    try:
        from sqlalchemy import or_
        # Query with division filter, including NULL for backward compatibility
        q = db.query(models.CleaningZone).filter(
            models.CleaningZone.company_id == current_user.get("company_id", 1),
            or_(
                models.CleaningZone.division == "CLEANING",
                models.CleaningZone.division.is_(None)
            )
        )
        if site_id:
            q = q.filter(models.CleaningZone.site_id == site_id)
        if is_active is not None:
            q = q.filter(models.CleaningZone.is_active == is_active)
        zones = q.all()
        
        # Update any NULL division values to CLEANING
        updated = False
        for zone in zones:
            if hasattr(zone, 'division') and zone.division is None:
                zone.division = "CLEANING"
                updated = True
        
        if updated:
            try:
                db.commit()
            except Exception as commit_err:
                db.rollback()
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Could not commit division updates: {commit_err}")
        
        return zones
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error listing cleaning zones: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list cleaning zones: {str(e)}")

@router.post("/zones", response_model=schemas.CleaningZoneBase)
def create_cleaning_zone(
    payload: schemas.CleaningZoneCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new cleaning zone."""
    zone = models.CleaningZone(
        company_id=current_user.get("company_id", 1),
        site_id=payload.site_id,
        name=payload.name,
        floor=payload.floor,
        area_type=payload.area_type,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone

@router.get("/zones/{zone_id}", response_model=schemas.CleaningZoneBase)
def get_cleaning_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific cleaning zone."""
    zone = (
        db.query(models.CleaningZone)
        .filter(
            models.CleaningZone.id == zone_id,
            models.CleaningZone.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not zone:
        raise HTTPException(status_code=404, detail="Cleaning zone not found")
    return zone

# ---- Today's Cleaning Tasks (Cleaner Mobile) ----

@router.get("/tasks/today", response_model=List[schemas.CleaningZoneWithTasks])
def get_today_cleaning_tasks(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get today's cleaning tasks for the current user (cleaner).
    Shows assigned zones with checklist status.
    """
    user_id = current_user.get("id")
    company_id = current_user.get("company_id", 1)
    today = date.today()
    
    # Get zones for the site
    q = db.query(models.CleaningZone).filter(
        models.CleaningZone.company_id == company_id,
        models.CleaningZone.is_active == True,
    )
    if site_id:
        q = q.filter(models.CleaningZone.site_id == site_id)
    zones = q.all()
    
    result = []
    for zone in zones:
        # Find checklist for this zone today
        checklist = (
            db.query(Checklist)
            .filter(
                Checklist.company_id == company_id,
                Checklist.site_id == zone.site_id,
                Checklist.user_id == user_id,
                Checklist.shift_date == today,
                Checklist.context_type == "CLEANING_ZONE",
                Checklist.context_id == zone.id,
            )
            .first()
        )
        
        task_count = 0
        completed_count = 0
        status = "NOT_DONE"
        checklist_data = None
        
        if checklist:
            checklist_data = {
                "id": checklist.id,
                "status": checklist.status.value if hasattr(checklist.status, "value") else str(checklist.status),
            }
            items = checklist.items
            task_count = len(items)
            completed_count = len([item for item in items if item.status in [ChecklistItemStatus.COMPLETED, ChecklistItemStatus.NOT_APPLICABLE]])
            
            if checklist.status == ChecklistStatus.COMPLETED:
                status = "CLEANED_ON_TIME"
            elif completed_count > 0:
                status = "PARTIAL"
        else:
            # Check if there's a template for this zone
            zone_template = (
                db.query(models.CleaningZoneTemplate)
                .filter(
                    models.CleaningZoneTemplate.zone_id == zone.id,
                    models.CleaningZoneTemplate.is_active == True,
                )
                .first()
            )
            if zone_template:
                # Count tasks from template
                template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == zone_template.checklist_template_id).first()
                if template:
                    task_count = len(template.items)
        
        # Calculate KPI status
        kpi_status = None
        kpi_summary = {}
        last_cleaned_at = None
        
        if checklist:
            last_cleaned_at = checklist.completed_at
            # Analyze KPI values from checklist items
            items = checklist.items
            kpi_values = {}
            for item in items:
                if item.kpi_key:
                    if item.answer_type == "BOOLEAN":
                        kpi_values[item.kpi_key] = item.answer_bool
                    elif item.answer_type == "CHOICE":
                        kpi_values[item.kpi_key] = item.answer_text
                    elif item.answer_type == "TEXT":
                        kpi_values[item.kpi_key] = item.answer_text
            
            kpi_summary = kpi_values
            
            # Determine KPI status
            # OK: all critical KPIs good (TOILET_CLEAN=YES, TISSUE_STOCK=OK/FULL, SOAP_STOCK=OK/FULL)
            # WARN: some KPIs low but not critical
            # FAIL: critical KPIs bad
            if kpi_values.get("TOILET_CLEAN") == False:
                kpi_status = "FAIL"
            elif kpi_values.get("TISSUE_STOCK") in ["NONE", "LOW"] or kpi_values.get("SOAP_STOCK") in ["NONE", "LOW"]:
                kpi_status = "WARN"
            elif kpi_values.get("TOILET_CLEAN") == True and kpi_values.get("TISSUE_STOCK") in ["OK", "FULL"] and kpi_values.get("SOAP_STOCK") in ["OK", "FULL"]:
                kpi_status = "OK"
        
        result.append(schemas.CleaningZoneWithTasks(
            zone=zone,
            checklist=checklist_data,
            task_count=task_count,
            completed_count=completed_count,
            status=status,
            kpi_status=kpi_status,
            last_cleaned_at=last_cleaned_at,
            kpi_summary=kpi_summary,
        ))
    
    return result

@router.get("/zones/{zone_id}/checklist", response_model=dict)
def get_zone_checklist(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get or create checklist for a specific zone for today.
    """
    user_id = current_user.get("id")
    company_id = current_user.get("company_id", 1)
    today = date.today()
    
    # Verify zone exists
    zone = (
        db.query(models.CleaningZone)
        .filter(
            models.CleaningZone.id == zone_id,
            models.CleaningZone.company_id == company_id,
        )
        .first()
    )
    if not zone:
        raise HTTPException(status_code=404, detail="Cleaning zone not found")
    
    # Find or create checklist
    checklist = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == company_id,
            Checklist.site_id == zone.site_id,
            Checklist.user_id == user_id,
            Checklist.shift_date == today,
            Checklist.context_type == "CLEANING_ZONE",
            Checklist.context_id == zone.id,
        )
        .first()
    )
    
    if not checklist:
        # Find template for this zone
        zone_template = (
            db.query(models.CleaningZoneTemplate)
            .filter(
                models.CleaningZoneTemplate.zone_id == zone_id,
                models.CleaningZoneTemplate.is_active == True,
            )
            .first()
        )
        
        if not zone_template:
            raise HTTPException(status_code=404, detail="No checklist template found for this zone")
        
        template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == zone_template.checklist_template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Checklist template not found")
        
        # Create checklist from template
        checklist = Checklist(
            company_id=company_id,
            site_id=zone.site_id,
            user_id=user_id,
            template_id=template.id,
            shift_date=today,
            context_type="CLEANING_ZONE",
            context_id=zone.id,
            status=ChecklistStatus.OPEN,
        )
        db.add(checklist)
        db.flush()
        
        # Create checklist items from template
        for order, template_item in enumerate(template.items, start=1):
            item = ChecklistItem(
                checklist_id=checklist.id,
                template_item_id=template_item.id,
                order=order,
                title=template_item.title,
                description=template_item.description,
                required=template_item.required,
                evidence_type=template_item.evidence_type,
                status=ChecklistItemStatus.PENDING,
                # Copy KPI fields from template
                kpi_key=template_item.kpi_key,
                answer_type=template_item.answer_type,
            )
            db.add(item)
        
        db.commit()
        db.refresh(checklist)
    
    # Return checklist with items
    items = [
        {
            "id": item.id,
            "order": item.order,
            "title": item.title,
            "description": item.description,
            "required": item.required,
            "evidence_type": item.evidence_type,
            "status": item.status.value if hasattr(item.status, "value") else str(item.status),
            "completed_at": item.completed_at.isoformat() if item.completed_at else None,
            "note": item.note,
            "evidence_id": item.evidence_id,
            # KPI fields
            "kpi_key": item.kpi_key,
            "answer_type": item.answer_type,
            "photo_required": getattr(template_item, "photo_required", False) if hasattr(template_item, "photo_required") else False,
            "answer_bool": item.answer_bool,
            "answer_int": item.answer_int,
            "answer_text": item.answer_text,
            "photo_id": item.photo_id,
        }
        for item in checklist.items
    ]
    
    return {
        "id": checklist.id,
        "zone_id": zone_id,
        "status": checklist.status.value if hasattr(checklist.status, "value") else str(checklist.status),
        "items": items,
    }

@router.get("/tasks/{checklist_id}/detail")
def get_cleaning_task_detail(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get detailed cleaning task/checklist information."""
    from app.core.logger import api_logger
    from app.models.user import User
    from app.models.site import Site
    from sqlalchemy.orm import joinedload
    from app.divisions.security.models import ChecklistItemStatus, ChecklistStatus
    
    try:
        checklist = (
            db.query(Checklist)
            .options(joinedload(Checklist.items))
            .filter(
                Checklist.id == checklist_id,
                Checklist.company_id == current_user.get("company_id", 1),
                Checklist.division == "CLEANING",
            )
            .first()
        )
        
        if not checklist:
            raise HTTPException(status_code=404, detail="Cleaning task not found")
        
        # Get user and site info
        user = db.query(User).filter(User.id == checklist.user_id).first()
        site = db.query(Site).filter(Site.id == checklist.site_id).first()
        
        # Get zone info if context_type is CLEANING_ZONE
        zone = None
        if checklist.context_type == "CLEANING_ZONE" and checklist.context_id:
            zone = db.query(models.CleaningZone).filter(
                models.CleaningZone.id == checklist.context_id
            ).first()
        
        # Build checklist items with evidence
        items_detail = []
        for item in checklist.items:
            item_data = {
                "id": item.id,
                "order": item.order,
                "title": item.title,
                "description": item.description,
                "required": item.required,
                "evidence_type": item.evidence_type,
                "status": item.status.value if hasattr(item.status, 'value') else str(item.status),
                "completed_at": item.completed_at.isoformat() if item.completed_at else None,
                "evidence": [],
            }
            
            # Get evidence (photos, notes, etc.)
            if item.evidence_id:
                # If evidence_id exists, get evidence details
                from app.models.evidence import Evidence
                evidence = db.query(Evidence).filter(Evidence.id == item.evidence_id).first()
                if evidence:
                    item_data["evidence"] = [{"type": "photo", "path": evidence.file_path}]
            elif hasattr(item, 'photo_id') and item.photo_id:
                item_data["evidence"] = [{"type": "photo", "id": item.photo_id}]
            
            if hasattr(item, 'note') and item.note:
                item_data["notes"] = item.note
            
            if hasattr(item, 'answer_text') and item.answer_text:
                item_data["answer"] = item.answer_text
            elif hasattr(item, 'answer_bool') and item.answer_bool is not None:
                item_data["answer"] = str(item.answer_bool)
            elif hasattr(item, 'answer_int') and item.answer_int is not None:
                item_data["answer"] = str(item.answer_int)
            
            items_detail.append(item_data)
        
        # Calculate completion
        total_items = len(checklist.items)
        completed_items = sum(1 for item in checklist.items if item.status == ChecklistItemStatus.COMPLETED)
        completion_percentage = (completed_items / total_items * 100) if total_items > 0 else 0
        
        # Build timeline
        timeline = []
        timeline.append({
            "time": checklist.created_at.isoformat(),
            "type": "CREATED",
            "description": "Task created",
        })
        
        for item in sorted(checklist.items, key=lambda x: x.completed_at if hasattr(x, 'completed_at') and x.completed_at else datetime.min):
            if hasattr(item, 'completed_at') and item.completed_at:
                timeline.append({
                    "time": item.completed_at.isoformat(),
                    "type": "ITEM_COMPLETED",
                    "description": f"Completed: {item.title}",
                })
        
        if checklist.status == ChecklistStatus.COMPLETED:
            timeline.append({
                "time": checklist.updated_at.isoformat(),
                "type": "COMPLETED",
                "description": "Task completed",
            })
        
        result = {
            "id": checklist.id,
            "user": {
                "id": checklist.user_id,
                "name": user.username if user else f"User {checklist.user_id}",
            },
            "site": {
                "id": checklist.site_id,
                "name": site.name if site else f"Site {checklist.site_id}",
            },
            "zone": {
                "id": zone.id if zone else None,
                "name": zone.name if zone else None,
                "code": zone.code if zone else None,
            } if zone else None,
            "shift_date": checklist.shift_date.isoformat() if checklist.shift_date else None,
            "status": checklist.status.value if hasattr(checklist.status, 'value') else str(checklist.status),
            "completion": {
                "total_items": total_items,
                "completed_items": completed_items,
                "completion_percentage": round(completion_percentage, 2),
            },
            "items": items_detail,
            "timeline": timeline,
            "created_at": checklist.created_at.isoformat(),
            "updated_at": checklist.updated_at.isoformat(),
        }
        
        api_logger.info(f"Retrieved cleaning task detail {checklist_id} for user {current_user.get('id')}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logger import api_logger
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting cleaning task detail: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cleaning task detail: {error_msg}"
        )

# ---- Cleaning Dashboard (Supervisor) ----

@router.get("/dashboard", response_model=List[schemas.CleaningZoneWithTasks])
def get_cleaning_dashboard(
    site_id: Optional[int] = Query(None),
    date_filter: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Supervisor dashboard: List all zones with cleaning status.
    """
    company_id = current_user.get("company_id", 1)
    filter_date = date_filter or date.today()
    
    # Get all zones
    q = db.query(models.CleaningZone).filter(
        models.CleaningZone.company_id == company_id,
        models.CleaningZone.is_active == True,
    )
    if site_id:
        q = q.filter(models.CleaningZone.site_id == site_id)
    zones = q.all()
    
    result = []
    for zone in zones:
        # Find all checklists for this zone on the filter date
        checklists = (
            db.query(Checklist)
            .filter(
                Checklist.company_id == company_id,
                Checklist.site_id == zone.site_id,
                Checklist.shift_date == filter_date,
                Checklist.context_type == "CLEANING_ZONE",
                Checklist.context_id == zone.id,
            )
            .all()
        )
        
        total_tasks = 0
        total_completed = 0
        status = "NOT_DONE"
        assigned_cleaner = None
        
        if checklists:
            for checklist in checklists:
                items = checklist.items
                total_tasks += len(items)
                total_completed += len([item for item in items if item.status in [ChecklistItemStatus.COMPLETED, ChecklistItemStatus.NOT_APPLICABLE]])
                
                if checklist.status == ChecklistStatus.COMPLETED:
                    status = "CLEANED_ON_TIME"
                elif total_completed > 0 and status != "CLEANED_ON_TIME":
                    status = "PARTIAL"
            
            # Get assigned cleaner (first checklist's user)
            if checklists[0].user_id:
                user = db.query(User).filter(User.id == checklists[0].user_id).first()
                if user:
                    assigned_cleaner = user.username
        else:
            # Check template to get task count
            zone_template = (
                db.query(models.CleaningZoneTemplate)
                .filter(
                    models.CleaningZoneTemplate.zone_id == zone.id,
                    models.CleaningZoneTemplate.is_active == True,
                )
                .first()
            )
            if zone_template:
                template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == zone_template.checklist_template_id).first()
                if template:
                    total_tasks = len(template.items)
        
        result.append(schemas.CleaningZoneWithTasks(
            zone=zone,
            checklist=None,  # Supervisor view doesn't need individual checklist
            task_count=total_tasks,
            completed_count=total_completed,
            status=status,
        ))
    
    return result

# ---- Cleaning Inspections ----

@router.post("/inspections", response_model=schemas.CleaningInspectionBase)
def create_cleaning_inspection(
    payload: schemas.CleaningInspectionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a quality inspection for a cleaning zone."""
    # Verify zone exists
    zone = (
        db.query(models.CleaningZone)
        .filter(
            models.CleaningZone.id == payload.zone_id,
            models.CleaningZone.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not zone:
        raise HTTPException(status_code=404, detail="Cleaning zone not found")
    
    inspection = models.CleaningInspection(
        company_id=current_user.get("company_id", 1),
        site_id=zone.site_id,
        zone_id=payload.zone_id,
        inspector_id=current_user.get("id"),
        score=payload.score,
        status=payload.status,
        notes=payload.notes,
        inspection_date=payload.inspection_date or date.today(),
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return inspection

@router.get("/inspections", response_model=List[schemas.CleaningInspectionBase])
def list_cleaning_inspections(
    zone_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List cleaning inspections."""
    q = db.query(models.CleaningInspection).filter(
        models.CleaningInspection.company_id == current_user.get("company_id", 1),
    )
    if zone_id:
        q = q.filter(models.CleaningInspection.zone_id == zone_id)
    if site_id:
        q = q.filter(models.CleaningInspection.site_id == site_id)
    return q.order_by(models.CleaningInspection.inspection_date.desc()).all()

# ---- Attendance (using unified Attendance model) ----

@router.get("/attendance/today")
def get_today_attendance(
    site_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get today's attendance for cleaning staff."""
    today = date.today()
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == current_user.get("id"),
            Attendance.site_id == site_id,
            Attendance.role_type == "CLEANING",
            Attendance.checkin_time >= datetime.combine(today, datetime.min.time()),
            Attendance.checkin_time < datetime.combine(today + timedelta(days=1), datetime.min.time()),
        )
        .order_by(Attendance.checkin_time.desc())
        .first()
    )
    
    if not attendance:
        return None
    
    return {
        "id": attendance.id,
        "site_id": attendance.site_id,
        "checkin_time": attendance.checkin_time.isoformat() if attendance.checkin_time else None,
        "checkout_time": attendance.checkout_time.isoformat() if attendance.checkout_time else None,
        "status": attendance.status.value if hasattr(attendance.status, "value") else str(attendance.status),
        "is_valid_location": attendance.is_valid_location,
    }

# ---- Reports ----

@router.post("/reports", response_model=security_schemas.SecurityReportOut)
async def create_cleaning_report(
    report_type: str = Form(...),
    site_id: int = Form(...),
    zone_id: Optional[int] = Form(None),
    location_text: Optional[str] = Form(None),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    severity: Optional[str] = Form(None),
    evidence_files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a cleaning report."""
    from app.core.logger import api_logger
    import re
    import traceback
    
    try:
        api_logger.info(f"Creating cleaning report - user_id: {current_user.get('id')}, site_id: {site_id}, title: {title[:50] if title else 'None'}")
        
        # Validate and sanitize required fields
        if not title or not title.strip():
            api_logger.warning("Title is missing or empty")
            raise HTTPException(status_code=400, detail="Title is required")
        if not report_type or not report_type.strip():
            api_logger.warning("Report type is missing or empty")
            raise HTTPException(status_code=400, detail="Report type is required")
        
        # Get user info
        user_id = current_user.get("id")
        company_id = current_user.get("company_id", 1)
        
        if not user_id:
            api_logger.error("User ID not found in token")
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        api_logger.info(f"User info - user_id: {user_id}, company_id: {company_id}")
        
        # Validate site_id exists
        from app.models.site import Site
        site = db.query(Site).filter(Site.id == site_id).first()
        if not site:
            api_logger.warning(f"Site {site_id} not found")
            raise HTTPException(status_code=404, detail=f"Site with ID {site_id} not found")
        api_logger.info(f"Site validated: {site.name}")
        
        # Validate zone_id if provided
        if zone_id is not None:
            zone = db.query(models.CleaningZone).filter(
                models.CleaningZone.id == zone_id,
                models.CleaningZone.company_id == company_id,
                models.CleaningZone.division == "CLEANING"
            ).first()
            if not zone:
                api_logger.warning(f"Cleaning zone {zone_id} not found for company {company_id}")
                raise HTTPException(status_code=404, detail=f"Cleaning zone with ID {zone_id} not found")
            api_logger.info(f"Zone validated: {zone.name}")
        
        evidence_paths: List[str] = []

        # Handle file uploads
        if evidence_files:
            # Ensure directory exists
            try:
                os.makedirs(CLEANING_REPORTS_DIR, exist_ok=True)
            except Exception as dir_err:
                error_msg = str(dir_err)
                error_type = type(dir_err).__name__
                api_logger.error(f"Failed to create directory {CLEANING_REPORTS_DIR}: {error_type} - {error_msg}")
                raise HTTPException(status_code=500, detail=f"Failed to create media directory: {error_msg}")
            
            # Get site and user info for watermark
            from app.models.site import Site
            from app.models.user import User
            site = db.query(Site).filter(Site.id == site_id).first()
            user = db.query(User).filter(User.id == user_id).first()
            
            try:
                from app.services.evidence_storage import save_multiple_evidence_files
                evidence_paths = await save_multiple_evidence_files(
                    [f for f in evidence_files if f and f.filename],
                    upload_dir=CLEANING_REPORTS_DIR,
                    location=location_text,
                    site_name=site.name if site else None,
                    user_name=user.username if user else None,
                    report_type=report_type.strip(),
                    additional_info={"Title": title[:50] if title else None, "Zone ID": str(zone_id) if zone_id else None}
                )
                api_logger.info(f"Saved {len(evidence_paths)} evidence files with watermark")
            except Exception as file_err:
                error_msg = str(file_err)
                error_type = type(file_err).__name__
                api_logger.error(f"Error saving evidence files: {error_type} - {error_msg}", exc_info=True)
                evidence_paths = []  # Set empty list if save fails
        # Prepare report data
        report_data = {
            "company_id": company_id,
            "site_id": site_id,
            "user_id": user_id,
            "division": "CLEANING",
            "report_type": report_type.strip(),
            "title": title.strip() if title else None,
            "description": description.strip() if description else None,
            "severity": severity.strip() if severity else None,
            "status": "open",
            "evidence_paths": ",".join(evidence_paths) if evidence_paths else None,
            "vehicle_id": None,
            "trip_id": None,
            "checklist_id": None,
            "reported_at": datetime.utcnow(),  # Set reported_at timestamp
        }
        
        api_logger.info(f"Creating report with data: {report_data}")
        
        # Create report with all required fields
        report = SecurityReport(**report_data)

        db.add(report)
        db.flush()  # Flush to get ID without committing
        api_logger.info(f"Report added to session, ID: {report.id}")
        
        db.commit()
        api_logger.info(f"Report committed to database, ID: {report.id}")
        
        db.refresh(report)
        api_logger.info(f"Created cleaning report {report.id} by user {user_id} for site {site_id}")
        
        return report
        
    except HTTPException:
        # Re-raise HTTP exceptions
        try:
            db.rollback()
        except:
            pass
        raise
    except Exception as e:
        error_trace = traceback.format_exc()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Unexpected error creating cleaning report: {error_type} - {error_msg}\n{error_trace}")
        try:
            db.rollback()
        except:
            pass
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create cleaning report: {error_msg}. Check server logs for details."
        )

@router.get("/reports", response_model=List[security_schemas.SecurityReportOut])
def list_cleaning_reports(
    site_id: Optional[int] = Query(None),
    zone_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List cleaning reports."""
    try:
        q = db.query(SecurityReport).filter(
            SecurityReport.company_id == current_user.get("company_id", 1),
            SecurityReport.user_id == current_user["id"],
            SecurityReport.division == "CLEANING",  # Filter by division
        )

        if site_id is not None:
            q = q.filter(SecurityReport.site_id == site_id)
        if zone_id is not None:
            q = q.filter(SecurityReport.zone_id == zone_id)
        if from_date is not None:
            q = q.filter(SecurityReport.created_at >= datetime.combine(from_date, datetime.min.time()))
        if to_date is not None:
            q = q.filter(SecurityReport.created_at <= datetime.combine(to_date, datetime.max.time()))

        q = q.order_by(SecurityReport.created_at.desc()).limit(200)
        return q.all()
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error listing cleaning reports: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list cleaning reports: {str(e)}")

@router.get("/reports/{report_id}", response_model=security_schemas.SecurityReportOut)
def get_cleaning_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific cleaning report."""
    try:
        report = (
            db.query(SecurityReport)
            .filter(
                SecurityReport.id == report_id,
                SecurityReport.company_id == current_user.get("company_id", 1),
                SecurityReport.user_id == current_user["id"],
                SecurityReport.division == "CLEANING",  # Filter by division
            )
            .first()
        )

        if not report:
            raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

        return report
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error getting cleaning report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get cleaning report: {str(e)}")

@router.get("/reports/{report_id}/export-pdf")
def export_cleaning_report_pdf(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export cleaning report as PDF."""
    from fastapi.responses import StreamingResponse
    from app.services.pdf_service import PDFService
    from app.models.site import Site
    
    report = (
        db.query(SecurityReport)
        .filter(
            SecurityReport.id == report_id,
            SecurityReport.company_id == current_user.get("company_id", 1),
            SecurityReport.user_id == current_user["id"],
            SecurityReport.division == "CLEANING",  # Filter by division
        )
        .first()
    )
    
    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")
    
    # Get site and user info
    site = db.query(Site).filter(Site.id == report.site_id).first()
    user = db.query(User).filter(User.id == report.user_id).first()
    
    site_name = site.name if site else f"Site {report.site_id}"
    user_name = user.username if user else "Unknown"
    
    # Convert report to dict
    report_dict = {
        "id": report.id,
        "report_type": report.report_type,
        "title": report.title,
        "description": report.description,
        "severity": report.severity,
        "status": report.status,
        "location_text": report.location_text,
        "evidence_paths": report.evidence_paths,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }
    
    pdf_service = PDFService()
    pdf_buffer = pdf_service.generate_security_report_pdf(report_dict, site_name, user_name)
    
    filename = f"Cleaning_Report_{report_id}_{date.today().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/reports/export-pdf")
def export_cleaning_reports_summary_pdf(
    site_id: Optional[int] = Query(None),
    zone_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export multiple cleaning reports as PDF summary."""
    from fastapi.responses import StreamingResponse
    from app.services.pdf_service import PDFService
    from app.models.site import Site
    
    q = db.query(SecurityReport).filter(
        SecurityReport.company_id == current_user.get("company_id", 1),
        SecurityReport.user_id == current_user["id"],
        SecurityReport.division == "CLEANING",  # Filter by division
    )

    if site_id is not None:
        q = q.filter(SecurityReport.site_id == site_id)
    if zone_id is not None:
        q = q.filter(SecurityReport.zone_id == zone_id)
    if from_date is not None:
        q = q.filter(SecurityReport.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date is not None:
        q = q.filter(SecurityReport.created_at <= datetime.combine(to_date, datetime.max.time()))

    reports = q.order_by(SecurityReport.created_at.desc()).limit(200).all()
    
    if not reports:
        raise HTTPException(status_code=404, detail="Tidak ada laporan untuk diekspor")
    
    # Get site info
    site = db.query(Site).filter(Site.id == reports[0].site_id).first() if reports else None
    site_name = site.name if site else f"Site {reports[0].site_id}" if reports else "Unknown"
    
    # Convert reports to dict list
    reports_dict = []
    for report in reports:
        reports_dict.append({
            "id": report.id,
            "report_type": report.report_type,
            "title": report.title,
            "description": report.description,
            "severity": report.severity,
            "status": report.status,
            "location_text": report.location_text,
            "created_at": report.created_at.isoformat() if report.created_at else None,
        })
    
    pdf_service = PDFService()
    pdf_buffer = pdf_service.generate_reports_summary_pdf(
        reports_dict,
        site_name,
        from_date.strftime('%d %B %Y') if from_date else None,
        to_date.strftime('%d %B %Y') if to_date else None,
    )
    
    filename = f"Cleaning_Reports_Summary_{date.today().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ---- Checklist Endpoints (Cleaner) ----

@router.get("/me/checklist/today", response_model=security_schemas.ChecklistOut)
def get_today_checklist(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get today's checklist for current cleaning user."""
    from fastapi import status as http_status
    
    from sqlalchemy.orm import joinedload
    today = date.today()
    checklist = (
        db.query(Checklist)
        .options(joinedload(Checklist.items))
        .filter(
            Checklist.company_id == current_user.get("company_id", 1),
            Checklist.user_id == current_user["id"],
            Checklist.shift_date == today,
            Checklist.division == "CLEANING",
        )
        .order_by(Checklist.id.desc())
        .first()
    )
    
    if not checklist:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="No checklist for today",
        )
    
    return checklist

@router.post("/me/checklist/create", response_model=security_schemas.ChecklistOut)
def create_checklist_manually(
    payload: security_schemas.CreateChecklistRequest = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Manually create checklist for today if it doesn't exist.
    Useful when checklist wasn't created during check-in.
    """
    from fastapi import status as http_status
    from app.divisions.security.services.checklist_service import create_checklist_for_attendance
    from app.models.user import User
    
    today = date.today()
    
    # Check if checklist already exists
    existing = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == current_user.get("company_id", 1),
            Checklist.user_id == current_user["id"],
            Checklist.site_id == payload.site_id,
            Checklist.shift_date == today,
            Checklist.division == "CLEANING",
        )
        .first()
    )
    
    if existing:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Checklist already exists for today"
        )
    
    # Get User model
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        user = current_user
    
    # Determine shift type based on current time
    now = datetime.utcnow()
    hour = now.hour
    shift_type = None
    if 6 <= hour < 14:
        shift_type = "MORNING"
    elif 14 <= hour < 22:
        shift_type = "DAY"
    else:
        shift_type = "NIGHT"
    
    # Try to create checklist
    checklist_result = create_checklist_for_attendance(
        db=db,
        user=user,
        site_id=payload.site_id,
        attendance_id=None,  # No attendance record
        shift_type=shift_type,
        division="CLEANING",  # Specify division for cleaning
    )
    
    # If no template found, create a default checklist with basic items
    if not checklist_result:
        from sqlalchemy.orm import joinedload
        from app.divisions.security.models import ChecklistStatus, ChecklistItemStatus
        
        # Create checklist without template
        checklist = Checklist(
            company_id=current_user.get("company_id", 1),
            user_id=current_user["id"],
            site_id=payload.site_id,
            attendance_id=None,
            template_id=None,  # No template
            division="CLEANING",
            shift_date=today,
            shift_type=shift_type,
            status=ChecklistStatus.OPEN,
        )
        db.add(checklist)
        db.flush()
        
        # Add default cleaning checklist items
        default_items = [
            {"title": "Pembersihan Area Umum", "description": "Membersihkan area umum dan koridor", "required": True},
            {"title": "Pembersihan Toilet", "description": "Membersihkan dan mengecek kondisi toilet", "required": True},
            {"title": "Pengecekan Sampah", "description": "Mengecek dan membuang sampah", "required": True},
            {"title": "Pengecekan Perlengkapan", "description": "Mengecek ketersediaan sabun, tisu, dan perlengkapan lainnya", "required": False},
        ]
        
        for order, item_data in enumerate(default_items, start=1):
            item = ChecklistItem(
                checklist_id=checklist.id,
                template_item_id=None,  # No template item
                order=order,
                title=item_data["title"],
                description=item_data["description"],
                required=item_data["required"],
                evidence_type="note",
                status=ChecklistItemStatus.PENDING,
            )
            db.add(item)
        
        db.commit()
        db.refresh(checklist)
        
        # Load with items for response
        checklist_result = (
            db.query(Checklist)
            .options(joinedload(Checklist.items))
            .filter(Checklist.id == checklist.id)
            .first()
        )
        
        return checklist_result
    
    # If template was found and checklist created, load with items
    from sqlalchemy.orm import joinedload
    checklist = (
        db.query(Checklist)
        .options(joinedload(Checklist.items))
        .filter(Checklist.id == checklist_result.id)
        .first()
    )
    
    return checklist
    
    # Load items for response
    from sqlalchemy.orm import joinedload
    checklist = (
        db.query(Checklist)
        .options(joinedload(Checklist.items))
        .filter(Checklist.id == checklist_result.id)
        .first()
    )
    
    return checklist

@router.patch("/me/checklist/{checklist_id}/items/{item_id}/complete", response_model=security_schemas.ChecklistOut)
async def complete_checklist_item(
    checklist_id: int,
    item_id: int,
    payload: security_schemas.ChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark a checklist item as completed/not applicable/failed."""
    from app.divisions.security.models import ChecklistStatus, ChecklistItemStatus
    from sqlalchemy.orm import joinedload
    
    checklist = (
        db.query(Checklist)
        .filter(
            Checklist.id == checklist_id,
            Checklist.company_id == current_user.get("company_id", 1),
            Checklist.user_id == current_user["id"],
            Checklist.division == "CLEANING",
        )
        .first()
    )
    
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    item = (
        db.query(ChecklistItem)
        .filter(
            ChecklistItem.id == item_id,
            ChecklistItem.checklist_id == checklist_id,
        )
        .first()
    )
    
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    # Update item status
    if payload.status:
        item.status = ChecklistItemStatus(payload.status)
    
    if payload.note is not None:
        item.note = payload.note
    
    if payload.answer_bool is not None:
        item.answer_bool = payload.answer_bool
    if payload.answer_int is not None:
        item.answer_int = payload.answer_int
    if payload.answer_text is not None:
        item.answer_text = payload.answer_text
    
    if payload.status in ["COMPLETED", "NOT_APPLICABLE", "FAILED"]:
        from datetime import datetime
        item.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(item)
    
    # Update checklist status based on items
    all_items = checklist.items
    required_items = [i for i in all_items if i.required]
    completed_required = [i for i in required_items if i.status == ChecklistItemStatus.COMPLETED]
    
    if len(completed_required) == len(required_items) and len(required_items) > 0:
        checklist.status = ChecklistStatus.COMPLETED
    elif any(i.status == ChecklistItemStatus.COMPLETED for i in all_items):
        checklist.status = ChecklistStatus.INCOMPLETE
    else:
        checklist.status = ChecklistStatus.OPEN
    
    db.commit()
    
    # Reload with items
    checklist = (
        db.query(Checklist)
        .options(joinedload(Checklist.items))
        .filter(Checklist.id == checklist_id)
        .first()
    )
    
    return checklist

# ---- Shift Calendar View ----

@router.get("/shifts/calendar")
def get_cleaning_shifts_calendar(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get cleaning shifts for calendar view.
    Returns shifts with status: ASSIGNED, OPEN
    """
    from app.core.logger import api_logger
    
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user["id"]
        
        api_logger.info(f"Getting cleaning shifts calendar - user_id: {user_id}, start: {start}, end: {end}")
        
        # Get all cleaning shifts in date range
        # Convert date to datetime for comparison
        start_datetime = datetime.combine(start, datetime.min.time())
        end_datetime = datetime.combine(end, datetime.max.time())
        
        shifts = (
            db.query(Shift)
            .filter(
                Shift.company_id == company_id,
                Shift.division == "CLEANING",  # Filter by division
                Shift.shift_date >= start_datetime,
                Shift.shift_date <= end_datetime,
            )
            .order_by(Shift.shift_date.asc(), Shift.start_time.asc())
            .all()
        )
        
        # Get sites for site names
        site_ids = list(set([s.site_id for s in shifts]))
        sites = db.query(Site.id, Site.name).filter(Site.id.in_(site_ids)).all() if site_ids else []
        site_map = {s.id: s.name for s in sites}
        
        # Get users for user names
        user_ids = list(set([s.user_id for s in shifts if s.user_id]))
        users = db.query(User.id, User.username).filter(User.id.in_(user_ids)).all() if user_ids else []
        user_map = {u.id: u.username for u in users}
        
        result = []
        for shift in shifts:
            # Build start/end datetime
            start_time_str = shift.start_time or "08:00"
            end_time_str = shift.end_time or "16:00"
            
            # Parse time strings (HH:MM)
            start_hour, start_min = map(int, start_time_str.split(":"))
            end_hour, end_min = map(int, end_time_str.split(":"))
            
            # Handle shift_date - it's DateTime, extract date part
            shift_date_obj = shift.shift_date
            if isinstance(shift_date_obj, datetime):
                shift_date_only = shift_date_obj.date()
            else:
                shift_date_only = shift_date_obj
            
            # Handle night shift that ends next day
            shift_start = datetime.combine(shift_date_only, datetime.min.time().replace(hour=start_hour, minute=start_min))
            if end_hour < start_hour:  # Night shift (e.g., 22:00 to 06:00)
                shift_end = datetime.combine(shift_date_only + timedelta(days=1), datetime.min.time().replace(hour=end_hour, minute=end_min))
            else:
                shift_end = datetime.combine(shift_date_only, datetime.min.time().replace(hour=end_hour, minute=end_min))
            
            # Determine shift status
            shift_status = "ASSIGNED"
            if shift.status == ShiftStatus.OPEN or (shift.status == ShiftStatus.ASSIGNED and shift.user_id is None):
                shift_status = "OPEN"
            
            # Check if shift is assigned to current user
            is_mine = shift.user_id == user_id if shift.user_id else False
            
            result.append({
                "id": shift.id,
                "start": shift_start.isoformat(),
                "end": shift_end.isoformat(),
                "siteId": shift.site_id,
                "siteName": site_map.get(shift.site_id, f"Site {shift.site_id}"),
                "roleType": "CLEANING",
                "status": shift_status,
                "isMine": is_mine,
            })
        
        api_logger.info(f"Returning {len(result)} cleaning shifts for calendar")
        return result
        
    except Exception as e:
        from app.core.logger import api_logger
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting cleaning shifts calendar: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cleaning shifts calendar: {error_msg}"
        )

@router.post("/shifts/{shift_id}/{action}")
def shift_action(
    shift_id: int,
    action: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Handle shift actions: confirm, cancel, take
    """
    from app.core.logger import api_logger
    
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user["id"]
        
        api_logger.info(f"Shift action - shift_id: {shift_id}, action: {action}, user_id: {user_id}")
        
        # Get shift
        shift = (
            db.query(Shift)
            .filter(
                Shift.id == shift_id,
                Shift.company_id == company_id,
                Shift.division == "CLEANING",  # Filter by division
            )
            .first()
        )
        
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        
        if action == "confirm":
            # Confirm assigned shift
            if shift.user_id != user_id:
                raise HTTPException(status_code=403, detail="You can only confirm your own shifts")
            shift.status = ShiftStatus.ASSIGNED
            api_logger.info(f"Shift {shift_id} confirmed by user {user_id}")
            
        elif action == "cancel":
            # Cancel assigned shift
            if shift.user_id != user_id:
                raise HTTPException(status_code=403, detail="You can only cancel your own shifts")
            shift.status = ShiftStatus.CANCELLED
            shift.user_id = None
            api_logger.info(f"Shift {shift_id} cancelled by user {user_id}")
            
        elif action == "take":
            # Take open shift
            if shift.status != ShiftStatus.OPEN:
                raise HTTPException(status_code=400, detail="Shift is not open")
            shift.status = ShiftStatus.ASSIGNED
            shift.user_id = user_id
            api_logger.info(f"Shift {shift_id} taken by user {user_id}")
            
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
        
        shift.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(shift)
        
        return {"success": True, "message": f"Shift {action}ed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logger import api_logger
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error in shift action: {error_type} - {error_msg}", exc_info=True)
        try:
            db.rollback()
        except:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Failed to {action} shift: {error_msg}"
        )