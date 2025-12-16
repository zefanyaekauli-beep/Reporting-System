# backend/app/models/master_data.py

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class MasterData(Base):
    """
    Master data management system.
    Supports hierarchical data with parent_id.
    """
    __tablename__ = "master_data"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)  # NULL for global master data
    
    # Category and Code
    category = Column(String(64), nullable=False, index=True)  # "INCIDENT_TYPE", "STATUS", "ZONE_TYPE", etc.
    code = Column(String(128), nullable=False, index=True)  # Unique code within category
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Hierarchical support
    parent_id = Column(Integer, ForeignKey("master_data.id"), nullable=True, index=True)
    
    # Additional data (flexible JSON field)
    extra_data = Column(JSON, nullable=True)  # For extra fields like color, icon, etc. (renamed from metadata to avoid SQLAlchemy reserved word)
    
    # Display and ordering
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Division-specific (optional)
    division = Column(String(32), nullable=True, index=True)  # SECURITY, CLEANING, DRIVER, or NULL for all
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    parent = relationship("MasterData", remote_side=[id], backref="children")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

