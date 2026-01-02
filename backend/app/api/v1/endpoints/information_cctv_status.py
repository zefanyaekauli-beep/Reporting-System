# backend/app/api/v1/endpoints/information_cctv_status.py

"""
Information CCTV Status Monitoring API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.cctv import CCTV

router = APIRouter(prefix="/information/cctv-status", tags=["information-cctv-status"])


class CCTVStatusOut(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    site_id: int
    is_active: bool
    is_recording: bool
    status: str  # ONLINE, OFFLINE, ERROR
    last_check: Optional[datetime] = None
    stream_url: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("", response_model=List[CCTVStatusOut])
def list_cctv_status(
    site_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List CCTV status"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(CCTV).filter(CCTV.company_id == company_id)
        
        if site_id:
            query = query.filter(CCTV.site_id == site_id)
        
        cameras = query.order_by(CCTV.name).all()
        
        result = []
        for camera in cameras:
            # Determine status based on is_active and is_recording
            if not camera.is_active:
                camera_status = "OFFLINE"
            elif not camera.is_recording:
                camera_status = "ERROR"
            else:
                camera_status = "ONLINE"
            
            if status_filter and camera_status != status_filter:
                continue
            
            result.append(CCTVStatusOut(
                id=camera.id,
                name=camera.name,
                location=camera.location,
                site_id=camera.site_id,
                is_active=camera.is_active,
                is_recording=camera.is_recording,
                status=camera_status,
                last_check=camera.updated_at if hasattr(camera, "updated_at") else None,
                stream_url=camera.stream_url,
            ))
        
        return result
    except Exception as e:
        api_logger.error(f"Error listing CCTV status: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_cctv_status")

