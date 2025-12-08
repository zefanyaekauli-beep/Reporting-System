# backend/app/models/device.py

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base

class Device(Base):
    """
    Device registration and time offset tracking.
    """
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(128), unique=True, nullable=False, index=True)  # UUID from client
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    device_name = Column(String(255), nullable=True)  # e.g., "Samsung Galaxy S21"
    device_model = Column(String(255), nullable=True)
    os_version = Column(String(64), nullable=True)
    app_version = Column(String(32), nullable=True)
    time_offset_sec = Column(Float, default=0.0, nullable=False)  # Device time - server time in seconds
    time_trusted = Column(Boolean, default=True, nullable=False)  # False if offset > ±300s
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class ClientEvent(Base):
    """
    Client events synced from mobile devices (offline-first architecture).
    """
    __tablename__ = "client_events"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(128), nullable=False, index=True)
    client_event_id = Column(String(128), nullable=False, index=True)  # UUID from client
    type = Column(String(64), nullable=False, index=True)  # "CLEANING_CHECK", "GPS_UPDATE", "PANIC", etc.
    event_time = Column(DateTime(timezone=True), nullable=False, index=True)  # JAM X from device
    server_received_at = Column(DateTime(timezone=True), nullable=False)  # JAM Y when received
    payload = Column(Text, nullable=False)  # JSONB equivalent (JSON string for SQLite)
    mapped_entity_id = Column(Integer, nullable=True, index=True)  # ID of checklist/report/etc created from this event
    time_suspect = Column(Boolean, default=False, nullable=False)  # True if device time offset was suspicious
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Unique constraint: device_id + client_event_id for idempotency
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )

