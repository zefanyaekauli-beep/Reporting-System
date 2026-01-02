# backend/app/api/v1/endpoints/incident_recap.py

"""
Incident Recap Dashboard API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.incident import LKLPReport, BAPReport, STPLKReport, FindingsReport, IncidentStatus

router = APIRouter(prefix="/incidents/recap", tags=["incidents-recap"])


class IncidentRecapStats(BaseModel):
    total_incidents: int
    open_incidents: int
    in_review_incidents: int
    closed_today: int
    critical_alerts: int
    lk_lp_count: int
    bap_count: int
    stplk_count: int
    findings_count: int
    incidents_by_status: dict
    incidents_by_type: dict
    incidents_by_severity: dict


@router.get("", response_model=IncidentRecapStats)
def get_incident_recap(
    site_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get incident recap dashboard data"""
    try:
        company_id = current_user.get("company_id", 1)
        today = date.today()
        
        # Base filters
        base_filters = [func.extract('year', LKLPReport.incident_date) == today.year]
        if site_id:
            base_filters.append(LKLPReport.site_id == site_id)
        if from_date:
            base_filters.append(LKLPReport.incident_date >= from_date)
        if to_date:
            base_filters.append(LKLPReport.incident_date <= to_date)
        
        # Count LK/LP
        lk_lp_query = db.query(LKLPReport).filter(
            LKLPReport.company_id == company_id,
            *base_filters
        )
        lk_lp_count = lk_lp_query.count()
        lk_lp_open = lk_lp_query.filter(LKLPReport.status == IncidentStatus.SUBMITTED.value).count()
        
        # Count BAP - rebuild filters with BAP model
        bap_filters = [func.extract('year', BAPReport.incident_date) == today.year]
        if site_id:
            bap_filters.append(BAPReport.site_id == site_id)
        if from_date:
            bap_filters.append(BAPReport.incident_date >= from_date)
        if to_date:
            bap_filters.append(BAPReport.incident_date <= to_date)
        
        bap_query = db.query(BAPReport).filter(
            BAPReport.company_id == company_id,
            *bap_filters
        )
        bap_count = bap_query.count()
        
        # Count STPLK - rebuild filters with STPLK model
        stplk_filters = [func.extract('year', STPLKReport.incident_date) == today.year]
        if site_id:
            stplk_filters.append(STPLKReport.site_id == site_id)
        if from_date:
            stplk_filters.append(STPLKReport.incident_date >= from_date)
        if to_date:
            stplk_filters.append(STPLKReport.incident_date <= to_date)
        
        stplk_query = db.query(STPLKReport).filter(
            STPLKReport.company_id == company_id,
            *stplk_filters
        )
        stplk_count = stplk_query.count()
        
        # Count Findings - rebuild filters with Findings model
        findings_filters = [func.extract('year', FindingsReport.incident_date) == today.year]
        if site_id:
            findings_filters.append(FindingsReport.site_id == site_id)
        if from_date:
            findings_filters.append(FindingsReport.incident_date >= from_date)
        if to_date:
            findings_filters.append(FindingsReport.incident_date <= to_date)
        
        findings_query = db.query(FindingsReport).filter(
            FindingsReport.company_id == company_id,
            *findings_filters
        )
        findings_count = findings_query.count()
        findings_critical = findings_query.filter(FindingsReport.severity_level == "CRITICAL").count()
        
        total_incidents = lk_lp_count + bap_count + stplk_count + findings_count
        open_incidents = lk_lp_open
        closed_today = 0  # TODO: Calculate based on status and date
        
        return IncidentRecapStats(
            total_incidents=total_incidents,
            open_incidents=open_incidents,
            in_review_incidents=0,  # TODO: Calculate
            closed_today=closed_today,
            critical_alerts=findings_critical,
            lk_lp_count=lk_lp_count,
            bap_count=bap_count,
            stplk_count=stplk_count,
            findings_count=findings_count,
            incidents_by_status={},
            incidents_by_type={
                "LK_LP": lk_lp_count,
                "BAP": bap_count,
                "STPLK": stplk_count,
                "FINDINGS": findings_count,
            },
            incidents_by_severity={},
        )
    except Exception as e:
        api_logger.error(f"Error getting incident recap: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_incident_recap")

