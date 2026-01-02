# backend/app/api/v1/endpoints/admin_user_access.py

"""
Admin User Access Matrix API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_admin
from app.models.user import User

router = APIRouter(prefix="/admin/user-access", tags=["admin-user-access"])


class UserAccessMatrixOut(BaseModel):
    user_id: int
    username: str
    role: str
    division: Optional[str] = None
    site_id: Optional[int] = None
    permissions: Dict[str, bool]
    is_active: bool

    class Config:
        from_attributes = True


class PermissionUpdate(BaseModel):
    permissions: Dict[str, bool]


@router.get("", response_model=List[UserAccessMatrixOut])
def get_user_access_matrix(
    role: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Get user access matrix"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(User).filter(User.company_id == company_id)
        
        if role:
            query = query.filter(User.role == role.upper())
        if division:
            query = query.filter(User.division == division.lower())
        
        users = query.order_by(User.username).all()
        
        result = []
        for user in users:
            # Default permissions based on role
            permissions = {
                "view_dashboard": True,
                "view_attendance": user.role in ["SUPERVISOR", "ADMIN"],
                "view_reports": user.role in ["SUPERVISOR", "ADMIN"],
                "view_patrol": user.role in ["SUPERVISOR", "ADMIN", "FIELD"],
                "view_incidents": user.role in ["SUPERVISOR", "ADMIN"],
                "manage_users": user.role == "ADMIN",
                "manage_sites": user.role in ["SUPERVISOR", "ADMIN"],
                "export_data": user.role in ["SUPERVISOR", "ADMIN"],
            }
            
            result.append(UserAccessMatrixOut(
                user_id=user.id,
                username=user.username,
                role=user.role or "",
                division=user.division,
                site_id=user.site_id,
                permissions=permissions,
                is_active=getattr(user, "is_active", True),
            ))
        
        return result
    except Exception as e:
        api_logger.error(f"Error getting user access matrix: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_user_access_matrix")


@router.put("/{user_id}/permissions", response_model=UserAccessMatrixOut)
def update_user_permissions(
    user_id: int,
    permission_data: PermissionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update user permissions"""
    try:
        company_id = current_user.get("company_id", 1)
        user = db.query(User).filter(
            User.id == user_id,
            User.company_id == company_id
        ).first()
        
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # TODO: Store permissions in database (create user_permissions table if needed)
        # For now, return the updated permissions
        return UserAccessMatrixOut(
            user_id=user.id,
            username=user.username,
            role=user.role or "",
            division=user.division,
            site_id=user.site_id,
            permissions=permission_data.permissions,
            is_active=getattr(user, "is_active", True),
        )
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error updating user permissions: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_user_permissions")

