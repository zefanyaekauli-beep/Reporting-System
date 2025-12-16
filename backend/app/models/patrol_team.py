# backend/app/models/patrol_team.py

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class PatrolTeam(Base):
    """
    Patrol team/group assignment.
    """
    __tablename__ = "patrol_teams"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    division = Column(String(32), nullable=False, index=True)  # SECURITY, CLEANING, DRIVER
    
    # Team members (stored as JSON array of user_ids)
    team_members = Column(JSON, nullable=False)  # [user_id1, user_id2, ...]
    
    # Assigned routes (stored as JSON array of route_ids)
    assigned_routes = Column(JSON, nullable=True)  # [route_id1, route_id2, ...]
    
    # Team leader
    team_leader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    site = relationship("Site", foreign_keys=[site_id])
    team_leader = relationship("User", foreign_keys=[team_leader_id])

