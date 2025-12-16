# backend/app/api/shift_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_supervisor
from app.models.shift import Shift, ShiftStatus
from app.services.shift_calculator import ShiftCalculator

router = APIRouter(prefix="/shifts", tags=["shifts"])


class ShiftCalculationResult(BaseModel):
    total_hours: float
    total_minutes: int
    overtime_hours: float
    overtime_minutes: int
    break_duration: int
    category: str
    overtime_rate: float
    regular_hours: float


@router.post("/calculate", response_model=ShiftCalculationResult)
def calculate_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Calculate shift hours and overtime for a shift."""
    try:
        company_id = current_user.get("company_id", 1)
        
        shift = (
            db.query(Shift)
            .filter(
                Shift.id == shift_id,
                Shift.company_id == company_id,
            )
            .first()
        )
        
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        
        # Calculate shift summary
        summary = ShiftCalculator.calculate_shift_summary(shift)
        
        # Update shift with calculated values
        shift.overtime_hours = summary["overtime_minutes"]
        shift.break_duration_minutes = summary["break_duration"]
        shift.shift_category = summary["category"]
        
        db.commit()
        db.refresh(shift)
        
        api_logger.info(f"Calculated shift {shift_id}: {summary['total_hours']}h total, {summary['overtime_hours']}h overtime")
        return ShiftCalculationResult(**summary)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error calculating shift: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate shift: {error_msg}"
        )


@router.get("/{shift_id}/overtime", response_model=dict)
def get_shift_overtime(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get overtime calculation for a shift."""
    try:
        company_id = current_user.get("company_id", 1)
        
        shift = (
            db.query(Shift)
            .filter(
                Shift.id == shift_id,
                Shift.company_id == company_id,
            )
            .first()
        )
        
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        
        summary = ShiftCalculator.calculate_shift_summary(shift)
        
        return {
            "shift_id": shift_id,
            "overtime_hours": summary["overtime_hours"],
            "overtime_minutes": summary["overtime_minutes"],
            "category": summary["category"],
            "overtime_rate": summary["overtime_rate"],
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting shift overtime: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get shift overtime: {error_msg}"
        )


@router.get("/user/{user_id}/summary")
def get_user_shift_summary(
    user_id: int,
    period_start: date = Query(...),
    period_end: date = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get shift summary for a user in a period."""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Verify user access
        if current_user.get("id") != user_id and current_user.get("role") not in ["SUPERVISOR", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Not authorized to view this user's shifts")
        
        shifts = (
            db.query(Shift)
            .filter(
                Shift.company_id == company_id,
                Shift.user_id == user_id,
                Shift.shift_date >= period_start,
                Shift.shift_date <= period_end,
            )
            .all()
        )
        
        total_hours = 0
        total_overtime = 0
        total_regular = 0
        
        for shift in shifts:
            summary = ShiftCalculator.calculate_shift_summary(shift)
            total_hours += summary["total_hours"]
            total_overtime += summary["overtime_hours"]
            total_regular += summary["regular_hours"]
        
        return {
            "user_id": user_id,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "total_shifts": len(shifts),
            "total_hours": round(total_hours, 2),
            "total_regular_hours": round(total_regular, 2),
            "total_overtime_hours": round(total_overtime, 2),
            "shifts": [
                {
                    "id": shift.id,
                    "shift_date": shift.shift_date.isoformat(),
                    "start_time": shift.start_time,
                    "end_time": shift.end_time,
                    "status": shift.status.value if hasattr(shift.status, 'value') else str(shift.status),
                    "summary": ShiftCalculator.calculate_shift_summary(shift),
                }
                for shift in shifts
            ],
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting user shift summary: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get user shift summary: {error_msg}"
        )

