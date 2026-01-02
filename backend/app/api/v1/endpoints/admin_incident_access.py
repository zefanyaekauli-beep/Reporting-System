# backend/app/api/v1/endpoints/admin_incident_access.py

"""
Admin Incident Access Control API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_admin
from app.models.user import User

router = APIRouter(prefix="/admin/incident-access", tags=["admin-incident-access"])


class IncidentAccessOut(BaseModel):
    user_id: int
    username: str
    role: str
    can_view_lklp: bool
    can_create_lklp: bool
    can_approve_lklp: bool
    can_view_bap: bool
    can_create_bap: bool
    can_approve_bap: bool
    can_view_stplk: bool
    can_create_stplk: bool
    can_approve_stplk: bool
    can_view_findings: bool
    can_create_findings: bool
    can_approve_findings: bool

    class Config:
        from_attributes = True


class IncidentAccessUpdate(BaseModel):
    can_view_lklp: Optional[bool] = None
    can_create_lklp: Optional[bool] = None
    can_approve_lklp: Optional[bool] = None
    can_view_bap: Optional[bool] = None
    can_create_bap: Optional[bool] = None
    can_approve_bap: Optional[bool] = None
    can_view_stplk: Optional[bool] = None
    can_create_stplk: Optional[bool] = None
    can_approve_stplk: Optional[bool] = None
    can_view_findings: Optional[bool] = None
    can_create_findings: Optional[bool] = None
    can_approve_findings: Optional[bool] = None


@router.get("", response_model=List[IncidentAccessOut])
def list_incident_access(
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """List incident access permissions"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(User).filter(User.company_id == company_id)
        
        if role:
            query = query.filter(User.role == role.upper())
        
        users = query.order_by(User.username).all()
        
        result = []
        for user in users:
            role_upper = (user.role or "").upper()
            is_supervisor = role_upper in ["SUPERVISOR", "ADMIN"]
            is_admin = role_upper == "ADMIN"
            
            result.append(IncidentAccessOut(
                user_id=user.id,
                username=user.username,
                role=user.role or "",
                can_view_lklp=is_supervisor,
                can_create_lklp=is_supervisor,
                can_approve_lklp=is_admin,
                can_view_bap=is_supervisor,
                can_create_bap=is_supervisor,
                can_approve_bap=is_admin,
                can_view_stplk=is_supervisor,
                can_create_stplk=is_supervisor,
                can_approve_stplk=is_admin,
                can_view_findings=is_supervisor,
                can_create_findings=is_supervisor,
                can_approve_findings=is_admin,
            ))
        
        return result
    except Exception as e:
        api_logger.error(f"Error listing incident access: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_incident_access")


@router.put("/{user_id}", response_model=IncidentAccessOut)
def update_incident_access(
    user_id: int,
    access_data: IncidentAccessUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update incident access permissions"""
    try:
        company_id = current_user.get("company_id", 1)
        user = db.query(User).filter(
            User.id == user_id,
            User.company_id == company_id
        ).first()
        
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # TODO: Store in database (create incident_access table if needed)
        # For now, return default based on role
        role_upper = (user.role or "").upper()
        is_supervisor = role_upper in ["SUPERVISOR", "ADMIN"]
        is_admin = role_upper == "ADMIN"
        
        return IncidentAccessOut(
            user_id=user.id,
            username=user.username,
            role=user.role or "",
            can_view_lklp=access_data.can_view_lklp if access_data.can_view_lklp is not None else is_supervisor,
            can_create_lklp=access_data.can_create_lklp if access_data.can_create_lklp is not None else is_supervisor,
            can_approve_lklp=access_data.can_approve_lklp if access_data.can_approve_lklp is not None else is_admin,
            can_view_bap=access_data.can_view_bap if access_data.can_view_bap is not None else is_supervisor,
            can_create_bap=access_data.can_create_bap if access_data.can_create_bap is not None else is_supervisor,
            can_approve_bap=access_data.can_approve_bap if access_data.can_approve_bap is not None else is_admin,
            can_view_stplk=access_data.can_view_stplk if access_data.can_view_stplk is not None else is_supervisor,
            can_create_stplk=access_data.can_create_stplk if access_data.can_create_stplk is not None else is_supervisor,
            can_approve_stplk=access_data.can_approve_stplk if access_data.can_approve_stplk is not None else is_admin,
            can_view_findings=access_data.can_view_findings if access_data.can_view_findings is not None else is_supervisor,
            can_create_findings=access_data.can_create_findings if access_data.can_create_findings is not None else is_supervisor,
            can_approve_findings=access_data.can_approve_findings if access_data.can_approve_findings is not None else is_admin,
        )
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error updating incident access: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_incident_access")

