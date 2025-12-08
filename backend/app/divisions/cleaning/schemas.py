# backend/app/divisions/cleaning/schemas.py

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel

# Cleaning Zone Schemas
class CleaningZoneBase(BaseModel):
    id: int
    site_id: int
    name: str
    floor: Optional[str] = None
    area_type: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class CleaningZoneCreate(BaseModel):
    site_id: int
    name: str
    floor: Optional[str] = None
    area_type: Optional[str] = None

class CleaningZoneTemplateBase(BaseModel):
    id: int
    zone_id: int
    checklist_template_id: int
    frequency_type: str
    frequency_detail: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class CleaningZoneTemplateCreate(BaseModel):
    zone_id: int
    checklist_template_id: int
    frequency_type: str
    frequency_detail: Optional[str] = None

# Cleaning Inspection Schemas
class CleaningInspectionBase(BaseModel):
    id: int
    zone_id: int
    inspector_id: int
    score: Optional[int] = None
    status: str
    notes: Optional[str] = None
    inspection_date: date

    class Config:
        from_attributes = True

class CleaningInspectionCreate(BaseModel):
    zone_id: int
    score: Optional[int] = None
    status: str = "pass"
    notes: Optional[str] = None
    inspection_date: Optional[date] = None

# Combined response with checklist info and KPI status
class CleaningZoneWithTasks(BaseModel):
    zone: CleaningZoneBase
    checklist: Optional[dict] = None  # Checklist instance if exists for today
    task_count: int = 0
    completed_count: int = 0
    status: str  # "CLEANED_ON_TIME", "LATE", "NOT_DONE", "PARTIAL"
    kpi_status: Optional[str] = None  # "OK", "WARN", "FAIL" based on KPI values
    last_cleaned_at: Optional[datetime] = None
    kpi_summary: Optional[dict] = None  # Summary of KPI values

    class Config:
        from_attributes = True

