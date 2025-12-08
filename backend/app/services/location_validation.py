# backend/app/services/location_validation.py

import math
from sqlalchemy.orm import Session
from app.models.site import Site

EARTH_RADIUS_M = 6371000.0

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Hitung jarak meter antara dua titik lat/lon menggunakan Haversine formula."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return EARTH_RADIUS_M * c

def is_location_within_site_radius(
    db: Session,
    site_id: int,
    lat: float,
    lng: float,
    max_distance_m: float = 100.0,
) -> bool:
    """
    Validasi apakah koordinat berada dalam radius site.
    Jika site belum punya koordinat, return True (asumsi valid untuk sementara).
    """
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        return False
    
    # Cek apakah site punya koordinat
    if site.lat is None or site.lng is None:
        # Kalau belum punya koordinat site, untuk saat ini anggap valid saja
        return True
    
    # Gunakan geofence_radius_m dari site jika ada, atau max_distance_m
    radius = site.geofence_radius_m if hasattr(site, 'geofence_radius_m') and site.geofence_radius_m else max_distance_m
    
    dist = haversine_m(lat, lng, site.lat, site.lng)
    return dist <= radius
