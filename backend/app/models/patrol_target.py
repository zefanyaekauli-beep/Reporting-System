# backend/app/models/patrol_target.py

from sqlalchemy import Column, Integer, String, Date, DateTime, Integer as SQLInteger, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.models.base import Base


class PatrolTarget(Base):
    """
    Patrol target and completion tracking.
    """
    __tablename__ = "patrol_targets"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("cleaning_zones.id"), nullable=True, index=True)
    route_id = Column(Integer, ForeignKey("patrol_routes.id"), nullable=True, index=True)
    
    # Target date
    target_date = Column(Date, nullable=False, index=True)
    
    # Target metrics
    target_checkpoints = Column(Integer, default=0, nullable=False)
    target_duration_minutes = Column(Integer, nullable=True)  # Expected duration in minutes
    target_patrols = Column(Integer, default=1, nullable=False)  # Number of patrols expected
    
    # Actual completion
    completed_checkpoints = Column(Integer, default=0, nullable=False)
    actual_duration_minutes = Column(Integer, nullable=True)
    completed_patrols = Column(Integer, default=0, nullable=False)
    
    # Calculated metrics
    completion_percentage = Column(Float, default=0.0, nullable=False)
    missed_checkpoints = Column(Integer, default=0, nullable=False)
    
    # Status
    status = Column(String(32), default="PENDING", nullable=False, index=True)  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    
    # Metadata
    notes = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    site = relationship("Site", foreign_keys=[site_id])

