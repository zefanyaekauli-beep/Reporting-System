# backend/app/api/heatmap_routes.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_, or_
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.attendance import Attendance
from app.models.user import User
from app.models.site import Site
from app.divisions.security.models import SecurityReport, SecurityPatrolLog, Checklist, ChecklistItem
from app.divisions.cleaning import models as cleaning_models
from app.models.gps_track import GPSTrack

router = APIRouter(prefix="/heatmap", tags=["heatmap"])


# ========== Response Models ==========

class HeatmapDataPoint(BaseModel):
    """Single data point for heatmap"""
    x: str  # Day of week, hour, site name, etc.
    y: str  # User name, division, etc.
    value: float  # Count, percentage, etc.
    label: Optional[str] = None  # Additional label

class HeatmapResponse(BaseModel):
    """Heatmap data response"""
    type: str  # attendance, activity, incidents, performance
    data: List[HeatmapDataPoint]
    x_axis_label: str
    y_axis_label: str
    value_label: str
    date_range: Optional[str] = None


# ========== Attendance Heatmap (Geographic) ==========

@router.get("/attendance", response_model=HeatmapResponse)
def get_attendance_heatmap(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    division: Optional[str] = Query(None),
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """
    Get attendance heatmap data based on GPS coordinates.
    X-axis: Latitude (rounded to grid)
    Y-axis: Longitude (rounded to grid)
    Value: Number of check-ins at that location
    """
    try:
        company_id = current_user.get("company_id", 1)
        
        # Default to last 30 days if not specified
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        # Build query for attendance with GPS coordinates
        query = db.query(
            func.round(Attendance.checkin_lat, 4).label('lat'),
            func.round(Attendance.checkin_lng, 4).label('lng'),
            func.count(Attendance.id).label('count')
        ).filter(
            Attendance.company_id == company_id,
            func.date(Attendance.checkin_time) >= start_date,
            func.date(Attendance.checkin_time) <= end_date,
            Attendance.checkin_lat.isnot(None),
            Attendance.checkin_lng.isnot(None)
        )
        
        if division:
            query = query.filter(Attendance.role_type == division.upper())
        
        if site_id:
            query = query.filter(Attendance.site_id == site_id)
        
        results = query.group_by(
            func.round(Attendance.checkin_lat, 4),
            func.round(Attendance.checkin_lng, 4)
        ).all()
        
        data_points = []
        for row in results:
            if row.lat and row.lng:
                data_points.append(HeatmapDataPoint(
                    x=f"{float(row.lat):.4f}",
                    y=f"{float(row.lng):.4f}",
                    value=float(row.count),
                    label=f"{int(row.count)} check-ins at ({row.lat:.4f}, {row.lng:.4f})"
                ))
        
        # If no GPS data found, use site coordinates as fallback
        if not data_points:
            site_query = db.query(Site).filter(Site.company_id == company_id)
            if site_id:
                site_query = site_query.filter(Site.id == site_id)
            sites = site_query.filter(
                Site.lat.isnot(None),
                Site.lng.isnot(None)
            ).all()
            
            for site in sites:
                # Count attendance for this site
                attendance_count = db.query(func.count(Attendance.id)).filter(
                    Attendance.company_id == company_id,
                    Attendance.site_id == site.id,
                    func.date(Attendance.checkin_time) >= start_date,
                    func.date(Attendance.checkin_time) <= end_date
                )
                if division:
                    attendance_count = attendance_count.filter(Attendance.role_type == division.upper())
                count = attendance_count.scalar() or 0
                
                if count > 0:
                    data_points.append(HeatmapDataPoint(
                        x=f"{float(site.lat):.4f}",
                        y=f"{float(site.lng):.4f}",
                        value=float(count),
                        label=f"{int(count)} check-ins at site {site.name} ({site.lat:.4f}, {site.lng:.4f})"
                    ))
        
        return HeatmapResponse(
            type="attendance",
            data=data_points,
            x_axis_label="Latitude",
            y_axis_label="Longitude",
            value_label="Check-ins",
            date_range=f"{start_date} to {end_date}"
        )
    
    except Exception as e:
        api_logger.error(f"Error getting attendance heatmap: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_attendance_heatmap")


# ========== Activity Heatmap (Geographic - GPS Tracks) ==========

@router.get("/activity", response_model=HeatmapResponse)
def get_activity_heatmap(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    division: Optional[str] = Query(None),
    site_id: Optional[int] = Query(None),
    activity_type: Optional[str] = Query(None),  # patrol, report, checklist
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """
    Get activity heatmap data based on GPS coordinates.
    Uses GPS tracks, patrol logs, and checklist items with GPS data.
    X-axis: Latitude (rounded to grid)
    Y-axis: Longitude (rounded to grid)
    Value: Number of activities at that location
    """
    try:
        from app.models.gps_track import GPSTrack
        
        company_id = current_user.get("company_id", 1)
        
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        data_points = []
        
        # Get GPS tracks (patrols, attendance, etc.)
        if not activity_type or activity_type == "patrol":
            gps_query = db.query(
                func.round(GPSTrack.latitude, 4).label('lat'),
                func.round(GPSTrack.longitude, 4).label('lng'),
                func.count(GPSTrack.id).label('count')
            ).filter(
                GPSTrack.company_id == company_id,
                func.date(GPSTrack.recorded_at) >= start_date,
                func.date(GPSTrack.recorded_at) <= end_date,
                GPSTrack.latitude.isnot(None),
                GPSTrack.longitude.isnot(None)
            )
            
            if site_id:
                gps_query = gps_query.filter(GPSTrack.site_id == site_id)
            
            # Filter by track_type if division specified
            if division:
                if division.upper() == "SECURITY":
                    gps_query = gps_query.filter(GPSTrack.track_type == "PATROL")
                elif division.upper() == "CLEANING":
                    gps_query = gps_query.filter(GPSTrack.track_type.in_(["CLEANING", "ATTENDANCE"]))
            
            gps_results = gps_query.group_by(
                func.round(GPSTrack.latitude, 4),
                func.round(GPSTrack.longitude, 4)
            ).all()
            
            for row in gps_results:
                if row.lat and row.lng:
                    data_points.append(HeatmapDataPoint(
                        x=f"{float(row.lat):.4f}",
                        y=f"{float(row.lng):.4f}",
                        value=float(row.count),
                        label=f"{int(row.count)} GPS points at ({row.lat:.4f}, {row.lng:.4f})"
                    ))
        
        # Get checklist items with GPS coordinates
        if not activity_type or activity_type == "checklist":
            checklist_items_query = db.query(
                func.round(ChecklistItem.gps_lat, 4).label('lat'),
                func.round(ChecklistItem.gps_lng, 4).label('lng'),
                func.count(ChecklistItem.id).label('count')
            ).join(
                Checklist, ChecklistItem.checklist_id == Checklist.id
            ).filter(
                Checklist.company_id == company_id,
                func.date(Checklist.created_at) >= start_date,
                func.date(Checklist.created_at) <= end_date,
                ChecklistItem.gps_lat.isnot(None),
                ChecklistItem.gps_lng.isnot(None)
            )
            
            if division:
                checklist_items_query = checklist_items_query.filter(Checklist.division == division.upper())
            if site_id:
                checklist_items_query = checklist_items_query.filter(Checklist.site_id == site_id)
            
            checklist_results = checklist_items_query.group_by(
                func.round(ChecklistItem.gps_lat, 4),
                func.round(ChecklistItem.gps_lng, 4)
            ).all()
            
            for row in checklist_results:
                if row.lat and row.lng:
                    data_points.append(HeatmapDataPoint(
                        x=f"{float(row.lat):.4f}",
                        y=f"{float(row.lng):.4f}",
                        value=float(row.count),
                        label=f"{int(row.count)} checklist items at ({row.lat:.4f}, {row.lng:.4f})"
                    ))
        
        # Get reports with location (if they have GPS in future)
        # For now, we'll use site coordinates as proxy
        if not activity_type or activity_type == "report":
            # Use site coordinates for reports
            report_site_query = db.query(
                Site.lat.label('lat'),
                Site.lng.label('lng'),
                func.count(SecurityReport.id).label('count')
            ).join(
                SecurityReport, SecurityReport.site_id == Site.id
            ).filter(
                SecurityReport.company_id == company_id,
                func.date(SecurityReport.created_at) >= start_date,
                func.date(SecurityReport.created_at) <= end_date,
                Site.lat.isnot(None),
                Site.lng.isnot(None)
            )
            
            if division:
                report_site_query = report_site_query.filter(SecurityReport.division == division.upper())
            if site_id:
                report_site_query = report_site_query.filter(SecurityReport.site_id == site_id)
            
            report_results = report_site_query.group_by(
                Site.lat,
                Site.lng
            ).all()
            
            for row in report_results:
                if row.lat and row.lng:
                    data_points.append(HeatmapDataPoint(
                        x=f"{float(row.lat):.4f}",
                        y=f"{float(row.lng):.4f}",
                        value=float(row.count),
                        label=f"{int(row.count)} reports at site ({row.lat:.4f}, {row.lng:.4f})"
                    ))
        
        return HeatmapResponse(
            type="activity",
            data=data_points,
            x_axis_label="Latitude",
            y_axis_label="Longitude",
            value_label="Activities",
            date_range=f"{start_date} to {end_date}"
        )
    
    except Exception as e:
        api_logger.error(f"Error getting activity heatmap: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_activity_heatmap")


# ========== Site Performance Heatmap ==========

@router.get("/site-performance", response_model=HeatmapResponse)
def get_site_performance_heatmap(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    division: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """
    Get site performance heatmap.
    X-axis: Site name
    Y-axis: Division
    Value: Performance score (attendance rate, completion rate, etc.)
    """
    try:
        company_id = current_user.get("company_id", 1)
        
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        # Get sites
        sites = db.query(Site).filter(Site.company_id == company_id).all()
        
        data_points = []
        divisions = ["SECURITY", "CLEANING", "DRIVER", "PARKING"]
        
        for site in sites:
            if division and division.upper() not in divisions:
                continue
            
            for div in divisions:
                if division and div != division.upper():
                    continue
                
                # Calculate attendance rate
                attendance_count = db.query(func.count(Attendance.id)).filter(
                    Attendance.company_id == company_id,
                    Attendance.site_id == site.id,
                    Attendance.role_type == div,  # Use role_type, not division
                    func.date(Attendance.checkin_time) >= start_date,
                    func.date(Attendance.checkin_time) <= end_date
                ).scalar() or 0
                
                # Calculate completion rate (for checklists)
                checklist_total = db.query(func.count(Checklist.id)).filter(
                    Checklist.company_id == company_id,
                    Checklist.site_id == site.id,
                    Checklist.division == div,
                    func.date(Checklist.created_at) >= start_date,
                    func.date(Checklist.created_at) <= end_date
                ).scalar() or 0
                
                from app.divisions.security.models import ChecklistStatus
                checklist_completed = db.query(func.count(Checklist.id)).filter(
                    Checklist.company_id == company_id,
                    Checklist.site_id == site.id,
                    Checklist.division == div,
                    Checklist.status == ChecklistStatus.COMPLETED,
                    func.date(Checklist.created_at) >= start_date,
                    func.date(Checklist.created_at) <= end_date
                ).scalar() or 0
                
                completion_rate = (checklist_completed / checklist_total * 100) if checklist_total > 0 else 0
                
                # Performance score (average of attendance and completion)
                performance_score = (attendance_count * 0.5) + (completion_rate * 0.5)
                
                if performance_score > 0:
                    data_points.append(HeatmapDataPoint(
                        x=site.name,
                        y=div,
                        value=float(performance_score),
                        label=f"Score: {performance_score:.1f}"
                    ))
        
        return HeatmapResponse(
            type="site-performance",
            data=data_points,
            x_axis_label="Site",
            y_axis_label="Division",
            value_label="Performance Score",
            date_range=f"{start_date} to {end_date}"
        )
    
    except Exception as e:
        api_logger.error(f"Error getting site performance heatmap: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_site_performance_heatmap")


# ========== User Activity Heatmap ==========

@router.get("/user-activity", response_model=HeatmapResponse)
def get_user_activity_heatmap(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    division: Optional[str] = Query(None),
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """
    Get user activity heatmap.
    X-axis: Day of week
    Y-axis: User name
    Value: Number of activities
    """
    try:
        company_id = current_user.get("company_id", 1)
        
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        # Get users
        user_query = db.query(User).filter(User.company_id == company_id)
        if division:
            user_query = user_query.filter(User.division == division.lower())
        users = user_query.all()
        
        data_points = []
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        for user in users:
            # Count activities per day of week
            for day_idx, day_name in enumerate(day_names):
                # Count attendance
                attendance_count = db.query(func.count(Attendance.id)).filter(
                    Attendance.company_id == company_id,
                    Attendance.user_id == user.id,
                    func.extract('dow', Attendance.checkin_time) == day_idx,
                    func.date(Attendance.checkin_time) >= start_date,
                    func.date(Attendance.checkin_time) <= end_date
                ).scalar() or 0
                
                # Count reports
                report_count = db.query(func.count(SecurityReport.id)).filter(
                    SecurityReport.company_id == company_id,
                    SecurityReport.user_id == user.id,
                    func.extract('dow', SecurityReport.created_at) == day_idx,
                    func.date(SecurityReport.created_at) >= start_date,
                    func.date(SecurityReport.created_at) <= end_date
                ).scalar() or 0
                
                # Count checklists
                checklist_count = db.query(func.count(Checklist.id)).filter(
                    Checklist.company_id == company_id,
                    Checklist.user_id == user.id,
                    func.extract('dow', Checklist.created_at) == day_idx,
                    func.date(Checklist.created_at) >= start_date,
                    func.date(Checklist.created_at) <= end_date
                ).scalar() or 0
                
                total_activities = attendance_count + report_count + checklist_count
                
                if total_activities > 0:
                    # Use username if name doesn't exist
                    user_display_name = getattr(user, 'name', None) or getattr(user, 'username', 'Unknown')
                    data_points.append(HeatmapDataPoint(
                        x=day_name,
                        y=user_display_name,
                        value=float(total_activities),
                        label=f"{total_activities} activities"
                    ))
        
        return HeatmapResponse(
            type="user-activity",
            data=data_points,
            x_axis_label="Day of Week",
            y_axis_label="User",
            value_label="Activities",
            date_range=f"{start_date} to {end_date}"
        )
    
    except Exception as e:
        api_logger.error(f"Error getting user activity heatmap: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_user_activity_heatmap")

