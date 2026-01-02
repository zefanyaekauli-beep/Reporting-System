# backend/app/api/dashboard_routes.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardFilters,
    AttendanceSummaryWidget,
    PatrolStatusWidget,
    IncidentSummaryWidget,
    TaskCompletionWidget
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/widgets", response_model=DashboardResponse)
def get_dashboard_widgets(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
    date_from: Optional[date] = Query(None, description="Start date filter"),
    date_to: Optional[date] = Query(None, description="End date filter"),
    site_ids: Optional[str] = Query(None, description="Comma-separated site IDs"),
    division: Optional[str] = Query(None, description="Division filter: SECURITY, CLEANING, DRIVER, PARKING"),
    shift: Optional[str] = Query(None, description="Shift filter: MORNING, AFTERNOON, NIGHT, or shift number"),
):
    """
    Get dashboard widgets data with filters.
    Returns all widget data: attendance, patrol, incident, and task completion.
    """
    try:
        company_id = current_user.get("company_id", 1)
        
        # Build filters
        filters = None
        if date_from or date_to or site_ids or division or shift:
            site_ids_list = None
            if site_ids:
                try:
                    site_ids_list = [int(sid.strip()) for sid in site_ids.split(",") if sid.strip()]
                except ValueError:
                    api_logger.warning(f"Invalid site_ids format: {site_ids}")
            
            filters = DashboardFilters(
                date_from=date_from,
                date_to=date_to,
                site_ids=site_ids_list,
                division=division,
                shift=shift
            )
        
        # Get widget data
        attendance_summary = DashboardService.get_attendance_summary(db, company_id, filters)
        patrol_status = DashboardService.get_patrol_status(db, company_id, filters)
        incident_summary = DashboardService.get_incident_summary(db, company_id, filters)
        task_completion = DashboardService.get_task_completion(db, company_id, filters)
        
        return DashboardResponse(
            attendance_summary=attendance_summary,
            patrol_status=patrol_status,
            incident_summary=incident_summary,
            task_completion=task_completion,
            filters=filters,
            last_updated=datetime.utcnow()
        )
    except Exception as e:
        api_logger.error(f"Error in get_dashboard_widgets: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_dashboard_widgets")


@router.get("/widgets/attendance", response_model=AttendanceSummaryWidget)
def get_attendance_widget(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    site_ids: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    shift: Optional[str] = Query(None),
):
    """Get attendance summary widget data only"""
    try:
        company_id = current_user.get("company_id", 1)
        
        filters = None
        if date_from or date_to or site_ids or division or shift:
            site_ids_list = None
            if site_ids:
                try:
                    site_ids_list = [int(sid.strip()) for sid in site_ids.split(",") if sid.strip()]
                except ValueError:
                    pass
            
            filters = DashboardFilters(
                date_from=date_from,
                date_to=date_to,
                site_ids=site_ids_list,
                division=division,
                shift=shift
            )
        
        return DashboardService.get_attendance_summary(db, company_id, filters)
    except Exception as e:
        api_logger.error(f"Error in get_attendance_widget: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_attendance_widget")


@router.get("/widgets/patrol", response_model=PatrolStatusWidget)
def get_patrol_widget(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    site_ids: Optional[str] = Query(None),
):
    """Get patrol status widget data only"""
    try:
        company_id = current_user.get("company_id", 1)
        
        filters = None
        if date_from or date_to or site_ids:
            site_ids_list = None
            if site_ids:
                try:
                    site_ids_list = [int(sid.strip()) for sid in site_ids.split(",") if sid.strip()]
                except ValueError:
                    pass
            
            filters = DashboardFilters(
                date_from=date_from,
                date_to=date_to,
                site_ids=site_ids_list
            )
        
        return DashboardService.get_patrol_status(db, company_id, filters)
    except Exception as e:
        api_logger.error(f"Error in get_patrol_widget: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_patrol_widget")


@router.get("/widgets/incident", response_model=IncidentSummaryWidget)
def get_incident_widget(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    site_ids: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
):
    """Get incident summary widget data only"""
    try:
        company_id = current_user.get("company_id", 1)
        
        filters = None
        if date_from or date_to or site_ids or division:
            site_ids_list = None
            if site_ids:
                try:
                    site_ids_list = [int(sid.strip()) for sid in site_ids.split(",") if sid.strip()]
                except ValueError:
                    pass
            
            filters = DashboardFilters(
                date_from=date_from,
                date_to=date_to,
                site_ids=site_ids_list,
                division=division
            )
        
        return DashboardService.get_incident_summary(db, company_id, filters)
    except Exception as e:
        api_logger.error(f"Error in get_incident_widget: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_incident_widget")


@router.get("/widgets/tasks", response_model=TaskCompletionWidget)
def get_task_widget(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    site_ids: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
):
    """Get task completion widget data only"""
    try:
        company_id = current_user.get("company_id", 1)
        
        filters = None
        if date_from or date_to or site_ids or division:
            site_ids_list = None
            if site_ids:
                try:
                    site_ids_list = [int(sid.strip()) for sid in site_ids.split(",") if sid.strip()]
                except ValueError:
                    pass
            
            filters = DashboardFilters(
                date_from=date_from,
                date_to=date_to,
                site_ids=site_ids_list,
                division=division
            )
        
        return DashboardService.get_task_completion(db, company_id, filters)
    except Exception as e:
        api_logger.error(f"Error in get_task_widget: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_task_widget")

