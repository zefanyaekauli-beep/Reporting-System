from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

# Enums
class ReportType(str, Enum):
    DAILY_SUMMARY = "daily_summary"
    INCIDENT = "incident"
    FINDING = "finding"

class ReportStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class PatrolStatus(str, Enum):
    COMPLETED = "completed"
    PARTIAL = "partial"
    ABORTED = "aborted"

class RequestType(str, Enum):
    PERMISSION = "permission"
    LEAVE = "leave"
    SICK = "sick"
    OTHER = "other"

class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# Attendance Schemas
class AttendanceBase(BaseModel):
    site_id: Optional[int] = None
    check_in_location: Optional[str] = None
    check_out_location: Optional[str] = None

class AttendanceCheckIn(AttendanceBase):
    check_in_photo_url: Optional[str] = None
    device_info: Optional[str] = None

class AttendanceCheckOut(AttendanceBase):
    check_out_photo_url: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    company_id: int
    site_id: Optional[int]
    shift_date: date
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    check_in_location: Optional[str]
    check_out_location: Optional[str]
    check_in_photo_url: Optional[str]
    check_out_photo_url: Optional[str]
    
    class Config:
        from_attributes = True

# Location Schemas
class SecurityLocationBase(BaseModel):
    name: str
    type: Optional[str] = None
    active: bool = True

class SecurityLocationCreate(SecurityLocationBase):
    site_id: int

class SecurityLocationResponse(SecurityLocationBase):
    id: int
    company_id: int
    site_id: int
    
    class Config:
        from_attributes = True

# Report Schemas
class SecurityReportBase(BaseModel):
    site_id: int
    location_id: Optional[int] = None
    location_text: Optional[str] = None
    report_type: ReportType
    title: str
    description: Optional[str] = None
    severity: Optional[Severity] = None
    attachments: Optional[List[str]] = None  # List of photo URLs

class SecurityReportCreate(SecurityReportBase):
    pass

class SecurityReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    description: Optional[str] = None
    severity: Optional[Severity] = None

class SecurityReportResponse(SecurityReportBase):
    id: int
    company_id: int
    created_by: int
    status: ReportStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Patrol Schemas
class PatrolLogBase(BaseModel):
    site_id: int
    area_covered: Optional[str] = None
    notes: Optional[str] = None
    photos: Optional[List[str]] = None

class PatrolLogCreate(PatrolLogBase):
    start_time: datetime
    end_time: Optional[datetime] = None
    status: PatrolStatus = PatrolStatus.PARTIAL

class PatrolLogUpdate(BaseModel):
    end_time: Optional[datetime] = None
    status: Optional[PatrolStatus] = None
    area_covered: Optional[str] = None
    notes: Optional[str] = None

class PatrolLogResponse(PatrolLogBase):
    id: int
    user_id: int
    company_id: int
    site_id: int
    start_time: datetime
    end_time: Optional[datetime]
    status: PatrolStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

# Visitor Log Schemas
class VisitorLogBase(BaseModel):
    site_id: int
    visit_date: date
    visitor_name: str
    nik: Optional[str] = None
    vehicle_plate: Optional[str] = None
    purpose: str
    notes: Optional[str] = None

class VisitorLogCreate(VisitorLogBase):
    time_in: datetime
    time_out: Optional[datetime] = None

class VisitorLogUpdate(BaseModel):
    time_out: Optional[datetime] = None
    notes: Optional[str] = None

class VisitorLogResponse(VisitorLogBase):
    id: int
    company_id: int
    recorded_by: int
    time_in: datetime
    time_out: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Asset Schemas
class AssetBase(BaseModel):
    site_id: int
    location_id: Optional[int] = None
    asset_code: str
    name: str
    serial_number: Optional[str] = None
    tag_number: Optional[str] = None
    next_inspection_due: Optional[date] = None

class AssetCreate(AssetBase):
    pass

class AssetResponse(AssetBase):
    id: int
    company_id: int
    active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class AssetInspectionBase(BaseModel):
    asset_id: int
    inspection_date: datetime
    condition: str  # OK / Not OK / Needs Maintenance
    pressure_ok: Optional[bool] = None
    seal_intact: Optional[bool] = None
    label_visible: Optional[bool] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class AssetInspectionCreate(AssetInspectionBase):
    pass

class AssetInspectionResponse(AssetInspectionBase):
    id: int
    inspected_by: int
    company_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Leave Request Schemas
class LeaveRequestBase(BaseModel):
    site_id: Optional[int] = None
    request_type: RequestType
    start_date: date
    end_date: date
    reason: str

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestUpdate(BaseModel):
    status: Optional[RequestStatus] = None
    rejection_reason: Optional[str] = None

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    user_id: int
    company_id: int
    site_id: Optional[int]
    status: RequestStatus
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

