from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User
from typing import Optional

def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Get current user from JWT token.
    
    Decodes JWT token from Authorization header and optionally fetches fresh user data from DB.
    For performance, we primarily use JWT claims, but can fetch from DB if needed.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract user info from JWT payload
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # Optionally verify user still exists and is active (for security)
    # In production, you might want to check user.is_active here
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    # Return user data (combine JWT claims with DB data for consistency)
    return {
        "id": user.id,
        "username": payload.get("username") or user.username,
        "division": payload.get("division"),
        "role": payload.get("role") or user.role.lower(),
        "company_id": payload.get("company_id") or user.company_id,
        "site_id": payload.get("site_id") or user.site_id,
        "scope_type": user.scope_type,
        "scope_id": user.scope_id,
    }

def require_supervisor(current_user: dict = Depends(get_current_user)):
    """Dependency to require supervisor or admin role"""
    role = current_user.get("role", "").lower()
    if role not in ("supervisor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisor access required",
        )
    return current_user

def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency to require admin role"""
    role = current_user.get("role", "").lower()
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

def apply_scope_filter(query, model, current_user: dict):
    """
    Apply scope-based filtering to a query based on supervisor scope.
    
    Scope types:
    - DIVISION: Filter by division (scope_id = division code)
    - SITE: Filter by site_id
    - COMPANY: No additional filter (already filtered by company_id)
    - None/Admin: No additional filter (see all)
    
    Args:
        query: SQLAlchemy query object
        model: SQLAlchemy model class (must have company_id, site_id, division fields)
        current_user: Current user dict with role, scope_type, scope_id, company_id
    
    Returns:
        Filtered query
    """
    role = current_user.get("role", "user")
    
    # Admins see all (no scope filtering)
    if role == "admin":
        return query
    
    # Field users see only their own data (handled in individual endpoints)
    if role == "field":
        return query
    
    # Supervisors: apply scope-based filtering
    scope_type = current_user.get("scope_type")
    scope_id = current_user.get("scope_id")
    company_id = current_user.get("company_id", 1)
    
    # Always filter by company_id first
    if hasattr(model, "company_id"):
        query = query.filter(model.company_id == company_id)
    
    if scope_type == "DIVISION":
        # Division supervisor: filter by division
        if scope_id and hasattr(model, "division"):
            # scope_id might be division code (e.g., "security") or division ID
            # Try both string and integer matching
            from sqlalchemy import or_
            query = query.filter(
                or_(
                    model.division == str(scope_id).upper(),
                    model.division == str(scope_id).lower(),
                )
            )
    elif scope_type == "SITE":
        # Site supervisor: filter by site_id
        if scope_id and hasattr(model, "site_id"):
            query = query.filter(model.site_id == scope_id)
    # COMPANY scope or None: no additional filter (already filtered by company_id)
    
    return query
