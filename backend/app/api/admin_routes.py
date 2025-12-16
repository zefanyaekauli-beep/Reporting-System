# backend/app/api/admin_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_admin
from app.models.user import User
import enum

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    GUARD = "GUARD"
    CLEANER = "CLEANER"
    DRIVER = "DRIVER"

router = APIRouter(prefix="/admin", tags=["admin"])


class UserPermission(BaseModel):
    user_id: int
    username: str
    role: str
    permissions: List[str]
    is_active: bool


class PermissionUpdate(BaseModel):
    permissions: List[str]


# require_admin is imported from app.api.deps


@router.get("/users", response_model=List[dict])
def list_users_with_permissions(
    role: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """List all users with their roles (admin only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(User).filter(User.company_id == company_id)
        
        if role:
            q = q.filter(User.role == role.upper())
        if division:
            q = q.filter(User.division == division.lower())
        if is_active is not None:
            # Check if User model has is_active field
            if hasattr(User, 'is_active'):
                q = q.filter(User.is_active == is_active)
        
        users = q.order_by(User.username.asc()).all()
        
        result = []
        for user in users:
            result.append({
                "id": user.id,
                "username": user.username,
                "role": user.role or "",
                "role_id": user.role_id,
                "division": user.division or "",
                "company_id": user.company_id,
                "site_id": user.site_id,
            })
        
        api_logger.info(f"Listed {len(result)} users for admin {current_user.get('id')}")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing users: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list users: {error_msg}"
        )


@router.patch("/users/{user_id}")
def update_user_role(
    user_id: int,
    role_id: Optional[int] = Body(None, embed=True),
    role: Optional[str] = Body(None, embed=True),
    division: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update user role or division (admin only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        user = (
            db.query(User)
            .filter(
                User.id == user_id,
                User.company_id == company_id,
            )
            .first()
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if role_id is not None:
            user.role_id = role_id
        if role is not None:
            user.role = role.upper()
        if division is not None:
            user.division = division.lower()
        
        db.commit()
        db.refresh(user)
        
        api_logger.info(f"Updated user {user_id} by admin {current_user.get('id')}")
        
        return {
            "id": user.id,
            "username": user.username,
            "role": user.role or "",
            "role_id": user.role_id,
            "division": user.division or "",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error updating user: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update user: {error_msg}"
        )


@router.put("/users/{user_id}/permissions", response_model=UserPermission)
def update_user_permissions(
    user_id: int,
    payload: PermissionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update user permissions (admin only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        user = (
            db.query(User)
            .filter(
                User.id == user_id,
                User.company_id == company_id,
            )
            .first()
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # In production, you might store custom permissions in a separate table
        # For now, we'll just validate and log
        valid_permissions = [
            "VIEW_REPORTS", "CREATE_REPORTS", "EDIT_REPORTS", "DELETE_REPORTS",
            "VIEW_PATROLS", "CREATE_PATROLS", "EDIT_PATROLS",
            "VIEW_ATTENDANCE", "EDIT_ATTENDANCE",
            "VIEW_PAYROLL", "MANAGE_PAYROLL",
            "VIEW_EMPLOYEES", "MANAGE_EMPLOYEES",
            "VIEW_MASTER_DATA", "MANAGE_MASTER_DATA",
            "VIEW_CCTV", "MANAGE_CCTV",
            "VIEW_CONTROL_CENTER", "MANAGE_CONTROL_CENTER",
        ]
        
        # Validate permissions
        for perm in payload.permissions:
            if perm not in valid_permissions:
                raise HTTPException(status_code=400, detail=f"Invalid permission: {perm}")
        
        # TODO: Store permissions in database (create permissions table)
        # For now, just log
        api_logger.info(f"Updated permissions for user {user_id}: {payload.permissions}")
        
        permissions = payload.permissions
        
        return UserPermission(
            user_id=user.id,
            username=user.username,
            role=user.role.value if hasattr(user.role, 'value') else str(user.role),
            permissions=permissions,
            is_active=user.is_active,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error updating permissions: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update permissions: {error_msg}"
        )


@router.get("/roles", response_model=List[dict])
def list_roles(
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """List all roles (admin only)."""
    try:
        from app.models.permission import Role
        
        q = db.query(Role)
        if is_active is not None:
            q = q.filter(Role.is_active == is_active)
        
        roles = q.order_by(Role.name.asc()).all()
        
        result = []
        for role in roles:
            result.append({
                "id": role.id,
                "name": role.name,
                "display_name": getattr(role, 'display_name', None),
                "description": getattr(role, 'description', None),
                "is_active": getattr(role, 'is_active', True),
                "is_system": getattr(role, 'is_system', getattr(role, 'is_system_role', False)),
                "created_at": role.created_at.isoformat() if role.created_at else None,
                "updated_at": getattr(role, 'updated_at', None).isoformat() if getattr(role, 'updated_at', None) else None,
            })
        
        api_logger.info(f"Listed {len(result)} roles for admin {current_user.get('id')}")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing roles: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list roles: {error_msg}"
        )


@router.get("/permissions", response_model=List[dict])
def list_available_permissions(
    resource: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """List all available permissions (admin only)."""
    try:
        from app.models.permission import Permission
        
        q = db.query(Permission)
        if resource:
            q = q.filter(Permission.resource == resource)
        if action:
            q = q.filter(Permission.action == action)
        if is_active is not None:
            q = q.filter(Permission.is_active == is_active)
        
        permissions = q.order_by(Permission.resource.asc(), Permission.action.asc()).all()
        
        result = []
        for perm in permissions:
            result.append({
                "id": perm.id,
                "name": perm.name,
                "resource": perm.resource,
                "action": perm.action,
                "description": getattr(perm, 'description', None),
                "is_active": getattr(perm, 'is_active', True),
                "created_at": getattr(perm, 'created_at', None).isoformat() if getattr(perm, 'created_at', None) else None,
            })
        
        api_logger.info(f"Listed {len(result)} permissions for admin {current_user.get('id')}")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing permissions: {error_type} - {error_msg}", exc_info=True)
        # Fallback to empty list - permissions should be created via script
        api_logger.warning("Returning empty permissions list. Please run create_default_permissions.py script.")
        return []


def get_permissions_for_role(role: str) -> List[str]:
    """Get default permissions for a role."""
    role_permissions = {
        "SUPER_ADMIN": [
            "VIEW_REPORTS", "CREATE_REPORTS", "EDIT_REPORTS", "DELETE_REPORTS",
            "VIEW_PATROLS", "CREATE_PATROLS", "EDIT_PATROLS",
            "VIEW_ATTENDANCE", "EDIT_ATTENDANCE",
            "VIEW_PAYROLL", "MANAGE_PAYROLL",
            "VIEW_EMPLOYEES", "MANAGE_EMPLOYEES",
            "VIEW_MASTER_DATA", "MANAGE_MASTER_DATA",
            "VIEW_CCTV", "MANAGE_CCTV",
            "VIEW_CONTROL_CENTER", "MANAGE_CONTROL_CENTER",
            "VIEW_TRAINING", "MANAGE_TRAINING",
            "VIEW_VISITORS", "MANAGE_VISITORS",
            "VIEW_DOCUMENTS", "MANAGE_DOCUMENTS",
        ],
        "ADMIN": [
            "VIEW_REPORTS", "CREATE_REPORTS", "EDIT_REPORTS",
            "VIEW_PATROLS", "CREATE_PATROLS",
            "VIEW_ATTENDANCE", "EDIT_ATTENDANCE",
            "VIEW_PAYROLL", "MANAGE_PAYROLL",
            "VIEW_EMPLOYEES", "MANAGE_EMPLOYEES",
            "VIEW_MASTER_DATA", "MANAGE_MASTER_DATA",
            "VIEW_CCTV", "MANAGE_CCTV",
            "VIEW_CONTROL_CENTER",
            "VIEW_TRAINING", "MANAGE_TRAINING",
            "VIEW_VISITORS", "MANAGE_VISITORS",
            "VIEW_DOCUMENTS", "MANAGE_DOCUMENTS",
        ],
        "SUPERVISOR": [
            "VIEW_REPORTS", "CREATE_REPORTS", "EDIT_REPORTS",
            "VIEW_PATROLS", "CREATE_PATROLS",
            "VIEW_ATTENDANCE", "EDIT_ATTENDANCE",
            "VIEW_EMPLOYEES",
            "VIEW_MASTER_DATA",
            "VIEW_CCTV",
            "VIEW_CONTROL_CENTER",
            "VIEW_TRAINING",
            "VIEW_VISITORS", "MANAGE_VISITORS",
        ],
        "GUARD": [
            "VIEW_REPORTS", "CREATE_REPORTS",
            "VIEW_PATROLS", "CREATE_PATROLS",
            "VIEW_ATTENDANCE",
        ],
        "CLEANER": [
            "VIEW_REPORTS", "CREATE_REPORTS",
            "VIEW_ATTENDANCE",
        ],
    }
    
    return role_permissions.get(role, [])


@router.get("/roles/{role_id}/permissions", response_model=List[dict])
def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Get role permissions (admin only)."""
    try:
        from app.models.permission import Role, Permission
        from sqlalchemy.orm import joinedload
        
        # Use joinedload to eagerly load permissions
        role = db.query(Role).options(joinedload(Role.permissions)).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Get permissions from role relationship
        permissions = role.permissions if hasattr(role, 'permissions') and role.permissions else []
        
        result = []
        for perm in permissions:
            result.append({
                "id": perm.id,
                "name": perm.name,
                "resource": perm.resource,
                "action": perm.action,
                "description": getattr(perm, 'description', None),
                "is_active": getattr(perm, 'is_active', True),
            })
        
        api_logger.info(f"Retrieved {len(result)} permissions for role {role_id} (name: {role.name})")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting role permissions: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get role permissions: {error_msg}"
        )


