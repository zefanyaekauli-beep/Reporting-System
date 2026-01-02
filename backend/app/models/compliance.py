# backend/app/models/compliance.py

"""
Compliance & Auditor Models
"""

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
    JSON,
)
from sqlalchemy.orm import relationship
from app.models.base import Base


class ComplianceStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    NON_COMPLIANT = "NON_COMPLIANT"


class AuditStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ComplianceChecklist(Base):
    """
    Compliance checklist items
    """
    __tablename__ = "compliance_checklists"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    checklist_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AuditSchedule(Base):
    """
    Audit scheduling
    """
    __tablename__ = "audit_schedules"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    audit_type = Column(String(100), nullable=False)
    scheduled_date = Column(Date, nullable=False, index=True)
    scheduled_time = Column(String(8), nullable=True)  # HH:MM format
    auditor_name = Column(String(255), nullable=True)
    status = Column(String(20), default=AuditStatus.SCHEDULED.value, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AuditExecution(Base):
    """
    Audit execution records
    """
    __tablename__ = "audit_executions"

    id = Column(Integer, primary_key=True, index=True)
    audit_schedule_id = Column(Integer, ForeignKey("audit_schedules.id"), nullable=False, index=True)
    checklist_id = Column(Integer, ForeignKey("compliance_checklists.id"), nullable=True)
    compliance_status = Column(String(20), nullable=False)
    findings = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    executed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

