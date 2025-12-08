# backend/app/models/attendance.py

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Float,
    Enum,
    Boolean,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import Base

class AttendanceStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class Attendance(Base):
    """
    Unified attendance model for all divisions (SECURITY, CLEANING, DRIVER).
    Stores check-in/check-out with GPS coordinates and photos.
    
    This is a SHARED module - same table, same validation logic for all divisions.
    Division is stored in role_type field (acts as division field).
    """
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    company_id = Column(Integer, nullable=False, index=True)
    
    # Division field: 'SECURITY', 'CLEANING', 'DRIVER', 'PARKING'
    # Note: This field acts as the division identifier for the unified platform
    role_type = Column(String(32), nullable=False, index=True)  # Division: 'SECURITY', 'CLEANING', 'DRIVER'
    
    # Check-in data
    checkin_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    checkin_lat = Column(Float, nullable=True)
    checkin_lng = Column(Float, nullable=True)
    checkin_photo_path = Column(String(512), nullable=True)
    checkin_accuracy = Column(Float, nullable=True)  # GPS accuracy in meters
    checkin_mock_location = Column(Boolean, default=False, nullable=False)  # Anti-fake GPS flag
    
    # Check-out data
    checkout_time = Column(DateTime, nullable=True)
    checkout_lat = Column(Float, nullable=True)
    checkout_lng = Column(Float, nullable=True)
    checkout_photo_path = Column(String(512), nullable=True)
    checkout_accuracy = Column(Float, nullable=True)
    checkout_mock_location = Column(Boolean, default=False, nullable=False)
    
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.IN_PROGRESS, nullable=False)
    is_valid_location = Column(Boolean, default=True, nullable=False)  # Flag hasil validasi koordinat
    
    # Additional fields for check-in/out
    shift = Column(String(32), nullable=True)  # Shift number/type (0, 1, 2, 3, etc.)
    is_overtime = Column(Boolean, default=False, nullable=False)  # Overtime flag
    is_backup = Column(Boolean, default=False, nullable=False)  # Backup flag
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    site = relationship("Site", foreign_keys=[site_id])
