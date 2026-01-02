# backend/app/divisions/security/models.py

from datetime import datetime, date
from typing import Optional
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    ForeignKey,
    Text,
    Boolean,
    Enum,
    JSON,
    Float,
)
from sqlalchemy.orm import relationship
from app.models.base import Base

class ChecklistStatus(str, enum.Enum):
    OPEN = "OPEN"
    COMPLETED = "COMPLETED"
    INCOMPLETE = "INCOMPLETE"

class ChecklistItemStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    FAILED = "FAILED"

class SecurityAttendance(Base):
    __tablename__ = "security_attendance"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    shift_date = Column(Date, nullable=False)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    check_in_location = Column(String(255), nullable=True)
    check_out_location = Column(String(255), nullable=True)
    check_in_photo_path = Column(String(512), nullable=True)
    check_out_photo_path = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

class SecurityReport(Base):
    """
    Unified report model for all divisions (SECURITY, CLEANING, DRIVER).
    This is a SHARED module - same table, same workflow for all divisions.
    Division is stored in division field to filter reports by division.
    """
    __tablename__ = "security_reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    
    # Division field: 'SECURITY', 'CLEANING', 'DRIVER', 'PARKING'
    # This field makes the report system truly unified across all divisions
    division = Column(String(32), nullable=False, index=True, default="SECURITY")  # Division: 'SECURITY', 'CLEANING', 'DRIVER'
    
    report_type = Column(String(32), nullable=False)  # "daily", "incident", "finding", "CLEANING_ISSUE", "VEHICLE_UNSAFE", "TRIP_ISSUE", "ACCIDENT", "CHECKLIST_NON_COMPLIANCE", "DAR"
    location_id = Column(Integer, nullable=True)
    location_text = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(16), nullable=True)  # "low", "medium", "high"
    status = Column(String(32), default="open", nullable=False)
    
    # Enhanced incident fields
    incident_category = Column(String(64), nullable=True, index=True)  # "THEFT", "VANDALISM", "ACCIDENT", etc.
    incident_level = Column(String(32), nullable=True, index=True)  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    incident_severity_score = Column(Integer, nullable=True)  # 1-10 severity score
    incident_details = Column(Text, nullable=True)  # JSON or text for additional details
    
    # Perpetrator tracking
    perpetrator_name = Column(String(255), nullable=True)
    perpetrator_type = Column(String(32), nullable=True)  # "INTERNAL", "EXTERNAL", "UNKNOWN"
    perpetrator_details = Column(Text, nullable=True)  # JSON for additional perpetrator info
    
    # Report entry timestamp
    reported_at = Column(DateTime, nullable=True, index=True)  # When report was actually created/submitted
    # Simple: store file paths as comma-separated or JSON in future
    evidence_paths = Column(Text, nullable=True)
    # Context fields for multi-role support
    zone_id = Column(Integer, nullable=True, index=True)  # For cleaning issues
    vehicle_id = Column(Integer, nullable=True, index=True)  # For vehicle-related incidents
    trip_id = Column(Integer, nullable=True, index=True)  # For trip-related incidents
    checklist_id = Column(Integer, nullable=True, index=True)  # For checklist non-compliance
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

class SecurityPatrolLog(Base):
    """
    Simple patrol log (MVP, no route/checkpoint decomposition).
    One record = one patrol session.
    """
    __tablename__ = "security_patrol_logs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    area_text = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    # Optional: one main photo evidence (or you do another table for many photos)
    main_photo_path = Column(String(512), nullable=True)
    
    # Enhanced patrol fields
    patrol_type = Column(String(32), nullable=True)  # "FOOT", "VEHICLE", "MIXED"
    distance_covered = Column(Float, nullable=True)  # Distance in meters (for foot patrol)
    steps_count = Column(Integer, nullable=True)  # Step count (optional)
    route_id = Column(Integer, ForeignKey("patrol_routes.id"), nullable=True, index=True)
    team_id = Column(Integer, ForeignKey("patrol_teams.id"), nullable=True, index=True)
    
    # GPS tracking
    gps_track_id = Column(Integer, nullable=True)  # Reference to GPS track data
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

