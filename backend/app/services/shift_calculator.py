# backend/app/services/shift_calculator.py

from datetime import datetime, timedelta
from typing import Optional, Tuple
from app.models.shift import Shift, ShiftStatus


class ShiftCalculator:
    """Service for calculating shift hours, overtime, and break time."""
    
    @staticmethod
    def calculate_shift_hours(
        scheduled_start: datetime,
        scheduled_end: datetime,
        actual_start: Optional[datetime] = None,
        actual_end: Optional[datetime] = None,
    ) -> Tuple[int, int, int]:
        """
        Calculate shift hours, overtime, and break duration.
        
        Returns:
            (total_hours_minutes, overtime_hours_minutes, break_duration_minutes)
        """
        if not actual_start or not actual_end:
            # If no actual times, use scheduled times
            if actual_start:
                actual_end = scheduled_end
            elif actual_end:
                actual_start = scheduled_start
            else:
                # No actual times, return scheduled duration
                duration = scheduled_end - scheduled_start
                total_minutes = int(duration.total_seconds() / 60)
                return total_minutes, 0, 0
        
        # Calculate actual duration
        actual_duration = actual_end - actual_start
        total_minutes = int(actual_duration.total_seconds() / 60)
        
        # Calculate scheduled duration
        scheduled_duration = scheduled_end - scheduled_start
        scheduled_minutes = int(scheduled_duration.total_seconds() / 60)
        
        # Calculate overtime (actual > scheduled)
        overtime_minutes = max(0, total_minutes - scheduled_minutes)
        
        # Break time calculation (simplified - assume 1 hour break for 8+ hour shifts)
        break_minutes = 0
        if scheduled_minutes >= 480:  # 8 hours
            break_minutes = 60  # 1 hour break
        elif scheduled_minutes >= 360:  # 6 hours
            break_minutes = 30  # 30 minutes break
        
        return total_minutes, overtime_minutes, break_minutes
    
    @staticmethod
    def detect_shift_category(
        shift_date: datetime,
        scheduled_start: datetime,
        scheduled_end: datetime,
    ) -> str:
        """
        Detect shift category: REGULAR, OVERTIME, HOLIDAY, WEEKEND
        """
        # Check if weekend (Saturday=5, Sunday=6)
        if shift_date.weekday() >= 5:
            return "WEEKEND"
        
        # Check if holiday (simplified - can be enhanced with holiday calendar)
        # For now, assume no holidays
        
        # Check if scheduled duration exceeds regular hours (8 hours)
        duration = scheduled_end - scheduled_start
        hours = duration.total_seconds() / 3600
        
        if hours > 8:
            return "OVERTIME"
        
        return "REGULAR"
    
    @staticmethod
    def calculate_overtime_rate(
        shift_category: str,
        base_rate: int,
    ) -> float:
        """
        Calculate overtime rate multiplier.
        Returns multiplier (e.g., 1.5 for 1.5x pay)
        """
        if shift_category == "WEEKEND":
            return 2.0  # 2x pay for weekend
        elif shift_category == "HOLIDAY":
            return 2.5  # 2.5x pay for holiday
        elif shift_category == "OVERTIME":
            return 1.5  # 1.5x pay for overtime
        else:
            return 1.0  # Regular pay
    
    @staticmethod
    def calculate_shift_summary(shift: Shift) -> dict:
        """
        Calculate comprehensive shift summary.
        """
        if not shift.scheduled_start_time or not shift.scheduled_end_time:
            return {
                "total_hours": 0,
                "overtime_hours": 0,
                "break_duration": 0,
                "category": "REGULAR",
                "overtime_rate": 1.0,
            }
        
        total_minutes, overtime_minutes, break_minutes = ShiftCalculator.calculate_shift_hours(
            shift.scheduled_start_time,
            shift.scheduled_end_time,
            shift.actual_start_time,
            shift.actual_end_time,
        )
        
        category = ShiftCalculator.detect_shift_category(
            shift.shift_date,
            shift.scheduled_start_time,
            shift.scheduled_end_time,
        )
        
        # Assume base hourly rate of 10000 (can be from employee contract)
        base_hourly_rate = 10000
        overtime_rate = ShiftCalculator.calculate_overtime_rate(category, base_hourly_rate)
        
        return {
            "total_hours": round(total_minutes / 60, 2),
            "total_minutes": total_minutes,
            "overtime_hours": round(overtime_minutes / 60, 2),
            "overtime_minutes": overtime_minutes,
            "break_duration": break_minutes,
            "category": category,
            "overtime_rate": overtime_rate,
            "regular_hours": round((total_minutes - overtime_minutes) / 60, 2),
        }

