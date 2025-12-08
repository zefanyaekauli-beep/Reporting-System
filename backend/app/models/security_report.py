from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .base import Base

class ReportType(str, enum.Enum):
    DAILY_SUMMARY = "daily_summary"
    INCIDENT = "incident"
    FINDING = "finding"

class ReportStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"

class Severity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class SecurityReport(Base):
    __tablename__ = "security_reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("security_locations.id"), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    report_type = Column(SQLEnum(ReportType), nullable=False, index=True)
    location_text = Column(String, nullable=True)  # Optional human-readable location
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    severity = Column(SQLEnum(Severity), nullable=True)  # Only for incidents
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.OPEN, nullable=False, index=True)
    
    attachments = Column(Text, nullable=True)  # JSON array of photo URLs
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

