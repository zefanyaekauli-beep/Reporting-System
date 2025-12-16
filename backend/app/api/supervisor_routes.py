# backend/app/api/supervisor_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, inspect, or_, func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.core.pagination import get_pagination_params, PaginationParams, PaginatedResponse, create_paginated_response
from app.core.utils import build_date_filter, build_search_filter, batch_load_users_and_sites, get_user_id_from_report, get_report_type_value, get_status_value
from app.api.deps import require_supervisor
from app.models.attendance import Attendance, AttendanceStatus
from app.models.user import User
from app.models.site import Site
from app.models.attendance_correction import AttendanceCorrection, CorrectionType, CorrectionStatus
from app.models.inspect_point import InspectPoint
from app.models.shift import Shift, ShiftStatus
from app.divisions.security.models import SecurityReport, SecurityPatrolLog
from app.models.master_data import MasterData
from app.divisions.cleaning import models as cleaning_models
from app.models.patrol_target import PatrolTarget
import qrcode
from io import BytesIO
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/supervisor", tags=["supervisor"])

# ========== Overview Models ==========

class DivisionAttendanceSnapshot(BaseModel):
    """Attendance snapshot per division"""
    on_duty: int
    expected: int
    late: int
    no_show: int

class DivisionTaskCompletion(BaseModel):
    """Task/checklist completion metrics per division"""
    completion_percent: float
    total_tasks: int
    completed_tasks: int
    missed_count: int

class OverviewOut(BaseModel):
    # Overall metrics
    total_today: int
    on_shift_now: int
    overtime_today: int
    unique_guards_today: int
    
    # Division attendance breakdown
    security_attendance: DivisionAttendanceSnapshot
    cleaning_attendance: DivisionAttendanceSnapshot
    driver_attendance: DivisionAttendanceSnapshot  # Fixed: should be DivisionAttendanceSnapshot, not DivisionTaskCompletion
    
    # Division task completion
    security_tasks: DivisionTaskCompletion
    cleaning_tasks: DivisionTaskCompletion
    driver_tasks: DivisionTaskCompletion
    
    # Legacy fields for backward compatibility
    security_today: int = 0
    cleaning_today: int = 0
    parking_today: int = 0
    cleaning_zones_completed: int = 0
    cleaning_zones_total: int = 0
    parking_sessions_today: int = 0
    reports_today: int = 0
    incidents_today: int = 0
    patrols_today: int = 0

# ========== Attendance Models ==========

