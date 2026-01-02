# backend/app/api/v1/endpoints/incident_findings.py

"""
Findings Report API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.schemas.incident import FindingsReportCreate, FindingsReportOut, FindingsReportUpdate
from app.models.incident import FindingsReport, IncidentStatus, IncidentType

router = APIRouter(prefix="/incidents/findings", tags=["incidents-findings"])


def generate_incident_number(db: Session, incident_type: str, incident_date: date) -> str:
    """Generate unique incident number"""
    date_str = incident_date.strftime("%Y%m%d")
    prefix = incident_type.replace("_", "-")
    
    last_incident = (
        db.query(FindingsReport)
        .filter(FindingsReport.incident_number.like(f"{prefix}-{date_str}-%"))
        .order_by(FindingsReport.id.desc())
        .first()
    )
    
    if last_incident:
        last_num = int(last_incident.incident_number.split("-")[-1])
        return f"{prefix}-{date_str}-{last_num + 1:03d}"
    else:
        return f"{prefix}-{date_str}-001"


@router.post("", response_model=FindingsReportOut, status_code=status.HTTP_201_CREATED)
def create_findings(
    data: FindingsReportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create Findings report"""
    try:
        company_id = current_user.get("company_id", 1)
        reported_by = current_user.get("id")
        
        if not reported_by:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        incident_number = generate_incident_number(db, IncidentType.FINDINGS.value, data.incident_date)

        report = FindingsReport(
            company_id=company_id,
            site_id=data.site_id,
            incident_type=IncidentType.FINDINGS.value,
            incident_number=incident_number,
            incident_date=data.incident_date,
            reported_by=reported_by,
            status=IncidentStatus.DRAFT.value,
            title=data.title,
            description=data.description,
            location=data.location,
            finding_category=data.finding_category,
            severity_level=data.severity_level,
            root_cause=data.root_cause,
            corrective_action=data.corrective_action,
            preventive_action=data.preventive_action,
            responsible_party=data.responsible_party,
            due_date=data.due_date,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error creating Findings: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_findings")


@router.get("", response_model=List[FindingsReportOut])
def list_findings(
    site_id: Optional[int] = Query(None),
    incident_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    severity_level: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List Findings reports"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(FindingsReport).filter(FindingsReport.company_id == company_id)
        
        if site_id:
            query = query.filter(FindingsReport.site_id == site_id)
        if incident_date:
            query = query.filter(FindingsReport.incident_date == incident_date)
        if status:
            query = query.filter(FindingsReport.status == status)
        if severity_level:
            query = query.filter(FindingsReport.severity_level == severity_level)
        
        reports = query.order_by(FindingsReport.incident_date.desc()).offset(skip).limit(limit).all()
        return reports
    except Exception as e:
        api_logger.error(f"Error listing Findings: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_findings")


@router.get("/{report_id}", response_model=FindingsReportOut)
def get_findings(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get Findings report by ID"""
    try:
        company_id = current_user.get("company_id", 1)
        
        report = db.query(FindingsReport).filter(
            FindingsReport.id == report_id,
            FindingsReport.company_id == company_id,
        ).first()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Findings report not found"
            )
        return report
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting Findings: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_findings")


@router.patch("/{report_id}", response_model=FindingsReportOut)
def update_findings(
    report_id: int,
    data: FindingsReportUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update Findings report"""
    try:
        company_id = current_user.get("company_id", 1)
        
        report = db.query(FindingsReport).filter(
            FindingsReport.id == report_id,
            FindingsReport.company_id == company_id,
        ).first()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Findings report not found"
            )
        
        # Update fields if provided
        if data.site_id is not None:
            report.site_id = data.site_id
        if data.incident_date is not None:
            report.incident_date = data.incident_date
        if data.title is not None:
            report.title = data.title
        if data.description is not None:
            report.description = data.description
        if data.location is not None:
            report.location = data.location
        if data.finding_category is not None:
            report.finding_category = data.finding_category
        if data.severity_level is not None:
            report.severity_level = data.severity_level
        if data.root_cause is not None:
            report.root_cause = data.root_cause
        if data.corrective_action is not None:
            report.corrective_action = data.corrective_action
        if data.preventive_action is not None:
            report.preventive_action = data.preventive_action
        if data.responsible_party is not None:
            report.responsible_party = data.responsible_party
        if data.due_date is not None:
            report.due_date = data.due_date
        if data.resolved_date is not None:
            report.resolved_date = data.resolved_date
        if data.status is not None:
            report.status = data.status
        
        db.commit()
        db.refresh(report)
        return report
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error updating Findings: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_findings")

