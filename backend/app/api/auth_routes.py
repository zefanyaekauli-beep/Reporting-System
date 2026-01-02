from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import json

# #region agent log
try:
    with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"C","location":"auth_routes.py:5","message":"Auth routes module import started","data":{"step":"import_start"},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion

from app.api.deps import get_current_user, get_db

# #region agent log
try:
    with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"C","location":"auth_routes.py:10","message":"About to import User model","data":{},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion

from app.models.user import User

# #region agent log
try:
    with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"C","location":"auth_routes.py:13","message":"User model imported, about to import Company","data":{},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion

from app.models.company import Company

# #region agent log
try:
    with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"C","location":"auth_routes.py:16","message":"Company model imported, about to import security functions","data":{},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion

from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.logger import auth_logger

# #region agent log
try:
    with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"C","location":"auth_routes.py:19","message":"All imports successful, creating router","data":{},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str  # Password is now required

class UserInfo(BaseModel):
    id: int
    username: str
    division: Optional[str]
    role: str
    company_id: int
    site_id: Optional[int] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    division: Optional[str]
    role: str
    user: UserInfo

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token.
    
    For backward compatibility during migration:
    - If user exists in DB with hashed password, verify it
    - If user doesn't exist but matches legacy username pattern, create with default password
    - Legacy usernames: security, cleaning, parking, driver, supervisor, admin
    
    Security: Logs username and login result, but NEVER logs passwords.
    """
    # #region agent log
    try:
        with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"D","location":"auth_routes.py:33","message":"Login endpoint called - BEFORE try block","data":{"username":payload.username,"db_type":type(db).__name__,"db_is_none":db is None},"timestamp":int(__import__("time").time()*1000)}) + "\n")
    except: pass
    # #endregion
    
    # Log immediately when endpoint is called (before any try/except)
    auth_logger.info(f"=== LOGIN ENDPOINT CALLED === Username: {payload.username}, Path: {request.url.path}")
    
    try:
        # #region agent log
        try:
            with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth_routes.py:48","message":"Inside try block, about to query database","data":{"username":payload.username},"timestamp":int(__import__("time").time()*1000)}) + "\n")
        except: pass
        # #endregion
        # Log that endpoint was reached
        auth_logger.info(f"Login endpoint called for username: {payload.username}")
        
        # Get client IP for audit trail
        client_ip = request.client.host if request.client else None
        
        # Log login attempt (username only, NEVER password)
        auth_logger.info(
            f"Login attempt: username={payload.username}",
            extra={
                "username": payload.username,
                "ip_address": client_ip,
                "event": "login_attempt"
            }
        )
        
        # Try to find user in database
        # #region agent log
        try:
            with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth_routes.py:65","message":"About to execute database query","data":{"username":payload.username,"User_model":str(User)},"timestamp":int(__import__("time").time()*1000)}) + "\n")
        except: pass
        # #endregion
        user = db.query(User).filter(User.username == payload.username).first()
        # #region agent log
        try:
            with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"auth_routes.py:67","message":"Database query completed","data":{"user_found":user is not None,"user_id":user.id if user else None},"timestamp":int(__import__("time").time()*1000)}) + "\n")
        except: pass
        # #endregion
        
        if user:
            # User exists - verify password; handle invalid/corrupted hashes gracefully
            invalid_hash = False
            password_valid = False
            
            try:
                # Check if hash is invalid (dummy placeholder or too short)
                if user.hashed_password == "dummy" or (user.hashed_password and len(user.hashed_password) < 20):
                    invalid_hash = True
                else:
                    # Try to verify password
                    password_valid = verify_password(payload.password, user.hashed_password)
            except Exception as e:
                # Hash is invalid or corrupted
                invalid_hash = True
                auth_logger.warning(
                    f"Invalid password hash for user {payload.username}: {str(e)}",
                    extra={"username": payload.username, "user_id": user.id}
                )
            
            # If hash is invalid/placeholder, re-hash with provided password
            if invalid_hash:
                new_hash = get_password_hash(payload.password)
                # Use raw SQL update to avoid FK validation issues
                from sqlalchemy import text
                db.execute(
                    text("UPDATE users SET hashed_password = :hash WHERE id = :user_id"),
                    {"hash": new_hash, "user_id": user.id}
                )
                db.commit()
                # Refresh user object
                db.refresh(user)
                password_valid = True  # Accept the password since we just set it
                auth_logger.info(
                    f"Fixed invalid password hash for username={payload.username}",
                    extra={"username": payload.username, "user_id": user.id, "event": "password_hash_fixed"}
                )
            
            if not password_valid:
                # Log failed login (invalid password)
                auth_logger.warning(
                    f"Login failed: invalid password for username={payload.username}",
                    extra={
                        "username": payload.username,
                        "user_id": user.id,
                        "ip_address": client_ip,
                        "event": "login_failed",
                        "reason": "invalid_password"
                    }
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Kredensial tidak valid"
                )
        else:
            # Legacy mode: create user on-the-fly for backward compatibility
            # This should be removed after full migration
            # Map legacy usernames to roles/divisions
            legacy_map = {
                "security": ("security", "FIELD"),
                "cleaning": ("cleaning", "FIELD"),
                "parking": ("parking", "FIELD"),
                "driver": ("driver", "FIELD"),
                "supervisor": ("security", "SUPERVISOR"),  # Default division
                "admin": ("security", "ADMIN"),  # Default division
            }
            
            if payload.username not in legacy_map:
                # Log failed login (user not found)
                auth_logger.warning(
                    f"Login failed: user not found username={payload.username}",
                    extra={
                        "username": payload.username,
                        "ip_address": client_ip,
                        "event": "login_failed",
                        "reason": "user_not_found"
                    }
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Kredensial tidak valid"
                )
            
            division, role = legacy_map[payload.username]
            
            # Ensure company exists (create if not)
            company = db.query(Company).filter(Company.id == 1).first()
            if not company:
                # Create default company
                company = Company(
                    id=1,
                    name="PT Verolux Security",
                    code="VEROLUX"
                )
                db.add(company)
                db.commit()
                db.refresh(company)
                auth_logger.info(f"Created default company: {company.name}")
            
            # Create user with hashed password
            user = User(
                username=payload.username,
                hashed_password=get_password_hash(payload.password),
                division=division if role == "FIELD" else None,
                role=role,
                company_id=company.id,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Log user creation (legacy mode)
            auth_logger.info(
                f"User created (legacy mode): username={payload.username}, role={role}",
                extra={
                    "username": payload.username,
                    "user_id": user.id,
                    "role": role,
                    "ip_address": client_ip,
                    "event": "user_created_legacy"
                }
            )
        
        # Ensure user has required fields (handle None values from old DB records)
        if not user.role:
            # Use raw SQL update to avoid FK validation issues
            from sqlalchemy import text
            db.execute(
                text("UPDATE users SET role = :role WHERE id = :user_id"),
                {"role": "FIELD", "user_id": user.id}
            )
            db.commit()
            db.refresh(user)
            user.role = "FIELD"  # Update local object
        
        # Normalize role to lowercase safely
        user_role = (user.role or "field").lower()
        user_division = user.division.lower() if user.division and isinstance(user.division, str) else None
        
        # Log successful login (AFTER password verification, before token creation)
        auth_logger.info(
            f"Login successful: username={payload.username}, user_id={user.id}, role={user_role}",
            extra={
                "username": payload.username,
                "user_id": user.id,
                "role": user_role,
                "division": user.division,
                "company_id": user.company_id,
                "ip_address": client_ip,
                "event": "login_success"
            }
        )
        
        # Create JWT token
        token_data = {
            "sub": str(user.id),  # Subject (user ID)
            "username": user.username,
            "role": user_role,
            "division": user_division,
            "company_id": user.company_id or 1,  # Default company_id if None
            "site_id": user.site_id,
        }
        access_token = create_access_token(data=token_data)
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            division=user_division,
            role=user_role,
            user=UserInfo(
                id=user.id,
                username=user.username,
                division=user_division,
                role=user_role,
                company_id=user.company_id or 1,
                site_id=user.site_id,
            ),
        )
    except HTTPException:
        # Re-raise HTTP exceptions (like 401 Unauthorized)
        # #region agent log
        try:
            with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"E","location":"auth_routes.py:245","message":"HTTPException caught, re-raising","data":{},"timestamp":int(__import__("time").time()*1000)}) + "\n")
        except: pass
        # #endregion
        raise
    except Exception as e:
        # #region agent log
        try:
            with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"E","location":"auth_routes.py:248","message":"Exception caught in login handler","data":{"error_type":type(e).__name__,"error_msg":str(e)},"timestamp":int(__import__("time").time()*1000)}) + "\n")
        except: pass
        # #endregion
        # Log unexpected errors
        auth_logger.error(
            f"Unexpected error during login for username={payload.username}: {str(e)}",
            exc_info=True,
            extra={
                "username": payload.username,
                "ip_address": request.client.host if request.client else None,
                "event": "login_error"
            }
        )
        # #region agent log
        try:
            with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"E","location":"auth_routes.py:260","message":"About to raise HTTPException 500","data":{},"timestamp":int(__import__("time").time()*1000)}) + "\n")
        except: pass
        # #endregion
        # Return generic error to avoid leaking information
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred. Please try again later."
        )

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user info from JWT token with permissions"""
    from app.models.permission import Permission, Role
    from app.models.user import User
    from sqlalchemy.orm import joinedload
    
    user_id = current_user.get("id")
    # Eager load role_obj with permissions and user permissions
    user = (
        db.query(User)
        .options(
            joinedload(User.role_obj).joinedload(Role.permissions),
            joinedload(User.permissions)
        )
        .filter(User.id == user_id)
        .first()
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get permissions from role and direct user permissions
    permissions = []
    permission_set = set()  # To avoid duplicates
    
    try:
        # Get permissions from role
        if user.role_obj and user.role_obj.permissions:
            for perm in user.role_obj.permissions:
                if perm.is_active:
                    perm_key = f"{perm.resource}:{perm.action}"
                    if perm_key not in permission_set:
                        permissions.append({
                            "resource": perm.resource,
                            "action": perm.action,
                            "id": perm.id,
                            "name": perm.name
                        })
                        permission_set.add(perm_key)
        
        # Also get direct user permissions (these override role permissions)
        if user.permissions:
            for perm in user.permissions:
                if perm.is_active:
                    perm_key = f"{perm.resource}:{perm.action}"
                    # Remove existing permission with same resource:action if exists
                    permissions = [p for p in permissions if f"{p['resource']}:{p['action']}" != perm_key]
                    permissions.append({
                        "resource": perm.resource,
                        "action": perm.action,
                        "id": perm.id,
                        "name": perm.name
                    })
                    permission_set.add(perm_key)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching permissions for user {user_id}: {str(e)}", exc_info=True)
        # Fallback: get permissions based on role name
        role_name = current_user.get("role", "").upper()
        from app.api.admin_routes import get_permissions_for_role
        perm_names = get_permissions_for_role(role_name)
        # Convert permission names to resource/action format
        for perm_name in perm_names:
            # Simple mapping - can be improved
            if "REPORTS" in perm_name:
                resource = "reports"
                action = "read" if "VIEW" in perm_name else "write"
            elif "PATROLS" in perm_name:
                resource = "patrols"
                action = "read" if "VIEW" in perm_name else "write"
            elif "ATTENDANCE" in perm_name:
                resource = "attendance"
                action = "read" if "VIEW" in perm_name else "write"
            elif "CHECKLISTS" in perm_name:
                resource = "checklists"
                action = "read" if "VIEW" in perm_name else "write"
            elif "SHIFTS" in perm_name:
                resource = "shifts"
                action = "read" if "VIEW" in perm_name else "write"
            else:
                continue
            perm_key = f"{resource}:{action}"
            if perm_key not in permission_set:
                permissions.append({
                    "resource": resource,
                    "action": action
                })
                permission_set.add(perm_key)
    
    return {
        "id": current_user.get("id"),
        "username": current_user.get("username"),
        "division": current_user.get("division"),
        "role": current_user.get("role"),
        "role_id": user.role_id,
        "company_id": current_user.get("company_id"),
        "site_id": current_user.get("site_id"),
        "permissions": permissions,
    }
