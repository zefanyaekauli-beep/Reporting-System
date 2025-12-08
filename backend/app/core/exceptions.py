# backend/app/core/exceptions.py

from fastapi import HTTPException, status
from typing import Optional, Dict, Any
import traceback

class BaseAPIException(HTTPException):
    """Base exception for API errors"""
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.metadata = metadata or {}


class NotFoundError(BaseAPIException):
    """Resource not found"""
    def __init__(self, resource: str, resource_id: Optional[Any] = None):
        detail = f"{resource} not found"
        if resource_id:
            detail += f" (id: {resource_id})"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="NOT_FOUND",
            metadata={"resource": resource, "resource_id": resource_id},
        )


class ValidationError(BaseAPIException):
    """Validation error"""
    def __init__(self, detail: str, field: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
            metadata={"field": field} if field else {},
        )


class DatabaseError(BaseAPIException):
    """Database operation error"""
    def __init__(self, detail: str, operation: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {detail}",
            error_code="DATABASE_ERROR",
            metadata={"operation": operation} if operation else {},
        )


class AuthenticationError(BaseAPIException):
    """Authentication error"""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTH_ERROR",
        )


class AuthorizationError(BaseAPIException):
    """Authorization error"""
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="AUTHORIZATION_ERROR",
        )


def handle_exception(e: Exception, logger, context: Optional[str] = None) -> HTTPException:
    """Handle exceptions and return appropriate HTTPException"""
    error_context = f" in {context}" if context else ""
    
    if isinstance(e, BaseAPIException):
        logger.warning(f"API Exception{error_context}: {e.detail}", extra=e.metadata)
        return e
    
    if isinstance(e, HTTPException):
        logger.warning(f"HTTP Exception{error_context}: {e.detail}")
        return e
    
    # Log full traceback for unexpected errors
    logger.error(
        f"Unexpected error{error_context}: {str(e)}",
        exc_info=True,
        extra={"traceback": traceback.format_exc()},
    )
    
    # Return generic error (don't expose internal details)
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An internal error occurred. Please try again later.",
    )

