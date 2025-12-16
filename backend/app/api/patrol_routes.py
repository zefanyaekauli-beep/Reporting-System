# backend/app/api/patrol_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_supervisor
from datetime import timedelta
from app.models.patrol_target import PatrolTarget
from app.models.patrol_team import PatrolTeam
from app.models.user import User
from app.models.site import Site
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

