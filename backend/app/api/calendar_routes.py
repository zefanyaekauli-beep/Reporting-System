# backend/app/api/calendar_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from calendar import monthrange

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user
from app.models.shift import Shift, ShiftStatus
from app.models.attendance import Attendance
from app.models.user import User
from app.models.site import Site
from app.divisions.security.models import SecurityReport
from app.models.training import Training
from app.models.visitor import Visitor

router = APIRouter(prefix="/calendar", tags=["calendar"])


class CalendarEvent(BaseModel):
    id: int
    title: str
    type: str  # "SHIFT", "ATTENDANCE", "REPORT", "TRAINING", "VISITOR"
    start: datetime
    end: Optional[datetime] = None
    all_day: bool = False
    color: Optional[str] = None
    metadata: Optional[dict] = None


@router.get("/events", response_model=List[CalendarEvent])
def get_calendar_events(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    event_types: Optional[str] = Query(None, description="Comma-separated: SHIFT,ATTENDANCE,REPORT,TRAINING,VISITOR"),
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get calendar events for a date range."""
    try:
        # Handle year/month parameters
        if year and month:
            # Calculate start and end dates for the month
            first_day = date(year, month, 1)
            last_day_num = monthrange(year, month)[1]
            last_day = date(year, month, last_day_num)
            start_date = first_day
            end_date = last_day
        elif not start_date or not end_date:
            # Default to current month if no dates provided
            today = date.today()
            first_day = date(today.year, today.month, 1)
            last_day_num = monthrange(today.year, today.month)[1]
            last_day = date(today.year, today.month, last_day_num)
            start_date = first_day
            end_date = last_day
        
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        role = current_user.get("role", "GUARD")
        
        # Parse event types
        types_filter = []
        if event_types:
            types_filter = [t.strip().upper() for t in event_types.split(",")]
        else:
            types_filter = ["SHIFT", "ATTENDANCE", "REPORT", "TRAINING", "VISITOR"]
        
        events = []
        
        # Shifts
        if "SHIFT" in types_filter:
            shifts = (
                db.query(Shift)
                .filter(
                    Shift.company_id == company_id,
                    func.date(Shift.shift_date) >= start_date,
                    func.date(Shift.shift_date) <= end_date,
                )
            )
            if site_id:
                shifts = shifts.filter(Shift.site_id == site_id)
            if role not in ["SUPERVISOR", "ADMIN", "SUPER_ADMIN"]:
                shifts = shifts.filter(Shift.user_id == user_id)
            
            for shift in shifts.all():
                user = db.query(User).filter(User.id == shift.user_id).first() if shift.user_id else None
                site = db.query(Site).filter(Site.id == shift.site_id).first()
                
                # Parse start/end times
                start_time = shift.shift_date
                if shift.start_time:
                    try:
                        hour, minute = map(int, shift.start_time.split(":"))
                        start_time = datetime.combine(shift.shift_date.date(), datetime.min.time().replace(hour=hour, minute=minute))
                    except:
                        pass
                
                end_time = None
                if shift.end_time:
                    try:
                        hour, minute = map(int, shift.end_time.split(":"))
                        end_time = datetime.combine(shift.shift_date.date(), datetime.min.time().replace(hour=hour, minute=minute))
                    except:
                        pass
                
                events.append(CalendarEvent(
                    id=shift.id,
                    title=f"Shift: {user.username if user else 'Unassigned'} - {site.name if site else f'Site {shift.site_id}'}",
                    type="SHIFT",
                    start=start_time,
                    end=end_time,
                    all_day=False,
                    color="#3b82f6",
                    metadata={
                        "shift_id": shift.id,
                        "user_id": shift.user_id,
                        "user_name": user.username if user else None,
                        "site_id": shift.site_id,
                        "site_name": site.name if site else None,
                        "division": shift.division,
                        "status": shift.status.value if hasattr(shift.status, 'value') else str(shift.status),
                    },
                ))
        
        # Attendance
        if "ATTENDANCE" in types_filter:
            attendances = (
                db.query(Attendance)
                .filter(
                    Attendance.company_id == company_id,
                    func.date(Attendance.checkin_time) >= start_date,
                    func.date(Attendance.checkin_time) <= end_date,
                )
            )
            if site_id:
                attendances = attendances.filter(Attendance.site_id == site_id)
            if role not in ["SUPERVISOR", "ADMIN", "SUPER_ADMIN"]:
                attendances = attendances.filter(Attendance.user_id == user_id)
            
            for att in attendances.all():
                user = db.query(User).filter(User.id == att.user_id).first()
                site = db.query(Site).filter(Site.id == att.site_id).first()
                
                events.append(CalendarEvent(
                    id=att.id,
                    title=f"Attendance: {user.username if user else f'User {att.user_id}'}",
                    type="ATTENDANCE",
                    start=att.checkin_time,
                    end=att.checkout_time,
                    all_day=False,
                    color="#10b981",
                    metadata={
                        "attendance_id": att.id,
                        "user_id": att.user_id,
                        "user_name": user.username if user else None,
                        "site_id": att.site_id,
                        "site_name": site.name if site else None,
                        "status": att.status.value if hasattr(att.status, 'value') else str(att.status),
                    },
                ))
        
        # Reports
        if "REPORT" in types_filter:
            reports = (
                db.query(SecurityReport)
                .filter(
                    SecurityReport.company_id == company_id,
                    func.date(SecurityReport.created_at) >= start_date,
                    func.date(SecurityReport.created_at) <= end_date,
                )
            )
            if site_id:
                reports = reports.filter(SecurityReport.site_id == site_id)
            if role not in ["SUPERVISOR", "ADMIN", "SUPER_ADMIN"]:
                reports = reports.filter(SecurityReport.user_id == user_id)
            
            for report in reports.limit(100).all():
                user = db.query(User).filter(User.id == report.user_id).first()
                site = db.query(Site).filter(Site.id == report.site_id).first()
                
                events.append(CalendarEvent(
                    id=report.id,
                    title=f"Report: {report.title}",
                    type="REPORT",
                    start=report.created_at,
                    end=None,
                    all_day=False,
                    color="#ef4444" if report.severity == "high" else "#f59e0b" if report.severity == "medium" else "#3b82f6",
                    metadata={
                        "report_id": report.id,
                        "report_type": report.report_type,
                        "severity": report.severity,
                        "status": report.status,
                        "user_id": report.user_id,
                        "user_name": user.username if user else None,
                        "site_id": report.site_id,
                        "site_name": site.name if site else None,
                    },
                ))
        
        # Training
        if "TRAINING" in types_filter:
            trainings = (
                db.query(Training)
                .filter(
                    Training.company_id == company_id,
                    func.date(Training.scheduled_date) >= start_date,
                    func.date(Training.scheduled_date) <= end_date,
                )
            )
            if site_id:
                trainings = trainings.filter(Training.site_id == site_id)
            
            for training in trainings.all():
                site = db.query(Site).filter(Site.id == training.site_id).first() if training.site_id else None
                
                end_time = training.scheduled_date
                if training.duration_minutes:
                    end_time = training.scheduled_date + timedelta(minutes=training.duration_minutes)
                
                events.append(CalendarEvent(
                    id=training.id,
                    title=f"Training: {training.title}",
                    type="TRAINING",
                    start=training.scheduled_date,
                    end=end_time,
                    all_day=False,
                    color="#8b5cf6",
                    metadata={
                        "training_id": training.id,
                        "category": training.category,
                        "status": training.status.value if hasattr(training.status, 'value') else str(training.status),
                        "site_id": training.site_id,
                        "site_name": site.name if site else None,
                    },
                ))
        
        # Visitors
        if "VISITOR" in types_filter:
            visitors = (
                db.query(Visitor)
                .filter(
                    Visitor.company_id == company_id,
                    func.date(Visitor.visit_date) >= start_date,
                    func.date(Visitor.visit_date) <= end_date,
                )
            )
            if site_id:
                visitors = visitors.filter(Visitor.site_id == site_id)
            
            for visitor in visitors.all():
                site = db.query(Site).filter(Site.id == visitor.site_id).first()
                
                events.append(CalendarEvent(
                    id=visitor.id,
                    title=f"Visitor: {visitor.name}",
                    type="VISITOR",
                    start=visitor.visit_date,
                    end=visitor.check_out_time,
                    all_day=False,
                    color="#06b6d4",
                    metadata={
                        "visitor_id": visitor.id,
                        "visitor_name": visitor.name,
                        "category": visitor.category,
                        "status": visitor.status,
                        "site_id": visitor.site_id,
                        "site_name": site.name if site else None,
                    },
                ))
        
        # Sort by start time
        events.sort(key=lambda x: x.start)
        
        api_logger.info(f"Retrieved {len(events)} calendar events for user {user_id}")
        return events
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting calendar events: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get calendar events: {error_msg}"
        )

