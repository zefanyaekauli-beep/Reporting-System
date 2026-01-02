# backend/app/api/v1/endpoints/compliance.py

"""
Compliance & Auditor API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.compliance import ComplianceChecklist, AuditSchedule, AuditExecution

router = APIRouter(prefix="/compliance", tags=["compliance"])


class ComplianceChecklistOut(BaseModel):
    id: int
    site_id: int
    checklist_name: str
    category: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuditScheduleOut(BaseModel):
    id: int
    site_id: int
    audit_type: str
    scheduled_date: date
    scheduled_time: Optional[str] = None
    auditor_name: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/checklists", response_model=List[ComplianceChecklistOut])
def list_compliance_checklists(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List compliance checklists"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(ComplianceChecklist).filter(ComplianceChecklist.company_id == company_id)
        
        if site_id:
            query = query.filter(ComplianceChecklist.site_id == site_id)
        
        checklists = query.order_by(ComplianceChecklist.checklist_name).all()
        return checklists
    except Exception as e:
        api_logger.error(f"Error listing compliance checklists: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_compliance_checklists")


@router.get("/audits", response_model=List[AuditScheduleOut])
def list_audit_schedules(
    site_id: Optional[int] = Query(None),
    scheduled_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List audit schedules"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(AuditSchedule).filter(AuditSchedule.company_id == company_id)
        
        if site_id:
            query = query.filter(AuditSchedule.site_id == site_id)
        if scheduled_date:
            query = query.filter(AuditSchedule.scheduled_date == scheduled_date)
        if status:
            query = query.filter(AuditSchedule.status == status)
        
        schedules = query.order_by(AuditSchedule.scheduled_date.desc()).all()
        return schedules
    except Exception as e:
        api_logger.error(f"Error listing audit schedules: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_audit_schedules")

