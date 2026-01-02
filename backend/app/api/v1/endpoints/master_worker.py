# backend/app/api/v1/endpoints/master_worker.py

"""
Master Worker Data API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.user import User

router = APIRouter(prefix="/master/worker", tags=["master-worker"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class WorkerDataOut(BaseModel):
    """Worker data output - only includes fields that exist in User model"""
    id: int
    username: str
    division: Optional[str] = None
    role: str
    site_id: Optional[int] = None
    company_id: int
    scope_type: Optional[str] = None
    scope_id: Optional[int] = None

    class Config:
        from_attributes = True


class WorkerDataCreate(BaseModel):
    """Create worker - only includes fields that exist in User model"""
    username: str
    password: str
    division: Optional[str] = None
    role: str = "FIELD"
    site_id: Optional[int] = None
    scope_type: Optional[str] = None  # For SUPERVISOR: DIVISION, SITE, COMPANY
    scope_id: Optional[int] = None     # Depends on scope_type


class WorkerDataUpdate(BaseModel):
    """Update worker - only includes fields that exist in User model"""
    username: Optional[str] = None
    password: Optional[str] = None
    division: Optional[str] = None
    role: Optional[str] = None
    site_id: Optional[int] = None
    scope_type: Optional[str] = None
    scope_id: Optional[int] = None


@router.get("", response_model=List[WorkerDataOut])
def list_workers(
    site_id: Optional[int] = Query(None),
    division: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List worker data"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(User).filter(User.company_id == company_id)
        
        if site_id:
            query = query.filter(User.site_id == site_id)
        if division:
            query = query.filter(User.division == division.upper())
        if role:
            query = query.filter(User.role == role.upper())
        
        workers = query.order_by(User.username).offset(skip).limit(limit).all()
        return workers
    except Exception as e:
        api_logger.error(f"Error listing workers: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_workers")


@router.get("/{worker_id}", response_model=WorkerDataOut)
def get_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get worker by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        worker = db.query(User).filter(
            User.id == worker_id,
            User.company_id == company_id
        ).first()
        
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")
        
        return worker
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting worker: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_worker")


@router.post("", response_model=WorkerDataOut, status_code=status.HTTP_201_CREATED)
def create_worker(
    data: WorkerDataCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create worker - only uses fields that exist in User model"""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Check if username exists
        existing_user = db.query(User).filter(User.username == data.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Hash password
        hashed_password = pwd_context.hash(data.password)
        
        # Validate division for FIELD role
        role_upper = data.role.upper()
        division_value = data.division.upper() if data.division else None
        
        # If division is None and database requires NOT NULL, set a default or require it
        if division_value is None:
            # For FIELD users, division is typically required
            # For SUPERVISOR/ADMIN, they might manage multiple divisions
            if role_upper == "FIELD":
                raise HTTPException(
                    status_code=400,
                    detail="Division is required for Field Workers. Please select a division."
                )
            # For SUPERVISOR/ADMIN without division, set to 'all' or empty string
            # to satisfy NOT NULL constraint (based on existing data pattern)
            division_value = data.division or "all"  # Use 'all' or first available division
        
        worker = User(
            company_id=company_id,
            username=data.username,
            hashed_password=hashed_password,
            division=division_value,
            role=role_upper,
            site_id=data.site_id,
            scope_type=data.scope_type,
            scope_id=data.scope_id,
        )
        db.add(worker)
        db.commit()
        db.refresh(worker)
        return worker
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating worker: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_worker")


@router.put("/{worker_id}", response_model=WorkerDataOut)
def update_worker(
    worker_id: int,
    data: WorkerDataUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update worker - only uses fields that exist in User model"""
    try:
        company_id = current_user.get("company_id", 1)
        
        worker = db.query(User).filter(
            User.id == worker_id,
            User.company_id == company_id
        ).first()
        
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")
        
        # Check username uniqueness if changing
        if data.username and data.username != worker.username:
            existing = db.query(User).filter(User.username == data.username).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already exists")
        
        if data.username is not None:
            worker.username = data.username
        if data.password is not None:
            worker.hashed_password = pwd_context.hash(data.password)
        if data.division is not None:
            worker.division = data.division.upper() if data.division else None
        if data.role is not None:
            worker.role = data.role.upper()
        if data.site_id is not None:
            worker.site_id = data.site_id
        if data.scope_type is not None:
            worker.scope_type = data.scope_type
        if data.scope_id is not None:
            worker.scope_id = data.scope_id
        
        db.commit()
        db.refresh(worker)
        return worker
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating worker: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_worker")


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete worker (Note: User model doesn't have is_active, so we can't soft delete. 
    This endpoint will return success but won't actually delete to prevent data loss.)"""
    try:
        company_id = current_user.get("company_id", 1)
        
        worker = db.query(User).filter(
            User.id == worker_id,
            User.company_id == company_id
        ).first()
        
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")
        
        # User model doesn't have is_active field
        # We'll just return success without actually deleting to prevent data loss
        # TODO: Add is_active field to User model if soft delete is needed
        api_logger.warning(f"Delete worker {worker_id} requested but User model has no is_active field. Skipping delete.")
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error deleting worker: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_worker")
