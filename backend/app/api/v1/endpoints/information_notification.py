# backend/app/api/v1/endpoints/information_notification.py

"""
Information Notification Management API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor

router = APIRouter(prefix="/information/notification", tags=["information-notification"])


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str  # INFO, WARNING, ERROR, SUCCESS
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "INFO"
    user_id: Optional[int] = None  # If None, broadcast to all


@router.get("", response_model=List[NotificationOut])
def list_notifications(
    is_read: Optional[bool] = Query(None),
    type_filter: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List notifications"""
    try:
        # TODO: Implement database storage for notifications
        # For now, return sample notifications
        notifications = [
            NotificationOut(
                id=1,
                title="System Update",
                message="New features have been added to the dashboard",
                type="INFO",
                is_read=False,
                created_at=datetime.utcnow(),
            ),
            NotificationOut(
                id=2,
                title="Patrol Reminder",
                message="Scheduled patrol is due in 30 minutes",
                type="WARNING",
                is_read=False,
                created_at=datetime.utcnow(),
            ),
        ]
        
        if is_read is not None:
            notifications = [n for n in notifications if n.is_read == is_read]
        if type_filter:
            notifications = [n for n in notifications if n.type == type_filter]
        
        return notifications[:limit]
    except Exception as e:
        api_logger.error(f"Error listing notifications: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_notifications")


@router.post("", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create notification"""
    try:
        # TODO: Store in database
        return NotificationOut(
            id=999,
            title=notification_data.title,
            message=notification_data.message,
            type=notification_data.type,
            is_read=False,
            created_at=datetime.utcnow(),
        )
    except Exception as e:
        api_logger.error(f"Error creating notification: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_notification")


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Mark notification as read"""
    try:
        # TODO: Update in database
        return NotificationOut(
            id=notification_id,
            title="Sample",
            message="Sample",
            type="INFO",
            is_read=True,
            created_at=datetime.utcnow(),
            read_at=datetime.utcnow(),
        )
    except Exception as e:
        api_logger.error(f"Error marking notification as read: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "mark_notification_read")