# ---- Checklist System ----

class ChecklistTemplate(Base):
    """
    Shared checklist template for all divisions (SECURITY, CLEANING, DRIVER).
    This is a SHARED module - same table, same logic for all divisions.
    Division is stored in division field to filter templates by division.
    Templates are differentiated by context_type (SECURITY_PATROL, CLEANING_ZONE, DRIVER_PRE_TRIP, etc.)
    """
    __tablename__ = "checklist_templates"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)  # null = global template
    
    # Division field: 'SECURITY', 'CLEANING', 'DRIVER', 'PARKING'
    # This field makes the checklist system truly unified across all divisions
    division = Column(String(32), nullable=False, index=True, default="SECURITY")  # Division: 'SECURITY', 'CLEANING', 'DRIVER'
    
    name = Column(String(255), nullable=False)
    role = Column(String(64), nullable=True)  # "guard", "supervisor", "cleaner", "driver", etc.
    shift_type = Column(String(32), nullable=True)  # "MORNING", "NIGHT", "DAY", null = all shifts
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationship
    items = relationship("ChecklistTemplateItem", back_populates="template", cascade="all, delete-orphan", order_by="ChecklistTemplateItem.order")

class ChecklistTemplateItem(Base):
    """
    Individual task/item in a checklist template.
    Extended for cleaning KPI support.
    """
    __tablename__ = "checklist_template_items"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("checklist_templates.id"), nullable=False, index=True)
    order = Column(Integer, nullable=False, default=0)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    required = Column(Boolean, default=True, nullable=False)
    evidence_type = Column(String(32), default="none", nullable=False)  # "none", "photo", "note", "patrol_log", "asset_scan"
    auto_complete_rule = Column(JSON, nullable=True)  # JSON for optional logic config
    # KPI fields for cleaning
    kpi_key = Column(String(64), nullable=True, index=True)  # 'TOILET_CLEAN', 'TISSUE_STOCK', etc.
    answer_type = Column(String(16), nullable=True)  # 'BOOLEAN', 'CHOICE', 'SCORE', 'TEXT'
    photo_required = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    template = relationship("ChecklistTemplate", back_populates="items")

