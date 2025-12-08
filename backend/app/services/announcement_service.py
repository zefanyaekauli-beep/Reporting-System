# backend/app/services/announcement_service.py

from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.models import announcement as models
from app.models.user import User
from app.schemas import announcement as schemas
from app.core.logger import api_logger


def create_announcement(
    db: Session,
    *,
    creator_id: int,
    company_id: int,
    data: schemas.AnnouncementCreate
) -> models.Announcement:
    """Create announcement and generate per-user targets"""
    try:
        announcement = models.Announcement(
            company_id=company_id,
            title=data.title,
            message=data.message,
            priority=data.priority,
            scope=data.scope,
            created_by_id=creator_id,
            valid_from=data.valid_from or datetime.utcnow(),
            valid_until=data.valid_until,
            is_active=True,
            require_ack=data.require_ack,
        )
        db.add(announcement)
        db.flush()  # Get ID without committing

        # Determine target users based on scope
        users: List[User] = []
        
        if data.scope == schemas.AnnouncementScope.ALL:
            # All active users in the company
            users = (
                db.query(User)
                .filter(User.company_id == company_id)
                .all()
            )
        elif data.scope == schemas.AnnouncementScope.DIVISIONS:
            if not data.division_ids:
                raise ValueError("division_ids required for divisions scope")
            # Users in specified divisions
            # Map numeric IDs to division names (division is stored as string in User model)
            division_map = {
                1: "security",
                2: "cleaning",
                3: "parking",
                4: "driver",
            }
            division_names = [division_map.get(did, f"division_{did}") for did in data.division_ids]
            users = (
                db.query(User)
                .filter(User.company_id == company_id)
                .filter(User.division.in_(division_names))
                .all()
            )
        elif data.scope == schemas.AnnouncementScope.USERS:
            if not data.user_ids:
                raise ValueError("user_ids required for users scope")
            users = (
                db.query(User)
                .filter(User.company_id == company_id)
                .filter(User.id.in_(data.user_ids))
                .all()
            )
        else:
            users = []

        # Create targets for each user
        targets = []
        for user in users:
            targets.append(
                models.AnnouncementTarget(
                    announcement_id=announcement.id,
                    user_id=user.id,
                )
            )

        if targets:
            db.add_all(targets)
        
        db.commit()
        db.refresh(announcement)
        
        api_logger.info(
            f"Created announcement {announcement.id} with {len(targets)} targets",
            extra={
                "announcement_id": announcement.id,
                "scope": data.scope,
                "target_count": len(targets),
            }
        )
        
        return announcement
    except Exception as e:
        db.rollback()
        api_logger.error(f"Failed to create announcement: {str(e)}", exc_info=True)
        raise


def get_announcements_for_user(
    db: Session,
    user_id: int,
    *,
    only_active: bool = True,
    only_unread: bool = False,
    limit: int = 20,
) -> List[schemas.AnnouncementWithState]:
    """Get announcements for a specific user with read/ack state"""
    try:
        q = (
            db.query(models.Announcement, models.AnnouncementTarget)
            .join(
                models.AnnouncementTarget,
                models.Announcement.id == models.AnnouncementTarget.announcement_id
            )
            .filter(models.AnnouncementTarget.user_id == user_id)
        )

        if only_active:
            q = q.filter(models.Announcement.is_active == True)

        now = datetime.utcnow()
        q = q.filter(models.Announcement.valid_from <= now)
        q = q.filter(
            (models.Announcement.valid_until == None)
            | (models.Announcement.valid_until >= now)
        )

        if only_unread:
            q = q.filter(models.AnnouncementTarget.is_read == False)

        q = q.order_by(models.Announcement.created_at.desc()).limit(limit)

        rows = q.all()

        result = []
        for ann, target in rows:
            # Build AnnouncementOut from model
            ann_out = schemas.AnnouncementOut(
                id=ann.id,
                company_id=ann.company_id,
                title=ann.title,
                message=ann.message,
                priority=ann.priority,
                scope=ann.scope,
                created_by_id=ann.created_by_id,
                created_at=ann.created_at,
                valid_from=ann.valid_from,
                valid_until=ann.valid_until,
                is_active=ann.is_active,
                require_ack=ann.require_ack,
            )
            
            # Add state from target
            result.append(
                schemas.AnnouncementWithState(
                    **ann_out.dict(),
                    is_read=target.is_read,
                    read_at=target.read_at,
                    is_ack=target.is_ack,
                    ack_at=target.ack_at,
                )
            )

        return result
    except Exception as e:
        api_logger.error(f"Failed to get announcements for user {user_id}: {str(e)}", exc_info=True)
        raise


def mark_announcement_read(
    db: Session,
    user_id: int,
    announcement_id: int
) -> Optional[models.AnnouncementTarget]:
    """Mark announcement as read for a user"""
    try:
        target = (
            db.query(models.AnnouncementTarget)
            .filter_by(user_id=user_id, announcement_id=announcement_id)
            .first()
        )

        if not target:
            return None

        if not target.is_read:
            target.is_read = True
            target.read_at = datetime.utcnow()
            db.commit()
            db.refresh(target)
            
            api_logger.info(
                f"Marked announcement {announcement_id} as read for user {user_id}"
            )

        return target
    except Exception as e:
        db.rollback()
        api_logger.error(
            f"Failed to mark announcement {announcement_id} as read: {str(e)}",
            exc_info=True
        )
        raise


def mark_announcement_ack(
    db: Session,
    user_id: int,
    announcement_id: int
) -> Optional[models.AnnouncementTarget]:
    """Mark announcement as acknowledged for a user"""
    try:
        target = (
            db.query(models.AnnouncementTarget)
            .filter_by(user_id=user_id, announcement_id=announcement_id)
            .first()
        )

        if not target:
            return None

        if not target.is_ack:
            target.is_ack = True
            target.ack_at = datetime.utcnow()
            # Also mark as read if not already
            if not target.is_read:
                target.is_read = True
                target.read_at = datetime.utcnow()
            db.commit()
            db.refresh(target)
            
            api_logger.info(
                f"Marked announcement {announcement_id} as acknowledged for user {user_id}"
            )

        return target
    except Exception as e:
        db.rollback()
        api_logger.error(
            f"Failed to mark announcement {announcement_id} as acknowledged: {str(e)}",
            exc_info=True
        )
        raise


def list_announcements_for_supervisor(
    db: Session,
    company_id: int,
    *,
    division: Optional[str] = None,
    limit: int = 50,
) -> List[schemas.AnnouncementOut]:
    """List all announcements for supervisor view (filtered by company)"""
    try:
        q = db.query(models.Announcement).filter(
            models.Announcement.company_id == company_id
        )

        if division:
            # Filter by division if specified
            q = q.filter(
                (models.Announcement.scope == schemas.AnnouncementScope.ALL)
                | (
                    (models.Announcement.scope == schemas.AnnouncementScope.DIVISIONS)
                    # Note: This is simplified - you may need to store division info differently
                )
            )

        q = q.order_by(models.Announcement.created_at.desc()).limit(limit)

        announcements = q.all()
        return [schemas.AnnouncementOut.from_orm(ann) for ann in announcements]
    except Exception as e:
        api_logger.error(f"Failed to list announcements: {str(e)}", exc_info=True)
        raise

