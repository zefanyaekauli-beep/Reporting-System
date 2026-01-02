# backend/app/services/dar_service.py

"""
Daily Activity Report (DAR) Service
Business logic for DAR operations
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import date, datetime
from app.models.dar import DailyActivityReport, DARPersonnel, DARActivity, DARStatus
from app.schemas.dar import (
    DailyActivityReportCreate,
    DailyActivityReportUpdate,
    DARPersonnelCreate,
    DARActivityCreate,
)
from app.core.logger import api_logger
from app.models.user import User
from app.models.site import Site


def create_dar(
    db: Session,
    *,
    company_id: int,
    created_by: int,
    data: DailyActivityReportCreate
) -> DailyActivityReport:
    """Create a new DAR"""
    try:
        # Check for duplicate DAR
        existing = db.query(DailyActivityReport).filter(
            DailyActivityReport.company_id == company_id,
            DailyActivityReport.site_id == data.site_id,
            DailyActivityReport.report_date == data.report_date,
            DailyActivityReport.shift == data.shift,
        ).first()

        if existing:
            raise ValueError(f"DAR already exists for site {data.site_id}, date {data.report_date}, shift {data.shift}")

        # Create DAR
        dar = DailyActivityReport(
            company_id=company_id,
            site_id=data.site_id,
            report_date=data.report_date,
            shift=data.shift,
            weather=data.weather,
            summary=data.summary,
            handover_notes=data.handover_notes,
            status=DARStatus.DRAFT.value,
            created_by=created_by,
        )
        db.add(dar)
        db.flush()

        # Add personnel
        for person_data in data.personnel:
            personnel = DARPersonnel(
                dar_id=dar.id,
                user_id=person_data.user_id,
                role=person_data.role,
                check_in_time=person_data.check_in_time,
                check_out_time=person_data.check_out_time,
            )
            db.add(personnel)

        # Add activities
        for activity_data in data.activities:
            activity = DARActivity(
                dar_id=dar.id,
                activity_time=activity_data.activity_time,
                activity_type=activity_data.activity_type,
                description=activity_data.description,
                location=activity_data.location,
                photo_url=activity_data.photo_url,
            )
            db.add(activity)

        db.commit()
        db.refresh(dar)
        return dar
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating DAR: {str(e)}", exc_info=True)
        raise


def get_dar(db: Session, *, dar_id: int, company_id: int) -> Optional[DailyActivityReport]:
    """Get DAR by ID"""
    return db.query(DailyActivityReport).filter(
        DailyActivityReport.id == dar_id,
        DailyActivityReport.company_id == company_id,
    ).first()


def list_dars(
    db: Session,
    *,
    company_id: int,
    site_id: Optional[int] = None,
    report_date: Optional[date] = None,
    shift: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[DailyActivityReport]:
    """List DARs with filters"""
    query = db.query(DailyActivityReport).filter(
        DailyActivityReport.company_id == company_id
    )

    if site_id:
        query = query.filter(DailyActivityReport.site_id == site_id)
    if report_date:
        query = query.filter(DailyActivityReport.report_date == report_date)
    if shift:
        query = query.filter(DailyActivityReport.shift == shift)
    if status:
        query = query.filter(DailyActivityReport.status == status)

    return query.order_by(DailyActivityReport.report_date.desc(), DailyActivityReport.created_at.desc()).offset(skip).limit(limit).all()


def update_dar(
    db: Session,
    *,
    dar_id: int,
    company_id: int,
    data: DailyActivityReportUpdate,
) -> Optional[DailyActivityReport]:
    """Update DAR"""
    dar = get_dar(db, dar_id=dar_id, company_id=company_id)
    if not dar:
        return None

    if dar.status != DARStatus.DRAFT.value:
        raise ValueError("Only DRAFT DARs can be updated")

    try:
        if data.weather is not None:
            dar.weather = data.weather
        if data.summary is not None:
            dar.summary = data.summary
        if data.handover_notes is not None:
            dar.handover_notes = data.handover_notes

        # Update personnel if provided
        if data.personnel is not None:
            # Delete existing personnel
            db.query(DARPersonnel).filter(DARPersonnel.dar_id == dar_id).delete()
            # Add new personnel
            for person_data in data.personnel:
                personnel = DARPersonnel(
                    dar_id=dar.id,
                    user_id=person_data.user_id,
                    role=person_data.role,
                    check_in_time=person_data.check_in_time,
                    check_out_time=person_data.check_out_time,
                )
                db.add(personnel)

        # Update activities if provided
        if data.activities is not None:
            # Delete existing activities
            db.query(DARActivity).filter(DARActivity.dar_id == dar_id).delete()
            # Add new activities
            for activity_data in data.activities:
                activity = DARActivity(
                    dar_id=dar.id,
                    activity_time=activity_data.activity_time,
                    activity_type=activity_data.activity_type,
                    description=activity_data.description,
                    location=activity_data.location,
                    photo_url=activity_data.photo_url,
                )
                db.add(activity)

        db.commit()
        db.refresh(dar)
        return dar
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating DAR: {str(e)}", exc_info=True)
        raise


def submit_dar(
    db: Session,
    *,
    dar_id: int,
    company_id: int,
) -> Optional[DailyActivityReport]:
    """Submit DAR for review"""
    dar = get_dar(db, dar_id=dar_id, company_id=company_id)
    if not dar:
        return None

    if dar.status != DARStatus.DRAFT.value:
        raise ValueError("Only DRAFT DARs can be submitted")

    dar.status = DARStatus.SUBMITTED.value
    db.commit()
    db.refresh(dar)
    return dar


def approve_dar(
    db: Session,
    *,
    dar_id: int,
    company_id: int,
    approved_by: int,
) -> Optional[DailyActivityReport]:
    """Approve DAR"""
    dar = get_dar(db, dar_id=dar_id, company_id=company_id)
    if not dar:
        return None

    if dar.status != DARStatus.SUBMITTED.value:
        raise ValueError("Only SUBMITTED DARs can be approved")

    dar.status = DARStatus.APPROVED.value
    dar.approved_by = approved_by
    dar.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(dar)
    return dar


def reject_dar(
    db: Session,
    *,
    dar_id: int,
    company_id: int,
    rejected_by: int,
    rejection_reason: str,
) -> Optional[DailyActivityReport]:
    """Reject DAR"""
    dar = get_dar(db, dar_id=dar_id, company_id=company_id)
    if not dar:
        return None

    if dar.status != DARStatus.SUBMITTED.value:
        raise ValueError("Only SUBMITTED DARs can be rejected")

    dar.status = DARStatus.REJECTED.value
    dar.approved_by = rejected_by  # Store who rejected
    dar.approved_at = datetime.utcnow()  # Store rejection time
    dar.rejection_reason = rejection_reason
    db.commit()
    db.refresh(dar)
    return dar


def delete_dar(
    db: Session,
    *,
    dar_id: int,
    company_id: int,
) -> bool:
    """Delete DAR (only if DRAFT)"""
    dar = get_dar(db, dar_id=dar_id, company_id=company_id)
    if not dar:
        return False

    if dar.status != DARStatus.DRAFT.value:
        raise ValueError("Only DRAFT DARs can be deleted")

    db.delete(dar)
    db.commit()
    return True

