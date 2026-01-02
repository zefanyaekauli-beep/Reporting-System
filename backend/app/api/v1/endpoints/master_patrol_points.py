# backend/app/api/v1/endpoints/master_patrol_points.py

"""
Master Patrol Points API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.inspect_point import InspectPoint

router = APIRouter(prefix="/master/patrol-points", tags=["master-patrol-points"])


class PatrolPointOut(BaseModel):
    id: int
    site_id: int
    name: str
    code: str  # QR code content
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class PatrolPointCreate(BaseModel):
    site_id: int
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool = True


class PatrolPointUpdate(BaseModel):
    site_id: Optional[int] = None
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", response_model=List[PatrolPointOut])
def list_patrol_points(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List patrol points"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(InspectPoint).filter(InspectPoint.company_id == company_id)
        
        if site_id:
            query = query.filter(InspectPoint.site_id == site_id)
        
        points = query.order_by(InspectPoint.name).all()
        return points
    except Exception as e:
        api_logger.error(f"Error listing patrol points: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_patrol_points")


@router.get("/{point_id}", response_model=PatrolPointOut)
def get_patrol_point(
    point_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get patrol point by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        point = db.query(InspectPoint).filter(
            InspectPoint.id == point_id,
            InspectPoint.company_id == company_id
        ).first()
        
        if not point:
            raise HTTPException(status_code=404, detail="Patrol point not found")
        
        return point
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting patrol point: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_patrol_point")


@router.post("", response_model=PatrolPointOut, status_code=status.HTTP_201_CREATED)
def create_patrol_point(
    data: PatrolPointCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create patrol point"""
    try:
        company_id = current_user.get("company_id", 1)
        
        point = InspectPoint(
            company_id=company_id,
            site_id=data.site_id,
            name=data.name,
            code=data.code,
            description=data.description,
            is_active=data.is_active,
        )
        db.add(point)
        db.commit()
        db.refresh(point)
        return point
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating patrol point: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_patrol_point")


@router.put("/{point_id}", response_model=PatrolPointOut)
def update_patrol_point(
    point_id: int,
    data: PatrolPointUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update patrol point"""
    try:
        company_id = current_user.get("company_id", 1)
        
        point = db.query(InspectPoint).filter(
            InspectPoint.id == point_id,
            InspectPoint.company_id == company_id
        ).first()
        
        if not point:
            raise HTTPException(status_code=404, detail="Patrol point not found")
        
        if data.site_id is not None:
            point.site_id = data.site_id
        if data.name is not None:
            point.name = data.name
        if data.code is not None:
            point.code = data.code
        if data.description is not None:
            point.description = data.description
        if data.is_active is not None:
            point.is_active = data.is_active
        
        db.commit()
        db.refresh(point)
        return point
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating patrol point: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_patrol_point")


@router.delete("/{point_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patrol_point(
    point_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete patrol point"""
    try:
        company_id = current_user.get("company_id", 1)
        
        point = db.query(InspectPoint).filter(
            InspectPoint.id == point_id,
            InspectPoint.company_id == company_id
        ).first()
        
        if not point:
            raise HTTPException(status_code=404, detail="Patrol point not found")
        
        db.delete(point)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error deleting patrol point: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_patrol_point")
