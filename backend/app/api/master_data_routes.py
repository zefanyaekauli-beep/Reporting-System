# backend/app/api/master_data_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_supervisor
from app.models.master_data import MasterData

router = APIRouter(prefix="/master-data", tags=["master-data"])


class MasterDataBase(BaseModel):
    id: int
    company_id: Optional[int] = None
    category: str
    code: str
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    extra_data: Optional[dict] = None  # Renamed from metadata to avoid SQLAlchemy reserved word
    sort_order: int
    is_active: bool
    division: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MasterDataCreate(BaseModel):
    category: str
    code: str
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    extra_data: Optional[dict] = None  # Renamed from metadata to avoid SQLAlchemy reserved word
    sort_order: int = 0
    is_active: bool = True
    division: Optional[str] = None


class MasterDataUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    extra_data: Optional[dict] = None  # Renamed from metadata to avoid SQLAlchemy reserved word
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    division: Optional[str] = None


@router.get("/{category}", response_model=List[MasterDataBase])
def get_master_data_by_category(
    category: str,
    division: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get master data by category."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(MasterData).filter(
            MasterData.category == category.upper(),
        )
        
        # Filter by company_id if not global (company_id is NULL for global)
        q = q.filter(
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        )
        
        if division:
            q = q.filter(
                (MasterData.division == division.upper()) | (MasterData.division.is_(None))
            )
        
        if is_active is not None:
            q = q.filter(MasterData.is_active == is_active)
        
        data = q.order_by(MasterData.sort_order.asc(), MasterData.name.asc()).all()
        
        api_logger.info(f"Retrieved {len(data)} master data items for category {category}")
        return data
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting master data: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get master data: {error_msg}"
        )


@router.get("", response_model=List[MasterDataBase])
def list_master_data(
    category: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """List all master data (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(MasterData).filter(
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        )
        
        if category:
            q = q.filter(MasterData.category == category.upper())
        if division:
            q = q.filter(
                (MasterData.division == division.upper()) | (MasterData.division.is_(None))
            )
        if is_active is not None:
            q = q.filter(MasterData.is_active == is_active)
        
        data = q.order_by(MasterData.category.asc(), MasterData.sort_order.asc(), MasterData.name.asc()).all()
        
        return data
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing master data: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list master data: {error_msg}"
        )


@router.post("", response_model=MasterDataBase, status_code=201)
def create_master_data(
    payload: MasterDataCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Create master data (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        # Check if code already exists in category
        existing = (
            db.query(MasterData)
            .filter(
                MasterData.category == payload.category.upper(),
                MasterData.code == payload.code.upper(),
                (MasterData.company_id == company_id) | (MasterData.company_id.is_(None)),
            )
            .first()
        )
        
        if existing:
            raise HTTPException(status_code=400, detail=f"Code {payload.code} already exists in category {payload.category}")
        
        master_data = MasterData(
            company_id=company_id,
            category=payload.category.upper(),
            code=payload.code.upper(),
            name=payload.name,
            description=payload.description,
            parent_id=payload.parent_id,
            extra_data=payload.extra_data,
            sort_order=payload.sort_order,
            is_active=payload.is_active,
            division=payload.division.upper() if payload.division else None,
            created_by=user_id,
        )
        
        db.add(master_data)
        db.commit()
        db.refresh(master_data)
        
        api_logger.info(f"Created master data {master_data.id} in category {payload.category} by user {user_id}")
        return master_data
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error creating master data: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create master data: {error_msg}"
        )


@router.put("/{master_data_id}", response_model=MasterDataBase)
def update_master_data(
    master_data_id: int,
    payload: MasterDataUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Update master data (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        master_data = (
            db.query(MasterData)
            .filter(
                MasterData.id == master_data_id,
                (MasterData.company_id == company_id) | (MasterData.company_id.is_(None)),
            )
            .first()
        )
        
        if not master_data:
            raise HTTPException(status_code=404, detail="Master data not found")
        
        # Update fields
        if payload.name is not None:
            master_data.name = payload.name
        if payload.description is not None:
            master_data.description = payload.description
        if payload.parent_id is not None:
            master_data.parent_id = payload.parent_id
        if payload.extra_data is not None:
            master_data.extra_data = payload.extra_data
        if payload.sort_order is not None:
            master_data.sort_order = payload.sort_order
        if payload.is_active is not None:
            master_data.is_active = payload.is_active
        if payload.division is not None:
            master_data.division = payload.division.upper()
        
        master_data.updated_by = user_id
        master_data.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(master_data)
        
        api_logger.info(f"Updated master data {master_data_id} by user {user_id}")
        return master_data
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error updating master data: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update master data: {error_msg}"
        )


@router.delete("/{master_data_id}", status_code=204)
def delete_master_data(
    master_data_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Delete master data (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        master_data = (
            db.query(MasterData)
            .filter(
                MasterData.id == master_data_id,
                (MasterData.company_id == company_id) | (MasterData.company_id.is_(None)),
            )
            .first()
        )
        
        if not master_data:
            raise HTTPException(status_code=404, detail="Master data not found")
        
        db.delete(master_data)
        db.commit()
        
        api_logger.info(f"Deleted master data {master_data_id} by user {current_user.get('id')}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error deleting master data: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete master data: {error_msg}"
        )

