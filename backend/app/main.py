from fastapi import FastAPI, Request, status
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
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "error_code": "VALIDATION_ERROR"},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    import traceback
    # LOG THE REAL ERROR with full stacktrace
    logger.error(
        "Unhandled error on %s %s: %s\n%s",
        request.method,
        request.url.path,
        repr(exc),
        "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal error occurred. Please try again later.",
            "error_code": "INTERNAL_ERROR",
        },
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
    
    response = await call_next(request)
    
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

app.include_router(api_router, prefix="/api")
