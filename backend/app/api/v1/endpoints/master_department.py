# backend/app/api/v1/endpoints/master_department.py

"""
Master Department API Endpoints
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

router = APIRouter(prefix="/master/department", tags=["master-department"])


class DepartmentOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True


class DepartmentCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True


class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", response_model=List[DepartmentOut])
def list_departments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List departments"""
    try:
        company_id = current_user.get("company_id", 1)
        
        departments = db.query(MasterData).filter(
            MasterData.category == "DEPARTMENT",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        ).order_by(MasterData.sort_order, MasterData.name).all()
        
        return departments
    except Exception as e:
        api_logger.error(f"Error listing departments: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_departments")


@router.get("/{dept_id}", response_model=DepartmentOut)
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get department by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        dept = db.query(MasterData).filter(
            MasterData.id == dept_id,
            MasterData.category == "DEPARTMENT",
            (MasterData.company_id == company_id) | (MasterData.company_id.is_(None))
        ).first()
        
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        
        return dept
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting department: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_department")


@router.post("", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create department"""
    try:
        company_id = current_user.get("company_id", 1)
        
        dept = MasterData(
            company_id=company_id,
            category="DEPARTMENT",
            code=data.code,
            name=data.name,
            description=data.description,
            is_active=data.is_active,
        )
        db.add(dept)
        db.commit()
        db.refresh(dept)
        return dept
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating department: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_department")


@router.put("/{dept_id}", response_model=DepartmentOut)
def update_department(
    dept_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update department"""
    try:
        company_id = current_user.get("company_id", 1)
        
        dept = db.query(MasterData).filter(
            MasterData.id == dept_id,
            MasterData.category == "DEPARTMENT",
            MasterData.company_id == company_id
        ).first()
        
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        
        if data.code is not None:
            dept.code = data.code
        if data.name is not None:
            dept.name = data.name
        if data.description is not None:
            dept.description = data.description
        if data.is_active is not None:
            dept.is_active = data.is_active
        
        db.commit()
        db.refresh(dept)
        return dept
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating department: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_department")


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete department"""
    try:
        company_id = current_user.get("company_id", 1)
        
        dept = db.query(MasterData).filter(
            MasterData.id == dept_id,
            MasterData.category == "DEPARTMENT",
            MasterData.company_id == company_id
        ).first()
        
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        
        db.delete(dept)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error deleting department: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_department")

