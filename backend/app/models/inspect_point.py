# backend/app/models/inspect_point.py

from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime

class InspectPoint(Base):
    __tablename__ = "inspect_points"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    code = Column(String(255), unique=True, nullable=False, index=True)  # QR code content
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

