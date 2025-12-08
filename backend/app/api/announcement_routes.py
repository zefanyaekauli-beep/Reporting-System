# backend/app/api/announcement_routes.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user, require_supervisor
from app.schemas import announcement as schemas
from app.services import announcement_service
from app.core.logger import api_logger
from app.core.exceptions import handle_exception

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.post("/", response_model=schemas.AnnouncementOut)
def create_announcement(
    data: schemas.AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Create a new announcement (supervisor/admin only)"""
    try:
        company_id = current_user.get("company_id", 1)
        creator_id = current_user.get("id")
        
        if not creator_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        ann = announcement_service.create_announcement(
            db,
            creator_id=creator_id,
            company_id=company_id,
            data=data
        )
        return ann
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        api_logger.error(f"Error creating announcement: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_announcement")


@router.get("/me", response_model=List[schemas.AnnouncementWithState])
def list_my_announcements(
    only_unread: bool = Query(False, description="Show only unread announcements"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of announcements"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get announcements for current user"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        return announcement_service.get_announcements_for_user(
            db,
            user_id,
            only_unread=only_unread,
            limit=limit
        )
    except Exception as e:
        api_logger.error(f"Error fetching user announcements: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_my_announcements")


@router.post("/{announcement_id}/read")
def mark_read(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark announcement as read"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        target = announcement_service.mark_announcement_read(
            db,
            user_id,
            announcement_id
        )
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found for this user"
            )
        return {"status": "ok", "message": "Announcement marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error marking announcement as read: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "mark_read")


@router.post("/{announcement_id}/ack")
def mark_ack(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark announcement as acknowledged"""
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        target = announcement_service.mark_announcement_ack(
            db,
            user_id,
            announcement_id
        )
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found for this user"
            )
        return {"status": "ok", "message": "Announcement acknowledged"}
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error marking announcement as acknowledged: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "mark_ack")


@router.get("/", response_model=List[schemas.AnnouncementOut])
def list_announcements(
    division: Optional[str] = Query(None, description="Filter by division"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """List all announcements (supervisor/admin only)"""
    try:
        company_id = current_user.get("company_id", 1)
        return announcement_service.list_announcements_for_supervisor(
            db,
            company_id,
            division=division,
            limit=limit
        )
    except Exception as e:
        api_logger.error(f"Error listing announcements: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_announcements")

