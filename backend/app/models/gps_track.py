# backend/app/models/gps_track.py

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class GPSTrack(Base):
    """
    GPS tracking data for patrols and activities.
    """
    __tablename__ = "gps_tracks"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    # Track Context
    track_type = Column(String(32), nullable=False, index=True)  # "PATROL", "ATTENDANCE", "TRIP", etc.
    track_reference_id = Column(Integer, nullable=True, index=True)  # ID of patrol, attendance, etc.
    
    # GPS Coordinates
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)  # GPS accuracy in meters
    speed = Column(Float, nullable=True)  # Speed in m/s
    
    # Timestamp
    recorded_at = Column(DateTime, nullable=False, index=True)
    
    # Device Info
    device_id = Column(String(128), nullable=True)
    is_mock_location = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    site = relationship("Site", foreign_keys=[site_id])

