# backend/app/api/v1/endpoints/training_participant.py

"""
Training Participant API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.training import TrainingAttendance, TrainingAttendanceStatus

router = APIRouter(prefix="/training/participants", tags=["training-participants"])


class TrainingParticipantOut(BaseModel):
    id: int
    training_id: int
    user_id: int
    registered_at: datetime
    attendance_status: str
    attended_at: Optional[datetime] = None
    score: Optional[int] = None
    passed: Optional[bool] = None
    completion_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class TrainingParticipantCreate(BaseModel):
    training_id: int
    user_id: int
    notes: Optional[str] = None


@router.post("", response_model=TrainingParticipantOut, status_code=status.HTTP_201_CREATED)
def enroll_participant(
    data: TrainingParticipantCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Enroll participant in training"""
    try:
        # Check if already enrolled
        existing = db.query(TrainingAttendance).filter(
            TrainingAttendance.training_id == data.training_id,
            TrainingAttendance.user_id == data.user_id,
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already enrolled in this training"
            )

        attendance = TrainingAttendance(
            training_id=data.training_id,
            user_id=data.user_id,
            attendance_status=TrainingAttendanceStatus.REGISTERED,
            notes=data.notes,
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        return attendance
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error enrolling participant: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "enroll_participant")


@router.get("", response_model=List[TrainingParticipantOut])
def list_training_participants(
    training_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    attendance_status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List training participants"""
    try:
        query = db.query(TrainingAttendance)
        
        if training_id:
            query = query.filter(TrainingAttendance.training_id == training_id)
        if user_id:
            query = query.filter(TrainingAttendance.user_id == user_id)
        if attendance_status:
            query = query.filter(TrainingAttendance.attendance_status == attendance_status)
        
        participants = query.order_by(TrainingAttendance.registered_at.desc()).offset(skip).limit(limit).all()
        return participants
    except Exception as e:
        api_logger.error(f"Error listing training participants: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_training_participants")


@router.get("/{participant_id}", response_model=TrainingParticipantOut)
def get_training_participant(
    participant_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get training participant by ID"""
    try:
        participant = db.query(TrainingAttendance).filter(
            TrainingAttendance.id == participant_id,
        ).first()
        
        if not participant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Training participant not found"
            )
        return participant
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting training participant: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_training_participant")

