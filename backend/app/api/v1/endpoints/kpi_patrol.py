# backend/app/api/v1/endpoints/kpi_patrol.py

"""
KPI Patrol API Endpoints
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
from app.models.patrol_schedule import PatrolAssignment, AssignmentStatus

router = APIRouter(prefix="/kpi/patrol", tags=["kpi-patrol"])


class KPIPatrolStats(BaseModel):
    total_assignments: int
    completed_assignments: int
    in_progress_assignments: int
    missed_assignments: int
    completion_rate: float
    average_duration_minutes: Optional[float] = None
    trends: dict


@router.get("", response_model=KPIPatrolStats)
def get_patrol_kpi(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get Patrol KPI metrics"""
    try:
        query = db.query(PatrolAssignment)
        
        if site_id:
            # Join with schedule to filter by site
            from app.models.patrol_schedule import PatrolSchedule
            query = query.join(PatrolSchedule).filter(PatrolSchedule.site_id == site_id)
        
        if from_date:
            query = query.filter(PatrolAssignment.assigned_at >= func.date(from_date))
        if to_date:
            query = query.filter(PatrolAssignment.assigned_at <= func.date(to_date))
        
        total = query.count()
        completed = query.filter(PatrolAssignment.status == AssignmentStatus.COMPLETED.value).count()
        in_progress = query.filter(PatrolAssignment.status == AssignmentStatus.IN_PROGRESS.value).count()
        missed = query.filter(PatrolAssignment.status == AssignmentStatus.MISSED.value).count()
        
        completion_rate = (completed / total * 100) if total > 0 else 0.0
        
        return KPIPatrolStats(
            total_assignments=total,
            completed_assignments=completed,
            in_progress_assignments=in_progress,
            missed_assignments=missed,
            completion_rate=completion_rate,
            average_duration_minutes=None,  # TODO: Calculate from start/complete times
            trends={},
        )
    except Exception as e:
        api_logger.error(f"Error getting patrol KPI: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_patrol_kpi")

