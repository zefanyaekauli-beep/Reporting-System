# backend/app/schemas/dashboard.py

from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ========== Dashboard Widget Schemas ==========

class AttendanceSummaryWidget(BaseModel):
    """Attendance Summary Widget Data"""
    total_on_duty: int
    total_late: int
    total_absent: int
    total_early_checkout: int
    
    class Config:
        from_attributes = True


class PatrolStatusWidget(BaseModel):
    """Patrol Status Widget Data"""
    routes_completed: int
    routes_in_progress: int
    routes_pending: int
    missed_checkpoints: int
    
    class Config:
        from_attributes = True


class IncidentSummaryWidget(BaseModel):
    """Incident Summary Widget Data"""
    open_incidents: int
    in_review: int
    closed_today: int
    critical_alerts: int
    
    class Config:
        from_attributes = True


class TaskCompletionWidget(BaseModel):
    """Task Completion Widget Data"""
    checklist_progress: float  # Percentage 0-100
    overdue_tasks: int
    completed_today: int
    total_tasks: int
    
    class Config:
        from_attributes = True


# ========== Dashboard Filters ==========

class DashboardFilters(BaseModel):
    """Dashboard filter parameters"""
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    site_ids: Optional[List[int]] = None
    division: Optional[str] = None  # SECURITY, CLEANING, DRIVER, PARKING
    shift: Optional[str] = None  # MORNING, AFTERNOON, NIGHT, or shift number
    
    class Config:
        from_attributes = True


# ========== Complete Dashboard Response ==========

class DashboardResponse(BaseModel):
    """Complete dashboard data with all widgets"""
    attendance_summary: AttendanceSummaryWidget
    patrol_status: PatrolStatusWidget
    incident_summary: IncidentSummaryWidget
    task_completion: TaskCompletionWidget
    filters: Optional[DashboardFilters] = None
    last_updated: datetime
    
    class Config:
        from_attributes = True

