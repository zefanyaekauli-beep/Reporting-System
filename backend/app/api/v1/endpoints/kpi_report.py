# backend/app/api/v1/endpoints/kpi_report.py

"""
KPI Report API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.dar import DailyActivityReport, DARStatus

router = APIRouter(prefix="/kpi/report", tags=["kpi-report"])


class KPIReportStats(BaseModel):
    total_reports: int
    submitted_reports: int
    approved_reports: int
    rejected_reports: int
    submission_rate: float
    approval_rate: float
    average_resolution_hours: Optional[float] = None
    trends: dict


@router.get("", response_model=KPIReportStats)
def get_report_kpi(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get Report KPI metrics"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(DailyActivityReport).filter(DailyActivityReport.company_id == company_id)
        
        if site_id:
            query = query.filter(DailyActivityReport.site_id == site_id)
        if from_date:
            query = query.filter(DailyActivityReport.report_date >= from_date)
        if to_date:
            query = query.filter(DailyActivityReport.report_date <= to_date)
        
        total = query.count()
        submitted = query.filter(DailyActivityReport.status == DARStatus.SUBMITTED.value).count()
        approved = query.filter(DailyActivityReport.status == DARStatus.APPROVED.value).count()
        rejected = query.filter(DailyActivityReport.status == DARStatus.REJECTED.value).count()
        
        submission_rate = (submitted / total * 100) if total > 0 else 0.0
        approval_rate = (approved / submitted * 100) if submitted > 0 else 0.0
        
        return KPIReportStats(
            total_reports=total,
            submitted_reports=submitted,
            approved_reports=approved,
            rejected_reports=rejected,
            submission_rate=submission_rate,
            approval_rate=approval_rate,
            average_resolution_hours=None,  # TODO: Calculate from submit/approve times
            trends={},
        )
    except Exception as e:
        api_logger.error(f"Error getting report KPI: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_report_kpi")

