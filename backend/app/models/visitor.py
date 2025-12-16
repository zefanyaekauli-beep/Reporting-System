# backend/app/models/visitor.py

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class Visitor(Base):
    """
    Visitor management system.
    """
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    # Visitor Information
    name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    id_card_number = Column(String(64), nullable=True)
    id_card_type = Column(String(32), nullable=True)  # "KTP", "SIM", "PASSPORT", etc.
    
    # Contact
    phone = Column(String(32), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Visit Details
    purpose = Column(String(255), nullable=True)
    category = Column(String(64), nullable=True, index=True)  # "GUEST", "CONTRACTOR", "VENDOR", "CLIENT", etc.
    visit_date = Column(DateTime, nullable=False, index=True)
    expected_duration_minutes = Column(Integer, nullable=True)
    
    # Check-in/Check-out
    check_in_time = Column(DateTime, nullable=True, index=True)
    check_out_time = Column(DateTime, nullable=True, index=True)
    is_checked_in = Column(Boolean, default=False, nullable=False, index=True)
    
    # Host
    host_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    host_name = Column(String(255), nullable=True)  # In case host is not a user
    
    # Security
    security_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Security who registered
    badge_number = Column(String(32), nullable=True)  # Visitor badge number
    
    # Evidence
    photo_path = Column(String(512), nullable=True)
    id_card_photo_path = Column(String(512), nullable=True)
    
    # Status
    status = Column(String(32), default="REGISTERED", nullable=False, index=True)  # REGISTERED, CHECKED_IN, CHECKED_OUT, CANCELLED
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    site = relationship("Site", foreign_keys=[site_id])
    host = relationship("User", foreign_keys=[host_user_id])
    security_user = relationship("User", foreign_keys=[security_user_id])

