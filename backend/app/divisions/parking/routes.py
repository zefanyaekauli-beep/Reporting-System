# backend/app/divisions/parking/routes.py

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
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.attendance import Attendance, AttendanceStatus
from app.models.site import Site
from app.divisions.security.models import SecurityReport
import os

router = APIRouter(tags=["parking"])

# Create media directories
MEDIA_BASE = "media"
PARKING_REPORTS_DIR = f"{MEDIA_BASE}/parking_reports"
PARKING_ATTENDANCE_DIR = f"{MEDIA_BASE}/parking_attendance"

for dir_path in [PARKING_REPORTS_DIR, PARKING_ATTENDANCE_DIR]:
    os.makedirs(dir_path, exist_ok=True)

# ---- Attendance (using unified Attendance model) ----

@router.get("/attendance/today")
def get_today_attendance(
    site_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get today's attendance for parking staff."""
    today = date.today()
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == current_user.get("id"),
            Attendance.site_id == site_id,
            Attendance.role_type == "PARKING",
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
async def create_parking_report(
    report_type: str = Form(...),
    site_id: int = Form(...),
    location_text: Optional[str] = Form(None),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    severity: Optional[str] = Form(None),
    evidence_files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a parking report."""
    evidence_paths: List[str] = []

    if evidence_files:
        for f in evidence_files:
            filename = f"{int(datetime.utcnow().timestamp())}_{f.filename}"
            path = f"{PARKING_REPORTS_DIR}/{filename}"
            with open(path, "wb") as out:
                content = await f.read()
                out.write(content)
            evidence_paths.append(path)

    report = SecurityReport(
        company_id=current_user.get("company_id", 1),
        site_id=site_id,
        user_id=current_user["id"],
        report_type=report_type,
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
def list_parking_reports(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List parking reports."""
    q = db.query(SecurityReport).filter(
        SecurityReport.company_id == current_user.get("company_id", 1),
        SecurityReport.user_id == current_user["id"],
    )

    if site_id is not None:
        q = q.filter(SecurityReport.site_id == site_id)
    if from_date is not None:
        q = q.filter(SecurityReport.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date is not None:
        q = q.filter(SecurityReport.created_at <= datetime.combine(to_date, datetime.max.time()))

    q = q.order_by(SecurityReport.created_at.desc()).limit(200)
    return q.all()

@router.get("/reports/{report_id}")
def get_parking_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific parking report."""
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
def export_parking_report_pdf(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export parking report as PDF."""
    from fastapi.responses import StreamingResponse
    from app.services.pdf_service import PDFService
    
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
    
    filename = f"Parking_Report_{report_id}_{date.today().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/reports/export-pdf")
def export_parking_reports_summary_pdf(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export multiple parking reports as PDF summary."""
    from fastapi.responses import StreamingResponse
    from app.services.pdf_service import PDFService
    
    q = db.query(SecurityReport).filter(
        SecurityReport.company_id == current_user.get("company_id", 1),
        SecurityReport.user_id == current_user["id"],
    )

    if site_id is not None:
        q = q.filter(SecurityReport.site_id == site_id)
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
    
    filename = f"Parking_Reports_Summary_{date.today().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ---- Checklist Endpoints (Parking Staff) ----

@router.get("/me/checklist/today")
def get_today_checklist(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get today's checklist for current parking user."""
    from fastapi import status as http_status
    from app.divisions.security.models import Checklist
    
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

# ---- Parking Tickets (existing) ----

@router.get("/tickets")
def list_parking_tickets(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List parking tickets."""
    # TODO: implement real DB query when parking ticket model is created
    return [{"id": 1, "plate": "B 1234 CD", "status": "in"}]
