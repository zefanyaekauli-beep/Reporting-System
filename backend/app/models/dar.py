# backend/app/models/dar.py

"""
Daily Activity Report (DAR) Models
Enhanced version with personnel and activities tracking
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
    Enum,
)
from sqlalchemy.orm import relationship
from app.models.base import Base


class DARStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class DailyActivityReport(Base):
    """
    Daily Activity Report (DAR) - Enhanced version
    Manual/managed DAR with personnel and activities
    Note: This is the new comprehensive DAR model. The old auto-compiled DAR is in security models.
    """
    __tablename__ = "dar_reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    report_date = Column(Date, nullable=False, index=True)
    shift = Column(String(20), nullable=False)  # MORNING, AFTERNOON, NIGHT
    weather = Column(String(50), nullable=True)
    summary = Column(Text, nullable=True)
    handover_notes = Column(Text, nullable=True)
    status = Column(String(20), default=DARStatus.DRAFT.value, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships - use fully qualified paths to avoid conflict with security models
    personnel = relationship("app.models.dar.DARPersonnel", back_populates="dar", cascade="all, delete-orphan")
    activities = relationship("app.models.dar.DARActivity", back_populates="dar", cascade="all, delete-orphan", order_by="DARActivity.activity_time")

    # Unique constraint: one DAR per site/date/shift
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class DARPersonnel(Base):
    """
    Personnel assigned to a DAR shift
    """
    __tablename__ = "dar_personnel"

    id = Column(Integer, primary_key=True, index=True)
    dar_id = Column(Integer, ForeignKey("dar_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(50), nullable=True)  # Guard, Supervisor, etc.
    check_in_time = Column(Time, nullable=True)
    check_out_time = Column(Time, nullable=True)

    # Relationships - use fully qualified path to avoid conflict with security models
    dar = relationship("app.models.dar.DailyActivityReport", back_populates="personnel")


class DARActivity(Base):
    """
    Activities recorded in a DAR
    """
    __tablename__ = "dar_activities"

    id = Column(Integer, primary_key=True, index=True)
    dar_id = Column(Integer, ForeignKey("dar_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_time = Column(Time, nullable=False)
    activity_type = Column(String(50), nullable=False)  # Patrol, Incident, Maintenance, etc.
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)
    photo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships - use fully qualified path to avoid conflict with security models
    dar = relationship("app.models.dar.DailyActivityReport", back_populates="activities")

