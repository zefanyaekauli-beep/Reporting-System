# backend/app/api/v1/endpoints/incident_stplk.py

"""
STPLK (Surat Tanda Laporan Kehilangan) API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.schemas.incident import STPLKReportCreate, STPLKReportOut, STPLKReportUpdate
from app.models.incident import STPLKReport, IncidentStatus, IncidentType

router = APIRouter(prefix="/incidents/stplk", tags=["incidents-stplk"])


def generate_incident_number(db: Session, incident_type: str, incident_date: date) -> str:
    """Generate unique incident number"""
    date_str = incident_date.strftime("%Y%m%d")
    prefix = incident_type.replace("_", "-")
    
    last_incident = (
        db.query(STPLKReport)
        .filter(STPLKReport.incident_number.like(f"{prefix}-{date_str}-%"))
        .order_by(STPLKReport.id.desc())
        .first()
    )
    
    if last_incident:
        last_num = int(last_incident.incident_number.split("-")[-1])
        return f"{prefix}-{date_str}-{last_num + 1:03d}"
    else:
        return f"{prefix}-{date_str}-001"


@router.post("", response_model=STPLKReportOut, status_code=status.HTTP_201_CREATED)
def create_stplk(
    data: STPLKReportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create STPLK report"""
    try:
        company_id = current_user.get("company_id", 1)
        reported_by = current_user.get("id")
        
        if not reported_by:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        incident_number = generate_incident_number(db, IncidentType.STPLK.value, data.incident_date)

        report = STPLKReport(
            company_id=company_id,
            site_id=data.site_id,
            incident_type=IncidentType.STPLK.value,
            incident_number=incident_number,
            incident_date=data.incident_date,
            reported_by=reported_by,
            status=IncidentStatus.DRAFT.value,
            title=data.title,
            description=data.description,
            lost_item_description=data.lost_item_description,
            lost_item_value=data.lost_item_value,
            lost_date=data.lost_date,
            lost_location=data.lost_location,
            owner_name=data.owner_name,
            owner_contact=data.owner_contact,
            police_report_number=data.police_report_number,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating STPLK: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_stplk")


@router.get("", response_model=List[STPLKReportOut])
def list_stplk(
    site_id: Optional[int] = Query(None),
    incident_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List STPLK reports"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(STPLKReport).filter(STPLKReport.company_id == company_id)
        
        if site_id:
            query = query.filter(STPLKReport.site_id == site_id)
        if incident_date:
            query = query.filter(STPLKReport.incident_date == incident_date)
        if status:
            query = query.filter(STPLKReport.status == status)
        
        reports = query.order_by(STPLKReport.incident_date.desc()).offset(skip).limit(limit).all()
        return reports
    except Exception as e:
        api_logger.error(f"Error listing STPLK: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_stplk")


@router.get("/{report_id}", response_model=STPLKReportOut)
def get_stplk(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get STPLK report by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        report = db.query(STPLKReport).filter(
            STPLKReport.id == report_id,
            STPLKReport.company_id == company_id,
        ).first()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="STPLK report not found"
            )
        return report
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting STPLK: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_stplk")


@router.patch("/{report_id}", response_model=STPLKReportOut)
def update_stplk(
    report_id: int,
    data: STPLKReportUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update STPLK report"""
    try:
        company_id = current_user.get("company_id", 1)
        
        report = db.query(STPLKReport).filter(
            STPLKReport.id == report_id,
            STPLKReport.company_id == company_id,
        ).first()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="STPLK report not found"
            )
        
        # Update fields if provided
        if data.site_id is not None:
            report.site_id = data.site_id
        if data.incident_date is not None:
            report.incident_date = data.incident_date
        if data.title is not None:
            report.title = data.title
        if data.lost_item_description is not None:
            report.lost_item_description = data.lost_item_description
        if data.lost_item_value is not None:
            report.lost_item_value = data.lost_item_value
        if data.lost_date is not None:
            report.lost_date = data.lost_date
        if data.lost_location is not None:
            report.lost_location = data.lost_location
        if data.owner_name is not None:
            report.owner_name = data.owner_name
        if data.owner_contact is not None:
            report.owner_contact = data.owner_contact
        if data.police_report_number is not None:
            report.police_report_number = data.police_report_number
        if data.description is not None:
            report.description = data.description
        if data.status is not None:
            report.status = data.status
        
        db.commit()
        db.refresh(report)
        return report
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating STPLK: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_stplk")

