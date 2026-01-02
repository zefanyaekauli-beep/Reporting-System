# backend/app/api/v1/endpoints/assets.py

"""
Assets Management API Endpoints
Uses Asset model (not MasterData)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.asset import Asset
from app.models.site import Site

router = APIRouter(prefix="/assets", tags=["assets"])


class AssetOut(BaseModel):
    id: int
    company_id: int
    site_id: int
    asset_name: str
    quantity: int
    category: Optional[str] = None
    condition: Optional[str] = None
    detail: Optional[str] = None
    remark: Optional[str] = None
    created_at: str
    updated_at: str
    site_name: Optional[str] = None  # From relationship

    class Config:
        from_attributes = True


class AssetCreate(BaseModel):
    site_id: int
    asset_name: str
    quantity: int = 1
    category: Optional[str] = None
    condition: Optional[str] = None
    detail: Optional[str] = None
    remark: Optional[str] = None


class AssetUpdate(BaseModel):
    site_id: Optional[int] = None
    asset_name: Optional[str] = None
    quantity: Optional[int] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    detail: Optional[str] = None
    remark: Optional[str] = None


@router.get("", response_model=List[AssetOut])
def list_assets(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
    site_id: Optional[int] = Query(None, description="Filter by site ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    condition: Optional[str] = Query(None, description="Filter by condition"),
):
    """List assets with optional filters"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(Asset).filter(Asset.company_id == company_id)
        
        if site_id:
            query = query.filter(Asset.site_id == site_id)
        if category:
            query = query.filter(Asset.category == category)
        if condition:
            query = query.filter(Asset.condition == condition)
        
        assets = query.order_by(Asset.asset_name).all()
        
        # Add site name to response
        result = []
        for asset in assets:
            asset_dict = {
                "id": asset.id,
                "company_id": asset.company_id,
                "site_id": asset.site_id,
                "asset_name": asset.asset_name,
                "quantity": asset.quantity,
                "category": asset.category,
                "condition": asset.condition,
                "detail": asset.detail,
                "remark": asset.remark,
                "created_at": asset.created_at.isoformat() if asset.created_at else "",
                "updated_at": asset.updated_at.isoformat() if asset.updated_at else "",
                "site_name": asset.site.name if asset.site else None,
            }
            result.append(asset_dict)
        
        return result
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
        
        asset = db.query(Asset).filter(
            Asset.id == asset_id,
            Asset.company_id == company_id
        ).first()
        
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        return {
            "id": asset.id,
            "company_id": asset.company_id,
            "site_id": asset.site_id,
            "asset_name": asset.asset_name,
            "quantity": asset.quantity,
            "category": asset.category,
            "condition": asset.condition,
            "detail": asset.detail,
            "remark": asset.remark,
            "created_at": asset.created_at.isoformat() if asset.created_at else "",
            "updated_at": asset.updated_at.isoformat() if asset.updated_at else "",
            "site_name": asset.site.name if asset.site else None,
        }
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
        user_id = current_user.get("user_id")
        
        # Verify site exists and belongs to company
        site = db.query(Site).filter(
            Site.id == data.site_id,
            Site.company_id == company_id
        ).first()
        
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        
        asset = Asset(
            company_id=company_id,
            site_id=data.site_id,
            asset_name=data.asset_name,
            quantity=data.quantity,
            category=data.category,
            condition=data.condition,
            detail=data.detail,
            remark=data.remark,
            created_by=user_id,
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
        
        return {
            "id": asset.id,
            "company_id": asset.company_id,
            "site_id": asset.site_id,
            "asset_name": asset.asset_name,
            "quantity": asset.quantity,
            "category": asset.category,
            "condition": asset.condition,
            "detail": asset.detail,
            "remark": asset.remark,
            "created_at": asset.created_at.isoformat() if asset.created_at else "",
            "updated_at": asset.updated_at.isoformat() if asset.updated_at else "",
            "site_name": asset.site.name if asset.site else None,
        }
    except HTTPException:
        raise
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
        user_id = current_user.get("user_id")
        
        asset = db.query(Asset).filter(
            Asset.id == asset_id,
            Asset.company_id == company_id
        ).first()
        
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # If site_id is being updated, verify new site exists
        if data.site_id is not None and data.site_id != asset.site_id:
            site = db.query(Site).filter(
                Site.id == data.site_id,
                Site.company_id == company_id
            ).first()
            if not site:
                raise HTTPException(status_code=404, detail="Site not found")
            asset.site_id = data.site_id
        
        if data.asset_name is not None:
            asset.asset_name = data.asset_name
        if data.quantity is not None:
            asset.quantity = data.quantity
        if data.category is not None:
            asset.category = data.category
        if data.condition is not None:
            asset.condition = data.condition
        if data.detail is not None:
            asset.detail = data.detail
        if data.remark is not None:
            asset.remark = data.remark
        
        asset.updated_by = user_id
        db.commit()
        db.refresh(asset)
        
        return {
            "id": asset.id,
            "company_id": asset.company_id,
            "site_id": asset.site_id,
            "asset_name": asset.asset_name,
            "quantity": asset.quantity,
            "category": asset.category,
            "condition": asset.condition,
            "detail": asset.detail,
            "remark": asset.remark,
            "created_at": asset.created_at.isoformat() if asset.created_at else "",
            "updated_at": asset.updated_at.isoformat() if asset.updated_at else "",
            "site_name": asset.site.name if asset.site else None,
        }
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
        
        asset = db.query(Asset).filter(
            Asset.id == asset_id,
            Asset.company_id == company_id
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

