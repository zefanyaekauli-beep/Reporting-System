# backend/app/core/errors.py
"""
Standardized error handling for the application.
"""

from fastapi import HTTPException, status
from typing import Optional, Dict, Any
import traceback
import logging

logger = logging.getLogger(__name__)

class AppError(Exception):
    """Base exception for application errors"""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(AppError):
    """Validation error (400)"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)

class NotFoundError(AppError):
    """Resource not found error (404)"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, details=details)

class UnauthorizedError(AppError):
    """Unauthorized error (401)"""
    def __init__(self, message: str = "Unauthorized", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, details=details)

class ForbiddenError(AppError):
    """Forbidden error (403)"""
    def __init__(self, message: str = "Forbidden", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)

class DatabaseError(AppError):
    """Database operation error (500)"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

def handle_error(error: Exception, context: Optional[str] = None) -> HTTPException:
    """
    Convert application errors to HTTP exceptions with proper logging.
    
    Args:
        error: The exception to handle
        context: Additional context about where the error occurred
        
    Returns:
        HTTPException ready to be raised
    """
    if isinstance(error, AppError):
        # Log application errors at appropriate level
        log_level = logging.WARNING if error.status_code < 500 else logging.ERROR
        logger.log(
            log_level,
            f"{error.__class__.__name__}: {error.message}",
            extra={
                "context": context,
                "status_code": error.status_code,
                "details": error.details,
            }
        )
        
        return HTTPException(
            status_code=error.status_code,
            detail={
                "error": error.__class__.__name__,
                "message": error.message,
                "details": error.details,
            }
        )
    else:
        # Log unexpected errors with full traceback
        logger.error(
            f"Unexpected error: {str(error)}",
            exc_info=True,
            extra={"context": context}
        )
        
        return HTTPException(
            status_code=500,
            detail={
                "error": "InternalServerError",
                "message": "An unexpected error occurred",
                "details": {} if context is None else {"context": context},
            }
        )

def create_error_response(
    message: str,
    status_code: int = 500,
    error_type: str = "Error",
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a standardized error response.
    
    Args:
        message: Error message
        status_code: HTTP status code
        error_type: Type of error
        details: Additional error details
        
    Returns:
        Dictionary with error information
    """
    return {
        "error": error_type,
        "message": message,
        "status_code": status_code,
        "details": details or {},
    }

