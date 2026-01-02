# backend/app/api/v1/endpoints/incident_bap.py

"""
BAP (Berita Acara Pemeriksaan) API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.schemas.incident import BAPReportCreate, BAPReportOut
from app.models.incident import BAPReport, IncidentStatus, IncidentType

router = APIRouter(prefix="/incidents/bap", tags=["incidents-bap"])


def generate_incident_number(db: Session, incident_type: str, incident_date: date) -> str:
    """Generate unique incident number"""
    date_str = incident_date.strftime("%Y%m%d")
    prefix = incident_type.replace("_", "-")
    
    last_incident = (
        db.query(BAPReport)
        .filter(BAPReport.incident_number.like(f"{prefix}-{date_str}-%"))
        .order_by(BAPReport.id.desc())
        .first()
    )
    
    if last_incident:
        last_num = int(last_incident.incident_number.split("-")[-1])
        return f"{prefix}-{date_str}-{last_num + 1:03d}"
    else:
        return f"{prefix}-{date_str}-001"


@router.post("", response_model=BAPReportOut, status_code=status.HTTP_201_CREATED)
def create_bap(
    data: BAPReportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create BAP report"""
    try:
        company_id = current_user.get("company_id", 1)
        reported_by = current_user.get("id")
        
        if not reported_by:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        incident_number = generate_incident_number(db, IncidentType.BAP.value, data.incident_date)

        report = BAPReport(
            company_id=company_id,
            site_id=data.site_id,
            incident_type=IncidentType.BAP.value,
            incident_number=incident_number,
            incident_date=data.incident_date,
            reported_by=reported_by,
            status=IncidentStatus.DRAFT.value,
            title=data.title,
            description=data.description,
            location=data.location,
            investigation_date=data.investigation_date,
            investigator_name=data.investigator_name,
            subject_name=data.subject_name,
            subject_id_number=data.subject_id_number,
            investigation_findings=data.investigation_findings,
            recommendations=data.recommendations,
            related_incident_id=data.related_incident_id,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating BAP: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_bap")


@router.get("", response_model=List[BAPReportOut])
def list_bap(
    site_id: Optional[int] = Query(None),
    incident_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List BAP reports"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(BAPReport).filter(BAPReport.company_id == company_id)
        
        if site_id:
            query = query.filter(BAPReport.site_id == site_id)
        if incident_date:
            query = query.filter(BAPReport.incident_date == incident_date)
        if status:
            query = query.filter(BAPReport.status == status)
        
        reports = query.order_by(BAPReport.incident_date.desc()).offset(skip).limit(limit).all()
        return reports
    except Exception as e:
        api_logger.error(f"Error listing BAP: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_bap")


@router.get("/{report_id}", response_model=BAPReportOut)
def get_bap(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get BAP report by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        report = db.query(BAPReport).filter(
            BAPReport.id == report_id,
            BAPReport.company_id == company_id,
        ).first()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="BAP report not found"
            )
        return report
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting BAP: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_bap")

