# backend/app/api/patrol_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date
import json

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_supervisor
from datetime import timedelta
from app.models.patrol_target import PatrolTarget
from app.models.patrol_team import PatrolTeam
from app.models.user import User
from app.models.site import Site
# Import joint_patrol models safely - if it fails, set to None
try:
    from app.models.joint_patrol import JointPatrol, PatrolReport as PatrolReportModel
except Exception as e:
    api_logger.warning(f"Failed to import joint_patrol models: {str(e)}. Joint patrol features may not be available.")
    JointPatrol = None
    PatrolReportModel = None
from app.divisions.security.models import SecurityPatrolLog
from app.divisions.cleaning import models as cleaning_models

router = APIRouter(prefix="/patrol", tags=["patrol"])


class PatrolTargetBase(BaseModel):
    id: int
    site_id: int
    site_name: Optional[str] = None
    zone_id: Optional[int] = None
    zone_name: Optional[str] = None
    route_id: Optional[int] = None
    target_date: date
    target_checkpoints: int
    completed_checkpoints: int
    completion_percentage: float
    status: str
    
    class Config:
        from_attributes = True


class PatrolTargetCreate(BaseModel):
    site_id: int
    zone_id: Optional[int] = None
    route_id: Optional[int] = None
    target_date: date
    target_checkpoints: int
    target_duration_minutes: Optional[int] = None
    target_patrols: int = 1
    notes: Optional[str] = None


class PatrolTeamBase(BaseModel):
    id: int
    company_id: int
    site_id: int
    name: str
    division: str
    team_members: List[int]
    assigned_routes: Optional[List[int]] = None
    team_leader_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class PatrolTeamCreate(BaseModel):
    site_id: int
    name: str
    division: str
    team_members: List[int]
    assigned_routes: Optional[List[int]] = None
    team_leader_id: Optional[int] = None
    description: Optional[str] = None


