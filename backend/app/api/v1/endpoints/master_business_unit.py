# backend/app/api/v1/endpoints/master_business_unit.py

"""
Master Business Unit API Endpoints
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

router = APIRouter(prefix="/master/business-unit", tags=["master-business-unit"])


class BusinessUnitOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True


class BusinessUnitCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True


class BusinessUnitUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", response_model=List[BusinessUnitOut])
def list_business_units(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List business units"""
    try:
        company_id = current_user.get("company_id", 1)
        
        units = db.query(MasterData).filter(
            MasterData.category == "BUSINESS_UNIT",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        ).order_by(MasterData.sort_order, MasterData.name).all()
        
        return units
    except Exception as e:
        api_logger.error(f"Error listing business units: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_business_units")


@router.get("/{unit_id}", response_model=BusinessUnitOut)
def get_business_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get business unit by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        unit = db.query(MasterData).filter(
            MasterData.id == unit_id,
            MasterData.category == "BUSINESS_UNIT",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        ).first()
        
        if not unit:
            raise HTTPException(status_code=404, detail="Business unit not found")
        
        return unit
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting business unit: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_business_unit")


@router.post("", response_model=BusinessUnitOut, status_code=status.HTTP_201_CREATED)
def create_business_unit(
    data: BusinessUnitCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create business unit"""
    try:
        company_id = current_user.get("company_id", 1)
        
        unit = MasterData(
            company_id=company_id,
            category="BUSINESS_UNIT",
            code=data.code,
            name=data.name,
            description=data.description,
            is_active=data.is_active,
        )
        db.add(unit)
        db.commit()
        db.refresh(unit)
        return unit
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating business unit: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_business_unit")


@router.put("/{unit_id}", response_model=BusinessUnitOut)
def update_business_unit(
    unit_id: int,
    data: BusinessUnitUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update business unit"""
    try:
        company_id = current_user.get("company_id", 1)
        
        unit = db.query(MasterData).filter(
            MasterData.id == unit_id,
            MasterData.category == "BUSINESS_UNIT",
            MasterData.company_id == company_id
        ).first()
        
        if not unit:
            raise HTTPException(status_code=404, detail="Business unit not found")
        
        if data.code is not None:
            unit.code = data.code
        if data.name is not None:
            unit.name = data.name
        if data.description is not None:
            unit.description = data.description
        if data.is_active is not None:
            unit.is_active = data.is_active
        
        db.commit()
        db.refresh(unit)
        return unit
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating business unit: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_business_unit")


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete business unit"""
    try:
        company_id = current_user.get("company_id", 1)
        
        unit = db.query(MasterData).filter(
            MasterData.id == unit_id,
            MasterData.category == "BUSINESS_UNIT",
            MasterData.company_id == company_id
        ).first()
        
        if not unit:
            raise HTTPException(status_code=404, detail="Business unit not found")
        
        db.delete(unit)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error deleting business unit: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_business_unit")

