# backend/app/models/cctv.py

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class CCTV(Base):
    """
    CCTV camera management model.
    """
    __tablename__ = "cctv_cameras"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    zone_name = Column(String(255), nullable=True, index=True)  # Zone assignment for grouping
    stream_url = Column(String(512), nullable=False)  # RTSP, HLS, or HTTP stream URL
    camera_type = Column(String(32), nullable=True)  # "ip_camera", "dvr", "nvr"
    stream_type = Column(String(32), nullable=True)  # "rtsp", "hls", "http"
    
    # Camera details
    brand = Column(String(128), nullable=True)
    model = Column(String(128), nullable=True)
    resolution = Column(String(32), nullable=True)  # "1080p", "720p", etc.
    
    # Access credentials (encrypted in production)
    username = Column(String(128), nullable=True)
    password = Column(String(128), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_recording = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    site = relationship("Site", foreign_keys=[site_id])

