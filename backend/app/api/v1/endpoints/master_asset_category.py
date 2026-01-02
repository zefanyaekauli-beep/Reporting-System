# backend/app/api/v1/endpoints/master_asset_category.py

"""
Master Asset Category API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.master_data import MasterData

router = APIRouter(prefix="/master/asset-category", tags=["master-asset-category"])


class AssetCategoryOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class AssetCategoryCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True


class AssetCategoryUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", response_model=List[AssetCategoryOut])
def list_asset_categories(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List asset categories"""
    try:
        company_id = current_user.get("company_id", 1)
        
        categories = db.query(MasterData).filter(
            MasterData.category == "ASSET_CATEGORY",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        ).order_by(MasterData.sort_order, MasterData.name).all()
        
        return categories
    except Exception as e:
        api_logger.error(f"Error listing asset categories: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_asset_categories")


@router.get("/{category_id}", response_model=AssetCategoryOut)
def get_asset_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get asset category by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        category = db.query(MasterData).filter(
            MasterData.id == category_id,
            MasterData.category == "ASSET_CATEGORY",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Asset category not found")
        
        return category
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting asset category: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_asset_category")


@router.post("", response_model=AssetCategoryOut, status_code=status.HTTP_201_CREATED)
def create_asset_category(
    data: AssetCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create asset category"""
    try:
        company_id = current_user.get("company_id", 1)
        
        category = MasterData(
            company_id=company_id,
            category="ASSET_CATEGORY",
            code=data.code,
            name=data.name,
            description=data.description,
            is_active=data.is_active,
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating asset category: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_asset_category")


@router.put("/{category_id}", response_model=AssetCategoryOut)
def update_asset_category(
    category_id: int,
    data: AssetCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update asset category"""
    try:
        company_id = current_user.get("company_id", 1)
        
        category = db.query(MasterData).filter(
            MasterData.id == category_id,
            MasterData.category == "ASSET_CATEGORY",
            MasterData.company_id == company_id
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Asset category not found")
        
        if data.code is not None:
            category.code = data.code
        if data.name is not None:
            category.name = data.name
        if data.description is not None:
            category.description = data.description
        if data.is_active is not None:
            category.is_active = data.is_active
        
        db.commit()
        db.refresh(category)
        return category
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating asset category: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_asset_category")


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete asset category"""
    try:
        company_id = current_user.get("company_id", 1)
        
        category = db.query(MasterData).filter(
            MasterData.id == category_id,
            MasterData.category == "ASSET_CATEGORY",
            MasterData.company_id == company_id
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Asset category not found")
        
        db.delete(category)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error deleting asset category: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_asset_category")
