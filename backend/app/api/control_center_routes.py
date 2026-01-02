# backend/app/api/control_center_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import require_supervisor
from app.models.attendance import Attendance, AttendanceStatus
from app.models.shift import Shift, ShiftStatus
from app.models.user import User
from app.models.site import Site
from app.divisions.security.models import SecurityReport, SecurityPatrolLog, PanicAlert, DispatchTicket
from app.models.gps_track import GPSTrack

router = APIRouter(prefix="/control-center", tags=["control-center"])


class ControlCenterStatus(BaseModel):
    """Overall control center status"""
    total_on_duty: int
    total_active_patrols: int
    total_active_incidents: int
    total_panic_alerts: int
    total_dispatch_tickets: int
    last_updated: datetime


class ActivePatrol(BaseModel):
    id: int
    user_id: int
    user_name: str
    site_id: int
    site_name: str
    start_time: datetime
    area_text: Optional[str] = None
    current_location: Optional[dict] = None  # Latest GPS track
    duration_minutes: Optional[int] = None


class ActiveIncident(BaseModel):
    id: int
    title: str
    report_type: str
    severity: Optional[str] = None
    site_id: int
    site_name: str
    reported_by: str
    reported_at: datetime
    status: str
    location_text: Optional[str] = None


@router.get("/status", response_model=ControlCenterStatus)
def get_control_center_status(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get overall control center status."""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Count on-duty personnel
        on_duty = (
            db.query(Attendance)
            .filter(
                Attendance.company_id == company_id,
                Attendance.status == AttendanceStatus.IN_PROGRESS,
            )
        )
        if site_id:
            on_duty = on_duty.filter(Attendance.site_id == site_id)
        total_on_duty = on_duty.count()
        
        # Count active patrols
        active_patrols = (
            db.query(SecurityPatrolLog)
            .filter(
                SecurityPatrolLog.company_id == company_id,
                SecurityPatrolLog.end_time.is_(None),
            )
        )
        if site_id:
            active_patrols = active_patrols.filter(SecurityPatrolLog.site_id == site_id)
        total_active_patrols = active_patrols.count()
        
        # Count active incidents (open status)
        active_incidents = (
            db.query(SecurityReport)
            .filter(
                SecurityReport.company_id == company_id,
                SecurityReport.status.in_(["open", "in_review"]),
            )
        )
        if site_id:
            active_incidents = active_incidents.filter(SecurityReport.site_id == site_id)
        total_active_incidents = active_incidents.count()
        
        # Count active panic alerts
        active_panics = (
            db.query(PanicAlert)
            .filter(
                PanicAlert.company_id == company_id,
                PanicAlert.status == "active",
            )
        )
        if site_id:
            active_panics = active_panics.filter(PanicAlert.site_id == site_id)
        total_panic_alerts = active_panics.count()
        
        # Count open dispatch tickets
        open_tickets = (
            db.query(DispatchTicket)
            .filter(
                DispatchTicket.company_id == company_id,
                DispatchTicket.status.in_(["NEW", "ASSIGNED", "ONSCENE"]),
            )
        )
        if site_id:
            open_tickets = open_tickets.filter(DispatchTicket.site_id == site_id)
        total_dispatch_tickets = open_tickets.count()
        
        from datetime import timezone as tz
        return ControlCenterStatus(
            total_on_duty=total_on_duty,
            total_active_patrols=total_active_patrols,
            total_active_incidents=total_active_incidents,
            total_panic_alerts=total_panic_alerts,
            total_dispatch_tickets=total_dispatch_tickets,
            last_updated=datetime.now(tz.utc),
        )
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting control center status: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get control center status: {error_msg}"
        )


@router.get("/active-patrols", response_model=List[ActivePatrol])
def get_active_patrols(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get active patrols with current location."""
    try:
        company_id = current_user.get("company_id", 1)
        
        patrols = (
            db.query(SecurityPatrolLog)
            .filter(
                SecurityPatrolLog.company_id == company_id,
                SecurityPatrolLog.end_time.is_(None),
            )
        )
        if site_id:
            patrols = patrols.filter(SecurityPatrolLog.site_id == site_id)
        
        patrols = patrols.order_by(SecurityPatrolLog.start_time.desc()).all()
        
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
            
            current_location = None
            if latest_track:
                current_location = {
                    "latitude": latest_track.latitude,
                    "longitude": latest_track.longitude,
                    "recorded_at": latest_track.recorded_at.isoformat(),
                    "accuracy": latest_track.accuracy,
                }
            
            # Calculate duration
            duration_minutes = None
            if patrol.start_time:
                from datetime import timezone as tz
                duration_seconds = (datetime.now(tz.utc) - patrol.start_time).total_seconds()
                duration_minutes = int(duration_seconds / 60)
            
            result.append(ActivePatrol(
                id=patrol.id,
                user_id=patrol.user_id,
                user_name=user.username if user else f"User {patrol.user_id}",
                site_id=patrol.site_id,
                site_name=site.name if site else f"Site {patrol.site_id}",
                start_time=patrol.start_time,
                area_text=patrol.area_text,
                current_location=current_location,
                duration_minutes=duration_minutes,
            ))
        
        api_logger.info(f"Retrieved {len(result)} active patrols for control center")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting active patrols: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get active patrols: {error_msg}"
        )


