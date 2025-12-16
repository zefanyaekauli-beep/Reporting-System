# backend/app/api/gps_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user
from app.models.gps_track import GPSTrack

router = APIRouter(prefix="/gps", tags=["gps"])


class GPSTrackCreate(BaseModel):
    track_type: str  # "PATROL", "ATTENDANCE", "TRIP"
    track_reference_id: Optional[int] = None
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    device_id: Optional[str] = None
    is_mock_location: bool = False


class GPSTrackOut(BaseModel):
    id: int
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    accuracy: Optional[float] = None
    speed: Optional[float] = None
    recorded_at: datetime
    is_mock_location: bool
    
    class Config:
        from_attributes = True


@router.post("/track", response_model=GPSTrackOut, status_code=201)
def create_gps_track(
    payload: GPSTrackCreate,
    site_id: int = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Record GPS track point."""
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user["id"]
        
        track = GPSTrack(
            company_id=company_id,
            user_id=user_id,
            site_id=site_id,
            track_type=payload.track_type,
            track_reference_id=payload.track_reference_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            altitude=payload.altitude,
            accuracy=payload.accuracy,
            speed=payload.speed,
            device_id=payload.device_id,
            is_mock_location=payload.is_mock_location,
            recorded_at=datetime.utcnow(),
        )
        
        db.add(track)
        db.commit()
        db.refresh(track)
        
        api_logger.info(f"Recorded GPS track point for user {user_id}, type: {payload.track_type}")
        return track
        
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error recording GPS track: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record GPS track: {error_msg}"
        )


@router.get("/track/{reference_id}", response_model=List[GPSTrackOut])
def get_gps_track(
    reference_id: int,
    track_type: str = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get GPS track for a patrol, attendance, or trip."""
    try:
        company_id = current_user.get("company_id", 1)
        
        tracks = (
            db.query(GPSTrack)
            .filter(
                GPSTrack.company_id == company_id,
                GPSTrack.track_type == track_type,
                GPSTrack.track_reference_id == reference_id,
            )
            .order_by(GPSTrack.recorded_at.asc())
            .all()
        )
        
        api_logger.info(f"Retrieved {len(tracks)} GPS track points for {track_type} {reference_id}")
        return tracks
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting GPS track: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get GPS track: {error_msg}"
        )


@router.get("/active", response_model=List[GPSTrackOut])
def get_active_gps_tracks(
    track_type: Optional[str] = Query(None),
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get latest GPS tracks for active patrols/activities."""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Get latest track per user/track_type combination
        from sqlalchemy import func
        
        subquery = (
            db.query(
                GPSTrack.user_id,
                GPSTrack.track_type,
                GPSTrack.track_reference_id,
                func.max(GPSTrack.recorded_at).label('max_time')
            )
            .filter(GPSTrack.company_id == company_id)
            .group_by(GPSTrack.user_id, GPSTrack.track_type, GPSTrack.track_reference_id)
            .subquery()
        )
        
        q = (
            db.query(GPSTrack)
            .join(
                subquery,
                (GPSTrack.user_id == subquery.c.user_id) &
                (GPSTrack.track_type == subquery.c.track_type) &
                (GPSTrack.track_reference_id == subquery.c.track_reference_id) &
                (GPSTrack.recorded_at == subquery.c.max_time)
            )
            .filter(GPSTrack.company_id == company_id)
        )
        
        if track_type:
            q = q.filter(GPSTrack.track_type == track_type)
        if site_id:
            q = q.filter(GPSTrack.site_id == site_id)
        
        # Only get tracks from last hour
        from datetime import timedelta
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        q = q.filter(GPSTrack.recorded_at >= one_hour_ago)
        
        tracks = q.order_by(GPSTrack.recorded_at.desc()).limit(100).all()
        
        api_logger.info(f"Retrieved {len(tracks)} active GPS tracks")
        return tracks
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting active GPS tracks: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get active GPS tracks: {error_msg}"
        )

