# backend/app/models/shift.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, date, time
import enum
from app.models.base import Base


class ShiftStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    OPEN = "OPEN"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Shift(Base):
    """
    Unified shift model for all divisions (SECURITY, CLEANING, DRIVER).
    Simple v1 implementation - just enough to make operations work.
    """
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    # Division field
    division = Column(String(32), nullable=False, index=True)  # SECURITY, CLEANING, DRIVER
    
    # Shift details
    shift_date = Column(DateTime, nullable=False, index=True)  # Date of the shift
    start_time = Column(String(8), nullable=False)  # HH:MM format (e.g., "08:00")
    end_time = Column(String(8), nullable=False)  # HH:MM format (e.g., "16:00")
    shift_type = Column(String(32), nullable=True)  # MORNING, AFTERNOON, NIGHT, etc.
    
    # Scheduled vs Actual times
    scheduled_start_time = Column(DateTime, nullable=True)  # Scheduled start datetime
    scheduled_end_time = Column(DateTime, nullable=True)  # Scheduled end datetime
    actual_start_time = Column(DateTime, nullable=True)  # Actual start datetime
    actual_end_time = Column(DateTime, nullable=True)  # Actual end datetime
    
    # Overtime calculation
    overtime_hours = Column(Integer, default=0, nullable=False)  # Overtime hours in minutes
    break_duration_minutes = Column(Integer, default=0, nullable=False)  # Break duration in minutes
    shift_category = Column(String(32), nullable=True)  # "REGULAR", "OVERTIME", "HOLIDAY", "WEEKEND"
    
    # Assignment
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Assigned user (null if OPEN)
    status = Column(Enum(ShiftStatus), default=ShiftStatus.ASSIGNED, nullable=False)
    
    # Metadata
    notes = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    site = relationship("Site", foreign_keys=[site_id])

