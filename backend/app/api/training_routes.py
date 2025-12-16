# backend/app/api/training_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_supervisor
from app.models.training import Training, TrainingAttendance, DevelopmentPlan
from app.models.training import TrainingStatus, TrainingAttendanceStatus
from app.models.user import User
from app.models.site import Site

router = APIRouter(prefix="/training", tags=["training"])


class TrainingBase(BaseModel):
    id: int
    company_id: int
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
    status: str
    division: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TrainingCreate(BaseModel):
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
    min_participants: int = 1
    division: Optional[str] = None
    notes: Optional[str] = None


@router.get("", response_model=List[TrainingBase])
def list_trainings(
    site_id: Optional[int] = Query(None),
    division: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List trainings."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(Training).filter(Training.company_id == company_id)
        
        if site_id:
            q = q.filter(Training.site_id == site_id)
        if division:
            q = q.filter(Training.division == division.upper())
        if status:
            q = q.filter(Training.status == TrainingStatus[status.upper()])
        
        trainings = q.order_by(Training.scheduled_date.desc()).limit(100).all()
        
        result = []
        for training in trainings:
            result.append(TrainingBase(
                id=training.id,
                company_id=training.company_id,
                site_id=training.site_id,
                title=training.title,
                description=training.description,
                category=training.category,
                scheduled_date=training.scheduled_date,
                duration_minutes=training.duration_minutes,
                location=training.location,
                instructor_id=training.instructor_id,
                instructor_name=training.instructor_name,
                max_participants=training.max_participants,
                status=training.status.value if hasattr(training.status, 'value') else str(training.status),
                division=training.division,
                created_at=training.created_at,
            ))
        
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing trainings: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list trainings: {error_msg}"
        )


@router.post("", response_model=TrainingBase, status_code=201)
def create_training(
    payload: TrainingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Create training (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        training = Training(
            company_id=company_id,
            site_id=payload.site_id,
            title=payload.title,
            description=payload.description,
            category=payload.category,
            scheduled_date=payload.scheduled_date,
            duration_minutes=payload.duration_minutes,
            location=payload.location,
            instructor_id=payload.instructor_id,
            instructor_name=payload.instructor_name,
            max_participants=payload.max_participants,
            min_participants=payload.min_participants,
            status=TrainingStatus.SCHEDULED,
            division=payload.division.upper() if payload.division else None,
            notes=payload.notes,
            created_by=user_id,
        )
        
        db.add(training)
        db.commit()
        db.refresh(training)
        
        api_logger.info(f"Created training {training.id} by user {user_id}")
        return TrainingBase(
            id=training.id,
            company_id=training.company_id,
            site_id=training.site_id,
            title=training.title,
            description=training.description,
            category=training.category,
            scheduled_date=training.scheduled_date,
            duration_minutes=training.duration_minutes,
            location=training.location,
            instructor_id=training.instructor_id,
            instructor_name=training.instructor_name,
            max_participants=training.max_participants,
            status=training.status.value if hasattr(training.status, 'value') else str(training.status),
            division=training.division,
            created_at=training.created_at,
        )
        
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error creating training: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create training: {error_msg}"
        )


@router.post("/{training_id}/register", status_code=201)
def register_training(
    training_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Register current user for training."""
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        training = (
            db.query(Training)
            .filter(
                Training.id == training_id,
                Training.company_id == company_id,
            )
            .first()
        )
        
        if not training:
            raise HTTPException(status_code=404, detail="Training not found")
        
        # Check if already registered
        existing = (
            db.query(TrainingAttendance)
            .filter(
                TrainingAttendance.training_id == training_id,
                TrainingAttendance.user_id == user_id,
            )
            .first()
        )
        
        if existing:
            raise HTTPException(status_code=400, detail="Already registered for this training")
        
        # Check capacity
        if training.max_participants:
            registered_count = (
                db.query(TrainingAttendance)
                .filter(TrainingAttendance.training_id == training_id)
                .count()
            )
            if registered_count >= training.max_participants:
                raise HTTPException(status_code=400, detail="Training is full")
        
        attendance = TrainingAttendance(
            training_id=training_id,
            user_id=user_id,
            attendance_status=TrainingAttendanceStatus.REGISTERED,
        )
        
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
        api_logger.info(f"User {user_id} registered for training {training_id}")
        return {"message": "Registered successfully", "attendance_id": attendance.id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error registering for training: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to register for training: {error_msg}"
        )


@router.get("/{training_id}/attendance", response_model=List[dict])
def get_training_attendance(
    training_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get training attendance list."""
    try:
        company_id = current_user.get("company_id", 1)
        
        training = (
            db.query(Training)
            .filter(
                Training.id == training_id,
                Training.company_id == company_id,
            )
            .first()
        )
        
        if not training:
            raise HTTPException(status_code=404, detail="Training not found")
        
        attendances = (
            db.query(TrainingAttendance)
            .filter(TrainingAttendance.training_id == training_id)
            .all()
        )
        
        result = []
        for att in attendances:
            user = db.query(User).filter(User.id == att.user_id).first()
            result.append({
                "id": att.id,
                "user_id": att.user_id,
                "user_name": user.username if user else f"User {att.user_id}",
                "attendance_status": att.attendance_status.value if hasattr(att.attendance_status, 'value') else str(att.attendance_status),
                "attended_at": att.attended_at.isoformat() if att.attended_at else None,
                "score": att.score,
                "passed": att.passed,
                "registered_at": att.registered_at.isoformat(),
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting training attendance: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get training attendance: {error_msg}"
        )

