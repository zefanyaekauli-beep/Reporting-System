# backend/app/api/v1/endpoints/master_job_position.py

"""
Master Job Position API Endpoints
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

router = APIRouter(prefix="/master/job-position", tags=["master-job-position"])


class JobPositionOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    division: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class JobPositionCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    division: Optional[str] = None
    is_active: bool = True


class JobPositionUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    division: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", response_model=List[JobPositionOut])
def list_job_positions(
    division: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List job positions"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(MasterData).filter(
            MasterData.category == "JOB_POSITION",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        )
        
        if division:
            query = query.filter(
                (MasterData.division == division.upper()) | (MasterData.division.is_(None))
            )
        
        positions = query.order_by(MasterData.sort_order, MasterData.name).all()
        return positions
    except Exception as e:
        api_logger.error(f"Error listing job positions: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_job_positions")


@router.get("/{position_id}", response_model=JobPositionOut)
def get_job_position(
    position_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get job position by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        position = db.query(MasterData).filter(
            MasterData.id == position_id,
            MasterData.category == "JOB_POSITION",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        ).first()
        
        if not position:
            raise HTTPException(status_code=404, detail="Job position not found")
        
        return position
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting job position: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_job_position")


@router.post("", response_model=JobPositionOut, status_code=status.HTTP_201_CREATED)
def create_job_position(
    data: JobPositionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create job position"""
    try:
        company_id = current_user.get("company_id", 1)
        
        position = MasterData(
            company_id=company_id,
            category="JOB_POSITION",
            code=data.code,
            name=data.name,
            description=data.description,
            division=data.division.upper() if data.division else None,
            is_active=data.is_active,
        )
        db.add(position)
        db.commit()
        db.refresh(position)
        return position
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating job position: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_job_position")


@router.put("/{position_id}", response_model=JobPositionOut)
def update_job_position(
    position_id: int,
    data: JobPositionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update job position"""
    try:
        company_id = current_user.get("company_id", 1)
        
        position = db.query(MasterData).filter(
            MasterData.id == position_id,
            MasterData.category == "JOB_POSITION",
            MasterData.company_id == company_id
        ).first()
        
        if not position:
            raise HTTPException(status_code=404, detail="Job position not found")
        
        if data.code is not None:
            position.code = data.code
        if data.name is not None:
            position.name = data.name
        if data.description is not None:
            position.description = data.description
        if data.division is not None:
            position.division = data.division.upper() if data.division else None
        if data.is_active is not None:
            position.is_active = data.is_active
        
        db.commit()
        db.refresh(position)
        return position
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating job position: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_job_position")


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_position(
    position_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete job position"""
    try:
        company_id = current_user.get("company_id", 1)
        
        position = db.query(MasterData).filter(
            MasterData.id == position_id,
            MasterData.category == "JOB_POSITION",
            MasterData.company_id == company_id
        ).first()
        
        if not position:
            raise HTTPException(status_code=404, detail="Job position not found")
        
        db.delete(position)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error deleting job position: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_job_position")
