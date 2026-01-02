# backend/app/divisions/security/routes.py

from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Query,
    Body,
)
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from . import models, schemas
from .services.checklist_service import create_checklist_for_attendance
import os

router = APIRouter(tags=["security"])

# Create media directories if they don't exist
MEDIA_BASE = "media"
SECURITY_REPORTS_DIR = f"{MEDIA_BASE}/security_reports"
SECURITY_PATROL_DIR = f"{MEDIA_BASE}/security_patrol"
SECURITY_ATTENDANCE_DIR = f"{MEDIA_BASE}/security_attendance"

SECURITY_CHECKLIST_DIR = f"{MEDIA_BASE}/security_checklist"

for dir_path in [SECURITY_REPORTS_DIR, SECURITY_PATROL_DIR, SECURITY_ATTENDANCE_DIR, SECURITY_CHECKLIST_DIR]:
    os.makedirs(dir_path, exist_ok=True)

# ---- Attendance ----

@router.post("/attendance/check-in", response_model=schemas.SecurityAttendanceOut)
async def security_check_in(
    site_id: int = Form(...),
    location: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()
    existing = (
        db.query(models.SecurityAttendance)
        .filter(
            models.SecurityAttendance.company_id == current_user.get("company_id", 1),
            models.SecurityAttendance.site_id == site_id,
            models.SecurityAttendance.user_id == current_user["id"],
            models.SecurityAttendance.shift_date == today,
        )
        .first()
    )

    if existing and existing.check_in_time is not None:
        raise HTTPException(status_code=400, detail="Sudah check in hari ini")

    now = datetime.now(timezone.utc)
    photo_path = None

    if photo:
        # Get site and user info for watermark
        from app.models.site import Site
        from app.models.user import User
        site = db.query(Site).filter(Site.id == site_id).first()
        user = db.query(User).filter(User.id == current_user.get("id")).first()
        
        from app.services.file_storage import save_attendance_photo
        await photo.seek(0)
        photo_path = await save_attendance_photo(
            photo,
            prefix="checkin",
            location=location,
            site_name=site.name if site else None,
            user_name=user.username if user else None,
            additional_info={"Type": "Security Attendance"}
        )

    if existing is None:
        attendance = models.SecurityAttendance(
            company_id=current_user.get("company_id", 1),
            site_id=site_id,
            user_id=current_user["id"],
            shift_date=today,
            check_in_time=now,
            check_in_location=location,
            check_in_photo_path=photo_path,
        )
        db.add(attendance)
    else:
        existing.check_in_time = now
        existing.check_in_location = location
        if photo_path:
            existing.check_in_photo_path = photo_path
        attendance = existing

    db.commit()
    db.refresh(attendance)

    # Auto-create checklist from template on check-in
    try:
        # Determine shift type (simplified: based on hour, or you can pass it)
        hour = now.hour
        shift_type = None
        if 6 <= hour < 14:
            shift_type = "MORNING"
        elif 14 <= hour < 22:
            shift_type = "DAY"
        else:
            shift_type = "NIGHT"

        # Get User model from DB
        user = db.query(User).filter(User.id == current_user["id"]).first()
        if not user:
            # Fallback to dict if user not found
            user = current_user

        checklist_result = create_checklist_for_attendance(
            db=db,
            user=user,
            site_id=site_id,
            attendance_id=attendance.id,
            shift_type=shift_type,
            division="SECURITY",
        )
        if checklist_result:
            from app.core.logger import api_logger
            api_logger.info(
                f"Checklist created for user {current_user['id']}, "
                f"site {site_id}, shift_type {shift_type}, checklist_id {checklist_result.id}"
            )
        else:
            from app.core.logger import api_logger
            api_logger.warning(
                f"No checklist template found for user {current_user['id']}, "
                f"site {site_id}, shift_type {shift_type}, division SECURITY. "
                f"Please create a checklist template matching these criteria."
            )
    except Exception as e:
        # Log error but don't fail check-in if checklist creation fails
        from app.core.logger import api_logger
        api_logger.error(f"Failed to create checklist on check-in: {e}", exc_info=True)

    return attendance

@router.post("/attendance/check-out", response_model=schemas.SecurityAttendanceOut)
async def security_check_out(
    site_id: int = Form(...),
    location: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()
    attendance = (
        db.query(models.SecurityAttendance)
        .filter(
            models.SecurityAttendance.company_id == current_user.get("company_id", 1),
            models.SecurityAttendance.site_id == site_id,
            models.SecurityAttendance.user_id == current_user["id"],
            models.SecurityAttendance.shift_date == today,
        )
        .first()
    )

    if attendance is None or attendance.check_in_time is None:
        raise HTTPException(status_code=400, detail="Tidak ada check-in ditemukan untuk hari ini")

    if attendance.check_out_time is not None:
        raise HTTPException(status_code=400, detail="Sudah check out hari ini")

    now = datetime.now(timezone.utc)
    photo_path = None

    if photo:
        # Get site and user info for watermark
        from app.models.site import Site
        from app.models.user import User
        site = db.query(Site).filter(Site.id == site_id).first()
        user = db.query(User).filter(User.id == current_user.get("id")).first()
        
        from app.services.file_storage import save_attendance_photo
        await photo.seek(0)
        photo_path = await save_attendance_photo(
            photo,
            prefix="checkout",
            location=location,
            site_name=site.name if site else None,
            user_name=user.username if user else None,
            additional_info={"Type": "Security Attendance"}
        )

    # Finalize checklist on check-out
    checklist = (
        db.query(models.Checklist)
        .filter(
            models.Checklist.attendance_id == attendance.id,
        )
        .first()
    )

    if checklist:
        from .models import ChecklistStatus, ChecklistItemStatus
        required_items = [item for item in checklist.items if item.required]
        completed_required = [
            item
            for item in required_items
            if item.status in [ChecklistItemStatus.COMPLETED, ChecklistItemStatus.NOT_APPLICABLE]
        ]

        if len(completed_required) == len(required_items):
            checklist.status = ChecklistStatus.COMPLETED
            checklist.completed_at = now
        else:
            checklist.status = ChecklistStatus.INCOMPLETE
            checklist.completed_at = None
        db.commit()

    attendance.check_out_time = now
    attendance.check_out_location = location
    if photo_path:
        attendance.check_out_photo_path = photo_path

    db.commit()
    db.refresh(attendance)
    return attendance

@router.get(
    "/attendance/today",
    response_model=Optional[schemas.SecurityAttendanceOut],
)
def get_today_attendance(
    site_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()
    attendance = (
        db.query(models.SecurityAttendance)
        .filter(
            models.SecurityAttendance.company_id == current_user.get("company_id", 1),
            models.SecurityAttendance.site_id == site_id,
            models.SecurityAttendance.user_id == current_user["id"],
            models.SecurityAttendance.shift_date == today,
        )
        .first()
    )
    return attendance

# ---- Reports ----

@router.post("/reports", response_model=schemas.SecurityReportOut)
async def create_security_report(
    report_type: str = Form(...),
    site_id: int = Form(...),
    location_id: Optional[int] = Form(None),
    location_text: Optional[str] = Form(None),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    severity: Optional[str] = Form(None),
    incident_category: Optional[str] = Form(None),
    incident_level: Optional[str] = Form(None),
    incident_severity_score: Optional[int] = Form(None),
    perpetrator_name: Optional[str] = Form(None),
    perpetrator_type: Optional[str] = Form(None),
    evidence_files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.core.logger import api_logger
    
    try:
        api_logger.info(f"Creating security report - user_id: {current_user.get('id')}, site_id: {site_id}, title: {title[:50] if title else 'None'}")
        
        # Validate required fields
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
        
        # TODO: implement proper file storage (GCS, S3, local, etc.)
        evidence_paths: List[str] = []

        # Get site and user info for watermark
        from app.models.site import Site
        from app.models.user import User
        site = db.query(Site).filter(Site.id == site_id).first()
        user = db.query(User).filter(User.id == user_id).first()

        if evidence_files:
            try:
                from app.services.evidence_storage import save_evidence_file
                for f in evidence_files:
                    # Save evidence file with watermark
                    path = await save_evidence_file(
                        f,
                        upload_dir=SECURITY_REPORTS_DIR,
                        site_name=site.name if site else None,
                        user_name=user.username if user else None,
                        location=location_text,
                        report_type=report_type.strip(),
                        additional_info={"Title": title[:50] if title else None, "Severity": severity}
                    )
                    evidence_paths.append(path)
                    api_logger.info(f"Saved evidence file with watermark: {path}")
            except Exception as file_err:
                # Log error without trying to serialize UploadFile objects
                error_msg = str(file_err)
                error_type = type(file_err).__name__
                api_logger.error(
                    f"Error saving evidence files: {error_type}: {error_msg}",
                    exc_info=True
                )
                # Don't fail the whole request if file saving fails
                pass

        try:
            # Validate site exists
            from app.models.site import Site
            site = db.query(Site).filter(Site.id == site_id).first()
            if not site:
                api_logger.warning(f"Site {site_id} not found")
                raise HTTPException(status_code=404, detail=f"Site with ID {site_id} not found")
            
            # Prepare report data
            report_data = {
                "company_id": company_id,
                "site_id": site_id,
                "user_id": user_id,
                "division": "SECURITY",
                "report_type": report_type.strip(),
                "location_id": location_id,
                "location_text": location_text.strip() if location_text else None,
                "title": title.strip(),
                "description": description.strip() if description else None,
                "severity": severity.strip() if severity else None,
                "status": "open",
                "evidence_paths": ",".join(evidence_paths) if evidence_paths else None,
                "reported_at": datetime.utcnow(),
            }
            
            # Add incident fields if provided
            if incident_category:
                report_data["incident_category"] = incident_category.strip()
            if incident_level:
                report_data["incident_level"] = incident_level.strip()
            if incident_severity_score is not None:
                report_data["incident_severity_score"] = incident_severity_score
            if perpetrator_name:
                report_data["perpetrator_name"] = perpetrator_name.strip()
            if perpetrator_type:
                report_data["perpetrator_type"] = perpetrator_type.strip()
            
            api_logger.info(f"Creating report with data: company_id={report_data['company_id']}, site_id={report_data['site_id']}, user_id={report_data['user_id']}, division={report_data['division']}, title={report_data['title'][:50]}")
            
            report = models.SecurityReport(**report_data)

            db.add(report)
            db.flush()  # Flush to get ID without committing
            api_logger.info(f"Report added to session, ID: {report.id}")
            
            db.commit()
            db.refresh(report)
            api_logger.info(f"Security report created successfully - report_id: {report.id}")
            return report
        except Exception as db_err:
            db.rollback()
            # Log error without trying to serialize complex objects
            error_msg = str(db_err)
            error_type = type(db_err).__name__
            api_logger.error(
                f"Database error creating security report: {error_type}: {error_msg}",
                exc_info=True
            )
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save report to database: {error_msg}"
            )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        try:
            db.rollback()
        except:
            pass
        raise
    except Exception as e:
        # Log error without trying to serialize UploadFile objects
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(
            f"Unexpected error creating security report: {error_type}: {error_msg}",
            exc_info=True
        )
        try:
            db.rollback()
        except:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"An internal error occurred. Please try again later."
        )

@router.get("/reports", response_model=List[schemas.SecurityReportOut])
def list_security_reports(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(models.SecurityReport).filter(
        models.SecurityReport.company_id == current_user.get("company_id", 1),
        models.SecurityReport.division == "SECURITY",  # Filter by division
    )

    if site_id is not None:
        q = q.filter(models.SecurityReport.site_id == site_id)
    if from_date is not None:
        q = q.filter(models.SecurityReport.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date is not None:
        q = q.filter(models.SecurityReport.created_at <= datetime.combine(to_date, datetime.max.time()))

    q = q.order_by(models.SecurityReport.created_at.desc()).limit(200)
    return q.all()

@router.get("/reports/{report_id}", response_model=schemas.SecurityReportOut)
def get_security_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    report = (
        db.query(models.SecurityReport)
        .filter(
            models.SecurityReport.id == report_id,
            models.SecurityReport.company_id == current_user.get("company_id", 1),
            models.SecurityReport.division == "SECURITY",  # Filter by division
        )
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    return report

@router.get("/reports/{report_id}/export-pdf")
def export_security_report_pdf(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export security report as PDF."""
    from fastapi.responses import StreamingResponse
    from app.services.pdf_service import PDFService
    from app.models.site import Site
    
    report = (
        db.query(models.SecurityReport)
        .filter(
            models.SecurityReport.id == report_id,
            models.SecurityReport.company_id == current_user.get("company_id", 1),
            models.SecurityReport.division == "SECURITY",  # Filter by division
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
    
    filename = f"Security_Report_{report_id}_{date.today().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/reports/export-pdf")
def export_security_reports_summary_pdf(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export multiple security reports as PDF summary."""
    from fastapi.responses import StreamingResponse
    from app.services.pdf_service import PDFService
    from app.models.site import Site
    
    q = db.query(models.SecurityReport).filter(
        models.SecurityReport.company_id == current_user.get("company_id", 1),
        models.SecurityReport.division == "SECURITY",  # Filter by division
    )

    if site_id is not None:
        q = q.filter(models.SecurityReport.site_id == site_id)
    if from_date is not None:
        q = q.filter(models.SecurityReport.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date is not None:
        q = q.filter(models.SecurityReport.created_at <= datetime.combine(to_date, datetime.max.time()))

    reports = q.order_by(models.SecurityReport.created_at.desc()).limit(200).all()
    
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
    
    filename = f"Security_Reports_Summary_{date.today().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ---- Patrol (simple) ----

@router.post("/patrols", response_model=schemas.SecurityPatrolLogOut)
async def create_patrol_log(
    site_id: int = Form(...),
    start_time: datetime = Form(...),
    end_time: Optional[datetime] = Form(None),
    area_text: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    main_photo: Optional[UploadFile] = File(None),
    patrol_type: Optional[str] = Form(None),  # "FOOT", "VEHICLE", "MIXED"
    route_id: Optional[int] = Form(None),
    team_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    photo_path = None
    if main_photo:
        # Get site and user info for watermark
        from app.models.site import Site
        from app.models.user import User
        site = db.query(Site).filter(Site.id == site_id).first()
        user = db.query(User).filter(User.id == current_user.get("id")).first()
        
        from app.services.evidence_storage import save_evidence_file
        location_str = f"Area: {area_text}" if area_text else None
        await main_photo.seek(0)
        photo_path = await save_evidence_file(
            main_photo,
            upload_dir=SECURITY_PATROL_DIR,
            location=location_str,
            site_name=site.name if site else None,
            user_name=user.username if user else None,
            report_type="Patrol",
            additional_info={"Start Time": start_time.isoformat() if start_time else None, "Patrol Type": patrol_type}
        )

    log = models.SecurityPatrolLog(
        company_id=current_user.get("company_id", 1),
        site_id=site_id,
        user_id=current_user["id"],
        start_time=start_time,
        end_time=end_time,
        area_text=area_text,
        notes=notes,
        main_photo_path=photo_path,
        patrol_type=patrol_type,
        route_id=route_id,
        team_id=team_id,
    )

    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/patrols", response_model=List[dict])
def list_patrol_logs(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    limit: Optional[int] = Query(200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List patrol logs with user and site information."""
    from app.models.user import User
    from app.models.site import Site
    
    q = db.query(models.SecurityPatrolLog).filter(
        models.SecurityPatrolLog.company_id == current_user.get("company_id", 1)
    )

    if site_id is not None:
        q = q.filter(models.SecurityPatrolLog.site_id == site_id)
    if from_date is not None:
        q = q.filter(models.SecurityPatrolLog.start_time >= datetime.combine(from_date, datetime.min.time()))
    if to_date is not None:
        q = q.filter(models.SecurityPatrolLog.start_time <= datetime.combine(to_date, datetime.max.time()))

    q = q.order_by(models.SecurityPatrolLog.start_time.desc()).limit(limit or 200)
    patrols = q.all()
    
    # Batch load users and sites
    from app.core.utils import batch_load_users_and_sites
    user_ids = list(set(p.user_id for p in patrols))
    site_ids = list(set(p.site_id for p in patrols))
    users_map, sites_map = batch_load_users_and_sites(db, user_ids, site_ids)
    
    # Enhance with user and site names
    result = []
    for patrol in patrols:
        user = users_map.get(patrol.user_id)
        site = sites_map.get(patrol.site_id)
        
        # Handle status safely - check if attribute exists
        status_value = None
        if hasattr(patrol, 'status') and patrol.status is not None:
            if hasattr(patrol.status, 'value'):
                status_value = patrol.status.value
            else:
                status_value = str(patrol.status)
        else:
            # Default status based on end_time
            status_value = "completed" if patrol.end_time else "partial"
        
        result.append({
            "id": patrol.id,
            "user_id": patrol.user_id,
            "officer_name": user.username if user else f"User {patrol.user_id}",
            "site_id": patrol.site_id,
            "site_name": site.name if site else f"Site {patrol.site_id}",
            "start_time": patrol.start_time.isoformat(),
            "end_time": patrol.end_time.isoformat() if patrol.end_time else None,
            "area_text": getattr(patrol, 'area_text', getattr(patrol, 'area_covered', None)),
            "status": status_value,
            "notes": getattr(patrol, 'notes', None),
            "patrol_type": getattr(patrol, 'patrol_type', None),
            "distance_covered": getattr(patrol, 'distance_covered', None),
            "steps_count": getattr(patrol, 'steps_count', None),
        })
    
    return result

@router.get("/patrols/{patrol_id}/gps-track")
def get_patrol_gps_track(
    patrol_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get GPS track data for a patrol."""
    from app.core.logger import api_logger
    from app.models.gps_track import GPSTrack
    
    try:
        # Verify patrol exists
        patrol = (
            db.query(models.SecurityPatrolLog)
            .filter(
                models.SecurityPatrolLog.id == patrol_id,
                models.SecurityPatrolLog.company_id == current_user.get("company_id", 1),
            )
            .first()
        )
        
        if not patrol:
            raise HTTPException(status_code=404, detail="Patrol log not found")
        
        # Get GPS tracks
        tracks = (
            db.query(GPSTrack)
            .filter(
                GPSTrack.track_type == "PATROL",
                GPSTrack.track_reference_id == patrol_id,
            )
            .order_by(GPSTrack.recorded_at.asc())
            .all()
        )
        
        result = [
            {
                "latitude": track.latitude,
                "longitude": track.longitude,
                "altitude": track.altitude,
                "accuracy": track.accuracy,
                "speed": track.speed,
                "recorded_at": track.recorded_at.isoformat(),
                "is_mock_location": track.is_mock_location,
            }
            for track in tracks
        ]
        
        api_logger.info(f"Retrieved {len(result)} GPS track points for patrol {patrol_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logger import api_logger
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting GPS track: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get GPS track: {error_msg}"
        )

@router.get("/patrols/active")
def get_active_patrols(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get active patrols with GPS location."""
    from app.core.logger import api_logger
    from app.models.user import User
    from app.models.site import Site
    from app.models.gps_track import GPSTrack
    
    try:
        company_id = current_user.get("company_id", 1)
        
        patrols = (
            db.query(models.SecurityPatrolLog)
            .filter(
                models.SecurityPatrolLog.company_id == company_id,
                models.SecurityPatrolLog.end_time.is_(None),
            )
        )
        
        if site_id:
            patrols = patrols.filter(models.SecurityPatrolLog.site_id == site_id)
        
        patrols = patrols.order_by(models.SecurityPatrolLog.start_time.desc()).all()
        
        result = []
        for patrol in patrols:
            user = db.query(User).filter(User.id == patrol.user_id).first()
            site = db.query(Site).filter(Site.id == patrol.site_id).first()
            
            # Get latest GPS track
            latest_track = (
                db.query(GPSTrack)
                .filter(
                    GPSTrack.track_type == "PATROL",
                    GPSTrack.track_reference_id == patrol.id,
                )
                .order_by(GPSTrack.recorded_at.desc())
                .first()
            )
            
            result.append({
                "id": patrol.id,
                "user_id": patrol.user_id,
                "user_name": user.username if user else f"User {patrol.user_id}",
                "site_id": patrol.site_id,
                "site_name": site.name if site else f"Site {patrol.site_id}",
                "start_time": patrol.start_time.isoformat(),
                "area_text": getattr(patrol, 'area_text', getattr(patrol, 'area_covered', None)),
                "current_location": {
                    "latitude": getattr(latest_track, 'latitude', None),
                    "longitude": getattr(latest_track, 'longitude', None),
                    "recorded_at": latest_track.recorded_at.isoformat() if latest_track and hasattr(latest_track, 'recorded_at') else None,
                    "accuracy": getattr(latest_track, 'accuracy', None),
                } if latest_track else None,
            })
        
        api_logger.info(f"Retrieved {len(result)} active patrols")
        return result
        
    except Exception as e:
        from app.core.logger import api_logger
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting active patrols: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get active patrols: {error_msg}"
        )

@router.get("/patrols/{patrol_id}/detail")
def get_patrol_detail(
    patrol_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get detailed patrol information including checkpoints, GPS track, photos, timeline."""
    from app.core.logger import api_logger
    from app.models.user import User
    from app.models.site import Site
    from app.models.gps_track import GPSTrack
    from app.divisions.security.models import PatrolCheckpointScan
    
    try:
        patrol = (
            db.query(models.SecurityPatrolLog)
            .filter(
                models.SecurityPatrolLog.id == patrol_id,
                models.SecurityPatrolLog.company_id == current_user.get("company_id", 1),
            )
            .first()
        )
        
        if not patrol:
            raise HTTPException(status_code=404, detail="Patrol log not found")
        
        # Get user and site info
        user = db.query(User).filter(User.id == patrol.user_id).first()
        site = db.query(Site).filter(Site.id == patrol.site_id).first()
        
        # Get GPS track
        gps_tracks = (
            db.query(GPSTrack)
            .filter(
                GPSTrack.track_type == "PATROL",
                GPSTrack.track_reference_id == patrol_id,
            )
            .order_by(GPSTrack.recorded_at.asc())
            .all()
        )
        
        # Get checkpoint scans
        checkpoint_scans = (
            db.query(PatrolCheckpointScan)
            .filter(
                PatrolCheckpointScan.user_id == patrol.user_id,
                PatrolCheckpointScan.scan_time >= patrol.start_time,
                PatrolCheckpointScan.scan_time <= (patrol.end_time or datetime.utcnow()),
            )
            .order_by(PatrolCheckpointScan.scan_time.asc())
            .all()
        )
        
        # Build timeline
        timeline = []
        timeline.append({
            "time": patrol.start_time.isoformat(),
            "type": "START",
            "description": "Patrol started",
            "location": getattr(patrol, 'area_text', getattr(patrol, 'area_covered', None)),
        })
        
        for scan in checkpoint_scans:
            checkpoint = db.query(models.PatrolCheckpoint).filter(
                models.PatrolCheckpoint.id == scan.checkpoint_id
            ).first()
            timeline.append({
                "time": scan.scan_time.isoformat(),
                "type": "CHECKPOINT",
                "description": f"Scanned checkpoint: {checkpoint.name if checkpoint else 'Unknown'}",
                "location": f"{scan.latitude}, {scan.longitude}" if scan.latitude else None,
                "is_valid": scan.is_valid,
            })
        
        if patrol.end_time:
            timeline.append({
                "time": patrol.end_time.isoformat(),
                "type": "END",
                "description": "Patrol ended",
            })
        
        # Build photos list
        photos = []
        if patrol.main_photo_path:
            photos.append({
                "path": patrol.main_photo_path,
                "type": "main",
            })
        
        # Calculate duration
        duration_minutes = None
        if patrol.end_time:
            duration_seconds = (patrol.end_time - patrol.start_time).total_seconds()
            duration_minutes = int(duration_seconds / 60)
        
        result = {
            "id": patrol.id,
            "user": {
                "id": patrol.user_id,
                "name": user.username if user else f"User {patrol.user_id}",
            },
            "site": {
                "id": patrol.site_id,
                "name": site.name if site else f"Site {patrol.site_id}",
            },
            "start_time": patrol.start_time.isoformat(),
            "end_time": patrol.end_time.isoformat() if patrol.end_time else None,
            "duration_minutes": duration_minutes,
            "area_text": getattr(patrol, 'area_text', getattr(patrol, 'area_covered', None)),
            "notes": getattr(patrol, 'notes', None),
            "patrol_type": patrol.patrol_type,
            "distance_covered": patrol.distance_covered,
            "steps_count": patrol.steps_count,
            "photos": photos,
            "gps_tracks": [
                {
                    "latitude": track.latitude,
                    "longitude": track.longitude,
                    "recorded_at": track.recorded_at.isoformat(),
                    "accuracy": track.accuracy,
                    "speed": track.speed,
                }
                for track in gps_tracks
            ],
            "checkpoint_scans": [
                {
                    "checkpoint_id": scan.checkpoint_id,
                    "checkpoint_name": db.query(models.PatrolCheckpoint)
                        .filter(models.PatrolCheckpoint.id == scan.checkpoint_id)
                        .first().name if db.query(models.PatrolCheckpoint)
                        .filter(models.PatrolCheckpoint.id == scan.checkpoint_id)
                        .first() else "Unknown",
                    "scan_time": scan.scan_time.isoformat(),
                    "scan_method": scan.scan_method,
                    "latitude": scan.latitude,
                    "longitude": scan.longitude,
                    "is_valid": scan.is_valid,
                }
                for scan in checkpoint_scans
            ],
            "timeline": timeline,
        }
        
        api_logger.info(f"Retrieved patrol detail {patrol_id} for user {current_user.get('id')}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logger import api_logger
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting patrol detail: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get patrol detail: {error_msg}"
        )

# ---- Checklist Endpoints (Guard) ----

@router.get("/me/checklist/today", response_model=schemas.ChecklistOut)
def get_today_checklist(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get today's checklist for current user."""
    # #region agent log
    import json
    import os
    import time
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        log_path = os.path.join(project_root, '.cursor', 'debug.log')
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps({"location": "security/routes.py:483", "message": "get_today_checklist called", "data": {"user_id": current_user.get("id"), "company_id": current_user.get("company_id", 1)}, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "runId": "checklist-debug", "hypothesisId": "A"}) + "\n")
    except Exception as log_err: pass
    # #endregion
    from fastapi import status as http_status
    today = date.today()
    # #region agent log
    try:
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps({"location": "security/routes.py:490", "message": "Query parameters", "data": {"today": str(today), "user_id": current_user.get("id"), "company_id": current_user.get("company_id", 1)}, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "runId": "checklist-debug", "hypothesisId": "B"}) + "\n")
    except: pass
    # #endregion
    from sqlalchemy.orm import joinedload
    checklist = (
        db.query(models.Checklist)
        .options(joinedload(models.Checklist.items))
        .filter(
            models.Checklist.company_id == current_user.get("company_id", 1),
            models.Checklist.user_id == current_user["id"],
            models.Checklist.shift_date == today,
            models.Checklist.division == "SECURITY",
        )
        .order_by(models.Checklist.id.desc())
        .first()
    )
    
    # #region agent log
    try:
        # Check if there are any checklists for this user (any date, any division)
        all_checklists = db.query(models.Checklist).filter(
            models.Checklist.company_id == current_user.get("company_id", 1),
            models.Checklist.user_id == current_user["id"],
        ).all()
        # Check security checklists specifically
        security_checklists = db.query(models.Checklist).filter(
            models.Checklist.company_id == current_user.get("company_id", 1),
            models.Checklist.user_id == current_user["id"],
            models.Checklist.division == "SECURITY",
        ).all()
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps({"location": "security/routes.py:500", "message": "Query result", "data": {"checklist_found": checklist is not None, "checklist_id": checklist.id if checklist else None, "checklist_division": checklist.division if checklist else None, "total_checklists_for_user": len(all_checklists), "total_security_checklists": len(security_checklists), "checklist_dates": [str(c.shift_date) for c in all_checklists[:5]], "security_checklist_dates": [str(c.shift_date) for c in security_checklists[:5]]}, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "runId": "checklist-debug", "hypothesisId": "C"}) + "\n")
    except: pass
    # #endregion
    
    if not checklist:
        # #region agent log
        try:
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps({"location": "security/routes.py:502", "message": "No checklist found, raising 404", "data": {"today": str(today)}, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "runId": "checklist-debug", "hypothesisId": "D"}) + "\n")
        except: pass
        # #endregion
        # Return 404 - this is expected behavior when user hasn't checked in yet
        # Frontend should handle this gracefully
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="No checklist for today. Please check in first to create a checklist.",
        )
    
    # #region agent log
    try:
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps({"location": "security/routes.py:508", "message": "Checklist found, returning", "data": {"checklist_id": checklist.id, "shift_date": str(checklist.shift_date), "division": checklist.division, "status": checklist.status.value if hasattr(checklist.status, 'value') else str(checklist.status)}, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "runId": "checklist-debug", "hypothesisId": "E"}) + "\n")
    except: pass
    # #endregion
    return checklist

@router.post("/me/checklist/create", response_model=schemas.ChecklistOut)
def create_checklist_manually(
    payload: schemas.CreateChecklistRequest = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Manually create checklist for today if it doesn't exist.
    Useful when checklist wasn't created during check-in.
    """
    from fastapi import status as http_status
    today = date.today()
    
    # Check if checklist already exists
    existing = (
        db.query(models.Checklist)
        .filter(
            models.Checklist.company_id == current_user.get("company_id", 1),
            models.Checklist.user_id == current_user["id"],
            models.Checklist.site_id == payload.site_id,
            models.Checklist.shift_date == today,
            models.Checklist.division == "SECURITY",
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
        division="SECURITY",  # Specify division for security
    )
    
    # If no template found, create a default checklist with basic items
    if not checklist_result:
        from sqlalchemy.orm import joinedload
        
        # Create checklist without template
        checklist = models.Checklist(
            company_id=current_user.get("company_id", 1),
            user_id=current_user["id"],
            site_id=payload.site_id,
            attendance_id=None,
            template_id=None,  # No template
            division="SECURITY",
            shift_date=today,
            shift_type=shift_type,
            status=models.ChecklistStatus.OPEN,
        )
        db.add(checklist)
        db.flush()
        
        # Add default security checklist items
        default_items = [
            {"title": "Patrol Area", "description": "Melakukan patrol di area yang ditugaskan", "required": True},
            {"title": "Cek Keamanan", "description": "Memeriksa keamanan area dan peralatan", "required": True},
            {"title": "Laporan Insiden", "description": "Melaporkan insiden atau kejadian yang terjadi", "required": False},
            {"title": "Cek CCTV", "description": "Memeriksa kondisi dan fungsi CCTV", "required": False},
        ]
        
        for order, item_data in enumerate(default_items, start=1):
            item = models.ChecklistItem(
                checklist_id=checklist.id,
                template_item_id=None,  # No template item
                order=order,
                title=item_data["title"],
                description=item_data["description"],
                required=item_data["required"],
                evidence_type="note",
                status=models.ChecklistItemStatus.PENDING,
            )
            db.add(item)
        
        db.commit()
        db.refresh(checklist)
        
        # Load with items for response
        checklist = (
            db.query(models.Checklist)
            .options(joinedload(models.Checklist.items))
            .filter(models.Checklist.id == checklist.id)
            .first()
        )
        
        return checklist
    
    # Load items for response
    from sqlalchemy.orm import joinedload
    checklist = (
        db.query(models.Checklist)
        .options(joinedload(models.Checklist.items))
        .filter(models.Checklist.id == checklist_result.id)
        .first()
    )
    
    return checklist

@router.post("/me/checklist/{checklist_id}/items/{item_id}/complete", response_model=schemas.ChecklistOut)
async def complete_checklist_item(
    checklist_id: int,
    item_id: int,
    payload: schemas.ChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark a checklist item as completed/not applicable/failed."""
    from .models import ChecklistStatus, ChecklistItemStatus
    
    checklist = (
        db.query(models.Checklist)
        .filter(
            models.Checklist.id == checklist_id,
            models.Checklist.company_id == current_user.get("company_id", 1),
            models.Checklist.user_id == current_user["id"],
        )
        .first()
    )

    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    item = (
        db.query(models.ChecklistItem)
        .filter(
            models.ChecklistItem.id == item_id,
            models.ChecklistItem.checklist_id == checklist_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    # Update item
    item.status = payload.status
    item.note = payload.note
    item.completed_at = datetime.utcnow() if payload.status != ChecklistItemStatus.PENDING else None
    if payload.evidence_id:
        item.evidence_id = payload.evidence_id
    
    # Update KPI fields if provided
    if payload.answer_bool is not None:
        item.answer_bool = payload.answer_bool
    if payload.answer_int is not None:
        item.answer_int = payload.answer_int
    if payload.answer_text is not None:
        item.answer_text = payload.answer_text
    if payload.photo_id is not None:
        item.photo_id = payload.photo_id
    if payload.gps_lat is not None:
        item.gps_lat = payload.gps_lat
    if payload.gps_lng is not None:
        item.gps_lng = payload.gps_lng
    if payload.gps_accuracy is not None:
        item.gps_accuracy = payload.gps_accuracy
    if payload.mock_location is not None:
        item.mock_location = payload.mock_location

    db.flush()

    # Recalculate checklist status
    required_items = [i for i in checklist.items if i.required]
    if all(i.status in [ChecklistItemStatus.COMPLETED, ChecklistItemStatus.NOT_APPLICABLE] for i in required_items):
        checklist.status = ChecklistStatus.COMPLETED
        checklist.completed_at = datetime.utcnow()
    else:
        checklist.status = ChecklistStatus.OPEN
        checklist.completed_at = None

    db.commit()
    db.refresh(checklist)

    return checklist

# ---- Admin Checklist Template Endpoints ----

@router.post("/admin/checklist-templates", response_model=schemas.ChecklistTemplateOut)
def create_checklist_template(
    payload: schemas.ChecklistTemplateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new checklist template (admin only)."""
    # TODO: Add role check for admin
    template = models.ChecklistTemplate(
        company_id=current_user.get("company_id", 1),
        site_id=payload.site_id,
        name=payload.name,
        role=payload.role,
        shift_type=payload.shift_type,
        is_active="active",
    )
    db.add(template)
    db.flush()

    # Add items
    for idx, item_data in enumerate(payload.items):
        item = models.ChecklistTemplateItem(
            template_id=template.id,
            order=item_data.get("order", idx),
            title=item_data["title"],
            description=item_data.get("description"),
            required=item_data.get("required", "true"),
            evidence_type=item_data.get("evidence_type"),
            auto_complete_rule=item_data.get("auto_complete_rule"),
        )
        db.add(item)

    db.commit()
    db.refresh(template)
    return template

@router.get("/admin/checklists", response_model=List[schemas.ChecklistSummary])
def list_checklists_admin(
    date_str: Optional[str] = Query(None),
    site_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List checklists (admin/supervisor view) with summary."""
    from .models import ChecklistStatus, ChecklistItemStatus
    from app.models.site import Site
    
    if date_str:
        target_date = date.fromisoformat(date_str)
    else:
        target_date = date.today()

    q = (
        db.query(models.Checklist)
        .filter(
            models.Checklist.company_id == current_user.get("company_id", 1),
            models.Checklist.shift_date == target_date,
        )
    )

    if site_id:
        q = q.filter(models.Checklist.site_id == site_id)
    if status_filter:
        q = q.filter(models.Checklist.status == status_filter)

    results = []
    for c in q.all():
        required_items = [i for i in c.items if i.required]
        completed_count = sum(
            1 for i in required_items
            if i.status in [ChecklistItemStatus.COMPLETED, ChecklistItemStatus.NOT_APPLICABLE]
        )
        
        # Get user name (simplified - you may need to adjust based on your User model)
        user = db.query(User).filter(User.id == c.user_id).first()
        user_name = user.username if user else f"User {c.user_id}"
        
        # Get site name
        site = db.query(Site).filter(Site.id == c.site_id).first()
        site_name = site.name if site else f"Site {c.site_id}"

        results.append(
            schemas.ChecklistSummary(
                id=c.id,
                user_id=c.user_id,
                user_name=user_name,
                site_id=c.site_id,
                site_name=site_name,
                shift_date=c.shift_date,
                shift_type=c.shift_type,
                status=c.status,
                completed_count=completed_count,
                total_required=len(required_items),
            )
        )

    return results

# ---- Dispatch & Panic Endpoints ----

@router.post("/dispatch/tickets", response_model=schemas.DispatchTicketBase)
def create_dispatch_ticket(
    payload: schemas.DispatchTicketCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new dispatch ticket (dispatcher)."""
    from .models import DispatchStatus
    from datetime import date
    
    # Generate ticket number
    today = date.today()
    today_str = today.strftime("%Y-%m-%d")
    last_ticket = (
        db.query(models.DispatchTicket)
        .filter(models.DispatchTicket.ticket_number.like(f"DISP-{today_str}-%"))
        .order_by(models.DispatchTicket.id.desc())
        .first()
    )
    
    if last_ticket:
        last_num = int(last_ticket.ticket_number.split("-")[-1])
        ticket_number = f"DISP-{today_str}-{last_num + 1:03d}"
    else:
        ticket_number = f"DISP-{today_str}-001"
    
    ticket = models.DispatchTicket(
        company_id=current_user.get("company_id", 1),
        site_id=payload.site_id,
        ticket_number=ticket_number,
        caller_name=payload.caller_name,
        caller_phone=payload.caller_phone,
        incident_type=payload.incident_type,
        priority=payload.priority,
        description=payload.description,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        status=DispatchStatus.NEW,
        created_by_user_id=current_user["id"],
    )
    
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/dispatch/tickets", response_model=List[schemas.DispatchTicketBase])
def list_dispatch_tickets(
    site_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    assigned_to: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List dispatch tickets (dispatcher/supervisor view)."""
    q = db.query(models.DispatchTicket).filter(
        models.DispatchTicket.company_id == current_user.get("company_id", 1)
    )
    
    if site_id:
        q = q.filter(models.DispatchTicket.site_id == site_id)
    if status:
        q = q.filter(models.DispatchTicket.status == status)
    if assigned_to:
        q = q.filter(models.DispatchTicket.assigned_to_user_id == assigned_to)
    
    q = q.order_by(models.DispatchTicket.created_at.desc()).limit(100)
    return q.all()

@router.patch("/dispatch/tickets/{ticket_id}", response_model=schemas.DispatchTicketBase)
def update_dispatch_ticket(
    ticket_id: int,
    payload: schemas.DispatchTicketUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update dispatch ticket status/assignment."""
    from .models import DispatchStatus
    
    ticket = (
        db.query(models.DispatchTicket)
        .filter(
            models.DispatchTicket.id == ticket_id,
            models.DispatchTicket.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    now = datetime.utcnow()
    
    if payload.status:
        ticket.status = payload.status
        if payload.status == DispatchStatus.ASSIGNED and not ticket.assigned_at:
            ticket.assigned_at = now
        elif payload.status == DispatchStatus.ONSCENE and not ticket.onscene_at:
            ticket.onscene_at = now
        elif payload.status == DispatchStatus.CLOSED and not ticket.closed_at:
            ticket.closed_at = now
            ticket.closed_by_user_id = current_user["id"]
    
    if payload.assigned_to_user_id is not None:
        ticket.assigned_to_user_id = payload.assigned_to_user_id
        if not ticket.assigned_at:
            ticket.assigned_at = now
    
    if payload.resolution_notes:
        ticket.resolution_notes = payload.resolution_notes
    
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/panic/alert", response_model=schemas.PanicAlertBase)
def trigger_panic_alert(
    payload: schemas.PanicAlertCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Trigger panic button alert from guard app."""
    alert = models.PanicAlert(
        company_id=current_user.get("company_id", 1),
        site_id=payload.site_id,
        user_id=current_user["id"],
        alert_type=payload.alert_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location_text=payload.location_text,
        message=payload.message,
        status="active",
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    # TODO: Send real-time notification to dispatchers/control room
    
    return alert

@router.get("/panic/alerts", response_model=List[schemas.PanicAlertBase])
def list_panic_alerts(
    site_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List panic alerts (dispatcher/supervisor view)."""
    q = db.query(models.PanicAlert).filter(
        models.PanicAlert.company_id == current_user.get("company_id", 1)
    )
    
    if site_id:
        q = q.filter(models.PanicAlert.site_id == site_id)
    if status:
        q = q.filter(models.PanicAlert.status == status)
    
    q = q.order_by(models.PanicAlert.created_at.desc()).limit(100)
    return q.all()

@router.post("/panic/alerts/{alert_id}/acknowledge")
def acknowledge_panic_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Acknowledge a panic alert."""
    alert = (
        db.query(models.PanicAlert)
        .filter(
            models.PanicAlert.id == alert_id,
            models.PanicAlert.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "acknowledged"
    alert.acknowledged_by_user_id = current_user["id"]
    alert.acknowledged_at = datetime.utcnow()
    
    db.commit()
    db.refresh(alert)
    return {"message": "Alert acknowledged", "alert": alert}


@router.post("/panic/alerts/{alert_id}/resolve")
def resolve_panic_alert(
    alert_id: int,
    resolution_notes: str = Body(..., description="Resolution notes/message"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Resolve a panic alert with resolution notes."""
    alert = (
        db.query(models.PanicAlert)
        .filter(
            models.PanicAlert.id == alert_id,
            models.PanicAlert.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if alert.status == "resolved":
        raise HTTPException(status_code=400, detail="Alert already resolved")
    
    alert.status = "resolved"
    alert.resolved_at = datetime.utcnow()
    alert.resolution_notes = resolution_notes
    
    db.commit()
    db.refresh(alert)
    return {"message": "Alert resolved", "alert": alert}

# ---- DAR & Passdown Endpoints ----

@router.post("/dar/generate", response_model=schemas.DailyActivityReportBase)
def generate_dar(
    site_id: int = Query(...),
    shift_date: Optional[date] = Query(None),
    shift_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Generate Daily Activity Report for a shift."""
    from .services.dar_service import compile_dar_data, generate_report_number
    
    if not shift_date:
        shift_date = date.today()
    
    # Check if DAR already exists
    existing = (
        db.query(models.DailyActivityReport)
        .filter(
            models.DailyActivityReport.company_id == current_user.get("company_id", 1),
            models.DailyActivityReport.site_id == site_id,
            models.DailyActivityReport.shift_date == shift_date,
            models.DailyActivityReport.shift_type == shift_type,
        )
        .first()
    )
    
    if existing:
        return existing
    
    # Compile data from various sources
    summary_data = compile_dar_data(db, current_user.get("company_id", 1), site_id, shift_date, shift_type)
    
    # Generate report
    report_number = generate_report_number(db, shift_date, site_id)
    
    dar = models.DailyActivityReport(
        company_id=current_user.get("company_id", 1),
        site_id=site_id,
        shift_date=shift_date,
        shift_type=shift_type,
        report_number=report_number,
        summary_data=summary_data,
        generated_by_user_id=current_user["id"],
        status="draft",
    )
    
    db.add(dar)
    db.commit()
    db.refresh(dar)
    return dar

@router.get("/dar/reports", response_model=List[schemas.DailyActivityReportBase])
def list_dar_reports(
    site_id: Optional[int] = Query(None),
    shift_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List Daily Activity Reports."""
    q = db.query(models.DailyActivityReport).filter(
        models.DailyActivityReport.company_id == current_user.get("company_id", 1)
    )
    
    if site_id:
        q = q.filter(models.DailyActivityReport.site_id == site_id)
    if shift_date:
        q = q.filter(models.DailyActivityReport.shift_date == shift_date)
    
    q = q.order_by(models.DailyActivityReport.shift_date.desc()).limit(100)
    return q.all()

@router.post("/passdown/notes", response_model=schemas.ShiftHandoverBase)
def create_passdown_note(
    payload: schemas.ShiftHandoverCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create shift handover / passdown note."""
    # Determine from_shift_type based on current time or attendance
    from_shift_type = None
    hour = datetime.utcnow().hour
    if 6 <= hour < 14:
        from_shift_type = "MORNING"
    elif 14 <= hour < 22:
        from_shift_type = "DAY"
    else:
        from_shift_type = "NIGHT"
    
    handover = models.ShiftHandover(
        company_id=current_user.get("company_id", 1),
        site_id=payload.site_id,
        shift_date=payload.shift_date,
        from_shift_type=from_shift_type,
        to_shift_type=payload.to_shift_type,
        from_user_id=current_user["id"],
        to_user_id=payload.to_user_id,
        category=payload.category,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status="pending",
    )
    
    db.add(handover)
    db.commit()
    db.refresh(handover)
    return handover

@router.get("/passdown/notes", response_model=List[schemas.ShiftHandoverBase])
def list_passdown_notes(
    site_id: Optional[int] = Query(None),
    shift_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List shift handover notes. Only shows notes from same division as current user (except supervisor/admin)."""
    from app.models.user import User
    
    company_id = current_user.get("company_id", 1)
    user_role = current_user.get("role", "").lower()
    user_division = current_user.get("division", "").lower() if current_user.get("division") else None
    
    # Supervisor and admin can see all passdown notes
    is_supervisor_or_admin = user_role in ["supervisor", "admin"]
    
    q = db.query(models.ShiftHandover).filter(
        models.ShiftHandover.company_id == company_id
    )
    
    # Filter by division: only show passdown notes from users in the same division
    # Exception: supervisor and admin can see all
    if not is_supervisor_or_admin and user_division:
        # Join with User table to filter by division
        q = q.join(User, models.ShiftHandover.from_user_id == User.id).filter(
            User.company_id == company_id,
            User.division == user_division
        )
    
    if site_id:
        q = q.filter(models.ShiftHandover.site_id == site_id)
    if shift_date:
        q = q.filter(models.ShiftHandover.shift_date == shift_date)
    if status:
        q = q.filter(models.ShiftHandover.status == status)
    
    q = q.order_by(models.ShiftHandover.created_at.desc()).limit(100)
    return q.all()

@router.post("/passdown/notes/{note_id}/acknowledge")
def acknowledge_passdown_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Acknowledge a passdown note. Only allows acknowledging notes from same division (except supervisor/admin)."""
    from app.models.user import User
    
    company_id = current_user.get("company_id", 1)
    user_role = current_user.get("role", "").lower()
    user_division = current_user.get("division", "").lower() if current_user.get("division") else None
    
    # Supervisor and admin can acknowledge any passdown note
    is_supervisor_or_admin = user_role in ["supervisor", "admin"]
    
    note = (
        db.query(models.ShiftHandover)
        .filter(
            models.ShiftHandover.id == note_id,
            models.ShiftHandover.company_id == company_id,
        )
        .first()
    )
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check if user can acknowledge this note (same division or supervisor/admin)
    if not is_supervisor_or_admin and user_division:
        # Get the division of the user who created the passdown note
        from_user = db.query(User).filter(User.id == note.from_user_id).first()
        if from_user and from_user.division:
            from_user_division = from_user.division.lower()
            if from_user_division != user_division:
                raise HTTPException(
                    status_code=403,
                    detail="You can only acknowledge passdown notes from your division"
                )
    
    note.status = "acknowledged"
    note.acknowledged_by_user_id = current_user["id"]
    note.acknowledged_at = datetime.utcnow()
    
    db.commit()
    db.refresh(note)
    return {"message": "Note acknowledged", "note": note}

# ---- Tour Checkpoints & Routes ----

@router.get("/patrol/routes", response_model=List[schemas.PatrolRouteBase])
def list_patrol_routes(
    site_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List patrol routes for a site."""
    q = db.query(models.PatrolRoute).filter(
        models.PatrolRoute.company_id == current_user.get("company_id", 1)
    )
    if site_id:
        q = q.filter(models.PatrolRoute.site_id == site_id)
    if is_active is not None:
        q = q.filter(models.PatrolRoute.is_active == is_active)
    return q.order_by(models.PatrolRoute.name).all()

@router.post("/patrol/checkpoints/scan", response_model=schemas.PatrolCheckpointScanBase)
def scan_checkpoint(
    payload: schemas.ScanCheckpointPayload,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Scan a checkpoint (NFC/QR)."""
    # Find checkpoint by scan_code
    checkpoint = (
        db.query(models.PatrolCheckpoint)
        .filter(
            (models.PatrolCheckpoint.nfc_code == payload.scan_code) |
            (models.PatrolCheckpoint.qr_code == payload.scan_code)
        )
        .first()
    )
    
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    
    # Verify route matches
    route = db.query(models.PatrolRoute).filter(models.PatrolRoute.id == payload.route_id).first()
    if not route or route.id != checkpoint.route_id:
        raise HTTPException(status_code=400, detail="Checkpoint does not belong to this route")
    
    # Check time window if specified
    is_valid = True
    if checkpoint.time_window_start and checkpoint.time_window_end:
        from datetime import datetime, time
        now = datetime.now().time()
        start = datetime.strptime(checkpoint.time_window_start, "%H:%M").time()
        end = datetime.strptime(checkpoint.time_window_end, "%H:%M").time()
        if not (start <= now <= end):
            is_valid = False
    
    scan = models.PatrolCheckpointScan(
        company_id=current_user.get("company_id", 1),
        site_id=route.site_id,
        user_id=current_user["id"],
        route_id=payload.route_id,
        checkpoint_id=checkpoint.id,
        scan_time=datetime.utcnow(),
        scan_method=payload.scan_method,
        scan_code=payload.scan_code,
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_valid=is_valid,
        is_missed=False,
        notes=payload.notes,
    )
    
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan

@router.get("/patrol/checkpoints/missed")
def get_missed_checkpoints(
    route_id: int,
    shift_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get missed checkpoints for a route on a given date."""
    if not shift_date:
        shift_date = date.today()
    
    route = db.query(models.PatrolRoute).filter(models.PatrolRoute.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Get all required checkpoints
    required_checkpoints = (
        db.query(models.PatrolCheckpoint)
        .filter(
            models.PatrolCheckpoint.route_id == route_id,
            models.PatrolCheckpoint.required == True
        )
        .all()
    )
    
    # Get scans for this date
    start_datetime = datetime.combine(shift_date, datetime.min.time())
    end_datetime = datetime.combine(shift_date, datetime.max.time())
    
    scans = (
        db.query(models.PatrolCheckpointScan)
        .filter(
            models.PatrolCheckpointScan.route_id == route_id,
            models.PatrolCheckpointScan.user_id == current_user["id"],
            models.PatrolCheckpointScan.scan_time >= start_datetime,
            models.PatrolCheckpointScan.scan_time <= end_datetime,
        )
        .all()
    )
    
    scanned_checkpoint_ids = {s.checkpoint_id for s in scans}
    missed = [cp for cp in required_checkpoints if cp.id not in scanned_checkpoint_ids]
    
    return {
        "route_id": route_id,
        "shift_date": shift_date,
        "total_required": len(required_checkpoints),
        "scanned": len(scans),
        "missed": [{"id": cp.id, "name": cp.name, "order": cp.order} for cp in missed],
    }

# ---- Post Orders & Policy ----

@router.get("/post-orders", response_model=List[schemas.PostOrderBase])
def list_post_orders(
    site_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(True),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List post orders/policies for user's site."""
    company_id = current_user.get("company_id", 1)
    user_site_id = current_user.get("site_id")
    
    q = db.query(models.PostOrder).filter(
        models.PostOrder.company_id == company_id,
        (models.PostOrder.site_id == site_id) | (models.PostOrder.site_id == None) | (models.PostOrder.site_id == user_site_id)
    )
    
    if is_active is not None:
        q = q.filter(models.PostOrder.is_active == is_active)
    if priority:
        q = q.filter(models.PostOrder.priority == priority)
    
    # Filter by effective/expiry dates
    today = date.today()
    q = q.filter(
        (models.PostOrder.effective_date == None) | (models.PostOrder.effective_date <= today)
    )
    q = q.filter(
        (models.PostOrder.expires_date == None) | (models.PostOrder.expires_date >= today)
    )
    
    return q.order_by(models.PostOrder.priority.desc(), models.PostOrder.created_at.desc()).all()

@router.get("/post-orders/{order_id}", response_model=schemas.PostOrderBase)
def get_post_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific post order."""
    order = (
        db.query(models.PostOrder)
        .filter(
            models.PostOrder.id == order_id,
            models.PostOrder.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Post order not found")
    return order

@router.post("/post-orders/{order_id}/acknowledge", response_model=schemas.PostOrderAcknowledgmentBase)
def acknowledge_post_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Acknowledge reading a post order."""
    order = (
        db.query(models.PostOrder)
        .filter(
            models.PostOrder.id == order_id,
            models.PostOrder.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Post order not found")
    
    # Check if already acknowledged
    existing = (
        db.query(models.PostOrderAcknowledgment)
        .filter(
            models.PostOrderAcknowledgment.post_order_id == order_id,
            models.PostOrderAcknowledgment.user_id == current_user["id"],
        )
        .first()
    )
    if existing:
        return existing
    
    ack = models.PostOrderAcknowledgment(
        post_order_id=order_id,
        user_id=current_user["id"],
        acknowledged_at=datetime.utcnow(),
    )
    
    db.add(ack)
    db.commit()
    db.refresh(ack)
    return ack

@router.get("/post-orders/acknowledgments/my", response_model=List[schemas.PostOrderAcknowledgmentBase])
def my_acknowledgments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all post orders I've acknowledged."""
    acks = (
        db.query(models.PostOrderAcknowledgment)
        .filter(models.PostOrderAcknowledgment.user_id == current_user["id"])
        .order_by(models.PostOrderAcknowledgment.acknowledged_at.desc())
        .all()
    )
    return acks

# ---- Shift Scheduling ----

@router.get("/shifts/my", response_model=List[schemas.ShiftScheduleBase])
def my_shifts(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get my shift schedule."""
    q = db.query(models.ShiftSchedule).filter(
        models.ShiftSchedule.company_id == current_user.get("company_id", 1),
        models.ShiftSchedule.user_id == current_user["id"],
    )
    
    if start_date:
        q = q.filter(models.ShiftSchedule.shift_date >= start_date)
    if end_date:
        q = q.filter(models.ShiftSchedule.shift_date <= end_date)
    if status:
        q = q.filter(models.ShiftSchedule.status == status)
    
    return q.order_by(models.ShiftSchedule.shift_date.desc()).all()

@router.get("/shifts/open", response_model=List[schemas.ShiftScheduleBase])
def open_shifts(
    site_id: Optional[int] = Query(None),
    shift_date: Optional[date] = Query(None),
    shift_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get open shifts (unassigned or unconfirmed)."""
    q = db.query(models.ShiftSchedule).filter(
        models.ShiftSchedule.company_id == current_user.get("company_id", 1),
        models.ShiftSchedule.status.in_(["assigned", "pending"]),
    )
    
    if site_id:
        q = q.filter(models.ShiftSchedule.site_id == site_id)
    if shift_date:
        q = q.filter(models.ShiftSchedule.shift_date == shift_date)
    if shift_type:
        q = q.filter(models.ShiftSchedule.shift_type == shift_type)
    
    return q.order_by(models.ShiftSchedule.shift_date, models.ShiftSchedule.shift_type).all()

@router.post("/shifts/{shift_id}/confirm", response_model=schemas.ShiftScheduleBase)
def confirm_shift(
    shift_id: int,
    payload: schemas.ShiftScheduleConfirm,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Confirm or decline a shift assignment."""
    shift = (
        db.query(models.ShiftSchedule)
        .filter(
            models.ShiftSchedule.id == shift_id,
            models.ShiftSchedule.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    if payload.confirmed:
        shift.status = "confirmed"
        shift.confirmed_at = datetime.utcnow()
        shift.confirmed_by_user_id = current_user["id"]
    else:
        shift.status = "cancelled"
    
    if payload.notes:
        shift.notes = payload.notes
    
    db.commit()
    db.refresh(shift)
    return shift

# ---- Shift Calendar View ----

@router.get("/shifts/calendar")
def get_shifts_calendar(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get shifts for calendar view.
    Returns shifts with status: ASSIGNED, OPEN, EXCHANGE_REQUESTED
    """
    company_id = current_user.get("company_id", 1)
    user_id = current_user["id"]
    
    # Get all shifts in date range
    shifts = (
        db.query(models.ShiftSchedule)
        .filter(
            models.ShiftSchedule.company_id == company_id,
            models.ShiftSchedule.shift_date >= start,
            models.ShiftSchedule.shift_date <= end,
        )
        .all()
    )
    
    # Get shift exchanges to determine EXCHANGE_REQUESTED status
    exchanges = (
        db.query(models.ShiftExchange)
        .filter(
            models.ShiftExchange.company_id == company_id,
            models.ShiftExchange.status.in_(["pending", "pending_approval"]),
        )
        .all()
    )
    
    exchange_shift_ids = {ex.from_shift_id for ex in exchanges}
    
    # Get sites for site names (query only needed columns to avoid schema issues)
    from app.models.site import Site
    sites = db.query(Site.id, Site.name).filter(Site.company_id == company_id).all()
    site_map = {s.id: s.name for s in sites}
    
    # Get users for role type determination
    user_ids = {s.user_id for s in shifts if s.user_id}
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u for u in users}
    
    result = []
    for shift in shifts:
        # Determine shift status
        shift_status = "ASSIGNED"
        if shift.status == "open" or (shift.status == "assigned" and shift.user_id is None):
            shift_status = "OPEN"
        elif shift.id in exchange_shift_ids:
            shift_status = "EXCHANGE_REQUESTED"
        
        # Build start/end datetime
        start_time_str = shift.start_time or "08:00"
        end_time_str = shift.end_time or "16:00"
        
        # Parse time strings (HH:MM)
        start_hour, start_min = map(int, start_time_str.split(":"))
        end_hour, end_min = map(int, end_time_str.split(":"))
        
        # Handle night shift that ends next day
        shift_start = datetime.combine(shift.shift_date, datetime.min.time().replace(hour=start_hour, minute=start_min))
        if end_hour < start_hour:  # Night shift (e.g., 22:00 to 06:00)
            shift_end = datetime.combine(shift.shift_date + timedelta(days=1), datetime.min.time().replace(hour=end_hour, minute=end_min))
        else:
            shift_end = datetime.combine(shift.shift_date, datetime.min.time().replace(hour=end_hour, minute=end_min))
        
        # Determine role type from user's division (simplified)
        user = user_map.get(shift.user_id) if shift.user_id else None
        role_type = "SECURITY"  # Default
        if user:
            if user.division == "cleaning":
                role_type = "CLEANING"
            elif user.division == "driver":
                role_type = "DRIVER"
        
        result.append({
            "id": shift.id,
            "start": shift_start.isoformat(),
            "end": shift_end.isoformat(),
            "siteId": shift.site_id,
            "siteName": site_map.get(shift.site_id, f"Site {shift.site_id}"),
            "roleType": role_type,
            "status": shift_status,
            "isMine": shift.user_id == user_id,
        })
    
    return result

@router.post("/shifts/{shift_id}/offer-open")
def offer_shift_as_open(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Offer my assigned shift as an open shift (anyone can take it)."""
    shift = (
        db.query(models.ShiftSchedule)
        .filter(
            models.ShiftSchedule.id == shift_id,
            models.ShiftSchedule.company_id == current_user.get("company_id", 1),
            models.ShiftSchedule.user_id == current_user["id"],
        )
        .first()
    )
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found or not assigned to you")
    
    if shift.status not in ["assigned", "confirmed"]:
        raise HTTPException(status_code=400, detail="Only assigned or confirmed shifts can be offered as open")
    
    # Set status to "open" (we'll use a special status)
    shift.status = "open"
    # Optionally clear user_id to make it truly open
    # shift.user_id = None  # Uncomment if you want to unassign
    
    db.commit()
    db.refresh(shift)
    return {"message": "Shift offered as open", "shift": shift}

@router.post("/shifts/{shift_id}/request-exchange")
def request_shift_exchange(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Request to exchange this shift (creates exchange request)."""
    shift = (
        db.query(models.ShiftSchedule)
        .filter(
            models.ShiftSchedule.id == shift_id,
            models.ShiftSchedule.company_id == current_user.get("company_id", 1),
            models.ShiftSchedule.user_id == current_user["id"],
        )
        .first()
    )
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found or not assigned to you")
    
    # Check if exchange already exists
    existing = (
        db.query(models.ShiftExchange)
        .filter(
            models.ShiftExchange.from_shift_id == shift_id,
            models.ShiftExchange.status.in_(["pending", "pending_approval"]),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Exchange request already exists for this shift")
    
    # Create exchange request (open request, no to_user_id)
    exchange = models.ShiftExchange(
        company_id=current_user.get("company_id", 1),
        site_id=shift.site_id,
        from_user_id=current_user["id"],
        to_user_id=None,  # Open request
        from_shift_id=shift.id,
        to_shift_id=None,  # Open request
        status="pending",
        requires_approval=True,
    )
    db.add(exchange)
    db.commit()
    db.refresh(exchange)
    
    return {"message": "Exchange request created", "exchange": exchange}

@router.post("/shifts/{shift_id}/take-open")
def take_open_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Take an open shift (assign it to current user)."""
    shift = (
        db.query(models.ShiftSchedule)
        .filter(
            models.ShiftSchedule.id == shift_id,
            models.ShiftSchedule.company_id == current_user.get("company_id", 1),
            models.ShiftSchedule.status == "open",
        )
        .first()
    )
    if not shift:
        raise HTTPException(status_code=404, detail="Open shift not found")
    
    # Check if user already has a shift on this date
    existing = (
        db.query(models.ShiftSchedule)
        .filter(
            models.ShiftSchedule.company_id == current_user.get("company_id", 1),
            models.ShiftSchedule.user_id == current_user["id"],
            models.ShiftSchedule.shift_date == shift.shift_date,
            models.ShiftSchedule.status.in_(["assigned", "confirmed"]),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already have a shift on this date")
    
    # Assign shift to current user
    shift.user_id = current_user["id"]
    shift.status = "assigned"
    
    db.commit()
    db.refresh(shift)
    return {"message": "Shift taken successfully", "shift": shift}

# ---- GPS Tracking & Idle Alerts ----

@router.post("/location/update")
def update_location(
    payload: schemas.UpdateLocationPayload,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update guard's current GPS location."""
    # Mark previous location as inactive
    db.query(models.GuardLocation).filter(
        models.GuardLocation.user_id == current_user["id"],
        models.GuardLocation.is_active == True,
    ).update({"is_active": False})
    
    location = models.GuardLocation(
        company_id=current_user.get("company_id", 1),
        site_id=payload.site_id,
        user_id=current_user["id"],
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy=payload.accuracy,
        heading=payload.heading,
        speed=payload.speed,
        timestamp=datetime.utcnow(),
        is_active=True,
    )
    
    db.add(location)
    db.commit()
    db.refresh(location)
    return {"message": "Location updated", "location": location}

@router.get("/location/live", response_model=List[schemas.GuardLocationBase])
def get_live_locations(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get live GPS locations of all guards (supervisor/admin only)."""
    q = db.query(models.GuardLocation).filter(
        models.GuardLocation.company_id == current_user.get("company_id", 1),
        models.GuardLocation.is_active == True,
    )
    
    if site_id:
        q = q.filter(models.GuardLocation.site_id == site_id)
    
    # Only get latest location per user
    locations = q.order_by(models.GuardLocation.timestamp.desc()).all()
    # Deduplicate by user_id (keep latest)
    seen = set()
    result = []
    for loc in locations:
        if loc.user_id not in seen:
            seen.add(loc.user_id)
            result.append(loc)
    
    return result

@router.get("/alerts/idle", response_model=List[schemas.IdleAlertBase])
def get_idle_alerts(
    site_id: Optional[int] = Query(None),
    status: Optional[str] = Query("active"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get idle/inactive alerts (supervisor/admin only)."""
    q = db.query(models.IdleAlert).filter(
        models.IdleAlert.company_id == current_user.get("company_id", 1),
    )
    
    if site_id:
        q = q.filter(models.IdleAlert.site_id == site_id)
    if status:
        q = q.filter(models.IdleAlert.status == status)
    
    return q.order_by(models.IdleAlert.created_at.desc()).limit(50).all()

@router.post("/alerts/idle/{alert_id}/acknowledge")
def acknowledge_idle_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Acknowledge an idle alert."""
    alert = (
        db.query(models.IdleAlert)
        .filter(
            models.IdleAlert.id == alert_id,
            models.IdleAlert.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "acknowledged"
    alert.acknowledged_by_user_id = current_user["id"]
    alert.acknowledged_at = datetime.utcnow()
    
    db.commit()
    db.refresh(alert)
    return {"message": "Alert acknowledged", "alert": alert}

# ---- Payroll Export ----

@router.get("/payroll/export")
def export_payroll(
    start_date: date = Query(...),
    end_date: date = Query(...),
    site_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export attendance data to CSV for payroll."""
    from fastapi.responses import StreamingResponse
    import csv
    import io
    
    q = db.query(models.SecurityAttendance).filter(
        models.SecurityAttendance.company_id == current_user.get("company_id", 1),
        models.SecurityAttendance.check_in_time >= datetime.combine(start_date, datetime.min.time()),
        models.SecurityAttendance.check_in_time <= datetime.combine(end_date, datetime.max.time()),
    )
    
    if site_id:
        q = q.filter(models.SecurityAttendance.site_id == site_id)
    if user_id:
        q = q.filter(models.SecurityAttendance.user_id == user_id)
    
    attendances = q.order_by(models.SecurityAttendance.check_in_time).all()
    
    # Get user names
    from app.models.user import User
    user_map = {}
    user_ids = {a.user_id for a in attendances}
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        user_map = {u.id: u.name for u in users}
    
    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Date", "Employee ID", "Employee Name", "Site", 
        "Check-In Time", "Check-Out Time", "Hours Worked", 
        "Status", "Location"
    ])
    
    # Rows
    for att in attendances:
        check_in = att.check_in_time.strftime("%Y-%m-%d %H:%M:%S") if att.check_in_time else ""
        check_out = att.check_out_time.strftime("%Y-%m-%d %H:%M:%S") if att.check_out_time else ""
        
        hours_worked = ""
        if att.check_in_time and att.check_out_time:
            delta = att.check_out_time - att.check_in_time
            hours_worked = f"{delta.total_seconds() / 3600:.2f}"
        
        writer.writerow([
            att.shift_date.strftime("%Y-%m-%d"),
            att.user_id,
            user_map.get(att.user_id, "Unknown"),
            att.site_id,
            check_in,
            check_out,
            hours_worked,
            att.status,
            att.check_in_location or "",
        ])
    
    output.seek(0)
    filename = f"payroll_export_{start_date}_{end_date}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ---- Client Portal (Read-only Reports) ----

@router.get("/client/reports")
def client_reports(
    site_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    report_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get reports for client portal (read-only, filtered by site)."""
    q = db.query(models.SecurityReport).filter(
        models.SecurityReport.company_id == current_user.get("company_id", 1),
    )
    
    if site_id:
        q = q.filter(models.SecurityReport.site_id == site_id)
    if start_date:
        q = q.filter(models.SecurityReport.report_date >= start_date)
    if end_date:
        q = q.filter(models.SecurityReport.report_date <= end_date)
    if report_type:
        q = q.filter(models.SecurityReport.report_type == report_type)
    
    reports = q.order_by(models.SecurityReport.report_date.desc(), models.SecurityReport.created_at.desc()).limit(100).all()
    return reports

@router.get("/client/dar/{dar_id}")
def client_dar_detail(
    dar_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get DAR detail for client portal."""
    dar = (
        db.query(models.DailyActivityReport)
        .filter(
            models.DailyActivityReport.id == dar_id,
            models.DailyActivityReport.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not dar:
        raise HTTPException(status_code=404, detail="DAR not found")
    return dar

@router.get("/client/dar/export/{dar_id}")
def export_dar_pdf(
    dar_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export DAR as PDF."""
    dar = (
        db.query(models.DailyActivityReport)
        .filter(
            models.DailyActivityReport.id == dar_id,
            models.DailyActivityReport.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not dar:
        raise HTTPException(status_code=404, detail="DAR not found")
    
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from io import BytesIO
        from fastapi.responses import StreamingResponse
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a365d'),
            spaceAfter=12,
        )
        story.append(Paragraph("Daily Activity Report", title_style))
        
        # Header info
        header_data = [
            ['Report Number:', dar.report_number or f"DAR-{dar.id}"],
            ['Date:', str(dar.report_date)],
            ['Site ID:', str(dar.site_id)],
            ['Shift Type:', dar.shift_type or "N/A"],
            ['Status:', dar.status or "DRAFT"],
        ]
        
        header_table = Table(header_data, colWidths=[2*inch, 4*inch])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Content
        if dar.content:
            content_style = ParagraphStyle(
                'CustomContent',
                parent=styles['Normal'],
                fontSize=10,
                leading=14,
                spaceAfter=12,
            )
            # Convert newlines to HTML breaks for Paragraph
            content_html = dar.content.replace('\n', '<br/>')
            story.append(Paragraph("Report Content:", styles['Heading2']))
            story.append(Paragraph(content_html, content_style))
        else:
            story.append(Paragraph("No content available.", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        filename = f"DAR_{dar.report_number or dar_id}_{dar.report_date}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ImportError:
        # Fallback to HTML if reportlab not installed
        from fastapi.responses import HTMLResponse
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Daily Activity Report - {dar.report_number}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #1a365d; }}
                .header {{ margin-bottom: 20px; }}
                .content {{ white-space: pre-wrap; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Daily Activity Report</h1>
                <p><strong>Report Number:</strong> {dar.report_number}</p>
                <p><strong>Date:</strong> {dar.report_date}</p>
                <p><strong>Site:</strong> {dar.site_id}</p>
            </div>
            <div class="content">{dar.content or "No content"}</div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)

# ---- Shift Exchange ----

@router.post("/shifts/exchange", response_model=schemas.ShiftExchangeBase)
def create_shift_exchange(
    payload: schemas.ShiftExchangeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a shift exchange/swap request."""
    # Verify from_shift belongs to current user
    from_shift = (
        db.query(models.ShiftSchedule)
        .filter(
            models.ShiftSchedule.id == payload.from_shift_id,
            models.ShiftSchedule.user_id == current_user["id"],
            models.ShiftSchedule.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not from_shift:
        raise HTTPException(status_code=404, detail="Shift not found or not yours")
    
    # If to_shift_id provided, verify it exists
    to_shift = None
    if payload.to_shift_id:
        to_shift = (
            db.query(models.ShiftSchedule)
            .filter(
                models.ShiftSchedule.id == payload.to_shift_id,
                models.ShiftSchedule.company_id == current_user.get("company_id", 1),
            )
            .first()
        )
        if not to_shift:
            raise HTTPException(status_code=404, detail="Target shift not found")
    
    # Determine if approval is needed based on user role
    # Guards need supervisor approval, supervisors can auto-approve
    user_role = current_user.get("role", "guard")
    requires_approval = user_role not in ["supervisor", "admin"]
    
    exchange = models.ShiftExchange(
        company_id=current_user.get("company_id", 1),
        site_id=payload.site_id,
        from_user_id=current_user["id"],
        to_user_id=payload.to_user_id,
        from_shift_id=payload.from_shift_id,
        to_shift_id=payload.to_shift_id,
        status="pending",
        request_message=payload.request_message,
        requires_approval=requires_approval,
        approval_status="pending" if requires_approval else None,
    )
    
    db.add(exchange)
    db.commit()
    db.refresh(exchange)
    return exchange

@router.get("/shifts/exchange/my", response_model=List[schemas.ShiftExchangeBase])
def my_shift_exchanges(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get my shift exchange requests (as requester or recipient)."""
    q = db.query(models.ShiftExchange).filter(
        models.ShiftExchange.company_id == current_user.get("company_id", 1),
        (
            (models.ShiftExchange.from_user_id == current_user["id"]) |
            (models.ShiftExchange.to_user_id == current_user["id"]) |
            (models.ShiftExchange.to_user_id == None)  # Open requests
        )
    )
    
    if status:
        q = q.filter(models.ShiftExchange.status == status)
    
    return q.order_by(models.ShiftExchange.requested_at.desc()).limit(50).all()

@router.get("/shifts/exchange/open", response_model=List[schemas.ShiftExchangeBase])
def open_shift_exchanges(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get open shift exchange requests (available for anyone to accept)."""
    q = db.query(models.ShiftExchange).filter(
        models.ShiftExchange.company_id == current_user.get("company_id", 1),
        models.ShiftExchange.status == "pending",
        models.ShiftExchange.to_user_id == None,  # Open requests
        models.ShiftExchange.from_user_id != current_user["id"],  # Not my requests
    )
    
    if site_id:
        q = q.filter(models.ShiftExchange.site_id == site_id)
    
    return q.order_by(models.ShiftExchange.requested_at.desc()).limit(50).all()

@router.post("/shifts/exchange/{exchange_id}/respond", response_model=schemas.ShiftExchangeBase)
def respond_to_shift_exchange(
    exchange_id: int,
    payload: schemas.ShiftExchangeResponse,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Accept or reject a shift exchange request."""
    exchange = (
        db.query(models.ShiftExchange)
        .filter(
            models.ShiftExchange.id == exchange_id,
            models.ShiftExchange.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not exchange:
        raise HTTPException(status_code=404, detail="Exchange request not found")
    
    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail="Exchange request already processed")
    
    # Verify user can respond (either recipient or accepting open request)
    if exchange.to_user_id and exchange.to_user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to respond")
    
    if payload.accept:
        # Accept the exchange - but don't apply yet, need approval
        exchange.to_user_id = current_user["id"]  # Set if it was open
        
        # Check if approval is needed
        if exchange.requires_approval:
            exchange.status = "pending_approval"
            exchange.approval_status = "pending"
        else:
            # No approval needed (supervisor/admin), apply immediately
            exchange.status = "accepted"
            exchange.approval_status = "approved"
            exchange.approved_by_user_id = current_user["id"]
            exchange.approved_at = datetime.utcnow()
            # Apply the shift swap
            _apply_shift_exchange(db, exchange)
    else:
        exchange.status = "rejected"
    
    exchange.response_message = payload.response_message
    exchange.responded_at = datetime.utcnow()
    
    db.commit()
    db.refresh(exchange)
    return exchange

@router.post("/shifts/exchange/{exchange_id}/cancel")
def cancel_shift_exchange(
    exchange_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cancel your own shift exchange request."""
    exchange = (
        db.query(models.ShiftExchange)
        .filter(
            models.ShiftExchange.id == exchange_id,
            models.ShiftExchange.company_id == current_user.get("company_id", 1),
            models.ShiftExchange.from_user_id == current_user["id"],
        )
        .first()
    )
    if not exchange:
        raise HTTPException(status_code=404, detail="Exchange request not found")
    
    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail="Cannot cancel non-pending request")
    
    exchange.status = "cancelled"
    db.commit()
    return {"message": "Exchange request cancelled"}
