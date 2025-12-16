# backend/app/divisions/security/services/checklist_service.py

from datetime import date
from sqlalchemy.orm import Session
from typing import Optional, Union
from app.models.user import User
from app.divisions.security.models import (
    Checklist,
    ChecklistItem,
    ChecklistTemplate,
    ChecklistStatus,
    ChecklistItemStatus,
)


def find_template_for_user(
    db: Session,
    user: Union[User, dict],
    site_id: int,
    shift_type: Optional[str] = None,
    division: str = "SECURITY",
) -> Optional[ChecklistTemplate]:
    """
    Find checklist template matching user's site, role, shift type, and division.
    Priority: site-specific > global (site_id=None)
    """
    if isinstance(user, dict):
        company_id = user.get("company_id", 1)
        user_role = user.get("role", "user")
    else:
        company_id = user.company_id
        user_role = user.role

    # Try site-specific first
    q = (
        db.query(ChecklistTemplate)
        .filter(
            ChecklistTemplate.company_id == company_id,
            ChecklistTemplate.is_active == True,
            ChecklistTemplate.division == division,
            ChecklistTemplate.site_id == site_id,
        )
    )

    if user_role:
        q = q.filter(
            (ChecklistTemplate.role == user_role) | (ChecklistTemplate.role.is_(None))
        )

    if shift_type:
        q = q.filter(
            (ChecklistTemplate.shift_type == shift_type)
            | (ChecklistTemplate.shift_type.is_(None))
        )

    template = q.first()

    # Fallback to global template (site_id=None)
    if not template:
        q = (
            db.query(ChecklistTemplate)
            .filter(
                ChecklistTemplate.company_id == company_id,
                ChecklistTemplate.is_active == True,
                ChecklistTemplate.division == division,
                ChecklistTemplate.site_id.is_(None),
            )
        )

        if user_role:
            q = q.filter(
                (ChecklistTemplate.role == user_role)
                | (ChecklistTemplate.role.is_(None))
            )

        if shift_type:
            q = q.filter(
                (ChecklistTemplate.shift_type == shift_type)
                | (ChecklistTemplate.shift_type.is_(None))
            )

        template = q.first()

    return template


def create_checklist_for_attendance(
    db: Session,
    user: Union[User, dict],
    site_id: int,
    attendance_id: Optional[int] = None,
    shift_type: Optional[str] = None,
    division: str = "SECURITY",
) -> Optional[Checklist]:
    """
    Create checklist instance from template for attendance.
    Returns None if no template found.
    """
    today = date.today()
    if isinstance(user, dict):
        company_id = user.get("company_id", 1)
        user_id = user.get("id", 1)
    else:
        company_id = user.company_id
        user_id = user.id

    # Avoid duplicate checklist for same user/date/site/division
    existing = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == company_id,
            Checklist.user_id == user_id,
            Checklist.site_id == site_id,
            Checklist.shift_date == today,
            Checklist.division == division,
        )
        .first()
    )

    if existing:
        return existing

    template = find_template_for_user(db, user, site_id, shift_type, division=division)

    if not template:
        # No template; nothing to create
        # Log for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(
            f"No checklist template found for user {user_id}, site {site_id}, "
            f"shift_type {shift_type}, division {division}"
        )
        return None

    checklist = Checklist(
        company_id=company_id,
        user_id=user_id,
        site_id=site_id,
        attendance_id=attendance_id,
        template_id=template.id,
        division=division,  # Use provided division
        shift_date=today,
        shift_type=shift_type,
        status=ChecklistStatus.OPEN,
    )

    db.add(checklist)
    db.flush()

    # Copy items from template
    for t_item in template.items:
        item = ChecklistItem(
            checklist_id=checklist.id,
            template_item_id=t_item.id,
            order=t_item.order,
            title=t_item.title,
            description=t_item.description,
            required=t_item.required,
            evidence_type=t_item.evidence_type,
            status=ChecklistItemStatus.PENDING,
        )
        db.add(item)

    db.commit()
    db.refresh(checklist)
    return checklist