@router.get("/targets", response_model=List[PatrolTargetBase])
def list_patrol_targets(
    site_id: Optional[int] = Query(None),
    target_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List patrol targets."""
    try:
        company_id = current_user.get("company_id", 1)
        filter_date = target_date or date.today()
        
        q = db.query(PatrolTarget).filter(
            PatrolTarget.company_id == company_id,
            PatrolTarget.target_date == filter_date,
        )
        
        if site_id:
            q = q.filter(PatrolTarget.site_id == site_id)
        if status:
            q = q.filter(PatrolTarget.status == status.upper())
        
        targets = q.order_by(PatrolTarget.target_date.desc()).all()
        
        result = []
        for target in targets:
            site = db.query(Site).filter(Site.id == target.site_id).first()
            zone = None
            if target.zone_id:
                zone = db.query(cleaning_models.CleaningZone).filter(
                    cleaning_models.CleaningZone.id == target.zone_id
                ).first()
            
            result.append(PatrolTargetBase(
                id=target.id,
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
        
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing patrol targets: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list patrol targets: {error_msg}"
        )


@router.post("/targets", response_model=PatrolTargetBase, status_code=201)
def create_patrol_target(
    payload: PatrolTargetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Create patrol target (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        target = PatrolTarget(
            company_id=company_id,
            site_id=payload.site_id,
            zone_id=payload.zone_id,
            route_id=payload.route_id,
            target_date=payload.target_date,
            target_checkpoints=payload.target_checkpoints,
            target_duration_minutes=payload.target_duration_minutes,
            target_patrols=payload.target_patrols,
            completed_checkpoints=0,
            completed_patrols=0,
            completion_percentage=0.0,
            missed_checkpoints=0,
            status="PENDING",
            notes=payload.notes,
        )
        
        db.add(target)
        db.commit()
        db.refresh(target)
        
        site = db.query(Site).filter(Site.id == target.site_id).first()
        zone = None
        if target.zone_id:
            zone = db.query(cleaning_models.CleaningZone).filter(
                cleaning_models.CleaningZone.id == target.zone_id
            ).first()
        
        api_logger.info(f"Created patrol target {target.id} by user {current_user.get('id')}")
        return PatrolTargetBase(
            id=target.id,
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
        )
        
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error creating patrol target: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create patrol target: {error_msg}"
        )


@router.get("/teams", response_model=List[PatrolTeamBase])
def list_patrol_teams(
    site_id: Optional[int] = Query(None),
    division: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List patrol teams."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(PatrolTeam).filter(PatrolTeam.company_id == company_id)
        
        if site_id:
            q = q.filter(PatrolTeam.site_id == site_id)
        if division:
            q = q.filter(PatrolTeam.division == division.upper())
        if is_active is not None:
            q = q.filter(PatrolTeam.is_active == is_active)
        
        teams = q.order_by(PatrolTeam.name.asc()).all()
        
        result = []
        for team in teams:
            result.append(PatrolTeamBase(
                id=team.id,
                company_id=team.company_id,
                site_id=team.site_id,
                name=team.name,
                division=team.division,
                team_members=team.team_members if isinstance(team.team_members, list) else [],
                assigned_routes=team.assigned_routes if isinstance(team.assigned_routes, list) else None,
                team_leader_id=team.team_leader_id,
                is_active=team.is_active,
                created_at=team.created_at,
            ))
        
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing patrol teams: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list patrol teams: {error_msg}"
        )


@router.post("/teams", response_model=PatrolTeamBase, status_code=201)
def create_patrol_team(
    payload: PatrolTeamCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Create patrol team (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        team = PatrolTeam(
            company_id=company_id,
            site_id=payload.site_id,
            name=payload.name,
            division=payload.division.upper(),
            team_members=payload.team_members,
            assigned_routes=payload.assigned_routes or [],
            team_leader_id=payload.team_leader_id,
            is_active=True,
            description=payload.description,
        )
        
        db.add(team)
        db.commit()
        db.refresh(team)
        
        api_logger.info(f"Created patrol team {team.id} by user {current_user.get('id')}")
        return PatrolTeamBase(
            id=team.id,
            company_id=team.company_id,
            site_id=team.site_id,
            name=team.name,
            division=team.division,
            team_members=team.team_members if isinstance(team.team_members, list) else [],
            assigned_routes=team.assigned_routes if isinstance(team.assigned_routes, list) else None,
            team_leader_id=team.team_leader_id,
            is_active=team.is_active,
            created_at=team.created_at,
        )
        
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error creating patrol team: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create patrol team: {error_msg}"
        )


@router.get("/foot-patrols", response_model=List[dict])
def get_foot_patrols(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get foot patrol tracking data."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(SecurityPatrolLog).filter(
            SecurityPatrolLog.company_id == company_id,
            SecurityPatrolLog.patrol_type == "FOOT",
        )
        
        if site_id:
            q = q.filter(SecurityPatrolLog.site_id == site_id)
        if from_date:
            q = q.filter(SecurityPatrolLog.start_time.date() >= from_date)
        if to_date:
            q = q.filter(SecurityPatrolLog.start_time.date() <= to_date)
        
        patrols = q.order_by(SecurityPatrolLog.start_time.desc()).limit(100).all()
        
        result = []
        for patrol in patrols:
            user = db.query(User).filter(User.id == patrol.user_id).first()
            site = db.query(Site).filter(Site.id == patrol.site_id).first()
            
            result.append({
                "id": patrol.id,
                "user_id": patrol.user_id,
                "user_name": user.username if user else f"User {patrol.user_id}",
                "site_id": patrol.site_id,
                "site_name": site.name if site else f"Site {patrol.site_id}",
                "start_time": patrol.start_time.isoformat(),
                "end_time": patrol.end_time.isoformat() if patrol.end_time else None,
                "distance_covered": patrol.distance_covered,
                "steps_count": patrol.steps_count,
                "area_text": patrol.area_text,
                "duration_minutes": (
                    int((patrol.end_time - patrol.start_time).total_seconds() / 60)
                    if patrol.end_time else None
                ),
            })
        
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting foot patrols: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get foot patrols: {error_msg}"
        )


# ============================================
# Joint Patrol Schemas and Endpoints
# ============================================

class JointPatrolBase(BaseModel):
    id: int
    site_id: int
    site_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    route: Optional[str] = None
    scheduled_start: datetime
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    lead_officer_id: int
    lead_officer_name: Optional[str] = None
    participant_ids: List[int]
    participant_names: Optional[List[str]] = None
    status: str
    notes: Optional[str] = None
    findings: Optional[str] = None
    photos: Optional[List[str]] = None
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class JointPatrolCreate(BaseModel):
    site_id: int
    title: str
    description: Optional[str] = None
    route: Optional[str] = None
    scheduled_start: datetime
    scheduled_end: Optional[datetime] = None
    lead_officer_id: int
    participant_ids: List[int]
    notes: Optional[str] = None


class JointPatrolUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    route: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    lead_officer_id: Optional[int] = None
    participant_ids: Optional[List[int]] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    findings: Optional[str] = None
    photos: Optional[List[str]] = None


def _enrich_joint_patrol(jp, db: Session) -> JointPatrolBase:
    """Helper to enrich joint patrol with names."""
    site = db.query(Site).filter(Site.id == jp.site_id).first()
    lead_officer = db.query(User).filter(User.id == jp.lead_officer_id).first()
    
    # Parse JSON strings to lists
    participant_ids_list = []
    if jp.participant_ids:
        if isinstance(jp.participant_ids, str):
            try:
                participant_ids_list = json.loads(jp.participant_ids)
            except (json.JSONDecodeError, TypeError):
                participant_ids_list = []
        elif isinstance(jp.participant_ids, list):
            participant_ids_list = jp.participant_ids
    
    participant_names = []
    if participant_ids_list:
        participants = db.query(User).filter(User.id.in_(participant_ids_list)).all()
        participant_names = [p.username for p in participants]
    
    # Parse photos JSON
    photos_list = None
    if jp.photos:
        if isinstance(jp.photos, str):
            try:
                photos_list = json.loads(jp.photos)
            except (json.JSONDecodeError, TypeError):
                photos_list = None
        elif isinstance(jp.photos, list):
            photos_list = jp.photos
    
    return JointPatrolBase(
        id=jp.id,
        site_id=jp.site_id,
        site_name=site.name if site else f"Site {jp.site_id}",
        title=jp.title,
        description=jp.description,
        route=jp.route,
        scheduled_start=jp.scheduled_start,
        scheduled_end=jp.scheduled_end,
        actual_start=jp.actual_start,
        actual_end=jp.actual_end,
        lead_officer_id=jp.lead_officer_id,
        lead_officer_name=lead_officer.username if lead_officer else f"User {jp.lead_officer_id}",
        participant_ids=participant_ids_list,
        participant_names=participant_names,
        status=jp.status,
        notes=jp.notes,
        findings=jp.findings,
        photos=photos_list,
        created_by=jp.created_by,
        created_at=jp.created_at,
    )


@router.get("/joint", response_model=List[JointPatrolBase])
def list_joint_patrols(
    site_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List joint patrols."""
    if JointPatrol is None:
        raise HTTPException(status_code=503, detail="Joint patrol feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(JointPatrol).filter(JointPatrol.company_id == company_id)
        
        if site_id:
            q = q.filter(JointPatrol.site_id == site_id)
        if status:
            q = q.filter(JointPatrol.status == status.upper())
        if date_from:
            q = q.filter(JointPatrol.scheduled_start >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            q = q.filter(JointPatrol.scheduled_start <= datetime.combine(date_to, datetime.max.time()))
        
        joint_patrols = q.order_by(JointPatrol.scheduled_start.desc()).limit(100).all()
        
        return [_enrich_joint_patrol(jp, db) for jp in joint_patrols]
        
    except Exception as e:
        error_msg = str(e)
        api_logger.error(f"Error listing joint patrols: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list joint patrols: {error_msg}")


@router.post("/joint", response_model=JointPatrolBase, status_code=201)
def create_joint_patrol(
    payload: JointPatrolCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Create a new joint patrol."""
    if JointPatrol is None:
        raise HTTPException(status_code=503, detail="Joint patrol feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        jp = JointPatrol(
            company_id=company_id,
            site_id=payload.site_id,
            title=payload.title,
            description=payload.description,
            route=payload.route,
            scheduled_start=payload.scheduled_start,
            scheduled_end=payload.scheduled_end,
            lead_officer_id=payload.lead_officer_id,
            participant_ids=json.dumps(payload.participant_ids) if payload.participant_ids else None,
            status="SCHEDULED",
            notes=payload.notes,
            created_by=user_id,
        )
        
        db.add(jp)
        db.commit()
        db.refresh(jp)
        
        api_logger.info(f"Created joint patrol {jp.id} by user {user_id}")
        return _enrich_joint_patrol(jp, db)
        
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        api_logger.error(f"Error creating joint patrol: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create joint patrol: {error_msg}")


@router.get("/joint/{patrol_id}", response_model=JointPatrolBase)
def get_joint_patrol(
    patrol_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get joint patrol by ID."""
    if JointPatrol is None:
        raise HTTPException(status_code=503, detail="Joint patrol feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        
        jp = db.query(JointPatrol).filter(
            JointPatrol.id == patrol_id,
            JointPatrol.company_id == company_id,
        ).first()
        
        if not jp:
            raise HTTPException(status_code=404, detail="Joint patrol not found")
        
        return _enrich_joint_patrol(jp, db)
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        api_logger.error(f"Error getting joint patrol: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get joint patrol: {error_msg}")


@router.put("/joint/{patrol_id}", response_model=JointPatrolBase)
def update_joint_patrol(
    patrol_id: int,
    payload: JointPatrolUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Update joint patrol."""
    if JointPatrol is None:
        raise HTTPException(status_code=503, detail="Joint patrol feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        
        jp = db.query(JointPatrol).filter(
            JointPatrol.id == patrol_id,
            JointPatrol.company_id == company_id,
        ).first()
        
        if not jp:
            raise HTTPException(status_code=404, detail="Joint patrol not found")
        
        # Update fields
        update_data = payload.dict(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                # Serialize list fields to JSON strings
                if key in ['participant_ids', 'photos'] and isinstance(value, list):
                    setattr(jp, key, json.dumps(value) if value else None)
                else:
                    setattr(jp, key, value)
        
        db.commit()
        db.refresh(jp)
        
        api_logger.info(f"Updated joint patrol {jp.id}")
        return _enrich_joint_patrol(jp, db)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        api_logger.error(f"Error updating joint patrol: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update joint patrol: {error_msg}")


@router.delete("/joint/{patrol_id}", status_code=204)
def delete_joint_patrol(
    patrol_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Delete joint patrol."""
    if JointPatrol is None:
        raise HTTPException(status_code=503, detail="Joint patrol feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        
        jp = db.query(JointPatrol).filter(
            JointPatrol.id == patrol_id,
            JointPatrol.company_id == company_id,
        ).first()
        
        if not jp:
            raise HTTPException(status_code=404, detail="Joint patrol not found")
        
        db.delete(jp)
        db.commit()
        
        api_logger.info(f"Deleted joint patrol {patrol_id}")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        api_logger.error(f"Error deleting joint patrol: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete joint patrol: {error_msg}")


# ============================================
# Patrol Report Schemas and Endpoints
# ============================================

class PatrolReportBase(BaseModel):
    id: int
    site_id: int
    site_name: Optional[str] = None
    report_date: datetime
    shift: str
    officer_id: int
    officer_name: Optional[str] = None
    patrol_type: str
    area_covered: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    summary: Optional[str] = None
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    incidents: Optional[List[dict]] = None
    photos: Optional[List[str]] = None
    status: str
    created_by: int
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PatrolReportCreate(BaseModel):
    site_id: int
    report_date: datetime
    shift: str
    officer_id: int
    patrol_type: str
    area_covered: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    summary: Optional[str] = None
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    photos: Optional[List[str]] = None


class PatrolReportUpdate(BaseModel):
    area_covered: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    summary: Optional[str] = None
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    photos: Optional[List[str]] = None
    status: Optional[str] = None


def _enrich_patrol_report(pr, db: Session) -> PatrolReportBase:
    """Helper to enrich patrol report with names."""
    site = db.query(Site).filter(Site.id == pr.site_id).first()
    officer = db.query(User).filter(User.id == pr.officer_id).first()
    
    duration = None
    if pr.start_time and pr.end_time:
        duration = int((pr.end_time - pr.start_time).total_seconds() / 60)
    
    return PatrolReportBase(
        id=pr.id,
        site_id=pr.site_id,
        site_name=site.name if site else f"Site {pr.site_id}",
        report_date=pr.report_date,
        shift=pr.shift,
        officer_id=pr.officer_id,
        officer_name=officer.username if officer else f"User {pr.officer_id}",
        patrol_type=pr.patrol_type,
        area_covered=pr.area_covered,
        start_time=pr.start_time,
        end_time=pr.end_time,
        duration_minutes=duration or pr.duration_minutes,
        summary=pr.summary,
        findings=pr.findings,
        recommendations=pr.recommendations,
        incidents=pr.incidents if isinstance(pr.incidents, list) else None,
        photos=pr.photos if isinstance(pr.photos, list) else None,
        status=pr.status,
        created_by=pr.created_by,
        reviewed_by=pr.reviewed_by,
        reviewed_at=pr.reviewed_at,
        created_at=pr.created_at,
    )


@router.get("/reports", response_model=List[PatrolReportBase])
def list_patrol_reports(
    site_id: Optional[int] = Query(None),
    officer_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    patrol_type: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List patrol reports."""
    if PatrolReportModel is None:
        raise HTTPException(status_code=503, detail="Patrol report feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(PatrolReportModel).filter(PatrolReportModel.company_id == company_id)
        
        if site_id:
            q = q.filter(PatrolReportModel.site_id == site_id)
        if officer_id:
            q = q.filter(PatrolReportModel.officer_id == officer_id)
        if status:
            q = q.filter(PatrolReportModel.status == status.upper())
        if patrol_type:
            q = q.filter(PatrolReportModel.patrol_type == patrol_type.upper())
        if date_from:
            q = q.filter(PatrolReportModel.report_date >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            q = q.filter(PatrolReportModel.report_date <= datetime.combine(date_to, datetime.max.time()))
        
        reports = q.order_by(PatrolReportModel.report_date.desc()).limit(100).all()
        
        return [_enrich_patrol_report(r, db) for r in reports]
        
    except Exception as e:
        error_msg = str(e)
        api_logger.error(f"Error listing patrol reports: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list patrol reports: {error_msg}")


@router.post("/reports", response_model=PatrolReportBase, status_code=201)
def create_patrol_report(
    payload: PatrolReportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Create a new patrol report."""
    if PatrolReportModel is None:
        raise HTTPException(status_code=503, detail="Patrol report feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        # Calculate duration
        duration = None
        if payload.start_time and payload.end_time:
            duration = int((payload.end_time - payload.start_time).total_seconds() / 60)
        
        pr = PatrolReportModel(
            company_id=company_id,
            site_id=payload.site_id,
            report_date=payload.report_date,
            shift=payload.shift.upper(),
            officer_id=payload.officer_id,
            patrol_type=payload.patrol_type.upper(),
            area_covered=payload.area_covered,
            start_time=payload.start_time,
            end_time=payload.end_time,
            duration_minutes=duration,
            summary=payload.summary,
            findings=payload.findings,
            recommendations=payload.recommendations,
            photos=json.dumps(payload.photos) if payload.photos else None,
            status="DRAFT",
            created_by=user_id,
        )
        
        db.add(pr)
        db.commit()
        db.refresh(pr)
        
        api_logger.info(f"Created patrol report {pr.id} by user {user_id}")
        return _enrich_patrol_report(pr, db)
        
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        api_logger.error(f"Error creating patrol report: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create patrol report: {error_msg}")


@router.get("/reports/{report_id}", response_model=PatrolReportBase)
def get_patrol_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get patrol report by ID."""
    if PatrolReportModel is None:
        raise HTTPException(status_code=503, detail="Patrol report feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        
        pr = db.query(PatrolReportModel).filter(
            PatrolReportModel.id == report_id,
            PatrolReportModel.company_id == company_id,
        ).first()
        
        if not pr:
            raise HTTPException(status_code=404, detail="Patrol report not found")
        
        return _enrich_patrol_report(pr, db)
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        api_logger.error(f"Error getting patrol report: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get patrol report: {error_msg}")


@router.put("/reports/{report_id}", response_model=PatrolReportBase)
def update_patrol_report(
    report_id: int,
    payload: PatrolReportUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Update patrol report."""
    if PatrolReportModel is None:
        raise HTTPException(status_code=503, detail="Patrol report feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        
        pr = db.query(PatrolReportModel).filter(
            PatrolReportModel.id == report_id,
            PatrolReportModel.company_id == company_id,
        ).first()
        
        if not pr:
            raise HTTPException(status_code=404, detail="Patrol report not found")
        
        # Update fields
        update_data = payload.dict(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                # Serialize list fields to JSON strings
                if key in ['photos', 'incidents'] and isinstance(value, list):
                    setattr(pr, key, json.dumps(value))
                else:
                    setattr(pr, key, value)
        
        # Recalculate duration if times changed
        if pr.start_time and pr.end_time:
            pr.duration_minutes = int((pr.end_time - pr.start_time).total_seconds() / 60)
        
        db.commit()
        db.refresh(pr)
        
        api_logger.info(f"Updated patrol report {pr.id}")
        return _enrich_patrol_report(pr, db)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        api_logger.error(f"Error updating patrol report: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update patrol report: {error_msg}")


@router.delete("/reports/{report_id}", status_code=204)
def delete_patrol_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Delete patrol report."""
    if PatrolReportModel is None:
        raise HTTPException(status_code=503, detail="Patrol report feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        
        pr = db.query(PatrolReportModel).filter(
            PatrolReportModel.id == report_id,
            PatrolReportModel.company_id == company_id,
        ).first()
        
        if not pr:
            raise HTTPException(status_code=404, detail="Patrol report not found")
        
        db.delete(pr)
        db.commit()
        
        api_logger.info(f"Deleted patrol report {report_id}")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        api_logger.error(f"Error deleting patrol report: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete patrol report: {error_msg}")


@router.post("/reports/{report_id}/submit", response_model=PatrolReportBase)
def submit_patrol_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Submit patrol report for review."""
    if PatrolReportModel is None:
        raise HTTPException(status_code=503, detail="Patrol report feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        
        pr = db.query(PatrolReportModel).filter(
            PatrolReportModel.id == report_id,
            PatrolReportModel.company_id == company_id,
        ).first()
        
        if not pr:
            raise HTTPException(status_code=404, detail="Patrol report not found")
        
        if pr.status != "DRAFT":
            raise HTTPException(status_code=400, detail="Only draft reports can be submitted")
        
        pr.status = "SUBMITTED"
        db.commit()
        db.refresh(pr)
        
        return _enrich_patrol_report(pr, db)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        api_logger.error(f"Error submitting patrol report: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to submit patrol report: {error_msg}")


@router.post("/reports/{report_id}/approve", response_model=PatrolReportBase)
def approve_patrol_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Approve patrol report."""
    if PatrolReportModel is None:
        raise HTTPException(status_code=503, detail="Patrol report feature is not available")
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        pr = db.query(PatrolReportModel).filter(
            PatrolReportModel.id == report_id,
            PatrolReportModel.company_id == company_id,
        ).first()
        
        if not pr:
            raise HTTPException(status_code=404, detail="Patrol report not found")
        
        if pr.status not in ["SUBMITTED", "REVIEWED"]:
            raise HTTPException(status_code=400, detail="Only submitted reports can be approved")
        
        pr.status = "APPROVED"
        pr.reviewed_by = user_id
        pr.reviewed_at = datetime.utcnow()
        db.commit()
        db.refresh(pr)
        
        return _enrich_patrol_report(pr, db)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        api_logger.error(f"Error approving patrol report: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to approve patrol report: {error_msg}")

