# backend/app/divisions/security/services/dar_service.py

from datetime import date, datetime
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.divisions.security.models import (
    SecurityAttendance,
    SecurityReport,
    SecurityPatrolLog,
    Checklist,
)


def compile_dar_data(
    db: Session,
    company_id: int,
    site_id: int,
    shift_date: date,
    shift_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Compile DAR data from various sources:
    - Check-ins/check-outs
    - Patrol logs
    - Incidents/reports
    - Checklists
    - Notes
    """
    summary = {
        "check_ins": [],
        "patrols": [],
        "incidents": [],
        "reports": [],
        "checklists": [],
        "notes": [],
    }
    
    # Get attendance records
    attendances = (
        db.query(SecurityAttendance)
        .filter(
            SecurityAttendance.company_id == company_id,
            SecurityAttendance.site_id == site_id,
            SecurityAttendance.shift_date == shift_date,
        )
        .all()
    )
    
    for att in attendances:
        summary["check_ins"].append({
            "user_id": att.user_id,
            "check_in_time": att.check_in_time.isoformat() if att.check_in_time else None,
            "check_out_time": att.check_out_time.isoformat() if att.check_out_time else None,
            "location": att.check_in_location,
        })
    
    # Get patrol logs
    start_of_day = datetime.combine(shift_date, datetime.min.time())
    end_of_day = datetime.combine(shift_date, datetime.max.time())
    
    patrols = (
        db.query(SecurityPatrolLog)
        .filter(
            SecurityPatrolLog.company_id == company_id,
            SecurityPatrolLog.site_id == site_id,
            SecurityPatrolLog.start_time >= start_of_day,
            SecurityPatrolLog.start_time <= end_of_day,
        )
        .all()
    )
    
    for patrol in patrols:
        summary["patrols"].append({
            "id": patrol.id,
            "user_id": patrol.user_id,
            "start_time": patrol.start_time.isoformat(),
            "end_time": patrol.end_time.isoformat() if patrol.end_time else None,
            "area": patrol.area_text,
            "notes": patrol.notes,
        })
    
    # Get incidents/reports
    reports = (
        db.query(SecurityReport)
        .filter(
            SecurityReport.company_id == company_id,
            SecurityReport.site_id == site_id,
            SecurityReport.created_at >= start_of_day,
            SecurityReport.created_at <= end_of_day,
        )
        .all()
    )
    
    for report in reports:
        if report.report_type == "incident":
            summary["incidents"].append({
                "id": report.id,
                "title": report.title,
                "description": report.description,
                "severity": report.severity,
                "location": report.location_text,
                "created_at": report.created_at.isoformat(),
            })
        else:
            summary["reports"].append({
                "id": report.id,
                "type": report.report_type,
                "title": report.title,
                "description": report.description,
                "created_at": report.created_at.isoformat(),
            })
    
    # Get checklists
    checklists = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == company_id,
            Checklist.site_id == site_id,
            Checklist.shift_date == shift_date,
        )
        .all()
    )
    
    for checklist in checklists:
        required_items = [i for i in checklist.items if i.required]
        completed = sum(1 for i in required_items if i.status.value == "COMPLETED")
        summary["checklists"].append({
            "id": checklist.id,
            "user_id": checklist.user_id,
            "status": checklist.status.value,
            "completed": completed,
            "total_required": len(required_items),
        })
    
    return summary


def generate_report_number(db: Session, shift_date: date, site_id: int) -> str:
    """Generate unique DAR report number."""
    from app.divisions.security.models import DailyActivityReport
    
    date_str = shift_date.strftime("%Y-%m-%d")
    site_code = f"S{site_id}"
    
    last_report = (
        db.query(DailyActivityReport)
        .filter(DailyActivityReport.report_number.like(f"DAR-{date_str}-{site_code}-%"))
        .order_by(DailyActivityReport.id.desc())
        .first()
    )
    
    if last_report:
        last_num = int(last_report.report_number.split("-")[-1])
        return f"DAR-{date_str}-{site_code}-{last_num + 1:03d}"
    else:
        return f"DAR-{date_str}-{site_code}-001"

