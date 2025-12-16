# backend/app/api/supervisor_routes_enhancements.py
# Additional endpoints for supervisor dashboard enhancements

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import require_supervisor
from app.models.user import User
from app.models.site import Site
from app.models.attendance import Attendance, AttendanceStatus
from app.divisions.security.models import SecurityReport
from app.divisions.cleaning import models as cleaning_models

# These endpoints will be added to supervisor_routes.py
# Keeping them separate for now to avoid conflicts

class ManpowerPerArea(BaseModel):
    area_id: int
    area_name: str
    area_type: str  # "ZONE", "SITE", "ROUTE"
    total_manpower: int
    active_manpower: int
    scheduled_manpower: int
    division: Optional[str] = None


class IncidentPerpetrator(BaseModel):
    perpetrator_name: str
    perpetrator_type: str  # "INTERNAL", "EXTERNAL", "UNKNOWN"
    incident_count: int
    first_incident_date: date
    last_incident_date: date
    incidents: List[dict]


class PatrolTargetSummary(BaseModel):
    target_id: int
    site_id: int
    site_name: str
    zone_id: Optional[int] = None
    zone_name: Optional[str] = None
    route_id: Optional[int] = None
    target_date: date
    target_checkpoints: int
    completed_checkpoints: int
    completion_percentage: float
    status: str


# These functions will be added to supervisor_routes.py router

def get_manpower_per_area(
    site_id: Optional[int] = Query(None),
    division: Optional[str] = Query(None),
    date_filter: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get manpower count per area/zone."""
    try:
        company_id = current_user.get("company_id", 1)
        filter_date = date_filter or date.today()
        
        result = []
        
        # Get zones for cleaning
        if not division or division == "CLEANING":
            zones = (
                db.query(cleaning_models.CleaningZone)
                .filter(cleaning_models.CleaningZone.company_id == company_id)
            )
            if site_id:
                zones = zones.filter(cleaning_models.CleaningZone.site_id == site_id)
            zones = zones.filter(cleaning_models.CleaningZone.division == "CLEANING").all()
            
            for zone in zones:
                # Count active attendance in this zone
                active_attendance = (
                    db.query(Attendance)
                    .filter(
                        Attendance.company_id == company_id,
                        Attendance.site_id == zone.site_id,
                        Attendance.role_type == "CLEANING",
                        Attendance.status == AttendanceStatus.IN_PROGRESS,
                        Attendance.checkin_time.date() == filter_date,
                    )
                    .count()
                )
                
                # Count scheduled shifts
                from app.models.shift import Shift, ShiftStatus
                scheduled_shifts = (
                    db.query(Shift)
                    .filter(
                        Shift.company_id == company_id,
                        Shift.site_id == zone.site_id,
                        Shift.division == "CLEANING",
                        Shift.shift_date.date() == filter_date,
                        Shift.status == ShiftStatus.ASSIGNED,
                    )
                    .count()
                )
                
                result.append(ManpowerPerArea(
                    area_id=zone.id,
                    area_name=zone.name,
                    area_type="ZONE",
                    total_manpower=scheduled_shifts,
                    active_manpower=active_attendance,
                    scheduled_manpower=scheduled_shifts,
                    division="CLEANING",
                ))
        
        # Get sites for overall
        if not division:
            sites = (
                db.query(Site)
                .filter(Site.company_id == company_id)
            )
            if site_id:
                sites = sites.filter(Site.id == site_id)
            sites = sites.all()
            
            for site_obj in sites:
                # Count active attendance
                active_attendance = (
                    db.query(Attendance)
                    .filter(
                        Attendance.company_id == company_id,
                        Attendance.site_id == site_obj.id,
                        Attendance.status == AttendanceStatus.IN_PROGRESS,
                        Attendance.checkin_time.date() == filter_date,
                    )
                    .count()
                )
                
                # Count scheduled shifts
                from app.models.shift import Shift, ShiftStatus
                scheduled_shifts = (
                    db.query(Shift)
                    .filter(
                        Shift.company_id == company_id,
                        Shift.site_id == site_obj.id,
                        Shift.shift_date.date() == filter_date,
                        Shift.status == ShiftStatus.ASSIGNED,
                    )
                    .count()
                )
                
                result.append(ManpowerPerArea(
                    area_id=site_obj.id,
                    area_name=site_obj.name,
                    area_type="SITE",
                    total_manpower=scheduled_shifts,
                    active_manpower=active_attendance,
                    scheduled_manpower=scheduled_shifts,
                    division=None,
                ))
        
        api_logger.info(f"Retrieved manpower data for {len(result)} areas")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting manpower per area: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get manpower per area: {error_msg}"
        )


def get_incident_perpetrators(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get incident perpetrators with statistics."""
    try:
        company_id = current_user.get("company_id", 1)
        
        incidents = (
            db.query(SecurityReport)
            .filter(
                SecurityReport.company_id == company_id,
                SecurityReport.division == "SECURITY",
                SecurityReport.perpetrator_name.isnot(None),
            )
        )
        
        if site_id:
            incidents = incidents.filter(SecurityReport.site_id == site_id)
        if from_date:
            incidents = incidents.filter(SecurityReport.created_at >= datetime.combine(from_date, datetime.min.time()))
        if to_date:
            incidents = incidents.filter(SecurityReport.created_at <= datetime.combine(to_date, datetime.max.time()))
        
        incidents = incidents.all()
        
        # Group by perpetrator
        perpetrator_map = {}
        for incident in incidents:
            key = f"{incident.perpetrator_name}_{incident.perpetrator_type}"
            if key not in perpetrator_map:
                perpetrator_map[key] = {
                    "perpetrator_name": incident.perpetrator_name,
                    "perpetrator_type": incident.perpetrator_type,
                    "incidents": [],
                }
            perpetrator_map[key]["incidents"].append({
                "id": incident.id,
                "title": incident.title,
                "report_type": incident.report_type,
                "severity": incident.severity,
                "incident_level": incident.incident_level,
                "created_at": incident.created_at.isoformat(),
                "site_id": incident.site_id,
            })
        
        result = []
        for key, data in perpetrator_map.items():
            incidents_list = data["incidents"]
            incident_dates = [datetime.fromisoformat(inc["created_at"].replace("Z", "+00:00")).date() for inc in incidents_list]
            
            result.append(IncidentPerpetrator(
                perpetrator_name=data["perpetrator_name"],
                perpetrator_type=data["perpetrator_type"],
                incident_count=len(incidents_list),
                first_incident_date=min(incident_dates),
                last_incident_date=max(incident_dates),
                incidents=incidents_list,
            ))
        
        # Sort by incident count descending
        result.sort(key=lambda x: x.incident_count, reverse=True)
        
        api_logger.info(f"Retrieved {len(result)} perpetrators with incidents")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting incident perpetrators: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get incident perpetrators: {error_msg}"
        )


