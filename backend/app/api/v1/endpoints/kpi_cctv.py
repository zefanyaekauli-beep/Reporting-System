# backend/app/api/v1/endpoints/kpi_cctv.py

"""
KPI CCTV API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.models.cctv import CCTV

router = APIRouter(prefix="/kpi/cctv", tags=["kpi-cctv"])


class KPICCTVStats(BaseModel):
    total_cameras: int
    active_cameras: int
    offline_cameras: int
    uptime_percentage: float
    coverage_area: Optional[float] = None
    trends: dict


@router.get("", response_model=KPICCTVStats)
def get_cctv_kpi(
    site_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get CCTV KPI metrics"""
    try:
        company_id = current_user.get("company_id", 1)
        
        query = db.query(CCTV).filter(CCTV.company_id == company_id)
        
        if site_id:
            query = query.filter(CCTV.site_id == site_id)
        
        total = query.count()
        active = query.filter(CCTV.is_active == True).count()
        offline = total - active
        
        uptime_percentage = (active / total * 100) if total > 0 else 0.0
        
        return KPICCTVStats(
            total_cameras=total,
            active_cameras=active,
            offline_cameras=offline,
            uptime_percentage=uptime_percentage,
            coverage_area=None,  # TODO: Calculate from zone coverage
            trends={},
        )
    except Exception as e:
        api_logger.error(f"Error getting CCTV KPI: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_cctv_kpi")

