# backend/app/models/incident.py

"""
Incident Management Models
LK/LP, BAP, STPLK, Findings
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


class IncidentType(str, enum.Enum):
    LK_LP = "LK_LP"  # Laporan Kejadian / Laporan Polisi
    BAP = "BAP"  # Berita Acara Pemeriksaan
    STPLK = "STPLK"  # Surat Tanda Laporan Kehilangan
    FINDINGS = "FINDINGS"  # Findings Report


class IncidentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CLOSED = "CLOSED"


class IncidentBase(Base):
    """
    Base incident model - shared fields for all incident types
    """
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), index=True, nullable=False)
    incident_type = Column(String(20), nullable=False, index=True)
    incident_number = Column(String(50), unique=True, nullable=False, index=True)
    incident_date = Column(Date, nullable=False, index=True)
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), default=IncidentStatus.DRAFT.value, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    evidence_paths = Column(Text, nullable=True)  # JSON array of file paths
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class LKLPReport(IncidentBase):
    """
    LK/LP - Laporan Kejadian / Laporan Polisi
    """
    __tablename__ = "lk_lp_reports"

    # Additional LK/LP specific fields
    police_report_number = Column(String(100), nullable=True)
    police_station = Column(String(255), nullable=True)
    perpetrator_name = Column(String(255), nullable=True)
    perpetrator_details = Column(Text, nullable=True)
    witness_names = Column(Text, nullable=True)  # JSON array
    damage_estimate = Column(String(100), nullable=True)
    follow_up_required = Column(Boolean, default=False, nullable=False)


class BAPReport(IncidentBase):
    """
    BAP - Berita Acara Pemeriksaan
    """
    __tablename__ = "bap_reports"

    # Additional BAP specific fields
    investigation_date = Column(Date, nullable=True)
    investigator_name = Column(String(255), nullable=True)
    subject_name = Column(String(255), nullable=True)
    subject_id_number = Column(String(100), nullable=True)
    investigation_findings = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    related_incident_id = Column(Integer, nullable=True)  # Reference to LK/LP


class STPLKReport(IncidentBase):
    """
    STPLK - Surat Tanda Laporan Kehilangan
    """
    __tablename__ = "stplk_reports"

    # Additional STPLK specific fields
    lost_item_description = Column(Text, nullable=False)
    lost_item_value = Column(String(100), nullable=True)
    lost_date = Column(Date, nullable=True)
    lost_location = Column(String(255), nullable=True)
    owner_name = Column(String(255), nullable=True)
    owner_contact = Column(String(100), nullable=True)
    police_report_number = Column(String(100), nullable=True)


class FindingsReport(IncidentBase):
    """
    Findings Report - Issue tracking and non-compliance
    """
    __tablename__ = "findings_reports"

    # Additional Findings specific fields
    finding_category = Column(String(100), nullable=True)  # Safety, Security, Compliance, etc.
    severity_level = Column(String(20), nullable=True)  # LOW, MEDIUM, HIGH, CRITICAL
    root_cause = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    preventive_action = Column(Text, nullable=True)
    responsible_party = Column(String(255), nullable=True)
    due_date = Column(Date, nullable=True)
    resolved_date = Column(Date, nullable=True)

