from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .base import Base

class PatrolStatus(str, enum.Enum):
    COMPLETED = "completed"
    PARTIAL = "partial"
    ABORTED = "aborted"

class SecurityPatrolLog(Base):
    __tablename__ = "security_patrol_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(SQLEnum(PatrolStatus), default=PatrolStatus.PARTIAL, nullable=False)
    
    area_covered = Column(String, nullable=True)  # e.g. "Main Gate to Warehouse"
    notes = Column(Text, nullable=True)
    photos = Column(Text, nullable=True)  # JSON array of photo URLs
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

