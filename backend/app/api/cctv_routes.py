# backend/app/api/cctv_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_supervisor
from app.models.cctv import CCTV

router = APIRouter(prefix="/cctv", tags=["cctv"])


class CCTVBase(BaseModel):
    id: int
    company_id: int
    site_id: int
    name: str
    location: Optional[str] = None
    stream_url: str
    camera_type: Optional[str] = None
    stream_type: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    resolution: Optional[str] = None
    is_active: bool
    is_recording: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class CTVTCreate(BaseModel):
    site_id: int
    name: str
    location: Optional[str] = None
    stream_url: str
    camera_type: Optional[str] = None
    stream_type: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    resolution: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


@router.get("", response_model=List[CCTVBase])
def list_cctv_cameras(
    site_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List CCTV cameras."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(CCTV).filter(CCTV.company_id == company_id)
        
        if site_id:
            q = q.filter(CCTV.site_id == site_id)
        if is_active is not None:
            q = q.filter(CCTV.is_active == is_active)
        
        cameras = q.order_by(CCTV.name.asc()).all()
        
        api_logger.info(f"Listed {len(cameras)} CCTV cameras for user {current_user.get('id')}")
        return cameras
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing CCTV cameras: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list CCTV cameras: {error_msg}"
        )


@router.get("/{camera_id}", response_model=CCTVBase)
def get_cctv_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get CCTV camera details."""
    try:
        company_id = current_user.get("company_id", 1)
        
        camera = (
            db.query(CCTV)
            .filter(
                CCTV.id == camera_id,
                CCTV.company_id == company_id,
            )
            .first()
        )
        
        if not camera:
            raise HTTPException(status_code=404, detail="CCTV camera not found")
        
        return camera
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting CCTV camera: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get CCTV camera: {error_msg}"
        )


@router.get("/{camera_id}/stream")
def get_cctv_stream_url(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get CCTV stream URL (may include authentication)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        camera = (
            db.query(CCTV)
            .filter(
                CCTV.id == camera_id,
                CCTV.company_id == company_id,
                CCTV.is_active == True,
            )
            .first()
        )
        
        if not camera:
            raise HTTPException(status_code=404, detail="CCTV camera not found or inactive")
        
        # Build stream URL with credentials if needed
        stream_url = camera.stream_url
        if camera.username and camera.password:
            # For RTSP: rtsp://username:password@host:port/path
            if camera.stream_type == "rtsp" and "@" not in stream_url:
                from urllib.parse import urlparse, urlunparse
                parsed = urlparse(stream_url)
                netloc = f"{camera.username}:{camera.password}@{parsed.netloc}"
                stream_url = urlunparse(parsed._replace(netloc=netloc))
        
        return {
            "camera_id": camera.id,
            "camera_name": camera.name,
            "stream_url": stream_url,
            "stream_type": camera.stream_type,
            "resolution": camera.resolution,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting CCTV stream: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get CCTV stream: {error_msg}"
        )


@router.post("", response_model=CCTVBase, status_code=201)
def create_cctv_camera(
    payload: CTVTCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Create new CCTV camera (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Validate site
        from app.models.site import Site
        site = db.query(Site).filter(
            Site.id == payload.site_id,
            Site.company_id == company_id,
        ).first()
        
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        
        camera = CCTV(
            company_id=company_id,
            site_id=payload.site_id,
            name=payload.name,
            location=payload.location,
            stream_url=payload.stream_url,
            camera_type=payload.camera_type,
            stream_type=payload.stream_type,
            brand=payload.brand,
            model=payload.model,
            resolution=payload.resolution,
            username=payload.username,
            password=payload.password,
            is_active=payload.is_active,
            is_recording=False,
            notes=payload.notes,
        )
        
        db.add(camera)
        db.commit()
        db.refresh(camera)
        
        api_logger.info(f"Created CCTV camera {camera.id} by user {current_user.get('id')}")
        return camera
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error creating CCTV camera: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create CCTV camera: {error_msg}"
        )


@router.put("/{camera_id}", response_model=CCTVBase)
def update_cctv_camera(
    camera_id: int,
    payload: CTVTCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Update CCTV camera (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        camera = (
            db.query(CCTV)
            .filter(
                CCTV.id == camera_id,
                CCTV.company_id == company_id,
            )
            .first()
        )
        
        if not camera:
            raise HTTPException(status_code=404, detail="CCTV camera not found")
        
        # Update fields
        camera.name = payload.name
        camera.location = payload.location
        camera.stream_url = payload.stream_url
        camera.camera_type = payload.camera_type
        camera.stream_type = payload.stream_type
        camera.brand = payload.brand
        camera.model = payload.model
        camera.resolution = payload.resolution
        if payload.username:
            camera.username = payload.username
        if payload.password:
            camera.password = payload.password
        camera.is_active = payload.is_active
        if payload.notes is not None:
            camera.notes = payload.notes
        
        db.commit()
        db.refresh(camera)
        
        api_logger.info(f"Updated CCTV camera {camera_id} by user {current_user.get('id')}")
        return camera
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error updating CCTV camera: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update CCTV camera: {error_msg}"
        )


@router.delete("/{camera_id}", status_code=204)
def delete_cctv_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Delete CCTV camera (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        camera = (
            db.query(CCTV)
            .filter(
                CCTV.id == camera_id,
                CCTV.company_id == company_id,
            )
            .first()
        )
        
        if not camera:
            raise HTTPException(status_code=404, detail="CCTV camera not found")
        
        db.delete(camera)
        db.commit()
        
        api_logger.info(f"Deleted CCTV camera {camera_id} by user {current_user.get('id')}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error deleting CCTV camera: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete CCTV camera: {error_msg}"
        )