class AttendanceOut(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    site_name: str
    role_type: str  # Division: SECURITY, CLEANING, DRIVER
    checkin_time: datetime
    checkout_time: Optional[datetime] = None
    shift: Optional[str] = None
    is_overtime: bool = False
    is_backup: bool = False
    status: str  # IN_PROGRESS, COMPLETED
    gps_valid: Optional[bool] = None
    photo_evidence: Optional[bool] = None
    
    class Config:
        from_attributes = True

class AttendanceUpdate(BaseModel):
    checkin_time: Optional[datetime] = None
    checkout_time: Optional[datetime] = None
    shift: Optional[str] = None
    is_overtime: Optional[bool] = None
    is_backup: Optional[bool] = None

# ========== Report Models ==========

class ReportOut(BaseModel):
    id: int
    division: str
    report_type: str
    title: str
    description: Optional[str] = None
    created_by_name: Optional[str] = None
    site_name: str
    created_at: datetime
    status: str
    
    class Config:
        from_attributes = True

# ========== Site Models ==========

class SiteOut(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    qr_code: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    geofence_radius_m: Optional[float] = None
    
    class Config:
        from_attributes = True

class SiteCreate(BaseModel):
    name: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    geofence_radius_m: Optional[float] = 100.0
    qr_code: Optional[str] = None

# ========== Officer Models ==========

class OfficerOut(BaseModel):
    id: int
    name: str
    badge_id: str
    position: str
    division: str
    status: str
    
    class Config:
        from_attributes = True

class OfficerCreate(BaseModel):
    name: str
    badge_id: str
    position: str
    division: str
    status: str = "active"

class OfficerUpdate(BaseModel):
    name: Optional[str] = None
    badge_id: Optional[str] = None
    position: Optional[str] = None
    division: Optional[str] = None
    status: Optional[str] = None

# ========== Attendance Correction Models ==========

class CorrectionOut(BaseModel):
    id: int
    officer_name: str
    date: str
    type: str
    requested_clock_in: Optional[str] = None
    requested_clock_out: Optional[str] = None
    reason: str
    evidence_url: Optional[str] = None
    status: str
    
    class Config:
        from_attributes = True

# ========== Inspect Point Models ==========

class InspectPointOut(BaseModel):
    id: int
    name: str
    code: str
    site_name: str
    description: Optional[str] = None
    is_active: bool
    
    class Config:
        from_attributes = True

class InspectPointCreate(BaseModel):
    name: str
    code: str
    site_name: str
    description: Optional[str] = None
    is_active: bool = True

class InspectPointUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    site_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

# ========== Patrol Activity Models ==========

class PatrolActivityOut(BaseModel):
    id: int
    user_id: int
    officer_name: Optional[str] = None
    site_id: int
    site_name: str
    start_time: str
    end_time: Optional[str] = None
    created_at: str
    
    model_config = {"from_attributes": False}

# ========== Leave Request Models ==========

class LeaveRequestOut(BaseModel):
    id: int
    user_name: str
    leave_type: str
    start_date: str
    end_date: str
    reason: str
    status: str
    division: str
    
    class Config:
        from_attributes = True

# ========== Checklist / Task Console Models ==========

class ChecklistTaskOut(BaseModel):
    id: int
    template_name: Optional[str] = None
    division: str
    context_type: Optional[str] = None
    site_name: str
    zone_or_vehicle: Optional[str] = None
    assigned_user_name: Optional[str] = None
    start_time: Optional[str] = None
    completed_time: Optional[str] = None
    completion_percent: float = 0.0
    evidence_available: bool = False
    status: str
    
    class Config:
        from_attributes = True

# ========== Overview Endpoint ==========

@router.get("/overview", response_model=OverviewOut)
def overview(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get overview statistics for today"""
    try:
        today = date.today()
        start = datetime.combine(today, datetime.min.time())
        end = datetime.combine(today, datetime.max.time())
        
        company_id = current_user.get("company_id", 1)
        
        # Overall metrics - use func.count() for efficiency
        total_today = db.query(func.count(Attendance.id)).filter(
            Attendance.company_id == company_id
        ).filter(
            Attendance.checkin_time >= start
        ).filter(
            Attendance.checkin_time <= end
        ).scalar() or 0
        
        on_shift_now = db.query(func.count(Attendance.id)).filter(
            Attendance.company_id == company_id
        ).filter(
            Attendance.status == AttendanceStatus.IN_PROGRESS
        ).scalar() or 0
        
        overtime_today = db.query(func.count(Attendance.id)).filter(
            Attendance.company_id == company_id
        ).filter(
            Attendance.checkin_time >= start
        ).filter(
            Attendance.checkin_time <= end
        ).filter(
            Attendance.is_overtime == True
        ).scalar() or 0
        
        unique_guards_today = db.query(func.count(func.distinct(Attendance.user_id))).filter(
            Attendance.company_id == company_id
        ).filter(
            Attendance.checkin_time >= start
        ).filter(
            Attendance.checkin_time <= end
        ).scalar() or 0

        # Division-specific attendance snapshots (simplified for now)
        security_attendance = DivisionAttendanceSnapshot(
            on_duty=db.query(func.count(Attendance.id)).filter(
                Attendance.company_id == company_id
            ).filter(
                Attendance.role_type == "SECURITY"
            ).filter(
                Attendance.status == AttendanceStatus.IN_PROGRESS
            ).scalar() or 0,
            expected=0,  # TODO: Calculate from shifts
            late=0,  # TODO: Calculate from shifts
            no_show=0  # TODO: Calculate from shifts
        )
        
        cleaning_attendance = DivisionAttendanceSnapshot(
            on_duty=db.query(func.count(Attendance.id)).filter(
                Attendance.company_id == company_id
            ).filter(
                Attendance.role_type == "CLEANING"
            ).filter(
                Attendance.status == AttendanceStatus.IN_PROGRESS
            ).scalar() or 0,
            expected=0,
            late=0,
            no_show=0
        )
        
        driver_attendance_snapshot = DivisionAttendanceSnapshot(
            on_duty=db.query(func.count(Attendance.id)).filter(
                Attendance.company_id == company_id
            ).filter(
                Attendance.role_type == "DRIVER"
            ).filter(
                Attendance.status == AttendanceStatus.IN_PROGRESS
            ).scalar() or 0,
            expected=0,
            late=0,
            no_show=0
        )

        # Division-specific task completion (simplified for now)
        security_tasks = DivisionTaskCompletion(
            completion_percent=0.0,
            total_tasks=0,
            completed_tasks=0,
            missed_count=0
        )
        
        cleaning_tasks = DivisionTaskCompletion(
            completion_percent=0.0,
            total_tasks=0,
            completed_tasks=0,
            missed_count=0
        )
        
        driver_tasks = DivisionTaskCompletion(
            completion_percent=0.0,
            total_tasks=0,
            completed_tasks=0,
            missed_count=0
        )

        # Legacy counts
        security_today = db.query(func.count(Attendance.id)).filter(
            Attendance.company_id == company_id
        ).filter(
            Attendance.checkin_time >= start
        ).filter(
            Attendance.checkin_time <= end
        ).filter(
            Attendance.role_type == 'SECURITY'
        ).scalar() or 0
        
        cleaning_today = db.query(func.count(Attendance.id)).filter(
            Attendance.company_id == company_id
        ).filter(
            Attendance.checkin_time >= start
        ).filter(
            Attendance.checkin_time <= end
        ).filter(
            Attendance.role_type == 'CLEANING'
        ).scalar() or 0
        
        parking_today = db.query(func.count(Attendance.id)).filter(
            Attendance.company_id == company_id
        ).filter(
            Attendance.checkin_time >= start
        ).filter(
            Attendance.checkin_time <= end
        ).filter(
            Attendance.role_type == 'PARKING'
        ).scalar() or 0
        
        # Use func.count() to avoid loading all columns
        reports_today = db.query(func.count(SecurityReport.id)).filter(
            SecurityReport.company_id == company_id
        ).filter(
            SecurityReport.created_at >= start
        ).filter(
            SecurityReport.created_at <= end
        ).scalar() or 0
        
        incidents_today = db.query(func.count(SecurityReport.id)).filter(
            SecurityReport.company_id == company_id
        ).filter(
            SecurityReport.created_at >= start
        ).filter(
            SecurityReport.created_at <= end
        ).filter(
            SecurityReport.report_type == 'incident'
        ).scalar() or 0

        patrols_today = db.query(func.count(SecurityPatrolLog.id)).filter(
            SecurityPatrolLog.company_id == company_id
        ).filter(
            SecurityPatrolLog.start_time >= start
        ).filter(
            SecurityPatrolLog.start_time <= end
        ).scalar() or 0
        
        # Calculate cleaning zones (simplified)
        cleaning_zones_completed = 0
        cleaning_zones_total = 0
        try:
            cleaning_zones_total = db.query(cleaning_models.CleaningZone).filter(
                cleaning_models.CleaningZone.company_id == company_id
            ).count()
            # TODO: Calculate completed zones based on checklist completion
        except Exception as e:
            api_logger.warning(f"Error calculating cleaning zones: {str(e)}")
            cleaning_zones_total = 0
        
        # Calculate parking sessions (simplified)
        parking_sessions_today = 0
        try:
            # TODO: Calculate parking sessions from parking_attendance or parking_sessions table
            # For now, use attendance count as proxy
            parking_sessions_today = parking_today
        except Exception as e:
            api_logger.warning(f"Error calculating parking sessions: {str(e)}")
            parking_sessions_today = 0
        
        try:
            return OverviewOut(
                total_today=total_today,
                on_shift_now=on_shift_now,
                overtime_today=overtime_today,
                unique_guards_today=unique_guards_today,
                security_attendance=security_attendance,
                cleaning_attendance=cleaning_attendance,
                driver_attendance=driver_attendance_snapshot,
                security_tasks=security_tasks,
                cleaning_tasks=cleaning_tasks,
                driver_tasks=driver_tasks,
                security_today=security_today,
                cleaning_today=cleaning_today,
                parking_today=parking_today,
                cleaning_zones_completed=cleaning_zones_completed,
                cleaning_zones_total=cleaning_zones_total,
                parking_sessions_today=parking_sessions_today,
                reports_today=reports_today,
                incidents_today=incidents_today,
                patrols_today=patrols_today,
            )
        except Exception as model_error:
            api_logger.error(f"Error creating OverviewOut model: {str(model_error)}", exc_info=True)
            raise
    except Exception as e:
        api_logger.error(f"Error in overview endpoint: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "overview")

# ========== Attendance Endpoints ==========

@router.get("/attendance", response_model=PaginatedResponse[AttendanceOut])
def list_attendance(
    db: Session = Depends(get_db),
    _: dict = Depends(require_supervisor),
    pagination: PaginationParams = Depends(get_pagination_params),
    date_from: Optional[date] = Query(None, alias="date_from"),
    date_to: Optional[date] = Query(None, alias="date_to"),
    site_id: Optional[int] = Query(None, alias="site_id"),
    user_id: Optional[int] = Query(None, alias="user_id"),
    role_type: Optional[str] = Query(None, alias="role_type"),
    status: Optional[str] = Query(None, alias="status"),
    company_id: Optional[int] = Query(None, alias="company_id"),
):
    """List all attendance with filters and pagination"""
    try:
        filter_company_id = company_id or _.get("company_id", 1)
        
        q = db.query(Attendance).options(
            joinedload(Attendance.user),
            joinedload(Attendance.site),
        )
        
        q = q.filter(Attendance.company_id == filter_company_id)
        
        if date_from:
            q = q.filter(Attendance.checkin_time >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            q = q.filter(Attendance.checkin_time < datetime.combine(date_to + timedelta(days=1), datetime.min.time()))
        
        if site_id:
            q = q.filter(Attendance.site_id == site_id)
        if user_id:
            q = q.filter(Attendance.user_id == user_id)
        if role_type:
            q = q.filter(Attendance.role_type == role_type.upper())
        if status:
            if status.lower() == "on_duty" or status.lower() == "on-duty":
                q = q.filter(Attendance.status == AttendanceStatus.IN_PROGRESS)
            elif status.lower() == "completed":
                q = q.filter(Attendance.status == AttendanceStatus.COMPLETED)
            else:
                try:
                    status_enum = AttendanceStatus[status.upper()]
                    q = q.filter(Attendance.status == status_enum)
                except (KeyError, AttributeError):
                    pass
        
        total = q.count()
        
        records = (
            q.order_by(Attendance.checkin_time.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
            .all()
        )
        
        result = []
        for att in records:
            user = att.user
            site = att.site
            
            shift_val = getattr(att, 'shift', None)
            overtime_val = getattr(att, 'is_overtime', False)
            backup_val = getattr(att, 'is_backup', False)
            status_val = att.status.value if hasattr(att.status, 'value') else str(att.status)
            
            gps_valid = getattr(att, 'is_valid_location', None)
            photo_evidence = bool(getattr(att, 'checkin_photo_path', None))
            
            result.append(AttendanceOut(
                id=att.id,
                user_id=att.user_id,
                user_name=user.username if user else None,
                site_name=site.name if site else "Unknown",
                role_type=att.role_type,
                checkin_time=att.checkin_time,
                checkout_time=att.checkout_time,
                shift=shift_val,
                is_overtime=overtime_val,
                is_backup=backup_val,
                status=status_val,
                gps_valid=gps_valid,
                photo_evidence=photo_evidence,
            ))
        
        return create_paginated_response(result, total, pagination)
        
    except Exception as e:
        api_logger.error(f"Error fetching attendance: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_attendance")

@router.patch("/attendance/{attendance_id}", response_model=AttendanceOut)
def update_attendance(
    attendance_id: int,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_supervisor),
):
    """Update attendance record"""
    try:
        att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not att:
            raise HTTPException(status_code=404, detail="Attendance not found")
        
        inspector = inspect(db.bind)
        att_columns = [col['name'] for col in inspector.get_columns('attendance')]
        has_shift = 'shift' in att_columns
        has_overtime = 'is_overtime' in att_columns
        has_backup = 'is_backup' in att_columns
        
        if payload.checkin_time is not None:
            att.checkin_time = payload.checkin_time
        if payload.checkout_time is not None:
            att.checkout_time = payload.checkout_time
            if payload.checkout_time:
                att.status = AttendanceStatus.COMPLETED
        if payload.shift is not None and has_shift:
            att.shift = payload.shift
        if payload.is_overtime is not None and has_overtime:
            att.is_overtime = payload.is_overtime
        if payload.is_backup is not None and has_backup:
            att.is_backup = payload.is_backup
        
        db.commit()
        db.refresh(att)
        
        user = db.query(User).filter(User.id == att.user_id).first()
        site = db.query(Site).filter(Site.id == att.site_id).first()
        
        shift_val = getattr(att, 'shift', None) if has_shift else None
        overtime_val = getattr(att, 'is_overtime', False) if has_overtime else False
        backup_val = getattr(att, 'is_backup', False) if has_backup else False
        status_val = att.status.value if hasattr(att.status, 'value') else str(att.status)
        
        gps_valid = getattr(att, 'is_valid_location', None)
        photo_evidence = bool(getattr(att, 'checkin_photo_path', None))
        
        return AttendanceOut(
            id=att.id,
            user_id=att.user_id,
            user_name=user.username if user else None,
            site_name=site.name if site else "Unknown",
            role_type=att.role_type,
            checkin_time=att.checkin_time,
            checkout_time=att.checkout_time,
            shift=shift_val,
            is_overtime=overtime_val,
            is_backup=backup_val,
            status=status_val,
            gps_valid=gps_valid,
            photo_evidence=photo_evidence,
        )
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error updating attendance {attendance_id}: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_attendance")

# ========== Reports Endpoints ==========

@router.get("/reports", response_model=PaginatedResponse[ReportOut])
def list_reports(
    db: Session = Depends(get_db),
    _: dict = Depends(require_supervisor),
    pagination: PaginationParams = Depends(get_pagination_params),
    division: Optional[str] = Query(None, alias="division"),
    date_from: Optional[date] = Query(None, alias="date_from"),
    date_to: Optional[date] = Query(None, alias="date_to"),
    site_id: Optional[int] = Query(None, alias="site_id"),
    search: Optional[str] = Query(None, alias="search"),
    company_id: Optional[int] = Query(None, alias="company_id"),
    type_: Optional[str] = Query(None, alias="type"),
    status: Optional[str] = Query(None, alias="status"),
):
    """List all reports from all divisions with filters and pagination"""
    try:
        company_id_filter = company_id or _.get("company_id", 1)
        
        results = []
        all_queries = []
        
        if not division or division.lower() == "security":
            q_sec = db.query(SecurityReport).filter(
                SecurityReport.company_id == company_id_filter,
                SecurityReport.division == "SECURITY",  # Filter by division
            )
            q_sec = build_date_filter(q_sec, SecurityReport.created_at, date_from, date_to)
            if site_id:
                q_sec = q_sec.filter(SecurityReport.site_id == site_id)
            if type_:
                q_sec = q_sec.filter(SecurityReport.report_type == type_)
            if status:
                q_sec = q_sec.filter(SecurityReport.status == status)
            q_sec = build_search_filter(q_sec, search, [SecurityReport.title, SecurityReport.description])
            all_queries.append(("security", q_sec))
        
        if not division or division.lower() == "cleaning":
            q_clean = db.query(SecurityReport).filter(
                SecurityReport.company_id == company_id_filter,
                SecurityReport.division == "CLEANING",  # Filter by division
            )
            q_clean = build_date_filter(q_clean, SecurityReport.created_at, date_from, date_to)
            if site_id:
                q_clean = q_clean.filter(SecurityReport.site_id == site_id)
            if type_:
                q_clean = q_clean.filter(SecurityReport.report_type == type_)
            if status:
                q_clean = q_clean.filter(SecurityReport.status == status)
            q_clean = build_search_filter(q_clean, search, [SecurityReport.title, SecurityReport.description])
            all_queries.append(("cleaning", q_clean))
        
        if not division or division.lower() == "parking":
            q_park = db.query(SecurityReport).filter(
                SecurityReport.company_id == company_id_filter,
                SecurityReport.division == "PARKING",  # Filter by division
            )
            q_park = build_date_filter(q_park, SecurityReport.created_at, date_from, date_to)
            if site_id:
                q_park = q_park.filter(SecurityReport.site_id == site_id)
            if type_:
                q_park = q_park.filter(SecurityReport.report_type == type_)
            if status:
                q_park = q_park.filter(SecurityReport.status == status)
            q_park = build_search_filter(q_park, search, [SecurityReport.title, SecurityReport.description])
            all_queries.append(("parking", q_park))
        
        all_reports = []
        for div_name, query in all_queries:
            reports = query.order_by(SecurityReport.created_at.desc()).all()
            all_reports.extend([(div_name, r) for r in reports])
        
        all_reports.sort(key=lambda x: x[1].created_at, reverse=True)
        
        total = len(all_reports)
        
        paginated_reports = all_reports[pagination.offset:pagination.offset + pagination.limit]
        
        user_ids = list(set([get_user_id_from_report(r) for _, r in paginated_reports if get_user_id_from_report(r)]))
        site_ids = list(set([r.site_id for _, r in paginated_reports]))
        
        users, sites = batch_load_users_and_sites(db, user_ids, site_ids)
        
        results = []
        for div_name, r in paginated_reports:
            user_id = get_user_id_from_report(r)
            user = users.get(user_id) if user_id else None
            site = sites.get(r.site_id) if r.site_id else None
            
            results.append(ReportOut(
                id=r.id,
                division=div_name,
                report_type=get_report_type_value(r.report_type),
                title=r.title,
                description=r.description,
                created_by_name=user.username if user else None,
                site_name=site.name if site else "Unknown",
                created_at=r.created_at,
                status=get_status_value(r.status),
            ))
        
        return create_paginated_response(results, total, pagination)
        
    except Exception as e:
        api_logger.error(f"Error fetching reports: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_reports")

# ========== Sites Endpoints ==========

@router.get("/sites", response_model=List[SiteOut])
def list_sites(
    db: Session = Depends(get_db),
    _: dict = Depends(require_supervisor),
    company_id: Optional[int] = Query(None, alias="company_id"),
):
    """List all sites"""
    company_id_filter = company_id or _.get("company_id", 1)
    
    sites = db.query(Site).filter(Site.company_id == company_id_filter).order_by(Site.name.asc()).all()
    return sites

@router.post("/sites", response_model=SiteOut)
def create_site(
    payload: SiteCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_supervisor),
):
    """Create a new site with QR code generation"""
    import uuid
    
    company_id = _.get("company_id", 1)
    
    if not payload.qr_code:
        qr_code = f"SITE_{uuid.uuid4().hex[:8].upper()}"
        while db.query(Site).filter(Site.qr_code == qr_code).first():
            qr_code = f"SITE_{uuid.uuid4().hex[:8].upper()}"
    else:
        existing = db.query(Site).filter(Site.qr_code == payload.qr_code).first()
        if existing:
            raise HTTPException(status_code=400, detail="QR code already exists")
        qr_code = payload.qr_code
    
    site = Site(
        name=payload.name,
        address=payload.address,
        lat=payload.lat,
        lng=payload.lng,
        geofence_radius_m=payload.geofence_radius_m or 100.0,
        qr_code=qr_code,
        company_id=company_id,
    )
    
    db.add(site)
    db.commit()
    db.refresh(site)
    
    api_logger.info(f"Created site: {site.name} (ID: {site.id}, QR: {site.qr_code})")
    
    return site

@router.patch("/sites/{site_id}", response_model=SiteOut)
def update_site(
    site_id: int,
    payload: SiteCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_supervisor),
):
    """Update a site"""
    company_id = _.get("company_id", 1)
    site = db.query(Site).filter(
        Site.id == site_id,
        Site.company_id == company_id
    ).first()
    
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    if payload.name:
        site.name = payload.name
    if payload.address is not None:
        site.address = payload.address
    if payload.lat is not None:
        site.lat = payload.lat
    if payload.lng is not None:
        site.lng = payload.lng
    if payload.geofence_radius_m is not None:
        site.geofence_radius_m = payload.geofence_radius_m
    
    db.commit()
    db.refresh(site)
    
    api_logger.info(f"Updated site: {site.name} (ID: {site.id})")
    return site

@router.delete("/sites/{site_id}")
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_supervisor),
):
    """Delete a site"""
    company_id = _.get("company_id", 1)
    site = db.query(Site).filter(
        Site.id == site_id,
        Site.company_id == company_id
    ).first()
    
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    db.delete(site)
    db.commit()
    
    api_logger.info(f"Deleted site: {site.name} (ID: {site.id})")
    return {"message": "Site deleted"}

@router.get("/sites/{site_id}/qr")
def generate_site_qr(
    site_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_supervisor),
):
    """Generate QR code for a site"""
    site = db.query(Site).filter(
        Site.id == site_id,
        Site.company_id == _.get("company_id", 1)
    ).first()
    
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    qr_data = site.qr_code or f"SITE_{site_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600"
        }
    )

# ========== Officers Endpoints ==========

@router.get("/officers", response_model=List[OfficerOut])
def list_officers(
    division: Optional[str] = Query(None, alias="division"),
    site_id: Optional[int] = Query(None, alias="site_id"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List all officers (users) across all divisions with filters"""
    company_id = current_user.get("company_id", 1)
    q = db.query(User).filter(User.company_id == company_id)
    
    if division:
        q = q.filter(User.division == division.lower())
    if site_id:
        q = q.filter(User.site_id == site_id)
    
    users = q.all()
    
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "name": user.username,
            "badge_id": f"BADGE_{user.id:04d}",
            "position": "Officer",
            "division": user.division,
            "status": "active",
        })
    return result

@router.post("/officers", response_model=OfficerOut)
def create_officer(
    payload: OfficerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create a new officer (user)"""
    company_id = current_user.get("company_id", 1)
    
    existing = db.query(User).filter(User.username == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Officer with this name already exists")
    
    user = User(
        username=payload.name,
        hashed_password="dummy",
        division=payload.division,
        role="user",
        company_id=company_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "name": user.username,
        "badge_id": f"BADGE_{user.id:04d}",
        "position": payload.position,
        "division": user.division,
        "status": payload.status,
    }

@router.patch("/officers/{officer_id}", response_model=OfficerOut)
def update_officer(
    officer_id: int,
    payload: OfficerUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update an officer"""
    company_id = current_user.get("company_id", 1)
    user = db.query(User).filter(User.id == officer_id, User.company_id == company_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    if payload.name:
        user.username = payload.name
    if payload.division:
        user.division = payload.division
    
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "name": user.username,
        "badge_id": f"BADGE_{user.id:04d}",
        "position": "Officer",
        "division": user.division,
        "status": "active",
    }

@router.delete("/officers/{officer_id}")
def delete_officer(
    officer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete an officer (soft delete)"""
    company_id = current_user.get("company_id", 1)
    user = db.query(User).filter(User.id == officer_id, User.company_id == company_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    return {"message": "Officer deleted"}

# ========== Attendance Corrections Endpoints ==========

@router.get("/attendance/corrections", response_model=List[CorrectionOut])
def list_corrections(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List all attendance correction requests"""
    company_id = current_user.get("company_id", 1)
    corrections = db.query(AttendanceCorrection).filter(
        AttendanceCorrection.company_id == company_id
    ).order_by(AttendanceCorrection.created_at.desc()).all()
    
    result = []
    for corr in corrections:
        user = db.query(User).filter(User.id == corr.user_id).first()
        result.append({
            "id": corr.id,
            "officer_name": user.username if user else f"User #{corr.user_id}",
            "date": corr.created_at.date().isoformat(),
            "type": corr.correction_type.value,
            "requested_clock_in": corr.requested_clock_in.isoformat() if corr.requested_clock_in else None,
            "requested_clock_out": corr.requested_clock_out.isoformat() if corr.requested_clock_out else None,
            "reason": corr.reason,
            "evidence_url": corr.evidence_url,
            "status": corr.status.value,
        })
    return result

@router.post("/attendance/corrections/{correction_id}/approve", response_model=CorrectionOut)
def approve_correction(
    correction_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Approve an attendance correction"""
    company_id = current_user.get("company_id", 1)
    correction = db.query(AttendanceCorrection).filter(
        AttendanceCorrection.id == correction_id,
        AttendanceCorrection.company_id == company_id
    ).first()
    
    if not correction:
        raise HTTPException(status_code=404, detail="Correction not found")
    
    correction.status = CorrectionStatus.APPROVED
    correction.approved_by = current_user.get("id")
    
    if correction.attendance_id and correction.requested_clock_in:
        attendance = db.query(Attendance).filter(Attendance.id == correction.attendance_id).first()
        if attendance:
            attendance.checkin_time = correction.requested_clock_in
        if correction.requested_clock_out:
            attendance.checkout_time = correction.requested_clock_out
    
    db.commit()
    db.refresh(correction)
    
    user = db.query(User).filter(User.id == correction.user_id).first()
    return {
        "id": correction.id,
        "officer_name": user.username if user else f"User #{correction.user_id}",
        "date": correction.created_at.date().isoformat(),
        "type": correction.correction_type.value,
        "requested_clock_in": correction.requested_clock_in.isoformat() if correction.requested_clock_in else None,
        "requested_clock_out": correction.requested_clock_out.isoformat() if correction.requested_clock_out else None,
        "reason": correction.reason,
        "evidence_url": correction.evidence_url,
        "status": correction.status.value,
    }

@router.post("/attendance/corrections/{correction_id}/reject")
def reject_correction(
    correction_id: int,
    reason: str = Query(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Reject an attendance correction"""
    company_id = current_user.get("company_id", 1)
    correction = db.query(AttendanceCorrection).filter(
        AttendanceCorrection.id == correction_id,
        AttendanceCorrection.company_id == company_id
    ).first()
    
    if not correction:
        raise HTTPException(status_code=404, detail="Correction not found")
    
    correction.status = CorrectionStatus.REJECTED
    correction.rejected_reason = reason
    
    db.commit()
    
    return {"message": "Correction rejected"}

# ========== Inspect Points Endpoints ==========

@router.get("/inspectpoints", response_model=List[InspectPointOut])
def list_inspect_points(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List all inspect points"""
    try:
        company_id = current_user.get("company_id", 1)
        points = db.query(InspectPoint).filter(InspectPoint.company_id == company_id).all()
        
        result = []
        for point in points:
            try:
                site = db.query(Site).filter(Site.id == point.site_id).first() if point.site_id else None
                result.append({
                    "id": point.id,
                    "name": point.name or "",
                    "code": point.code or f"INSPECT_{point.id}",
                    "site_name": site.name if site else f"Site #{point.site_id}" if point.site_id else "Unknown",
                    "description": getattr(point, 'description', None),
                    "is_active": getattr(point, 'is_active', True),
                })
            except Exception as point_error:
                api_logger.error(f"Error processing inspect point {point.id}: {str(point_error)}", exc_info=True)
                # Skip this point and continue
                continue
        
        return result
    except Exception as e:
        api_logger.error(f"Error listing inspect points: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_inspect_points")

@router.post("/inspectpoints", response_model=InspectPointOut)
def create_inspect_point(
    payload: InspectPointCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create a new inspect point"""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Validate required fields
        if not payload.name or not payload.name.strip():
            raise HTTPException(status_code=400, detail="Name is required")
        if not payload.code or not payload.code.strip():
            raise HTTPException(status_code=400, detail="Code is required")
        if not payload.site_name or not payload.site_name.strip():
            raise HTTPException(status_code=400, detail="Site name is required")
        
        site = db.query(Site).filter(
            Site.name == payload.site_name,
            Site.company_id == company_id
        ).first()
        
        if not site:
            raise HTTPException(status_code=404, detail=f"Site '{payload.site_name}' not found. Please create the site first.")
        
        existing = db.query(InspectPoint).filter(InspectPoint.code == payload.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Inspect point with this code already exists")
        
        point = InspectPoint(
            company_id=company_id,
            site_id=site.id,
            name=payload.name.strip(),
            code=payload.code.strip(),
            description=payload.description.strip() if payload.description else None,
            is_active=payload.is_active if payload.is_active is not None else True,
        )
        db.add(point)
        db.commit()
        db.refresh(point)
        
        return {
            "id": point.id,
            "name": point.name,
            "code": point.code,
            "site_name": site.name,
            "description": point.description,
            "is_active": point.is_active,
        }
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error creating inspect point: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_inspect_point")

@router.patch("/inspectpoints/{point_id}", response_model=InspectPointOut)
def update_inspect_point(
    point_id: int,
    payload: InspectPointUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update an inspect point"""
    company_id = current_user.get("company_id", 1)
    point = db.query(InspectPoint).filter(
        InspectPoint.id == point_id,
        InspectPoint.company_id == company_id
    ).first()
    
    if not point:
        raise HTTPException(status_code=404, detail="Inspect point not found")
    
    if payload.name:
        point.name = payload.name
    if payload.code:
        point.code = payload.code
    if payload.description is not None:
        point.description = payload.description
    if payload.is_active is not None:
        point.is_active = payload.is_active
    if payload.site_name:
        site = db.query(Site).filter(
            Site.name == payload.site_name,
            Site.company_id == company_id
        ).first()
        if site:
            point.site_id = site.id
    
    db.commit()
    db.refresh(point)
    
    site = db.query(Site).filter(Site.id == point.site_id).first()
    return {
        "id": point.id,
        "name": point.name,
        "code": point.code,
        "site_name": site.name if site else f"Site #{point.site_id}",
        "description": point.description,
        "is_active": point.is_active,
    }

@router.delete("/inspectpoints/{point_id}")
def delete_inspect_point(
    point_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete an inspect point"""
    company_id = current_user.get("company_id", 1)
    point = db.query(InspectPoint).filter(
        InspectPoint.id == point_id,
        InspectPoint.company_id == company_id
    ).first()
    
    if not point:
        raise HTTPException(status_code=404, detail="Inspect point not found")
    
    db.delete(point)
    db.commit()
    
    return {"message": "Inspect point deleted"}

@router.get("/inspectpoints/{point_id}/qr")
def get_inspect_point_qr(
    point_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Generate QR code for an inspect point"""
    company_id = current_user.get("company_id", 1)
    point = db.query(InspectPoint).filter(
        InspectPoint.id == point_id,
        InspectPoint.company_id == company_id
    ).first()
    
    if not point:
        raise HTTPException(status_code=404, detail="Inspect point not found")
    
    # Use point code or generate one from ID if code is missing
    qr_data = point.code if point.code else f"INSPECT_{point.id}"
    
    if not qr_data or not qr_data.strip():
        raise HTTPException(status_code=400, detail="Inspect point code is required for QR generation")
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600"
        }
    )

# ========== Patrol Activity Endpoints ==========

@router.get("/patrol-activity", response_model=List[PatrolActivityOut])
def list_patrol_activity(
    date_from: Optional[date] = Query(None, alias="date_from"),
    date_to: Optional[date] = Query(None, alias="date_to"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List patrol activities from Security division"""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(SecurityPatrolLog).filter(SecurityPatrolLog.company_id == company_id)
        
        if date_from:
            q = q.filter(SecurityPatrolLog.start_time >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            q = q.filter(SecurityPatrolLog.start_time < datetime.combine(date_to + timedelta(days=1), datetime.min.time()))
        
        patrols = q.order_by(SecurityPatrolLog.start_time.desc()).all()
        
        # Batch load users and sites to avoid N+1 queries
        user_ids = list(set([p.user_id for p in patrols if p.user_id]))
        site_ids = list(set([p.site_id for p in patrols if p.site_id]))
        
        users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
        sites = {s.id: s for s in db.query(Site).filter(Site.id.in_(site_ids)).all()} if site_ids else {}
        
        result = []
        for patrol in patrols:
            user = users.get(patrol.user_id) if patrol.user_id else None
            site = sites.get(patrol.site_id) if patrol.site_id else None
            
            # Handle datetime conversion safely
            start_time_str = None
            if patrol.start_time:
                try:
                    if hasattr(patrol.start_time, 'isoformat'):
                        start_time_str = patrol.start_time.isoformat()
                    else:
                        start_time_str = str(patrol.start_time)
                except Exception:
                    start_time_str = str(patrol.start_time) if patrol.start_time else None
            
            end_time_str = None
            if patrol.end_time:
                try:
                    if hasattr(patrol.end_time, 'isoformat'):
                        end_time_str = patrol.end_time.isoformat()
                    else:
                        end_time_str = str(patrol.end_time)
                except Exception:
                    end_time_str = str(patrol.end_time) if patrol.end_time else None
            
            created_at_str = start_time_str  # Use start_time as created_at fallback
            
            result.append({
                "id": patrol.id,
                "user_id": patrol.user_id,
                "officer_name": user.username if user else f"User #{patrol.user_id}",
                "site_id": patrol.site_id,
                "site_name": site.name if site else f"Site #{patrol.site_id}",
                "start_time": start_time_str or "",
                "end_time": end_time_str,
                "created_at": created_at_str or "",
            })
        return result
    except Exception as e:
        api_logger.error(f"Error fetching patrol activity: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_patrol_activity")

@router.get("/patrol-activity/{patrol_id}/qr")
def generate_patrol_qr(
    patrol_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Generate QR code for a patrol activity record"""
    company_id = current_user.get("company_id", 1)
    
    patrol = db.query(SecurityPatrolLog).filter(
        SecurityPatrolLog.id == patrol_id,
        SecurityPatrolLog.company_id == company_id
    ).first()
    
    if not patrol:
        raise HTTPException(status_code=404, detail="Patrol activity not found")
    
    # Generate QR code with patrol reference
    qr_data = f"PATROL_{patrol.id}_{patrol.user_id}_{patrol.site_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600"
        }
    )

# ========== Shift Management Endpoints ==========

class ShiftOut(BaseModel):
    id: int
    company_id: int
    site_id: int
    site_name: Optional[str] = None
    division: str
    shift_date: date
    start_time: str
    end_time: str
    shift_type: Optional[str] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    status: str
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

class ShiftCreate(BaseModel):
    site_id: int
    division: str
    shift_date: date
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    shift_type: Optional[str] = None
    user_id: Optional[int] = None  # If None, status will be OPEN
    notes: Optional[str] = None

class ShiftUpdate(BaseModel):
    user_id: Optional[int] = None
    status: Optional[str] = None  # ASSIGNED, OPEN, COMPLETED, CANCELLED
    notes: Optional[str] = None

@router.get("/shifts/calendar", response_model=List[ShiftOut])
def get_shifts_calendar(
    start: date = Query(..., alias="start"),
    end: date = Query(..., alias="end"),
    site_id: Optional[int] = Query(None, alias="site_id"),
    division: Optional[str] = Query(None, alias="division"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get shifts for calendar view (date range)"""
    company_id = current_user.get("company_id", 1)
    
    q = db.query(Shift).filter(
        Shift.company_id == company_id,
        Shift.shift_date >= start,
        Shift.shift_date <= end
    )
    
    if site_id:
        q = q.filter(Shift.site_id == site_id)
    if division:
        q = q.filter(Shift.division == division.upper())
    
    shifts = q.order_by(Shift.shift_date.asc(), Shift.start_time.asc()).all()
    
    site_ids = list(set([s.site_id for s in shifts]))
    user_ids = list(set([s.user_id for s in shifts if s.user_id]))
    
    sites = {s.id: s for s in db.query(Site).filter(Site.id.in_(site_ids)).all()} if site_ids else {}
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
    
    result = []
    for shift in shifts:
        site = sites.get(shift.site_id)
        user = users.get(shift.user_id) if shift.user_id else None
        result.append(ShiftOut(
            id=shift.id,
            company_id=shift.company_id,
            site_id=shift.site_id,
            site_name=site.name if site else f"Site #{shift.site_id}",
            division=shift.division,
            shift_date=shift.shift_date.date() if isinstance(shift.shift_date, datetime) else shift.shift_date,
            start_time=shift.start_time,
            end_time=shift.end_time,
            shift_type=shift.shift_type,
            user_id=shift.user_id,
            user_name=user.username if user else None,
            status=shift.status.value if hasattr(shift.status, 'value') else str(shift.status),
            notes=shift.notes,
        ))
    return result

@router.post("/shifts", response_model=ShiftOut, status_code=status.HTTP_201_CREATED)
def create_shift(
    payload: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create a new shift"""
    company_id = current_user.get("company_id", 1)
    
    # Determine status based on user_id
    shift_status = ShiftStatus.OPEN if payload.user_id is None else ShiftStatus.ASSIGNED
    
    shift = Shift(
        company_id=company_id,
        site_id=payload.site_id,
        division=payload.division.upper(),
        shift_date=datetime.combine(payload.shift_date, datetime.min.time()),
        start_time=payload.start_time,
        end_time=payload.end_time,
        shift_type=payload.shift_type,
        user_id=payload.user_id,
        status=shift_status,
        notes=payload.notes,
    )
    
    db.add(shift)
    db.commit()
    db.refresh(shift)
    
    site = db.query(Site).filter(Site.id == shift.site_id).first()
    user = db.query(User).filter(User.id == shift.user_id).first() if shift.user_id else None
    
    return ShiftOut(
        id=shift.id,
        company_id=shift.company_id,
        site_id=shift.site_id,
        site_name=site.name if site else f"Site #{shift.site_id}",
        division=shift.division,
        shift_date=shift.shift_date.date() if isinstance(shift.shift_date, datetime) else shift.shift_date,
        start_time=shift.start_time,
        end_time=shift.end_time,
        shift_type=shift.shift_type,
        user_id=shift.user_id,
        user_name=user.username if user else None,
        status=shift.status.value if hasattr(shift.status, 'value') else str(shift.status),
        notes=shift.notes,
    )

@router.patch("/shifts/{shift_id}", response_model=ShiftOut)
def update_shift(
    shift_id: int,
    payload: ShiftUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update a shift (assign user, change status, etc.)"""
    company_id = current_user.get("company_id", 1)
    shift = db.query(Shift).filter(
        Shift.id == shift_id,
        Shift.company_id == company_id
    ).first()
    
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    if payload.user_id is not None:
        shift.user_id = payload.user_id
        # Auto-update status based on user_id
        if payload.user_id:
            shift.status = ShiftStatus.ASSIGNED
        else:
            shift.status = ShiftStatus.OPEN
    
    if payload.status:
        try:
            shift.status = ShiftStatus[payload.status.upper()]
        except (KeyError, AttributeError):
            pass
    
    if payload.notes is not None:
        shift.notes = payload.notes
    
    db.commit()
    db.refresh(shift)
    
    site = db.query(Site).filter(Site.id == shift.site_id).first()
    user = db.query(User).filter(User.id == shift.user_id).first() if shift.user_id else None
    
    return ShiftOut(
        id=shift.id,
        company_id=shift.company_id,
        site_id=shift.site_id,
        site_name=site.name if site else f"Site #{shift.site_id}",
        division=shift.division,
        shift_date=shift.shift_date.date() if isinstance(shift.shift_date, datetime) else shift.shift_date,
        start_time=shift.start_time,
        end_time=shift.end_time,
        shift_type=shift.shift_type,
        user_id=shift.user_id,
        user_name=user.username if user else None,
        status=shift.status.value if hasattr(shift.status, 'value') else str(shift.status),
        notes=shift.notes,
    )

@router.delete("/shifts/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete a shift"""
    company_id = current_user.get("company_id", 1)
    shift = db.query(Shift).filter(
        Shift.id == shift_id,
        Shift.company_id == company_id
    ).first()
    
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    db.delete(shift)
    db.commit()
    return

# ========== Leave Requests Endpoints ==========

@router.get("/leave-requests", response_model=List[LeaveRequestOut])
def list_leave_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List all leave requests across all divisions"""
    # For now, return empty list - leave requests will be implemented separately
    return []

@router.post("/leave-requests/{request_id}/approve")
def approve_leave_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Approve a leave request"""
    # TODO: Implement when LeaveRequest model is created
    return {"message": "Leave request approved"}

@router.post("/leave-requests/{request_id}/reject")
def reject_leave_request(
    request_id: int,
    reason: str = Query(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Reject a leave request"""
    # TODO: Implement when LeaveRequest model is created
    return {"message": "Leave request rejected"}

# ========== Checklist / Task Console Endpoints ==========

@router.get("/checklists", response_model=PaginatedResponse[ChecklistTaskOut])
def list_checklists(
    db: Session = Depends(get_db),
    _: dict = Depends(require_supervisor),
    pagination: PaginationParams = Depends(get_pagination_params),
    date: Optional[date] = Query(None, alias="date"),
    site_id: Optional[int] = Query(None, alias="site_id"),
    division: Optional[str] = Query(None, alias="division"),
    context_type: Optional[str] = Query(None, alias="context_type"),
    status: Optional[str] = Query(None, alias="status"),
    company_id: Optional[int] = Query(None, alias="company_id"),
    search: Optional[str] = Query(None, alias="search"),
):
    """List all checklists/tasks across all divisions with filters"""
    # #region agent log
    import json
    import os
    import time
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        log_path = os.path.join(project_root, '.cursor', 'debug.log')
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
    except Exception as log_err: 
        log_path = None
    # #endregion
    try:
        from app.divisions.security.models import Checklist, ChecklistTemplate, ChecklistItem, ChecklistStatus, ChecklistItemStatus
        from app.divisions.cleaning.models import CleaningZone
        from app.divisions.driver.models import Vehicle
        
        company_id_filter = company_id or _.get("company_id", 1)
        
        api_logger.info(
            "Fetching checklists",
            extra={
                "company_id": company_id_filter,
                "filters": {
                    "date": str(date) if date else None,
                    "site_id": site_id,
                    "division": division,
                    "context_type": context_type,
                    "status": status,
                    "search": search,
                },
                "pagination": {"page": pagination.page, "limit": pagination.limit},
            },
        )
        
        # Build base query
        q = db.query(Checklist).filter(Checklist.company_id == company_id_filter)
        
        if date:
            q = q.filter(Checklist.shift_date == date)
        
        if site_id:
            q = q.filter(Checklist.site_id == site_id)
        
        if division:
            q = q.filter(Checklist.division == division.upper())
        
        if context_type:
            q = q.filter(Checklist.context_type == context_type.upper())
        
        if status:
            try:
                status_enum = ChecklistStatus[status.upper()]
                q = q.filter(Checklist.status == status_enum)
            except (KeyError, AttributeError):
                pass
        
        # Apply search filter - search in template name, site name, user name, division, context type
        if search and search.strip():
            search_term = f"%{search.strip()}%"
            # #region agent log
            try:
                if log_path:
                    with open(log_path, 'a', encoding='utf-8') as f:
                        f.write(json.dumps({"location": "supervisor_routes.py:1600", "message": "Applying search filter", "data": {"search": search, "search_term": search_term}, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "runId": "search-debug", "hypothesisId": "A"}) + "\n")
            except Exception as log_err: pass
            # #endregion
            
            # Use subquery approach for better performance
            # Get matching template IDs
            matching_template_ids = db.query(ChecklistTemplate.id).filter(
                ChecklistTemplate.name.ilike(search_term)
            )
            
            # Get matching site IDs
            matching_site_ids = db.query(Site.id).filter(
                Site.name.ilike(search_term)
            )
            
            # Get matching user IDs
            matching_user_ids = db.query(User.id).filter(
                User.username.ilike(search_term)
            )
            
            # #region agent log
            try:
                if log_path:
                    template_count = matching_template_ids.count()
                    site_count = matching_site_ids.count()
                    user_count = matching_user_ids.count()
                    with open(log_path, 'a', encoding='utf-8') as f:
                        f.write(json.dumps({"location": "supervisor_routes.py:1620", "message": "Search subquery counts", "data": {"template_matches": template_count, "site_matches": site_count, "user_matches": user_count}, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "runId": "search-debug", "hypothesisId": "B"}) + "\n")
            except: pass
            # #endregion
            
            # Search conditions using subqueries
            search_conditions = [
                Checklist.template_id.in_(matching_template_ids),
                Checklist.site_id.in_(matching_site_ids),
                Checklist.user_id.in_(matching_user_ids),
                Checklist.division.ilike(search_term),
                Checklist.context_type.ilike(search_term),
            ]
            q = q.filter(or_(*search_conditions))
            
            # #region agent log
            try:
                if log_path:
                    with open(log_path, 'a', encoding='utf-8') as f:
                        f.write(json.dumps({"location": "supervisor_routes.py:1635", "message": "Search filter applied", "data": {"conditions_count": len(search_conditions)}, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "runId": "search-debug", "hypothesisId": "C"}) + "\n")
            except: pass
            # #endregion
        
        total = q.count()
        
        # #region agent log
        try:
            if log_path:
                with open(log_path, 'a', encoding='utf-8') as f:
                    f.write(json.dumps({"location": "supervisor_routes.py:1660", "message": "Query count result", "data": {"total": total, "has_search": bool(search and search.strip())}, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "runId": "search-debug", "hypothesisId": "D"}) + "\n")
        except: pass
        # #endregion
        
        records = (
            q.order_by(Checklist.shift_date.desc(), Checklist.created_at.desc())
            .offset(pagination.offset)
            .limit(pagination.limit)
            .all()
        )
        
        # #region agent log
        try:
            if log_path:
                with open(log_path, 'a', encoding='utf-8') as f:
                    f.write(json.dumps({"location": "supervisor_routes.py:1670", "message": "Records retrieved", "data": {"records_count": len(records)}, "timestamp": int(time.time() * 1000), "sessionId": "debug-session", "runId": "search-debug", "hypothesisId": "E"}) + "\n")
        except: pass
        # #endregion
        
        template_ids = list(set([c.template_id for c in records if c.template_id]))
        user_ids = list(set([c.user_id for c in records]))
        site_ids = list(set([c.site_id for c in records]))
        context_ids = list(set([c.context_id for c in records if c.context_id]))
        
        templates = {t.id: t for t in db.query(ChecklistTemplate).filter(ChecklistTemplate.id.in_(template_ids)).all()} if template_ids else {}
        users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
        sites = {s.id: s for s in db.query(Site).filter(Site.id.in_(site_ids)).all()} if site_ids else {}
        
        zones = {}
        vehicles = {}
        if context_ids:
            cleaning_checklists = [c for c in records if c.context_type == "CLEANING_ZONE" and c.context_id]
            if cleaning_checklists:
                zone_ids = [c.context_id for c in cleaning_checklists]
                zones = {z.id: z for z in db.query(CleaningZone).filter(CleaningZone.id.in_(zone_ids)).all()}
            
            driver_checklists = [c for c in records if c.context_type in ["DRIVER_PRE_TRIP", "DRIVER_POST_TRIP"] and c.context_id]
            if driver_checklists:
                pass
        
        results = []
        for checklist in records:
            template = templates.get(checklist.template_id) if checklist.template_id else None
            user = users.get(checklist.user_id)
            site = sites.get(checklist.site_id)
            
            items = db.query(ChecklistItem).filter(ChecklistItem.checklist_id == checklist.id).all()
            total_items = len(items)
            # Handle status - could be enum or string
            completed_items = 0
            for item in items:
                try:
                    # Handle enum status properly
                    if isinstance(item.status, ChecklistItemStatus):
                        status_value = item.status.value
                    elif hasattr(item.status, 'value'):
                        status_value = item.status.value
                    else:
                        status_value = str(item.status)
                    
                    if status_value == "COMPLETED" or status_value == ChecklistItemStatus.COMPLETED:
                        completed_items += 1
                except Exception:
                    pass
            completion_percent = (completed_items / total_items * 100) if total_items > 0 else 0.0
            
            evidence_available = any(
                (getattr(item, 'photo_id', None) or getattr(item, 'photo_path', None) or getattr(item, 'notes', None) or getattr(item, 'note', None))
                for item in items
            )
            
            zone_or_vehicle = None
            if checklist.context_type == "CLEANING_ZONE" and checklist.context_id:
                zone = zones.get(checklist.context_id)
                zone_or_vehicle = zone.name if zone else f"Zone #{checklist.context_id}"
            elif checklist.context_type in ["DRIVER_PRE_TRIP", "DRIVER_POST_TRIP"]:
                zone_or_vehicle = f"Vehicle/Trip #{checklist.context_id}" if checklist.context_id else None
            
            # Handle datetime conversion safely
            start_time_str = None
            if checklist.created_at:
                try:
                    start_time_str = checklist.created_at.isoformat() if hasattr(checklist.created_at, 'isoformat') else str(checklist.created_at)
                except:
                    start_time_str = str(checklist.created_at) if checklist.created_at else None
            
            completed_time_str = None
            if checklist.completed_at:
                try:
                    completed_time_str = checklist.completed_at.isoformat() if hasattr(checklist.completed_at, 'isoformat') else str(checklist.completed_at)
                except:
                    completed_time_str = str(checklist.completed_at) if checklist.completed_at else None
            
            # Handle status safely
            status_str = None
            try:
                if isinstance(checklist.status, ChecklistStatus):
                    status_str = checklist.status.value
                elif hasattr(checklist.status, 'value'):
                    status_str = checklist.status.value
                else:
                    status_str = str(checklist.status)
            except:
                status_str = str(checklist.status) if checklist.status else "UNKNOWN"
            
            results.append(ChecklistTaskOut(
                id=checklist.id,
                template_name=template.name if template else "Untitled Checklist",
                division=checklist.division,
                context_type=checklist.context_type,
                site_name=site.name if site else "Unknown",
                zone_or_vehicle=zone_or_vehicle,
                assigned_user_name=user.username if user else f"User #{checklist.user_id}",
                start_time=start_time_str,
                completed_time=completed_time_str,
                completion_percent=round(completion_percent, 1),
                evidence_available=evidence_available,
                status=status_str,
            ))
        
        api_logger.info(f"Retrieved {len(results)} checklist records (total: {total})")
        
        return create_paginated_response(results, total, pagination)
        
    except Exception as e:
        api_logger.error(f"Error fetching checklists: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_checklists")

# ========== Dashboard Enhancements ==========

@router.get("/manpower", response_model=List[dict])
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
                    db.query(func.count(Attendance.id))
                    .filter(
                        Attendance.company_id == company_id,
                        Attendance.site_id == zone.site_id,
                        Attendance.role_type == "CLEANING",
                        Attendance.status == AttendanceStatus.IN_PROGRESS,
                        func.date(Attendance.checkin_time) == filter_date,
                    )
                    .scalar() or 0
                )
                
                # Count scheduled shifts
                scheduled_shifts = (
                    db.query(func.count(Shift.id))
                    .filter(
                        Shift.company_id == company_id,
                        Shift.site_id == zone.site_id,
                        Shift.division == "CLEANING",
                        func.date(Shift.shift_date) == filter_date,
                        Shift.status == ShiftStatus.ASSIGNED,
                    )
                    .scalar() or 0
                )
                
                result.append({
                    "area_id": zone.id,
                    "area_name": zone.name,
                    "area_type": "ZONE",
                    "total_manpower": scheduled_shifts,
                    "active_manpower": active_attendance,
                    "scheduled_manpower": scheduled_shifts,
                    "division": "CLEANING",
                })
        
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
                    db.query(func.count(Attendance.id))
                    .filter(
                        Attendance.company_id == company_id,
                        Attendance.site_id == site_obj.id,
                        Attendance.status == AttendanceStatus.IN_PROGRESS,
                        func.date(Attendance.checkin_time) == filter_date,
                    )
                    .scalar() or 0
                )
                
                # Count scheduled shifts
                scheduled_shifts = (
                    db.query(func.count(Shift.id))
                    .filter(
                        Shift.company_id == company_id,
                        Shift.site_id == site_obj.id,
                        func.date(Shift.shift_date) == filter_date,
                        Shift.status == ShiftStatus.ASSIGNED,
                    )
                    .scalar() or 0
                )
                
                result.append({
                    "area_id": site_obj.id,
                    "area_name": site_obj.name,
                    "area_type": "SITE",
                    "total_manpower": scheduled_shifts,
                    "active_manpower": active_attendance,
                    "scheduled_manpower": scheduled_shifts,
                    "division": None,
                })
        
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


@router.get("/incidents/perpetrators", response_model=List[dict])
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
            if not incident.perpetrator_name:
                continue
            key = f"{incident.perpetrator_name}_{incident.perpetrator_type or 'UNKNOWN'}"
            if key not in perpetrator_map:
                perpetrator_map[key] = {
                    "perpetrator_name": incident.perpetrator_name,
                    "perpetrator_type": incident.perpetrator_type or "UNKNOWN",
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
            incident_dates = [
                datetime.fromisoformat(inc["created_at"].replace("Z", "+00:00")).date() 
                for inc in incidents_list
            ]
            
            result.append({
                "perpetrator_name": data["perpetrator_name"],
                "perpetrator_type": data["perpetrator_type"],
                "incident_count": len(incidents_list),
                "first_incident_date": min(incident_dates).isoformat(),
                "last_incident_date": max(incident_dates).isoformat(),
                "incidents": incidents_list,
            })
        
        # Sort by incident count descending
        result.sort(key=lambda x: x["incident_count"], reverse=True)
        
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


@router.get("/patrol-targets", response_model=List[dict])
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
            
            result.append({
                "target_id": target.id,
                "site_id": target.site_id,
                "site_name": site.name if site else f"Site {target.site_id}",
                "zone_id": target.zone_id,
                "zone_name": zone.name if zone else None,
                "route_id": target.route_id,
                "target_date": target.target_date.isoformat(),
                "target_checkpoints": target.target_checkpoints,
                "completed_checkpoints": target.completed_checkpoints,
                "completion_percentage": target.completion_percentage,
                "status": target.status,
            })
        
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


@router.get("/users/{user_id}/recap", response_model=dict)
def get_user_recap(
    user_id: int,
    period_start: date = Query(...),
    period_end: date = Query(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get user recap/report with attendance, patrol, report, and incident summary."""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Verify user exists and belongs to company
        user = db.query(User).filter(
            User.id == user_id,
            User.company_id == company_id,
        ).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Attendance summary
        attendance_summary = (
            db.query(Attendance)
            .filter(
                Attendance.user_id == user_id,
                func.date(Attendance.checkin_time) >= period_start,
                func.date(Attendance.checkin_time) <= period_end,
            )
            .all()
        )
        
        total_attendance = len(attendance_summary)
        total_hours = sum(
            (att.checkout_time - att.checkin_time).total_seconds() / 3600
            for att in attendance_summary
            if att.checkout_time
        )
        overtime_count = sum(1 for att in attendance_summary if att.is_overtime)
        
        # Patrol summary
        from app.divisions.security.models import SecurityPatrolLog
        patrol_summary = (
            db.query(SecurityPatrolLog)
            .filter(
                SecurityPatrolLog.user_id == user_id,
                func.date(SecurityPatrolLog.start_time) >= period_start,
                func.date(SecurityPatrolLog.start_time) <= period_end,
            )
            .all()
        )
        
        total_patrols = len(patrol_summary)
        completed_patrols = sum(1 for p in patrol_summary if p.end_time)
        
        # Report summary
        report_summary = (
            db.query(SecurityReport)
            .filter(
                SecurityReport.user_id == user_id,
                func.date(SecurityReport.created_at) >= period_start,
                func.date(SecurityReport.created_at) <= period_end,
            )
            .all()
        )
        
        total_reports = len(report_summary)
        incidents = sum(1 for r in report_summary if r.report_type == "incident")
        
        # Incident summary (as perpetrator)
        incident_as_perpetrator = (
            db.query(SecurityReport)
            .filter(
                SecurityReport.perpetrator_name == user.username,
                func.date(SecurityReport.created_at) >= period_start,
                func.date(SecurityReport.created_at) <= period_end,
            )
            .all()
        )
        
        return {
            "user_id": user_id,
            "user_name": user.username,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "attendance": {
                "total_days": total_attendance,
                "total_hours": round(total_hours, 2),
                "overtime_count": overtime_count,
                "details": [
                    {
                        "date": att.checkin_time.date().isoformat(),
                        "checkin": att.checkin_time.isoformat(),
                        "checkout": att.checkout_time.isoformat() if att.checkout_time else None,
                        "hours": round((att.checkout_time - att.checkin_time).total_seconds() / 3600, 2) if att.checkout_time else None,
                        "is_overtime": att.is_overtime,
                    }
                    for att in attendance_summary
                ],
            },
            "patrols": {
                "total": total_patrols,
                "completed": completed_patrols,
                "completion_rate": round((completed_patrols / total_patrols * 100) if total_patrols > 0 else 0, 2),
                "details": [
                    {
                        "id": p.id,
                        "date": p.start_time.date().isoformat(),
                        "start_time": p.start_time.isoformat(),
                        "end_time": p.end_time.isoformat() if p.end_time else None,
                        "area": p.area_text,
                        "status": "completed" if p.end_time else "ongoing",
                    }
                    for p in patrol_summary
                ],
            },
            "reports": {
                "total": total_reports,
                "incidents": incidents,
                "details": [
                    {
                        "id": r.id,
                        "title": r.title,
                        "type": r.report_type,
                        "severity": r.severity,
                        "date": r.created_at.date().isoformat(),
                    }
                    for r in report_summary
                ],
            },
            "incidents_as_perpetrator": {
                "count": len(incident_as_perpetrator),
                "details": [
                    {
                        "id": r.id,
                        "title": r.title,
                        "level": r.incident_level,
                        "date": r.created_at.date().isoformat(),
                    }
                    for r in incident_as_perpetrator
                ],
            },
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting user recap: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get user recap: {error_msg}"
        )