@router.get("/active-incidents", response_model=List[ActiveIncident])
def get_active_incidents(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get active incidents."""
    try:
        company_id = current_user.get("company_id", 1)
        
        incidents = (
            db.query(SecurityReport)
            .filter(
                SecurityReport.company_id == company_id,
                SecurityReport.status.in_(["open", "in_review"]),
            )
        )
        if site_id:
            incidents = incidents.filter(SecurityReport.site_id == site_id)
        
        incidents = incidents.order_by(SecurityReport.created_at.desc()).limit(50).all()
        
        result = []
        for incident in incidents:
            user = db.query(User).filter(User.id == incident.user_id).first()
            site = db.query(Site).filter(Site.id == incident.site_id).first()
            
            reported_at = incident.reported_at if hasattr(incident, 'reported_at') and incident.reported_at else incident.created_at
            
            result.append(ActiveIncident(
                id=incident.id,
                title=incident.title,
                report_type=incident.report_type,
                severity=incident.severity,
                site_id=incident.site_id,
                site_name=site.name if site else f"Site {incident.site_id}",
                reported_by=user.username if user else f"User {incident.user_id}",
                reported_at=reported_at,
                status=incident.status,
                location_text=incident.location_text,
            ))
        
        api_logger.info(f"Retrieved {len(result)} active incidents for control center")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting active incidents: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get active incidents: {error_msg}"
        )


@router.get("/panic-alerts")
def get_panic_alerts(
    site_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get panic alerts."""
    try:
        company_id = current_user.get("company_id", 1)
        
        alerts = (
            db.query(PanicAlert)
            .filter(PanicAlert.company_id == company_id)
        )
        
        if site_id:
            alerts = alerts.filter(PanicAlert.site_id == site_id)
        if status:
            alerts = alerts.filter(PanicAlert.status == status)
        
        alerts = alerts.order_by(PanicAlert.created_at.desc()).limit(50).all()
        
        result = []
        for alert in alerts:
            user = db.query(User).filter(User.id == alert.user_id).first()
            site = db.query(Site).filter(Site.id == alert.site_id).first()
            
            result.append({
                "id": alert.id,
                "user_id": alert.user_id,
                "user_name": user.username if user else f"User {alert.user_id}",
                "site_id": alert.site_id,
                "site_name": site.name if site else f"Site {alert.site_id}",
                "alert_type": alert.alert_type,
                "latitude": alert.latitude,
                "longitude": alert.longitude,
                "message": alert.message,
                "status": alert.status,
                "created_at": alert.created_at.isoformat(),
                "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
                "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
            })
        
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting panic alerts: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get panic alerts: {error_msg}"
        )


@router.get("/dispatch-tickets")
def get_dispatch_tickets(
    site_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get dispatch tickets."""
    try:
        company_id = current_user.get("company_id", 1)
        
        tickets = (
            db.query(DispatchTicket)
            .filter(DispatchTicket.company_id == company_id)
        )
        
        if site_id:
            tickets = tickets.filter(DispatchTicket.site_id == site_id)
        if status:
            tickets = tickets.filter(DispatchTicket.status == status)
        
        tickets = tickets.order_by(DispatchTicket.created_at.desc()).limit(50).all()
        
        result = []
        for ticket in tickets:
            site = db.query(Site).filter(Site.id == ticket.site_id).first()
            assigned_user = None
            if ticket.assigned_to_user_id:
                assigned_user = db.query(User).filter(User.id == ticket.assigned_to_user_id).first()
            
            result.append({
                "id": ticket.id,
                "ticket_number": ticket.ticket_number,
                "site_id": ticket.site_id,
                "site_name": site.name if site else f"Site {ticket.site_id}",
                "incident_type": ticket.incident_type,
                "priority": ticket.priority,
                "status": ticket.status,
                "location": ticket.location,
                "latitude": ticket.latitude,
                "longitude": ticket.longitude,
                "description": ticket.description,
                "assigned_to_user_id": ticket.assigned_to_user_id,
                "assigned_to_name": assigned_user.username if assigned_user else None,
                "created_at": ticket.created_at.isoformat(),
            })
        
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting dispatch tickets: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get dispatch tickets: {error_msg}"
        )

