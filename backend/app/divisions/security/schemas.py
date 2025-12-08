# backend/app/divisions/security/schemas.py

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum

class SecurityAttendanceBase(BaseModel):
    company_id: int
    site_id: int
    shift_date: date

class SecurityAttendanceCreate(SecurityAttendanceBase):
    # for check-in, we'll get company_id/site_id from current_user or body
    pass

class SecurityAttendanceUpdate(BaseModel):
    check_out: bool = True
    location: Optional[str] = None

class SecurityAttendanceOut(BaseModel):
    id: int
    company_id: int
    site_id: int
    user_id: int
    shift_date: date
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    check_in_location: Optional[str]
    check_out_location: Optional[str]

    class Config:
        from_attributes = True

class SecurityReportBase(BaseModel):
    report_type: str  # "daily" | "incident" | "finding"
    site_id: int
    location_id: Optional[int] = None
    location_text: Optional[str] = None
    title: str
    description: Optional[str] = None
    severity: Optional[str] = None  # "low" | "medium" | "high"

class SecurityReportCreate(SecurityReportBase):
    pass  # files handled via multipart

class SecurityReportOut(BaseModel):
    id: int
    company_id: int
    site_id: int
    user_id: int
    report_type: str
    location_id: Optional[int]
    location_text: Optional[str]
    title: str
    description: Optional[str]
    severity: Optional[str]
    status: str
    evidence_paths: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class SecurityPatrolLogBase(BaseModel):
    site_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    area_text: Optional[str] = None
    notes: Optional[str] = None

class SecurityPatrolLogCreate(SecurityPatrolLogBase):
    pass

class SecurityPatrolLogOut(BaseModel):
    id: int
    company_id: int
    site_id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime]
    area_text: Optional[str]
    notes: Optional[str]
    main_photo_path: Optional[str]

    class Config:
        from_attributes = True

# ---- Checklist Schemas ----

class ChecklistItemStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    FAILED = "FAILED"

class ChecklistStatus(str, Enum):
    OPEN = "OPEN"
    COMPLETED = "COMPLETED"
    INCOMPLETE = "INCOMPLETE"

