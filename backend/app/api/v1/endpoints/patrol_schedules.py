# backend/app/api/v1/endpoints/patrol_schedules.py

"""
Patrol Schedule API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.schemas.patrol import (
    PatrolScheduleBase,
    PatrolScheduleCreate,
    PatrolScheduleUpdate,
)
from app.models.patrol_schedule import PatrolSchedule
from app.models.site import Site

router = APIRouter(prefix="/patrol/schedules", tags=["patrol-schedules"])


@router.post("", response_model=PatrolScheduleBase, status_code=status.HTTP_201_CREATED)
def create_patrol_schedule(
    data: PatrolScheduleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create a new patrol schedule"""
    try:
        company_id = current_user.get("company_id", 1)
        created_by = current_user.get("id")
        
        if not created_by:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        schedule = PatrolSchedule(
            company_id=company_id,
            site_id=data.site_id,
            route_id=data.route_id,
            scheduled_date=data.scheduled_date,
            scheduled_time=data.scheduled_time,
            frequency=data.frequency,
            recurrence_end_date=data.recurrence_end_date,
            notes=data.notes,
            created_by=created_by,
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return schedule
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating patrol schedule: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_patrol_schedule")


@router.get("", response_model=List[PatrolScheduleBase])
def list_patrol_schedules(
    site_id: Optional[int] = Query(None),
    route_id: Optional[int] = Query(None),
    scheduled_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List patrol schedules"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(PatrolSchedule).filter(PatrolSchedule.company_id == company_id)
        
        if site_id:
            query = query.filter(PatrolSchedule.site_id == site_id)
        if route_id:
            query = query.filter(PatrolSchedule.route_id == route_id)
        if scheduled_date:
            query = query.filter(PatrolSchedule.scheduled_date == scheduled_date)
        
        schedules = query.order_by(PatrolSchedule.scheduled_date.desc(), PatrolSchedule.scheduled_time).offset(skip).limit(limit).all()
        return schedules
    except Exception as e:
        api_logger.error(f"Error listing patrol schedules: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_patrol_schedules")


@router.get("/{schedule_id}", response_model=PatrolScheduleBase)
def get_patrol_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get patrol schedule by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        schedule = db.query(PatrolSchedule).filter(
            PatrolSchedule.id == schedule_id,
            PatrolSchedule.company_id == company_id,
        ).first()
        
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patrol schedule not found"
            )
        return schedule
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting patrol schedule: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_patrol_schedule")


@router.put("/{schedule_id}", response_model=PatrolScheduleBase)
def update_patrol_schedule(
    schedule_id: int,
    data: PatrolScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update patrol schedule"""
    try:
        company_id = current_user.get("company_id", 1)
        
        schedule = db.query(PatrolSchedule).filter(
            PatrolSchedule.id == schedule_id,
            PatrolSchedule.company_id == company_id,
        ).first()
        
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patrol schedule not found"
            )
        
        if data.scheduled_date is not None:
            schedule.scheduled_date = data.scheduled_date
        if data.scheduled_time is not None:
            schedule.scheduled_time = data.scheduled_time
        if data.frequency is not None:
            schedule.frequency = data.frequency
        if data.recurrence_end_date is not None:
            schedule.recurrence_end_date = data.recurrence_end_date
        if data.notes is not None:
            schedule.notes = data.notes
        if data.is_active is not None:
            schedule.is_active = data.is_active
        
        db.commit()
        db.refresh(schedule)
        return schedule
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating patrol schedule: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_patrol_schedule")


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patrol_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete patrol schedule"""
    try:
        company_id = current_user.get("company_id", 1)
        
        schedule = db.query(PatrolSchedule).filter(
            PatrolSchedule.id == schedule_id,
            PatrolSchedule.company_id == company_id,
        ).first()
        
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patrol schedule not found"
            )
        
        db.delete(schedule)
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error deleting patrol schedule: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_patrol_schedule")

