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
)
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.attendance import Attendance, AttendanceStatus
from . import models, schemas
from app.divisions.security.models import Checklist, ChecklistItem, ChecklistStatus, ChecklistItemStatus, ChecklistTemplate, SecurityReport
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
    q = db.query(models.CleaningZone).filter(
        models.CleaningZone.company_id == current_user.get("company_id", 1),
    )
    if site_id:
        q = q.filter(models.CleaningZone.site_id == site_id)
    if is_active is not None:
        q = q.filter(models.CleaningZone.is_active == is_active)
    return q.all()

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

@router.post("/reports")
async def create_cleaning_report(
    report_type: str = Form(...),
    site_id: int = Form(...),
    zone_id: Optional[int] = Form(None),
    location_text: Optional[str] = Form(None),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    severity: Optional[str] = Form(None),
    evidence_files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a cleaning report."""
    evidence_paths: List[str] = []

    if evidence_files:
        for f in evidence_files:
            filename = f"{int(datetime.utcnow().timestamp())}_{f.filename}"
            path = f"{CLEANING_REPORTS_DIR}/{filename}"
            with open(path, "wb") as out:
                content = await f.read()
                out.write(content)
            evidence_paths.append(path)

    report = SecurityReport(
        company_id=current_user.get("company_id", 1),
        site_id=site_id,
        user_id=current_user["id"],
        report_type=report_type,
        zone_id=zone_id,
        location_text=location_text,
        title=title,
        description=description,
        severity=severity,
        evidence_paths=",".join(evidence_paths) if evidence_paths else None,
    )

    db.add(report)
    db.commit()
    db.refresh(report)
    return report

@router.get("/reports")
def list_cleaning_reports(
    site_id: Optional[int] = Query(None),
    zone_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List cleaning reports."""
    q = db.query(SecurityReport).filter(
        SecurityReport.company_id == current_user.get("company_id", 1),
        SecurityReport.user_id == current_user["id"],
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

@router.get("/reports/{report_id}")
def get_cleaning_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific cleaning report."""
    report = (
        db.query(SecurityReport)
        .filter(
            SecurityReport.id == report_id,
            SecurityReport.company_id == current_user.get("company_id", 1),
            SecurityReport.user_id == current_user["id"],
        )
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    return report

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

@router.get("/me/checklist/today")
def get_today_checklist(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get today's checklist for current cleaning user."""
    from fastapi import status as http_status
    
    today = date.today()
    checklist = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == current_user.get("company_id", 1),
            Checklist.user_id == current_user["id"],
            Checklist.shift_date == today,
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
