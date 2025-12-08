# backend/app/divisions/cleaning/models.py

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
    Enum,
    Float,
)
from sqlalchemy.orm import relationship
from app.models.base import Base

class CleaningZone(Base):
    """
    Shared zones model for all divisions (SECURITY, CLEANING, DRIVER).
    This is a SHARED module - same table, different usage per division.
    Division field identifies zone type: SECURITY (patrol area), CLEANING (cleaning zone), DRIVER (route stop/depot).
    """
    __tablename__ = "cleaning_zones"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    # Division field: 'SECURITY', 'CLEANING', 'DRIVER', 'PARKING'
    # This field makes the zones system truly unified across all divisions
    division = Column(String(32), nullable=False, index=True, default="CLEANING")  # Division: 'SECURITY', 'CLEANING', 'DRIVER'
    
    name = Column(String(255), nullable=False)  # e.g., "Toilet A", "Lobby Floor 1", "Patrol Area A", "Depot 1"
    code = Column(String(64), nullable=True)  # Internal code
    qr_code = Column(String(256), unique=True, nullable=True, index=True)  # QR code string for scanning
    floor = Column(String(64), nullable=True)  # e.g., "Floor 1", "Ground Floor"
    area_type = Column(String(64), nullable=True)  # "toilet", "lobby", "corridor", "warehouse", "mess_hall", "patrol_area", "depot", etc.
    geofence_id = Column(Integer, nullable=True)  # Optional: link to geofence for GPS enforcement
    geofence_latitude = Column(String(32), nullable=True)  # Center point for geofence (as string for precision)
    geofence_longitude = Column(String(32), nullable=True)
    geofence_radius_meters = Column(Integer, nullable=True, default=20)  # Radius in meters
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    zone_templates = relationship("CleaningZoneTemplate", back_populates="zone", cascade="all, delete-orphan")
    inspections = relationship("CleaningInspection", back_populates="zone", cascade="all, delete-orphan")

class CleaningZoneTemplate(Base):
    """
    Links cleaning zones to checklist templates with frequency.
    Defines what needs to be done in each zone and how often.
    """
    __tablename__ = "cleaning_zone_templates"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("cleaning_zones.id"), nullable=False, index=True)
    checklist_template_id = Column(Integer, ForeignKey("checklist_templates.id"), nullable=False, index=True)
    frequency_type = Column(String(32), nullable=False)  # "DAILY", "DAILY_3X", "HOURLY_2", "WEEKLY", "CUSTOM"
    frequency_detail = Column(String(255), nullable=True)  # e.g., "06:00,12:00,18:00" for DAILY_3X, or CRON expression
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    zone = relationship("CleaningZone", back_populates="zone_templates")
    template = relationship("ChecklistTemplate")

class CleaningInspection(Base):
    """
    Supervisor quality checks for cleaning zones.
    """
    __tablename__ = "cleaning_inspections"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("cleaning_zones.id"), nullable=False, index=True)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    score = Column(Integer, nullable=True)  # 1-5 rating
    status = Column(String(32), default="pass", nullable=False)  # "pass", "fail", "needs_improvement"
    notes = Column(Text, nullable=True)
    photo_paths = Column(Text, nullable=True)  # Comma-separated or JSON
    inspection_date = Column(Date, nullable=False, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    zone = relationship("CleaningZone", back_populates="inspections")
    inspector = relationship("User", foreign_keys=[inspector_id])

