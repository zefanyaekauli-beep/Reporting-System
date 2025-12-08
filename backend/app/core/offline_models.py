# backend/app/core/offline_models.py

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    Boolean,
    Float,
    JSON,
    BigInteger,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from app.models.base import Base

class Device(Base):
    """
    Device registration for offline sync and time tracking.
    """
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(128), unique=True, nullable=False, index=True)  # UUID from client
    user_id = Column(Integer, nullable=True, index=True)  # Current user
    device_name = Column(String(255), nullable=True)  # Device model/name
    platform = Column(String(32), nullable=True)  # "android", "ios", "web"
    app_version = Column(String(32), nullable=True)
    time_offset_sec = Column(Integer, default=0, nullable=False)  # Device time offset from server
    time_untrusted = Column(Boolean, default=False, nullable=False)  # Flag if time offset > threshold
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class ClientEvent(Base):
    """
    Client events from offline devices.
    Stores events with original event_time (jam X) and server_received_at (jam Y).
    """
    __tablename__ = "client_events"

    id = Column(BigInteger, primary_key=True, index=True)
    device_id = Column(String(128), nullable=False, index=True)
    client_event_id = Column(String(128), nullable=False, index=True)  # UUID from client
    type = Column(String(64), nullable=False, index=True)  # 'CLEANING_CHECK', 'GPS_UPDATE', 'PANIC', etc.
    event_time = Column(DateTime(timezone=True), nullable=False, index=True)  # Jam X from device
    server_received_at = Column(DateTime(timezone=True), nullable=False)  # Jam Y when received
    payload = Column(JSONB, nullable=False)  # Full event payload
    mapped_entity_id = Column(BigInteger, nullable=True, index=True)  # ID of created checklist/report/etc.
    client_version = Column(String(32), nullable=True)
    # Anti-fake GPS flags
    time_suspect = Column(Boolean, default=False, nullable=False)  # Device time offset suspicious
    mock_location = Column(Boolean, default=False, nullable=False)  # Mock location detected
    speed_anomaly = Column(Boolean, default=False, nullable=False)  # Speed > threshold
    jump_anomaly = Column(Boolean, default=False, nullable=False)  # Location jump > threshold
    out_of_zone = Column(Boolean, default=False, nullable=False)  # GPS outside geofence
    validity_status = Column(String(32), default="VALID", nullable=False)  # VALID, SUSPICIOUS, INVALID
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Unique constraint to prevent duplicate events
    __table_args__ = (
        UniqueConstraint("device_id", "client_event_id", name="uq_device_client_event"),
    )

