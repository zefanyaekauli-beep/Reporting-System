# backend/app/api/v1/endpoints/kpi_training.py

"""
KPI Training API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.training import Training, TrainingAttendance, TrainingStatus, TrainingAttendanceStatus

router = APIRouter(prefix="/kpi/training", tags=["kpi-training"])


class KPITrainingStats(BaseModel):
    total_trainings: int
    completed_trainings: int
    total_participants: int
    attended_participants: int
    completion_rate: float
    attendance_rate: float
    pass_rate: float
    trends: dict


@router.get("", response_model=KPITrainingStats)
def get_training_kpi(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get Training KPI metrics"""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Training stats
        training_query = db.query(Training).filter(Training.company_id == company_id)
        if site_id:
            training_query = training_query.filter(Training.site_id == site_id)
        if from_date:
            training_query = training_query.filter(Training.scheduled_date >= func.date(from_date))
        if to_date:
            training_query = training_query.filter(Training.scheduled_date <= func.date(to_date))
        
        total_trainings = training_query.count()
        completed_trainings = training_query.filter(Training.status == TrainingStatus.COMPLETED).count()
        
        # Participant stats
        participant_query = db.query(TrainingAttendance)
        if from_date or to_date:
            # Join with training to filter by date
            participant_query = participant_query.join(Training).filter(Training.company_id == company_id)
            if from_date:
                participant_query = participant_query.filter(Training.scheduled_date >= func.date(from_date))
            if to_date:
                participant_query = participant_query.filter(Training.scheduled_date <= func.date(to_date))
        else:
            # Filter by company through training
            participant_query = participant_query.join(Training).filter(Training.company_id == company_id)
        
        if site_id:
            participant_query = participant_query.filter(Training.site_id == site_id)
        
        total_participants = participant_query.count()
        attended = participant_query.filter(TrainingAttendance.attendance_status == TrainingAttendanceStatus.ATTENDED).count()
        passed = participant_query.filter(TrainingAttendance.passed == True).count()
        
        completion_rate = (completed_trainings / total_trainings * 100) if total_trainings > 0 else 0.0
        attendance_rate = (attended / total_participants * 100) if total_participants > 0 else 0.0
        pass_rate = (passed / attended * 100) if attended > 0 else 0.0
        
        return KPITrainingStats(
            total_trainings=total_trainings,
            completed_trainings=completed_trainings,
            total_participants=total_participants,
            attended_participants=attended,
            completion_rate=completion_rate,
            attendance_rate=attendance_rate,
            pass_rate=pass_rate,
            trends={},
        )
    except Exception as e:
        api_logger.error(f"Error getting training KPI: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_training_kpi")

