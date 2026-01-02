# backend/app/schemas/patrol.py

"""
Patrol Management Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, time, datetime


# Schedule Schemas
class PatrolScheduleBase(BaseModel):
    id: int
    site_id: int
    route_id: int
    scheduled_date: date
    scheduled_time: time
    frequency: str
    recurrence_end_date: Optional[date] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PatrolScheduleCreate(BaseModel):
    site_id: int
    route_id: int
    scheduled_date: date
    scheduled_time: time
    frequency: str = Field(default="ONCE", description="ONCE, DAILY, WEEKLY")
    recurrence_end_date: Optional[date] = None
    notes: Optional[str] = None


class PatrolScheduleUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    frequency: Optional[str] = None
    recurrence_end_date: Optional[date] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


# Assignment Schemas
class PatrolAssignmentBase(BaseModel):
    id: int
    schedule_id: int
    user_id: int
    is_lead: bool
    status: str
    assigned_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PatrolAssignmentCreate(BaseModel):
    schedule_id: int
    user_id: int
    is_lead: bool = False
    notes: Optional[str] = None


# Log Schemas
class PatrolLogBase(BaseModel):
    id: int
    assignment_id: int
    checkpoint_id: Optional[int] = None
    scanned_at: datetime
    gps_lat: Optional[str] = None
    gps_lng: Optional[str] = None
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class PatrolLogCreate(BaseModel):
    assignment_id: int
    checkpoint_id: Optional[int] = None
    scan_code: Optional[str] = None
    gps_lat: Optional[str] = None
    gps_lng: Optional[str] = None
    status: str = "OK"
    notes: Optional[str] = None


# Report Schemas
class PatrolReportBase(BaseModel):
    id: int
    assignment_id: int
    total_checkpoints: int
    completed_checkpoints: int
    missed_checkpoints: int
    total_duration_minutes: Optional[int] = None
    issues_found: int
    summary: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

