# backend/app/models/asset.py

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime


class Asset(Base):
    """
    Asset Management Model
    Tracks assets per site with details
    """
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    # Asset Information
    asset_name = Column(String(255), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    category = Column(String(100), nullable=True, index=True)  # e.g., "Equipment", "Vehicle", "Furniture"
    condition = Column(String(50), nullable=True, index=True)  # e.g., "Good", "Fair", "Poor", "Damaged"
    detail = Column(Text, nullable=True)  # Detailed description
    remark = Column(Text, nullable=True)  # Additional notes/remarks
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    site = relationship("Site", foreign_keys=[site_id])
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

