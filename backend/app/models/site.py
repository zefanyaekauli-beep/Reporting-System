from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from .base import Base

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    address = Column(String, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    # GPS coordinates for location validation
    lat = Column(Float, nullable=True)  # Latitude
    lng = Column(Float, nullable=True)  # Longitude
    geofence_radius_m = Column(Float, nullable=True, default=100.0)  # Default radius in meters
    # QR code for attendance scanning
    qr_code = Column(String(256), unique=True, nullable=True, index=True)  # QR code string for scanning (e.g., "SITE_1", "GATE_1")
    
    # Relationships (optional, for future use)
    # company = relationship("Company", back_populates="sites")
    # users = relationship("User", back_populates="site")