class Checklist(Base):
    """
    Shared checklist instance for all divisions (SECURITY, CLEANING, DRIVER).
    This is a SHARED module - same table, same logic for all divisions.
    Auto-created when person checks in or scans QR code.
    Division is stored in division field, context_type differentiates usage.
    """
    __tablename__ = "checklists"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    attendance_id = Column(Integer, ForeignKey("security_attendance.id"), nullable=True, index=True)
    template_id = Column(Integer, ForeignKey("checklist_templates.id"), nullable=True, index=True)
    
    # Division field: 'SECURITY', 'CLEANING', 'DRIVER', 'PARKING'
    # This field makes the checklist system truly unified across all divisions
    division = Column(String(32), nullable=False, index=True, default="SECURITY")  # Division: 'SECURITY', 'CLEANING', 'DRIVER'
    
    shift_date = Column(Date, nullable=False, index=True)
    shift_type = Column(String(32), nullable=True)
    status = Column(Enum(ChecklistStatus), default=ChecklistStatus.OPEN, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    # Context fields for multi-role support
    # context_type: "SECURITY_SHIFT", "CLEANING_ZONE", "DRIVER_PRE_TRIP", "DRIVER_POST_TRIP"
    context_type = Column(String(32), nullable=True, index=True)
    context_id = Column(Integer, nullable=True, index=True)  # ID of zone, trip, etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    items = relationship("ChecklistItem", back_populates="checklist", cascade="all, delete-orphan", order_by="ChecklistItem.order")
    attendance = relationship("SecurityAttendance", foreign_keys=[attendance_id])

class ChecklistItem(Base):
    """
    Individual task/item in a checklist instance.
    Copied from template, tracked for that user, that date, that shift.
    Extended for cleaning KPI answers.
    """
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id"), nullable=False, index=True)
    template_item_id = Column(Integer, ForeignKey("checklist_template_items.id"), nullable=True, index=True)
    order = Column(Integer, nullable=False, default=0)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    required = Column(Boolean, default=True, nullable=False)
    evidence_type = Column(String(32), default="none", nullable=False)
    status = Column(Enum(ChecklistItemStatus), default=ChecklistItemStatus.PENDING, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    evidence_id = Column(String(512), nullable=True)  # link to file/photo/etc.
    note = Column(Text, nullable=True)
    # KPI answer fields for cleaning
    kpi_key = Column(String(64), nullable=True, index=True)
    answer_type = Column(String(16), nullable=True)
    answer_bool = Column(Boolean, nullable=True)
    answer_int = Column(Integer, nullable=True)
    answer_text = Column(Text, nullable=True)
    photo_id = Column(Integer, nullable=True)  # Link to files table if implemented
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    gps_accuracy = Column(Float, nullable=True)
    mock_location = Column(Boolean, default=False, nullable=False)  # Anti-fake GPS flag
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationship
    checklist = relationship("Checklist", back_populates="items")

# ---- Dispatch & Panic System ----

class DispatchStatus(str, enum.Enum):
    NEW = "NEW"
    ASSIGNED = "ASSIGNED"
    ONSCENE = "ONSCENE"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"

class DispatchTicket(Base):
    """
    Dispatch ticket for incoming calls/incidents.
    Tracks assignment and status through workflow.
    """
    __tablename__ = "dispatch_tickets"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    ticket_number = Column(String(32), unique=True, nullable=False, index=True)  # e.g., "DISP-2025-12-03-001"
    caller_name = Column(String(255), nullable=True)
    caller_phone = Column(String(32), nullable=True)
    incident_type = Column(String(64), nullable=False)  # "theft", "vandalism", "medical", "fire", etc.
    priority = Column(String(16), default="medium", nullable=False)  # "low", "medium", "high", "critical"
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)
    latitude = Column(String(32), nullable=True)  # GPS coordinates
    longitude = Column(String(32), nullable=True)
    status = Column(Enum(DispatchStatus), default=DispatchStatus.NEW, nullable=False)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    assigned_at = Column(DateTime, nullable=True)
    onscene_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    closed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Dispatcher
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class PanicAlert(Base):
    """
    Panic button alert from guard app.
    Instant alert with GPS location to control room.
    """
    __tablename__ = "panic_alerts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    alert_type = Column(String(32), default="panic", nullable=False)  # "panic", "medical", "fire", etc.
    latitude = Column(String(32), nullable=False)  # GPS coordinates
    longitude = Column(String(32), nullable=False)
    location_text = Column(String(255), nullable=True)  # Human-readable location
    message = Column(Text, nullable=True)  # Optional message from guard
    status = Column(String(32), default="active", nullable=False)  # "active", "acknowledged", "resolved"
    acknowledged_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

# ---- DAR & Passdown System ----

class DailyActivityReport(Base):
    """
    Daily Activity Report (DAR).
    Auto-compiled from check-ins, tours, incidents, notes, photos.
    Per shift / per site → PDF/HTML for client.
    
    NOTE: This is the OLD auto-compiled DAR model.
    The NEW manual DAR model is in app.models.dar.DailyActivityReport
    """
    __tablename__ = "daily_activity_reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    shift_date = Column(Date, nullable=False, index=True)
    shift_type = Column(String(32), nullable=True)  # "MORNING", "DAY", "NIGHT"
    report_number = Column(String(32), unique=True, nullable=False, index=True)  # e.g., "DAR-2025-12-03-A"
    generated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Compiled data (JSON for flexibility)
    summary_data = Column(JSON, nullable=True)  # {
    #   "check_ins": [...],
    #   "patrols": [...],
    #   "incidents": [...],
    #   "notes": [...],
    #   "photos": [...]
    # }
    
    # Export paths
    pdf_path = Column(String(512), nullable=True)
    html_path = Column(String(512), nullable=True)
    
    notes = Column(Text, nullable=True)  # Additional notes
    status = Column(String(32), default="draft", nullable=False)  # "draft", "final", "sent"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class ShiftHandover(Base):
    """
    Shift handover / passdown log.
    Guard A leaves note for next shift.
    Structured passdown log across shifts.
    """
    __tablename__ = "shift_handovers"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    shift_date = Column(Date, nullable=False, index=True)
    from_shift_type = Column(String(32), nullable=True)  # "MORNING", "DAY", "NIGHT"
    to_shift_type = Column(String(32), nullable=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Guard leaving
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Guard receiving (optional)
    category = Column(String(32), nullable=True)  # "maintenance", "incident", "note", "task"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(16), default="normal", nullable=False)  # "low", "normal", "high", "urgent"
    status = Column(String(32), default="pending", nullable=False)  # "pending", "acknowledged", "resolved"
    acknowledged_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Enhanced handover fields
    handover_type = Column(String(32), nullable=True)  # "SHIFT", "DAILY", "WEEKLY"
    priority_items = Column(JSON, nullable=True)  # JSON array of priority items
    pending_tasks = Column(JSON, nullable=True)  # JSON array of pending tasks
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

# ---- Tour Checkpoints & Routes ----

class PatrolRoute(Base):
    """
    Patrol route definition with checkpoints.
    """
    __tablename__ = "patrol_routes"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    checkpoints = relationship("PatrolCheckpoint", back_populates="route", cascade="all, delete-orphan", order_by="PatrolCheckpoint.order")

class PatrolCheckpoint(Base):
    """
    Checkpoint in a patrol route (NFC/QR code location).
    """
    __tablename__ = "patrol_checkpoints"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("patrol_routes.id"), nullable=False, index=True)
    order = Column(Integer, nullable=False, default=0)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    latitude = Column(String(32), nullable=True)
    longitude = Column(String(32), nullable=True)
    nfc_code = Column(String(128), unique=True, nullable=True, index=True)  # NFC tag ID
    qr_code = Column(String(128), unique=True, nullable=True, index=True)  # QR code data
    required = Column(Boolean, default=True, nullable=False)  # Must be scanned
    time_window_start = Column(String(8), nullable=True)  # e.g., "20:00" - start of valid scan window
    time_window_end = Column(String(8), nullable=True)  # e.g., "22:00" - end of valid scan window
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    route = relationship("PatrolRoute", back_populates="checkpoints")

class PatrolCheckpointScan(Base):
    """
    Record of checkpoint scan during patrol.
    """
    __tablename__ = "patrol_checkpoint_scans"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    route_id = Column(Integer, ForeignKey("patrol_routes.id"), nullable=False, index=True)
    checkpoint_id = Column(Integer, ForeignKey("patrol_checkpoints.id"), nullable=False, index=True)
    scan_time = Column(DateTime, nullable=False, index=True)
    scan_method = Column(String(16), nullable=False)  # "NFC", "QR", "manual"
    scan_code = Column(String(128), nullable=True)  # The actual NFC/QR code scanned
    latitude = Column(String(32), nullable=True)  # GPS at scan time
    longitude = Column(String(32), nullable=True)
    is_valid = Column(Boolean, default=True, nullable=False)  # Within time window, correct code
    is_missed = Column(Boolean, default=False, nullable=False)  # Marked as missed if not scanned
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

# ---- Post Orders & Policy ----

class PostOrder(Base):
    """
    Post orders / company policy documents.
    Guards must acknowledge reading.
    """
    __tablename__ = "post_orders"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True, index=True)  # null = company-wide
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)  # Policy text / instructions
    category = Column(String(64), nullable=True)  # "safety", "procedure", "emergency", etc.
    priority = Column(String(16), default="normal", nullable=False)  # "low", "normal", "high", "critical"
    is_active = Column(Boolean, default=True, nullable=False)
    effective_date = Column(Date, nullable=True)
    expires_date = Column(Date, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class PostOrderAcknowledgment(Base):
    """
    Record of guard acknowledging post order.
    """
    __tablename__ = "post_order_acknowledgments"

    id = Column(Integer, primary_key=True, index=True)
    post_order_id = Column(Integer, ForeignKey("post_orders.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    acknowledged_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

# ---- Shift Scheduling ----

class ShiftSchedule(Base):
    """
    Shift schedule assignment for guards.
    """
    __tablename__ = "shift_schedules"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    shift_date = Column(Date, nullable=False, index=True)
    shift_type = Column(String(32), nullable=False)  # "MORNING", "DAY", "NIGHT"
    start_time = Column(String(8), nullable=True)  # e.g., "06:00"
    end_time = Column(String(8), nullable=True)  # e.g., "14:00"
    status = Column(String(32), default="assigned", nullable=False)  # "assigned", "confirmed", "completed", "cancelled"
    confirmed_at = Column(DateTime, nullable=True)
    confirmed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

# ---- Shift Exchange ----

class ShiftExchange(Base):
    """
    Shift exchange/swap requests between guards.
    """
    __tablename__ = "shift_exchanges"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # Guard requesting exchange
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Guard accepting (null = open request)
    from_shift_id = Column(Integer, ForeignKey("shift_schedules.id"), nullable=False, index=True)  # Shift being offered
    to_shift_id = Column(Integer, ForeignKey("shift_schedules.id"), nullable=True, index=True)  # Shift being requested (null = open)
    status = Column(String(32), default="pending", nullable=False)  # "pending", "accepted", "rejected", "cancelled", "completed", "pending_approval", "approved", "rejected_by_supervisor"
    request_message = Column(Text, nullable=True)
    response_message = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    responded_at = Column(DateTime, nullable=True)
    # Approval workflow
    requires_approval = Column(Boolean, default=True, nullable=False)  # Whether supervisor approval is needed
    approval_status = Column(String(32), nullable=True)  # "pending", "approved", "rejected"
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    approved_at = Column(DateTime, nullable=True)
    approval_notes = Column(Text, nullable=True)
    # Shift application
    applied_at = Column(DateTime, nullable=True)  # When the shift swap was actually applied
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

# ---- GPS Tracking & Idle Alerts ----

class GuardLocation(Base):
    """
    Live GPS location tracking for guards.
    """
    __tablename__ = "guard_locations"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    latitude = Column(String(32), nullable=False)
    longitude = Column(String(32), nullable=False)
    accuracy = Column(String(16), nullable=True)  # GPS accuracy in meters
    heading = Column(String(16), nullable=True)  # Direction of movement
    speed = Column(String(16), nullable=True)  # Speed in m/s
    timestamp = Column(DateTime, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)  # Latest location for user
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class IdleAlert(Base):
    """
    Alert when guard is idle/inactive for too long.
    """
    __tablename__ = "idle_alerts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    alert_type = Column(String(32), default="idle", nullable=False)  # "idle", "inactive", "no_movement"
    idle_duration_minutes = Column(Integer, nullable=False)  # How long idle
    last_activity_time = Column(DateTime, nullable=True)  # Last checkpoint scan or activity
    latitude = Column(String(32), nullable=True)
    longitude = Column(String(32), nullable=True)
    status = Column(String(32), default="active", nullable=False)  # "active", "acknowledged", "resolved"
    acknowledged_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

