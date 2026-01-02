# backend/app/api/v1/endpoints/master_asset.py

"""
Master Asset Management API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.master_data import MasterData

router = APIRouter(prefix="/master/asset", tags=["master-asset"])


class AssetOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    site_id: Optional[int] = None
    location: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AssetCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    site_id: Optional[int] = None
    location: Optional[str] = None
    is_active: bool = True


class AssetUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    site_id: Optional[int] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", response_model=List[AssetOut])
def list_assets(
    site_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List assets"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(MasterData).filter(
            MasterData.category == "ASSET",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        )
        
        if category_id:
            query = query.filter(MasterData.parent_id == category_id)
        
        assets = query.order_by(MasterData.name).all()
        return assets
    except Exception as e:
        api_logger.error(f"Error listing assets: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_assets")


@router.get("/{asset_id}", response_model=AssetOut)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get asset by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        asset = db.query(MasterData).filter(
            MasterData.id == asset_id,
            MasterData.category == "ASSET",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        ).first()
        
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        return asset
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting asset: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_asset")


@router.post("", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(
    data: AssetCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create asset"""
    try:
        company_id = current_user.get("company_id", 1)
        
        asset = MasterData(
            company_id=company_id,
            category="ASSET",
            code=data.code,
            name=data.name,
            description=data.description,
            parent_id=data.category_id,
            is_active=data.is_active,
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating asset: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_asset")


@router.put("/{asset_id}", response_model=AssetOut)
def update_asset(
    asset_id: int,
    data: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update asset"""
    try:
        company_id = current_user.get("company_id", 1)
        
        asset = db.query(MasterData).filter(
            MasterData.id == asset_id,
            MasterData.category == "ASSET",
            MasterData.company_id == company_id
        ).first()
        
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        if data.code is not None:
            asset.code = data.code
        if data.name is not None:
            asset.name = data.name
        if data.description is not None:
            asset.description = data.description
        if data.category_id is not None:
            asset.parent_id = data.category_id
        if data.is_active is not None:
            asset.is_active = data.is_active
        
        db.commit()
        db.refresh(asset)
        return asset
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating asset: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_asset")


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete asset"""
    try:
        company_id = current_user.get("company_id", 1)
        
        asset = db.query(MasterData).filter(
            MasterData.id == asset_id,
            MasterData.category == "ASSET",
            MasterData.company_id == company_id
        ).first()
        
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        db.delete(asset)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error deleting asset: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_asset")
