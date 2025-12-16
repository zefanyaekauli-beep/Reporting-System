# backend/app/services/payroll_service.py

from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Dict
from app.models.attendance import Attendance
from app.models.shift import Shift, ShiftStatus
from app.services.shift_calculator import ShiftCalculator


class PayrollService:
    """Service for calculating payroll from attendance and shifts."""
    
    def calculate_payroll(
        self,
        db: Session,
        user_id: int,
        period_start: date,
        period_end: date,
    ) -> Dict:
        """
        Calculate payroll for a user in a period.
        Returns dict with all payroll components in cents.
        """
        # Get all attendance in period
        attendances = (
            db.query(Attendance)
            .filter(
                Attendance.user_id == user_id,
                Attendance.checkin_time.date() >= period_start,
                Attendance.checkin_time.date() <= period_end,
            )
            .all()
        )
        
        # Get all shifts in period
        shifts = (
            db.query(Shift)
            .filter(
                Shift.user_id == user_id,
                Shift.shift_date.date() >= period_start,
                Shift.shift_date.date() <= period_end,
            )
            .all()
        )
        
        # Calculate base salary (assume monthly, prorated)
        # This should come from employee contract
        base_monthly_salary = 5000000  # 5 million IDR in cents (50,000,000)
        days_in_period = (period_end - period_start).days + 1
        days_in_month = 30  # Simplified
        base_salary = int((base_monthly_salary / days_in_month) * days_in_period)
        
        # Calculate overtime
        total_overtime_hours = 0
        total_overtime_pay = 0
        
        for shift in shifts:
            if shift.scheduled_start_time and shift.scheduled_end_time:
                summary = ShiftCalculator.calculate_shift_summary(shift)
                overtime_hours = summary["overtime_hours"]
                if overtime_hours > 0:
                    total_overtime_hours += overtime_hours
                    # Overtime rate: 1.5x hourly rate
                    hourly_rate = base_monthly_salary / (30 * 8)  # Monthly / days / hours
                    overtime_pay = int(hourly_rate * 1.5 * overtime_hours)
                    total_overtime_pay += overtime_pay
        
        # Allowances (simplified - can be from employee contract)
        allowances = 0
        # Transport allowance: 50,000 per day
        transport_allowance = 50000 * len(attendances)
        allowances += transport_allowance
        
        # Meal allowance: 30,000 per day
        meal_allowance = 30000 * len(attendances)
        allowances += meal_allowance
        
        # Bonuses (can be calculated based on performance)
        bonuses = 0
        
        # Other earnings
        other_earnings = 0
        
        # Calculate totals
        total_gross = base_salary + total_overtime_pay + allowances + bonuses + other_earnings
        
        # Deductions
        # Tax: 5% of gross (simplified)
        tax = int(total_gross * 0.05)
        
        # Insurance: 2% of gross (simplified)
        insurance = int(total_gross * 0.02)
        
        # Loan deduction (can be from employee record)
        loan_deduction = 0
        
        # Other deductions
        other_deductions = 0
        
        total_deductions = tax + insurance + loan_deduction + other_deductions
        
        # Net pay
        net_pay = total_gross - total_deductions
        
        return {
            "base_salary": base_salary,
            "overtime_hours": int(total_overtime_hours),
            "overtime_pay": total_overtime_pay,
            "allowances": allowances,
            "bonuses": bonuses,
            "other_earnings": other_earnings,
            "tax": tax,
            "insurance": insurance,
            "loan_deduction": loan_deduction,
            "other_deductions": other_deductions,
            "total_gross": total_gross,
            "total_deductions": total_deductions,
            "net_pay": net_pay,
        }

