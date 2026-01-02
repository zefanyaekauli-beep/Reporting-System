# backend/app/schemas/dar.py

"""
Daily Activity Report (DAR) Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, time, datetime


# Activity Schemas
class DARActivityBase(BaseModel):
    activity_time: time
    activity_type: str
    description: str
    location: Optional[str] = None
    photo_url: Optional[str] = None


class DARActivityCreate(DARActivityBase):
    pass


class DARActivityOut(DARActivityBase):
    id: int
    dar_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Personnel Schemas
class DARPersonnelBase(BaseModel):
    user_id: int
    role: Optional[str] = None
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None


class DARPersonnelCreate(DARPersonnelBase):
    pass


class DARPersonnelOut(DARPersonnelBase):
    id: int
    dar_id: int

    class Config:
        from_attributes = True


# DAR Schemas
class DailyActivityReportBase(BaseModel):
    id: int
    site_id: int
    report_date: date
    shift: str
    weather: Optional[str] = None
    summary: Optional[str] = None
    handover_notes: Optional[str] = None
    status: str
    created_by: int
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DailyActivityReportCreate(BaseModel):
    site_id: int
    report_date: date
    shift: str = Field(..., description="MORNING, AFTERNOON, or NIGHT")
    weather: Optional[str] = None
    summary: Optional[str] = None
    handover_notes: Optional[str] = None
    personnel: List[DARPersonnelCreate] = []
    activities: List[DARActivityCreate] = []


class DailyActivityReportUpdate(BaseModel):
    weather: Optional[str] = None
    summary: Optional[str] = None
    handover_notes: Optional[str] = None
    personnel: Optional[List[DARPersonnelCreate]] = None
    activities: Optional[List[DARActivityCreate]] = None


class DailyActivityReportOut(DailyActivityReportBase):
    personnel: List[DARPersonnelOut] = []
    activities: List[DARActivityOut] = []

    class Config:
        from_attributes = True


class DailyActivityReportList(BaseModel):
    id: int
    site_id: int
    site_name: Optional[str] = None
    report_date: date
    shift: str
    status: str
    created_by: int
    created_by_name: Optional[str] = None
    created_at: datetime
    activities_count: int = 0
    personnel_count: int = 0

    class Config:
        from_attributes = True