class ChecklistItemBase(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    required: bool
    evidence_type: str
    status: ChecklistItemStatus
    completed_at: Optional[datetime] = None
    note: Optional[str] = None
    evidence_id: Optional[str] = None

    class Config:
        from_attributes = True

class ChecklistBase(BaseModel):
    id: int
    shift_date: date
    shift_type: Optional[str]
    status: ChecklistStatus
    completed_at: Optional[datetime]
    notes: Optional[str] = None
    items: List[ChecklistItemBase]

    class Config:
        from_attributes = True

class ChecklistItemUpdate(BaseModel):
    status: ChecklistItemStatus = ChecklistItemStatus.COMPLETED
    note: Optional[str] = None
    evidence_id: Optional[str] = None
    # KPI fields for cleaning
    answer_bool: Optional[bool] = None
    answer_int: Optional[int] = None
    answer_text: Optional[str] = None
    photo_id: Optional[int] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    gps_accuracy: Optional[float] = None
    mock_location: Optional[bool] = None

class ChecklistSummary(BaseModel):
    id: int
    user_id: int
    user_name: str
    site_id: int
    site_name: str
    shift_date: date
    shift_type: Optional[str]
    status: ChecklistStatus
    completed_count: int
    total_required: int

    class Config:
        from_attributes = True

# Template schemas
class ChecklistTemplateItemOut(BaseModel):
    id: int
    template_id: int
    order: int
    title: str
    description: Optional[str]
    required: bool
    evidence_type: str

    class Config:
        from_attributes = True

class ChecklistTemplateOut(BaseModel):
    id: int
    company_id: int
    site_id: Optional[int]
    name: str
    role: Optional[str]
    shift_type: Optional[str]
    is_active: bool
    items: List[ChecklistTemplateItemOut] = []

    class Config:
        from_attributes = True

class ChecklistTemplateCreate(BaseModel):
    name: str
    site_id: Optional[int] = None
    role: Optional[str] = None
    shift_type: Optional[str] = None
    items: List[dict] = []  # [{title, description, required, evidence_type, order}]

# Legacy aliases for compatibility
ChecklistItemOut = ChecklistItemBase
ChecklistOut = ChecklistBase

# ---- Dispatch & Panic Schemas ----

class DispatchStatus(str, Enum):
    NEW = "NEW"
    ASSIGNED = "ASSIGNED"
    ONSCENE = "ONSCENE"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"

class DispatchTicketBase(BaseModel):
    id: int
    ticket_number: str
    site_id: int
    caller_name: Optional[str]
    caller_phone: Optional[str]
    incident_type: str
    priority: str
    description: str
    location: Optional[str]
    latitude: Optional[str]
    longitude: Optional[str]
    status: DispatchStatus
    assigned_to_user_id: Optional[int]
    assigned_at: Optional[datetime]
    onscene_at: Optional[datetime]
    closed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class DispatchTicketCreate(BaseModel):
    site_id: int
    caller_name: Optional[str] = None
    caller_phone: Optional[str] = None
    incident_type: str
    priority: str = "medium"
    description: str
    location: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None

class DispatchTicketUpdate(BaseModel):
    status: Optional[DispatchStatus] = None
    assigned_to_user_id: Optional[int] = None
    resolution_notes: Optional[str] = None

class PanicAlertBase(BaseModel):
    id: int
    site_id: int
    user_id: int
    alert_type: str
    latitude: str
    longitude: str
    location_text: Optional[str]
    message: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class PanicAlertCreate(BaseModel):
    site_id: int
    alert_type: str = "panic"
    latitude: str
    longitude: str
    location_text: Optional[str] = None
    message: Optional[str] = None

# ---- DAR & Passdown Schemas ----

class DailyActivityReportBase(BaseModel):
    id: int
    site_id: int
    shift_date: date
    shift_type: Optional[str]
    report_number: str
    summary_data: Optional[dict]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ShiftHandoverBase(BaseModel):
    id: int
    site_id: int
    shift_date: date
    from_shift_type: Optional[str]
    to_shift_type: Optional[str]
    from_user_id: int
    to_user_id: Optional[int]
    category: Optional[str]
    title: str
    description: str
    priority: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ShiftHandoverCreate(BaseModel):
    site_id: int
    shift_date: date
    to_shift_type: Optional[str] = None
    to_user_id: Optional[int] = None
    category: Optional[str] = None
    title: str
    description: str
    priority: str = "normal"

# ---- Tour Checkpoints & Routes Schemas ----

class PatrolCheckpointBase(BaseModel):
    id: int
    route_id: int
    order: int
    name: str
    description: Optional[str]
    location: Optional[str]
    latitude: Optional[str]
    longitude: Optional[str]
    nfc_code: Optional[str]
    qr_code: Optional[str]
    required: bool
    time_window_start: Optional[str]
    time_window_end: Optional[str]

    class Config:
        from_attributes = True

class PatrolRouteBase(BaseModel):
    id: int
    site_id: int
    name: str
    description: Optional[str]
    is_active: bool
    checkpoints: List[PatrolCheckpointBase] = []

    class Config:
        from_attributes = True

class PatrolCheckpointScanBase(BaseModel):
    id: int
    checkpoint_id: int
    scan_time: datetime
    scan_method: str
    is_valid: bool
    is_missed: bool
    latitude: Optional[str]
    longitude: Optional[str]

    class Config:
        from_attributes = True

class ScanCheckpointPayload(BaseModel):
    route_id: int
    checkpoint_id: int
    scan_code: str  # NFC or QR code
    scan_method: str  # "NFC" or "QR"
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    notes: Optional[str] = None

# ---- Post Orders Schemas ----

class PostOrderBase(BaseModel):
    id: int
    site_id: Optional[int]
    title: str
    content: str
    category: Optional[str]
    priority: str
    is_active: bool
    effective_date: Optional[date]
    expires_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True

class PostOrderAcknowledgmentBase(BaseModel):
    id: int
    post_order_id: int
    user_id: int
    acknowledged_at: datetime

    class Config:
        from_attributes = True

# ---- Shift Scheduling Schemas ----

class ShiftScheduleBase(BaseModel):
    id: int
    site_id: int
    user_id: int
    shift_date: date
    shift_type: str
    start_time: Optional[str]
    end_time: Optional[str]
    status: str
    confirmed_at: Optional[datetime]

    class Config:
        from_attributes = True

class ShiftScheduleCreate(BaseModel):
    site_id: int
    user_id: int
    shift_date: date
    shift_type: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None

class ShiftScheduleConfirm(BaseModel):
    confirmed: bool = True
    notes: Optional[str] = None

# ---- GPS & Idle Alert Schemas ----

class GuardLocationBase(BaseModel):
    id: int
    user_id: int
    latitude: str
    longitude: str
    timestamp: datetime

    class Config:
        from_attributes = True

class UpdateLocationPayload(BaseModel):
    site_id: int
    latitude: str
    longitude: str
    accuracy: Optional[str] = None
    heading: Optional[str] = None
    speed: Optional[str] = None

class IdleAlertBase(BaseModel):
    id: int
    user_id: int
    alert_type: str
    idle_duration_minutes: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ---- Shift Exchange Schemas ----

class ShiftExchangeBase(BaseModel):
    id: int
    site_id: int
    from_user_id: int
    to_user_id: Optional[int]
    from_shift_id: int
    to_shift_id: Optional[int]
    status: str
    request_message: Optional[str]
    response_message: Optional[str]
    requested_at: datetime
    requires_approval: bool
    approval_status: Optional[str]
    approved_by_user_id: Optional[int]
    approved_at: Optional[datetime]
    approval_notes: Optional[str]
    applied_at: Optional[datetime]

    class Config:
        from_attributes = True

class ShiftExchangeCreate(BaseModel):
    site_id: int
    from_shift_id: int
    to_shift_id: Optional[int] = None  # null = open request
    to_user_id: Optional[int] = None  # null = open request
    request_message: Optional[str] = None

class ShiftExchangeResponse(BaseModel):
    accept: bool = True
    response_message: Optional[str] = None

class ShiftExchangeApproval(BaseModel):
    approve: bool = True
    approval_notes: Optional[str] = None

