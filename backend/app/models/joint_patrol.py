# backend/app/models/joint_patrol.py

"""
Joint Patrol Model - For tracking patrols conducted by multiple personnel together
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base


class JointPatrol(Base):
    """
    Joint Patrol - A patrol conducted by 2 or more personnel together
    """
    __tablename__ = "joint_patrols"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    # Patrol details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    route = Column(String(255), nullable=True)  # Route/area to patrol
    
    # Schedule
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=True)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    
    # Team
    lead_officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    participant_ids = Column(Text, nullable=True)  # List of user IDs (JSON string)
    
    # Status
    status = Column(String(20), default="SCHEDULED", nullable=False)  # SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    
    # Additional info
    notes = Column(Text, nullable=True)
    findings = Column(Text, nullable=True)
    photos = Column(Text, nullable=True)  # List of photo URLs (JSON string)
    
    # Audit
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class PatrolReport(Base):
    """
    Manual Patrol Report - For supervisor to create detailed patrol reports
    """
    __tablename__ = "patrol_reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    # Report info
    report_date = Column(DateTime, nullable=False, index=True)
    shift = Column(String(20), nullable=False)  # MORNING, AFTERNOON, NIGHT
    
    # Officer info
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Patrol details
    patrol_type = Column(String(50), nullable=False)  # ROUTINE, EMERGENCY, SPECIAL
    area_covered = Column(String(255), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Report content
    summary = Column(Text, nullable=True)
    findings = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    incidents = Column(Text, nullable=True)  # List of incident IDs or descriptions (JSON string)
    photos = Column(Text, nullable=True)  # List of photo URLs (JSON string)
    
    # Status
    status = Column(String(20), default="DRAFT", nullable=False)  # DRAFT, SUBMITTED, REVIEWED, APPROVED
    
    # Audit
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        {"sqlite_autoincrement": True, "extend_existing": True},
    )