def get_patrol_targets_summary(
    site_id: Optional[int] = Query(None),
    target_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get patrol targets and completion summary."""
    try:
        company_id = current_user.get("company_id", 1)
        filter_date = target_date or date.today()
        
        from app.models.patrol_target import PatrolTarget
        
        targets = (
            db.query(PatrolTarget)
            .filter(
                PatrolTarget.company_id == company_id,
                PatrolTarget.target_date == filter_date,
            )
        )
        
        if site_id:
            targets = targets.filter(PatrolTarget.site_id == site_id)
        
        targets = targets.all()
        
        result = []
        for target in targets:
            site = db.query(Site).filter(Site.id == target.site_id).first()
            zone = None
            if target.zone_id:
                zone = db.query(cleaning_models.CleaningZone).filter(
                    cleaning_models.CleaningZone.id == target.zone_id
                ).first()
            
            result.append(PatrolTargetSummary(
                target_id=target.id,
                site_id=target.site_id,
                site_name=site.name if site else f"Site {target.site_id}",
                zone_id=target.zone_id,
                zone_name=zone.name if zone else None,
                route_id=target.route_id,
                target_date=target.target_date,
                target_checkpoints=target.target_checkpoints,
                completed_checkpoints=target.completed_checkpoints,
                completion_percentage=target.completion_percentage,
                status=target.status,
            ))
        
        api_logger.info(f"Retrieved {len(result)} patrol targets summary")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting patrol targets summary: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get patrol targets summary: {error_msg}"
        )

