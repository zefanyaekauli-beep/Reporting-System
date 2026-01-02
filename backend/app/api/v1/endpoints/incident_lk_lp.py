# backend/app/api/v1/endpoints/incident_lk_lp.py

"""
LK/LP (Laporan Kejadian) API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.schemas.incident import LKLPReportCreate, LKLPReportOut
from app.models.incident import LKLPReport, IncidentStatus, IncidentType

router = APIRouter(prefix="/incidents/lk-lp", tags=["incidents-lk-lp"])


def generate_incident_number(db: Session, incident_type: str, incident_date: date) -> str:
    """Generate unique incident number"""
    date_str = incident_date.strftime("%Y%m%d")
    prefix = incident_type.replace("_", "-")
    
    last_incident = (
        db.query(LKLPReport)
        .filter(LKLPReport.incident_number.like(f"{prefix}-{date_str}-%"))
        .order_by(LKLPReport.id.desc())
        .first()
    )
    
    if last_incident:
        last_num = int(last_incident.incident_number.split("-")[-1])
        return f"{prefix}-{date_str}-{last_num + 1:03d}"
    else:
        return f"{prefix}-{date_str}-001"


@router.post("", response_model=LKLPReportOut, status_code=status.HTTP_201_CREATED)
def create_lk_lp(
    data: LKLPReportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create LK/LP report"""
    try:
        company_id = current_user.get("company_id", 1)
        reported_by = current_user.get("id")
        
        if not reported_by:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        incident_number = generate_incident_number(db, IncidentType.LK_LP.value, data.incident_date)

        report = LKLPReport(
            company_id=company_id,
            site_id=data.site_id,
            incident_type=IncidentType.LK_LP.value,
            incident_number=incident_number,
            incident_date=data.incident_date,
            reported_by=reported_by,
            status=IncidentStatus.DRAFT.value,
            title=data.title,
            description=data.description,
            location=data.location,
            police_report_number=data.police_report_number,
            police_station=data.police_station,
            perpetrator_name=data.perpetrator_name,
            perpetrator_details=data.perpetrator_details,
            witness_names=str(data.witness_names) if data.witness_names else None,
            damage_estimate=data.damage_estimate,
            follow_up_required=data.follow_up_required,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating LK/LP: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_lk_lp")


@router.get("", response_model=List[LKLPReportOut])
def list_lk_lp(
    site_id: Optional[int] = Query(None),
    incident_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List LK/LP reports"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(LKLPReport).filter(LKLPReport.company_id == company_id)
        
        if site_id:
            query = query.filter(LKLPReport.site_id == site_id)
        if incident_date:
            query = query.filter(LKLPReport.incident_date == incident_date)
        if status:
            query = query.filter(LKLPReport.status == status)
        
        reports = query.order_by(LKLPReport.incident_date.desc()).offset(skip).limit(limit).all()
        return reports
    except Exception as e:
        api_logger.error(f"Error listing LK/LP: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_lk_lp")


@router.get("/{report_id}", response_model=LKLPReportOut)
def get_lk_lp(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get LK/LP report by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        report = db.query(LKLPReport).filter(
            LKLPReport.id == report_id,
            LKLPReport.company_id == company_id,
        ).first()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="LK/LP report not found"
            )
        return report
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting LK/LP: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_lk_lp")