@router.post("/roles/{role_id}/permissions")
def update_role_permissions(
    role_id: int,
    permission_ids: List[int] = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update role permissions (admin only)."""
    try:
        from app.models.permission import Role, Permission
        
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Get permissions
        permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        if len(permissions) != len(permission_ids):
            raise HTTPException(status_code=400, detail="Some permissions not found")
        
        # Update role permissions
        role.permissions = permissions
        db.commit()
        db.refresh(role)
        
        api_logger.info(f"Updated permissions for role {role_id} by admin {current_user.get('id')}")
        
        return {
            "message": "Role permissions updated successfully",
            "role_id": role_id,
            "permission_count": len(permissions),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error updating role permissions: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update role permissions: {error_msg}"
        )


@router.post("/users/{user_id}/permissions")
def update_user_permissions_db(
    user_id: int,
    permission_ids: List[int] = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update user permissions directly (admin only)."""
    try:
        from app.models.permission import Permission
        
        company_id = current_user.get("company_id", 1)
        
        user = (
            db.query(User)
            .filter(
                User.id == user_id,
                User.company_id == company_id,
            )
            .first()
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get permissions
        permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        if len(permissions) != len(permission_ids):
            raise HTTPException(status_code=400, detail="Some permissions not found")
        
        # Update user permissions
        user.permissions = permissions
        db.commit()
        db.refresh(user)
        
        api_logger.info(f"Updated permissions for user {user_id} by admin {current_user.get('id')}")
        
        return {
            "message": "User permissions updated successfully",
            "user_id": user_id,
            "permission_count": len(permissions),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error updating user permissions: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update user permissions: {error_msg}"
        )

