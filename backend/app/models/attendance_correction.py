# backend/app/models/attendance_correction.py

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime
import enum

class CorrectionType(str, enum.Enum):
    LATE = "late"
    MISSING_CLOCK_IN = "missing_clock_in"
    MISSING_CLOCK_OUT = "missing_clock_out"
    OVERTIME = "overtime"

class CorrectionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class AttendanceCorrection(Base):
    __tablename__ = "attendance_corrections"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    attendance_id = Column(Integer, ForeignKey("attendance.id"), nullable=True, index=True)
    
    correction_type = Column(Enum(CorrectionType), nullable=False)
    status = Column(Enum(CorrectionStatus), default=CorrectionStatus.PENDING, nullable=False)
    
    requested_clock_in = Column(DateTime, nullable=True)
    requested_clock_out = Column(DateTime, nullable=True)
    
    reason = Column(Text, nullable=False)
    evidence_url = Column(String(512), nullable=True)
    
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    rejected_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

