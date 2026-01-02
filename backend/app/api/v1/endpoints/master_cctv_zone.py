# backend/app/api/v1/endpoints/master_cctv_zone.py

"""
Master CCTV Zone API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.cctv import CCTV
from app.models.master_data import MasterData
from app.models.site import Site

router = APIRouter(prefix="/master/cctv-zone", tags=["master-cctv-zone"])


class CCTVZoneOut(BaseModel):
    id: int
    site_id: int
    zone_name: str
    description: Optional[str] = None
    camera_count: int
    is_active: bool

    class Config:
        from_attributes = True


class CCTVZoneCreate(BaseModel):
    site_id: int
    zone_name: str
    description: Optional[str] = None
    is_active: bool = True


class CCTVZoneUpdate(BaseModel):
    site_id: Optional[int] = None
    zone_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", response_model=List[CCTVZoneOut])
def list_cctv_zones(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List CCTV zones"""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Get zones from MasterData
        query = db.query(MasterData).filter(
            MasterData.category == "CCTV_ZONE",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        )
        
        if site_id:
            # Use extra_data to store site_id, or use a different approach
            # For now, we'll filter zones and then count cameras per zone
            pass
        
        zones = query.order_by(MasterData.name).all()
        
        # Get camera counts per zone
        result = []
        for zone in zones:
            zone_name = zone.name  # zone_name is stored in name field
            camera_query = db.query(CCTV).filter(
                CCTV.company_id == company_id,
                CCTV.zone_name == zone_name
            )
            if site_id:
                camera_query = camera_query.filter(CCTV.site_id == site_id)
            
            camera_count = camera_query.count()
            
            # Get site_id from first camera or from extra_data
            site_id_for_zone = site_id
            if not site_id_for_zone:
                first_camera = camera_query.first()
                site_id_for_zone = first_camera.site_id if first_camera else None
            
            result.append({
                "id": zone.id,
                "site_id": site_id_for_zone or 0,
                "zone_name": zone_name,
                "description": zone.description,
                "camera_count": camera_count,
                "is_active": zone.is_active,
            })
        
        return result
    except Exception as e:
        api_logger.error(f"Error listing CCTV zones: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_cctv_zones")


@router.get("/{zone_id}", response_model=CCTVZoneOut)
def get_cctv_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get CCTV zone by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        zone = db.query(MasterData).filter(
            MasterData.id == zone_id,
            MasterData.category == "CCTV_ZONE",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        ).first()
        
        if not zone:
            raise HTTPException(status_code=404, detail="CCTV zone not found")
        
        zone_name = zone.name
        camera_count = db.query(CCTV).filter(
            CCTV.company_id == company_id,
            CCTV.zone_name == zone_name
        ).count()
        
        first_camera = db.query(CCTV).filter(
            CCTV.company_id == company_id,
            CCTV.zone_name == zone_name
        ).first()
        
        return {
            "id": zone.id,
            "site_id": first_camera.site_id if first_camera else 0,
            "zone_name": zone_name,
            "description": zone.description,
            "camera_count": camera_count,
            "is_active": zone.is_active,
        }
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting CCTV zone: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_cctv_zone")


@router.post("", response_model=CCTVZoneOut, status_code=status.HTTP_201_CREATED)
def create_cctv_zone(
    data: CCTVZoneCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create CCTV zone"""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Verify site exists
        site = db.query(Site).filter(
            Site.id == data.site_id,
            Site.company_id == company_id
        ).first()
        
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        
        zone = MasterData(
            company_id=company_id,
            category="CCTV_ZONE",
            code=f"CCTV_ZONE_{data.zone_name.upper().replace(' ', '_')}",
            name=data.zone_name,
            description=data.description,
            is_active=data.is_active,
            extra_data={"site_id": data.site_id}  # Store site_id in extra_data
        )
        db.add(zone)
        db.commit()
        db.refresh(zone)
        
        return {
            "id": zone.id,
            "site_id": data.site_id,
            "zone_name": zone.name,
            "description": zone.description,
            "camera_count": 0,
            "is_active": zone.is_active,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating CCTV zone: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_cctv_zone")


@router.put("/{zone_id}", response_model=CCTVZoneOut)
def update_cctv_zone(
    zone_id: int,
    data: CCTVZoneUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update CCTV zone"""
    try:
        company_id = current_user.get("company_id", 1)
        
        zone = db.query(MasterData).filter(
            MasterData.id == zone_id,
            MasterData.category == "CCTV_ZONE",
            MasterData.company_id == company_id
        ).first()
        
        if not zone:
            raise HTTPException(status_code=404, detail="CCTV zone not found")
        
        old_zone_name = zone.name
        
        if data.site_id is not None:
            # Verify site exists
            site = db.query(Site).filter(
                Site.id == data.site_id,
                Site.company_id == company_id
            ).first()
            if not site:
                raise HTTPException(status_code=404, detail="Site not found")
            if zone.extra_data:
                zone.extra_data["site_id"] = data.site_id
            else:
                zone.extra_data = {"site_id": data.site_id}
        
        if data.zone_name is not None:
            # Update zone name and update all cameras with old zone name
            new_zone_name = data.zone_name
            zone.name = new_zone_name
            
            # Update all cameras with the old zone name
            db.query(CCTV).filter(
                CCTV.company_id == company_id,
                CCTV.zone_name == old_zone_name
            ).update({"zone_name": new_zone_name})
        
        if data.description is not None:
            zone.description = data.description
        if data.is_active is not None:
            zone.is_active = data.is_active
        
        db.commit()
        db.refresh(zone)
        
        zone_name = zone.name
        camera_count = db.query(CCTV).filter(
            CCTV.company_id == company_id,
            CCTV.zone_name == zone_name
        ).count()
        
        site_id = zone.extra_data.get("site_id") if zone.extra_data else None
        if not site_id:
            first_camera = db.query(CCTV).filter(
                CCTV.company_id == company_id,
                CCTV.zone_name == zone_name
            ).first()
            site_id = first_camera.site_id if first_camera else 0
        
        return {
            "id": zone.id,
            "site_id": site_id or 0,
            "zone_name": zone_name,
            "description": zone.description,
            "camera_count": camera_count,
            "is_active": zone.is_active,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating CCTV zone: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_cctv_zone")


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cctv_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete CCTV zone"""
    try:
        company_id = current_user.get("company_id", 1)
        
        zone = db.query(MasterData).filter(
            MasterData.id == zone_id,
            MasterData.category == "CCTV_ZONE",
            MasterData.company_id == company_id
        ).first()
        
        if not zone:
            raise HTTPException(status_code=404, detail="CCTV zone not found")
        
        zone_name = zone.name
        
        # Check if any cameras are using this zone
        camera_count = db.query(CCTV).filter(
            CCTV.company_id == company_id,
            CCTV.zone_name == zone_name
        ).count()
        
        if camera_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete zone: {camera_count} camera(s) are assigned to this zone. Please reassign cameras first."
            )
        
        db.delete(zone)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error deleting CCTV zone: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_cctv_zone")

