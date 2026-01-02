# backend/app/api/admin_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_admin, require_supervisor
from app.models.user import User
from app.models.permission import AuditLog
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


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    username: Optional[str]
    company_id: Optional[int]
    action: str
    resource_type: str
    resource_id: Optional[int]
    details: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# require_admin is imported from app.api.deps


@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    user_id: Optional[int] = Query(None),
    resource_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),  # Allow supervisor to view audit logs
):
    """Get audit logs with optional filters (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Build query
        q = db.query(AuditLog).filter(AuditLog.company_id == company_id)
        
        # Apply filters
        if user_id:
            q = q.filter(AuditLog.user_id == user_id)
        if resource_type:
            q = q.filter(AuditLog.resource_type == resource_type.upper())
        if action:
            q = q.filter(AuditLog.action == action.upper())
        if from_date:
            try:
                from datetime import datetime as dt
                from_dt = dt.fromisoformat(from_date)
                q = q.filter(AuditLog.created_at >= from_dt)
            except:
                pass
        if to_date:
            try:
                from datetime import datetime as dt
                to_dt = dt.fromisoformat(to_date)
                q = q.filter(AuditLog.created_at <= to_dt)
            except:
                pass
        
        # Order by most recent first and apply limit
        logs = q.order_by(AuditLog.created_at.desc()).limit(limit).all()
        
        # Get usernames for logs
        user_ids = list(set([log.user_id for log in logs if log.user_id]))
        users_dict = {}
        if user_ids:
            users = db.query(User).filter(User.id.in_(user_ids)).all()
            users_dict = {u.id: u.username for u in users}
        
        # Build response
        result = []
        for log in logs:
            result.append(AuditLogOut(
                id=log.id,
                user_id=log.user_id,
                username=users_dict.get(log.user_id),
                company_id=log.company_id,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                details=log.details,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                created_at=log.created_at,
            ))
        
        api_logger.info(f"Retrieved {len(result)} audit logs for user {current_user.get('id')}")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error retrieving audit logs: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve audit logs: {error_msg}"
        )


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
    current_user: dict = Depends(require_supervisor),  # Allow supervisor too
):
    """List all roles (admin only)."""
    try:
        from app.models.permission import Role
        from sqlalchemy import inspect
        
        # Check if roles table exists
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        
        if 'roles' not in tables:
            api_logger.warning("Roles table does not exist. Please run migrations.")
            return []
        
        q = db.query(Role)
        if is_active is not None:
            q = q.filter(Role.is_active == is_active)
        
        roles = q.order_by(Role.name.asc()).all()
        
        api_logger.info(f"Found {len(roles)} roles in database")
        
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
        # Return empty list instead of raising error to prevent frontend crash
        api_logger.warning("Returning empty roles list due to error. Please check database and run migrations.")
        return []


@router.get("/permissions", response_model=List[dict])
def list_available_permissions(
    resource: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),  # Allow supervisor too
):
    """List all available permissions (admin only)."""
    try:
        from app.models.permission import Permission
        from sqlalchemy import inspect
        
        # Check if permissions table exists
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        
        if 'permissions' not in tables:
            api_logger.warning("Permissions table does not exist. Please run migrations.")
            return []
        
        q = db.query(Permission)
        if resource:
            q = q.filter(Permission.resource == resource)
        if action:
            q = q.filter(Permission.action == action)
        if is_active is not None:
            q = q.filter(Permission.is_active == is_active)
        
        permissions = q.order_by(Permission.resource.asc(), Permission.action.asc()).all()
        
        api_logger.info(f"Found {len(permissions)} permissions in database")
        
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
    current_user: dict = Depends(require_supervisor),  # Allow supervisor too
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
    current_user: dict = Depends(require_admin),  # Only admin can update
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

