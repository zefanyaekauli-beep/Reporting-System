# backend/app/models/patrol_schedule.py

"""
Patrol Schedule and Assignment Models
"""

from datetime import datetime, date, time
from typing import Optional
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Time,
    ForeignKey,
    Text,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship
from app.models.base import Base


class PatrolFrequency(str, enum.Enum):
    ONCE = "ONCE"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    CUSTOM = "CUSTOM"


class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    MISSED = "MISSED"
    CANCELLED = "CANCELLED"


class PatrolSchedule(Base):
    """
    Patrol schedule - defines when patrols should occur
    """
    __tablename__ = "patrol_schedules"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    route_id = Column(Integer, ForeignKey("patrol_routes.id"), index=True, nullable=False)
    scheduled_date = Column(Date, nullable=False, index=True)
    scheduled_time = Column(Time, nullable=False)
    frequency = Column(String(20), default=PatrolFrequency.ONCE.value, nullable=False)
    recurrence_end_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    assignments = relationship("PatrolAssignment", back_populates="schedule", cascade="all, delete-orphan")


class PatrolAssignment(Base):
    """
    Assignment of personnel to a scheduled patrol
    """
    __tablename__ = "patrol_assignments"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("patrol_schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    is_lead = Column(Boolean, default=False, nullable=False)
    status = Column(String(20), default=AssignmentStatus.ASSIGNED.value, nullable=False, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    schedule = relationship("PatrolSchedule", back_populates="assignments")
    logs = relationship("PatrolLog", back_populates="assignment", cascade="all, delete-orphan")


class PatrolLog(Base):
    """
    Execution log for a checkpoint scan during patrol
    """
    __tablename__ = "patrol_logs"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("patrol_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    checkpoint_id = Column(Integer, ForeignKey("patrol_checkpoints.id"), nullable=False, index=True)
    scanned_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    gps_lat = Column(String(32), nullable=True)
    gps_lng = Column(String(32), nullable=True)
    gps_accuracy = Column(String(16), nullable=True)
    photo_url = Column(String(500), nullable=True)
    status = Column(String(20), default="OK", nullable=False)  # OK, ISSUE, SKIPPED
    notes = Column(Text, nullable=True)
    issue_type = Column(String(50), nullable=True)
    issue_description = Column(Text, nullable=True)

    # Relationships
    assignment = relationship("PatrolAssignment", back_populates="logs")


class PatrolAssignmentReport(Base):
    """
    Summary report for a completed patrol assignment
    """
    __tablename__ = "patrol_assignment_reports"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("patrol_assignments.id"), nullable=False, index=True, unique=True)
    total_checkpoints = Column(Integer, nullable=False)
    completed_checkpoints = Column(Integer, nullable=False)
    missed_checkpoints = Column(Integer, nullable=False)
    total_duration_minutes = Column(Integer, nullable=True)
    issues_found = Column(Integer, default=0, nullable=False)
    summary = Column(Text, nullable=True)
    status = Column(String(20), default="DRAFT", nullable=False)  # DRAFT, SUBMITTED, REVIEWED
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

