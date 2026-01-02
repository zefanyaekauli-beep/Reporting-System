# backend/app/api/v1/endpoints/patrol_assignments.py

"""
Patrol Assignment API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor, get_current_user
from app.schemas.patrol import (
    PatrolAssignmentBase,
    PatrolAssignmentCreate,
)
from app.models.patrol_schedule import PatrolAssignment, AssignmentStatus
from app.models.user import User

router = APIRouter(prefix="/patrol/assignments", tags=["patrol-assignments"])


@router.post("", response_model=PatrolAssignmentBase, status_code=status.HTTP_201_CREATED)
def create_patrol_assignment(
    data: PatrolAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create a new patrol assignment"""
    try:
        assignment = PatrolAssignment(
            schedule_id=data.schedule_id,
            user_id=data.user_id,
            is_lead=data.is_lead,
            status=AssignmentStatus.ASSIGNED.value,
            notes=data.notes,
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating patrol assignment: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_patrol_assignment")


@router.get("", response_model=List[PatrolAssignmentBase])
def list_patrol_assignments(
    schedule_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List patrol assignments"""
    try:
        query = db.query(PatrolAssignment)
        
        if schedule_id:
            query = query.filter(PatrolAssignment.schedule_id == schedule_id)
        if user_id:
            query = query.filter(PatrolAssignment.user_id == user_id)
        if status:
            query = query.filter(PatrolAssignment.status == status)
        
        assignments = query.order_by(PatrolAssignment.assigned_at.desc()).offset(skip).limit(limit).all()
        return assignments
    except Exception as e:
        api_logger.error(f"Error listing patrol assignments: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_patrol_assignments")


@router.get("/{assignment_id}", response_model=PatrolAssignmentBase)
def get_patrol_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get patrol assignment by ID"""
    try:
        assignment = db.query(PatrolAssignment).filter(
            PatrolAssignment.id == assignment_id,
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patrol assignment not found"
            )
        return assignment
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting patrol assignment: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_patrol_assignment")


@router.post("/{assignment_id}/start", response_model=PatrolAssignmentBase)
def start_patrol(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Start a patrol assignment"""
    try:
        assignment = db.query(PatrolAssignment).filter(
            PatrolAssignment.id == assignment_id,
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patrol assignment not found"
            )
        
        if assignment.status != AssignmentStatus.ASSIGNED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patrol can only be started from ASSIGNED status"
            )
        
        assignment.status = AssignmentStatus.IN_PROGRESS.value
        assignment.started_at = datetime.utcnow()
        
        db.commit()
        db.refresh(assignment)
        return assignment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error starting patrol: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "start_patrol")


@router.post("/{assignment_id}/complete", response_model=PatrolAssignmentBase)
def complete_patrol(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Complete a patrol assignment"""
    try:
        assignment = db.query(PatrolAssignment).filter(
            PatrolAssignment.id == assignment_id,
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patrol assignment not found"
            )
        
        if assignment.status != AssignmentStatus.IN_PROGRESS.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patrol can only be completed from IN_PROGRESS status"
            )
        
        assignment.status = AssignmentStatus.COMPLETED.value
        assignment.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(assignment)
        return assignment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error completing patrol: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "complete_patrol")


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patrol_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete a patrol assignment"""
    try:
        assignment = db.query(PatrolAssignment).filter(
            PatrolAssignment.id == assignment_id,
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patrol assignment not found"
            )
        
        # Check if assignment can be deleted (only if not started/completed)
        if assignment.status in [AssignmentStatus.IN_PROGRESS.value, AssignmentStatus.COMPLETED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete assignment that is in progress or completed"
            )
        
        db.delete(assignment)
        db.commit()
        
        api_logger.info(f"Deleted patrol assignment {assignment_id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error deleting patrol assignment: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_patrol_assignment")

