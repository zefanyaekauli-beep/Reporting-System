from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.api.router import api_router
from app.core.config import settings
from app.core.logger import logger
from app.core.exceptions import BaseAPIException, handle_exception

# Import models to register them with SQLAlchemy
from app.core import offline_models  # noqa: F401
from app.models import attendance  # noqa: F401
from app.models import announcement  # noqa: F401
from app.models import shift  # noqa: F401
from app.models import inspect_point  # noqa: F401
from app.models import attendance_correction  # noqa: F401
from app.models import dar  # noqa: F401
from app.models import patrol_schedule  # noqa: F401
from app.models import incident  # noqa: F401
from app.models import compliance  # noqa: F401
# Import joint_patrol models safely - if it fails, log but don't crash
try:
    from app.models import joint_patrol  # noqa: F401
except Exception as e:
    logger.warning(f"Failed to import joint_patrol models: {str(e)}. Joint patrol features may not be available.")
from app.divisions.security import models as security_models  # noqa: F401
from app.divisions.cleaning import models as cleaning_models  # noqa: F401
from app.divisions.driver import models as driver_models  # noqa: F401
# Device model is in app.core.offline_models, not app.models.device

app = FastAPI(title="Verolux Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handlers
@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    """Handle custom API exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": exc.error_code,
            "metadata": exc.metadata,
        },
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    from fastapi import UploadFile
    import json
    
    # Safely serialize validation errors, avoiding UploadFile objects
    try:
        errors = exc.errors()
        
        def clean_value(v):
            """Recursively clean values to make them JSON serializable"""
            if isinstance(v, UploadFile):
                return f"<UploadFile: {v.filename or 'unnamed'}>"
            elif isinstance(v, (str, int, float, bool, type(None))):
                return v
            elif isinstance(v, (list, tuple)):
                return [clean_value(item) for item in v]
            elif isinstance(v, dict):
                return {k: clean_value(val) for k, val in v.items()}
            else:
                # Try to serialize, fallback to string representation
                try:
                    json.dumps(v)
                    return v
                except (TypeError, ValueError):
                    return str(v)
        
        # Clean all errors
        clean_errors = []
        for error in errors:
            clean_error = {k: clean_value(v) for k, v in error.items()}
            clean_errors.append(clean_error)
        
        logger.warning(f"Validation error: {len(clean_errors)} errors")
        # Log each error for debugging
        for idx, error in enumerate(clean_errors):
            logger.warning(
                f"Validation error #{idx+1}: loc={error.get('loc', [])}, "
                f"msg={error.get('msg', 'N/A')}, type={error.get('type', 'N/A')}"
            )
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": clean_errors, "error_code": "VALIDATION_ERROR"},
        )
    except Exception as e:
        # Fallback if we can't serialize errors
        logger.error(f"Error serializing validation errors: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error occurred. Please check your request format.",
                "error_code": "VALIDATION_ERROR",
            },
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with detailed logging"""
    import uuid
    trace_id = str(uuid.uuid4())
    
    logger.warning(
        f"HTTP Exception: {exc.status_code} - {exc.detail}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": exc.status_code,
            "detail": exc.detail,
            "trace_id": trace_id,
        },
    )
    
    # Return RFC 7807 Problem Details format
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": "https://tools.ietf.org/html/rfc7231#section-6.5",
            "title": exc.detail if exc.status_code == 401 else "An error occurred",
            "status": exc.status_code,
            "detail": exc.detail,
            "instance": request.url.path,
            "trace_id": trace_id,
        },
        headers={"X-Trace-Id": trace_id},
        media_type="application/problem+json",
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    from fastapi import HTTPException
    import traceback
    import uuid
    
    # If it's already an HTTPException, let the http_exception_handler handle it
    if isinstance(exc, HTTPException):
        return await http_exception_handler(request, exc)
    
    # LOG THE REAL ERROR with full stacktrace
    # Avoid serializing request body which may contain UploadFile objects
    try:
        error_repr = repr(exc)
        traceback_str = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    except Exception as log_err:
        # If we can't serialize the exception, just log the type and message
        error_repr = f"{type(exc).__name__}: {str(exc)}"
        traceback_str = f"Error serializing exception: {str(log_err)}"
    
    trace_id = str(uuid.uuid4())
    logger.error(
        "Unhandled error on %s %s: %s\n%s",
        request.method,
        request.url.path,
        error_repr,
        traceback_str,
        extra={"trace_id": trace_id},
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal error occurred. Please try again later.",
            "error_code": "INTERNAL_ERROR",
            "trace_id": trace_id,
        },
        headers={"X-Trace-Id": trace_id},
    )

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    import time
    start_time = time.time()
    
    logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host if request.client else None,
        },
    )
    
    try:
        response = await call_next(request)
    except HTTPException as exc:
        # Log HTTPException before it's handled
        if "/api/auth/login" in request.url.path:
            logger.warning(
                f"=== MIDDLEWARE: HTTPException caught for login === Status: {exc.status_code}, Detail: {exc.detail}",
                extra={
                    "status_code": exc.status_code,
                    "detail": exc.detail,
                    "path": request.url.path,
                },
            )
        raise
    
    process_time = time.time() - start_time
    logger.info(
        f"Response: {response.status_code} ({process_time:.3f}s)",
        extra={
            "status_code": response.status_code,
            "process_time": process_time,
        },
    )
    
    return response

@app.get("/health")
def health():
    """Basic health check"""
    return {"status": "ok", "service": "Verolux Management System"}

@app.get("/health/detailed")
def health_detailed():
    """Detailed health check with system status"""
    from app.core.health import get_system_health
    return get_system_health()

# Include API router
app.include_router(api_router, prefix="/api")

# Startup validation: Check critical routes and database
@app.on_event("startup")
async def startup_validation():
    """Validate critical system components on startup"""
    import sys
    
    # 1. Check database connection
    from app.core.database import test_database_connection
    db_success, db_message = test_database_connection()
    if not db_success:
        logger.error(f"Database validation failed: {db_message}")
        print(f"ERROR: Database validation failed: {db_message}", file=sys.stderr)
    else:
        logger.info(f"Database validation passed: {db_message}")
    
    # 2. Check if auth login route is registered
    login_route_found = False
    for route in app.routes:
        if hasattr(route, 'path') and route.path == "/api/auth/login":
            if hasattr(route, 'methods') and 'POST' in route.methods:
                login_route_found = True
                break
    
    if not login_route_found:
        error_msg = "CRITICAL: /api/auth/login route not found! Login will fail with 500 error."
        logger.error(error_msg)
        print(error_msg, file=sys.stderr)
        # Try to find what routes are registered
        registered_paths = [getattr(r, 'path', str(r)) for r in app.routes if hasattr(r, 'path')]
        logger.error(f"Registered routes: {registered_paths[:20]}")  # Log first 20 routes
    else:
        logger.info("Login route validation passed: /api/auth/login is registered")
