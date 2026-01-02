# backend/app/api/v1/endpoints/training_plan.py

"""
Training Plan API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.training import Training, TrainingStatus

router = APIRouter(prefix="/training/plans", tags=["training-plans"])


class TrainingPlanOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    scheduled_date: datetime
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    instructor_name: Optional[str] = None
    max_participants: Optional[int] = None
    status: str
    division: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TrainingPlanCreate(BaseModel):
    site_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    scheduled_date: datetime
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    instructor_id: Optional[int] = None
    instructor_name: Optional[str] = None
    max_participants: Optional[int] = None
    division: Optional[str] = None
    notes: Optional[str] = None


@router.post("", response_model=TrainingPlanOut, status_code=status.HTTP_201_CREATED)
def create_training_plan(
    data: TrainingPlanCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create training plan"""
    try:
        company_id = current_user.get("company_id", 1)
        created_by = current_user.get("id")
        
        if not created_by:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        training = Training(
            company_id=company_id,
            site_id=data.site_id,
            title=data.title,
            description=data.description,
            category=data.category,
            scheduled_date=data.scheduled_date,
            duration_minutes=data.duration_minutes,
            location=data.location,
            instructor_id=data.instructor_id,
            instructor_name=data.instructor_name,
            max_participants=data.max_participants,
            division=data.division,
            notes=data.notes,
            status=TrainingStatus.SCHEDULED,
            created_by=created_by,
        )
        db.add(training)
        db.commit()
        db.refresh(training)
        return training
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating training plan: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_training_plan")


@router.get("", response_model=List[TrainingPlanOut])
def list_training_plans(
    site_id: Optional[int] = Query(None),
    scheduled_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List training plans"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(Training).filter(Training.company_id == company_id)
        
        if site_id:
            query = query.filter(Training.site_id == site_id)
        if scheduled_date:
            query = query.filter(Training.scheduled_date.date() == scheduled_date)
        if status:
            query = query.filter(Training.status == status)
        if division:
            query = query.filter(Training.division == division)
        
        plans = query.order_by(Training.scheduled_date.desc()).offset(skip).limit(limit).all()
        return plans
    except Exception as e:
        api_logger.error(f"Error listing training plans: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_training_plans")


@router.get("/{plan_id}", response_model=TrainingPlanOut)
def get_training_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get training plan by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        plan = db.query(Training).filter(
            Training.id == plan_id,
            Training.company_id == company_id,
        ).first()
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Training plan not found"
            )
        return plan
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting training plan: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_training_plan")

