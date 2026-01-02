from fastapi import APIRouter
import json
import os

# #region agent log
try:
    import pathlib
    log_path = pathlib.Path(__file__).parent.parent.parent.parent / ".cursor" / "debug.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(str(log_path), "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"A","location":"router.py:3","message":"Router module import started","data":{"step":"import_start"},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except Exception as e:
    import sys
    print(f"DEBUG LOG ERROR: {e}", file=sys.stderr)
# #endregion

# Import auth_routes with error handling - CRITICAL for login functionality
try:
    from app.api import auth_routes
    # #region agent log
    try:
        import pathlib
        log_path = pathlib.Path(__file__).parent.parent.parent.parent / ".cursor" / "debug.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(str(log_path), "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"C","location":"router.py:17","message":"Auth routes imported successfully","data":{"auth_router_exists":hasattr(auth_routes,"router")},"timestamp":int(__import__("time").time()*1000)}) + "\n")
    except: pass
    # #endregion
except Exception as e:
    # CRITICAL: Log auth_routes import failure to stderr so it's visible
    import sys
    import traceback
    error_msg = f"CRITICAL ERROR: Failed to import auth_routes: {type(e).__name__}: {str(e)}"
    print(error_msg, file=sys.stderr)
    print(f"Traceback:\n{''.join(traceback.format_exception(type(e), e, e.__traceback__))}", file=sys.stderr)
    # Also try to log to file
    try:
        import pathlib
        log_path = pathlib.Path(__file__).parent.parent.parent.parent / ".cursor" / "debug.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(str(log_path), "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"C","location":"router.py:17","message":"Auth routes import FAILED","data":{"error":str(e),"error_type":type(e).__name__,"traceback":traceback.format_exc()},"timestamp":int(__import__("time").time()*1000)}) + "\n")
    except: pass
    # Re-raise to prevent silent failure
    raise ImportError(f"Failed to import auth_routes: {str(e)}") from e

from app.api.attendance_routes import router as attendance_router
from app.api.supervisor_routes import router as supervisor_router
from app.api.announcement_routes import router as announcement_router
from app.api.checklist_template_routes import router as checklist_template_router
from app.api.cctv_routes import router as cctv_router
from app.api.control_center_routes import router as control_center_router
from app.api.shift_routes import router as shift_routes
from app.api.gps_routes import router as gps_router
from app.api.master_data_routes import router as master_data_router
from app.api.payroll_routes import router as payroll_router
from app.api.employee_routes import router as employee_router
from app.api.training_routes import router as training_router
from app.api.visitor_routes import router as visitor_router
from app.api.document_routes import router as document_router
from app.api.kta_routes import router as kta_router
from app.api.admin_routes import router as admin_router

# Import patrol_routes with error handling
try:
    from app.api.patrol_routes import router as patrol_router
    # #region agent log
    try:
        import pathlib
        log_path = pathlib.Path(__file__).parent.parent.parent.parent / ".cursor" / "debug.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(str(log_path), "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"A","location":"router.py:64","message":"Patrol routes imported successfully","data":{},"timestamp":int(__import__("time").time()*1000)}) + "\n")
    except: pass
    # #endregion
except Exception as e:
    import sys
    import traceback
    patrol_router = None
    error_msg = f"WARNING: Failed to import patrol_routes: {type(e).__name__}: {str(e)}"
    print(error_msg, file=sys.stderr)
    # #region agent log
    try:
        import pathlib
        log_path = pathlib.Path(__file__).parent.parent.parent.parent / ".cursor" / "debug.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(str(log_path), "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"A","location":"router.py:71","message":"Patrol routes import failed","data":{"error":str(e),"error_type":type(e).__name__,"traceback":traceback.format_exc()},"timestamp":int(__import__("time").time()*1000)}) + "\n")
    except: pass
    # #endregion
from app.api.calendar_routes import router as calendar_router
from app.api.heatmap_routes import router as heatmap_router
from app.api.dashboard_routes import router as dashboard_router
from app.api.v1.endpoints.dar import router as dar_router
from app.api.v1.endpoints.patrol_schedules import router as patrol_schedules_router
from app.api.v1.endpoints.patrol_assignments import router as patrol_assignments_router
from app.api.v1.endpoints.incident_lk_lp import router as incident_lk_lp_router
from app.api.v1.endpoints.incident_bap import router as incident_bap_router
from app.api.v1.endpoints.incident_stplk import router as incident_stplk_router
from app.api.v1.endpoints.incident_findings import router as incident_findings_router
from app.api.v1.endpoints.incident_recap import router as incident_recap_router
from app.api.v1.endpoints.compliance import router as compliance_router
from app.api.v1.endpoints.training_plan import router as training_plan_router
from app.api.v1.endpoints.training_participant import router as training_participant_router
from app.api.v1.endpoints.kpi_patrol import router as kpi_patrol_router
from app.api.v1.endpoints.kpi_report import router as kpi_report_router
from app.api.v1.endpoints.kpi_cctv import router as kpi_cctv_router
from app.api.v1.endpoints.kpi_training import router as kpi_training_router
from app.api.v1.endpoints.master_worker import router as master_worker_router
from app.api.v1.endpoints.master_business_unit import router as master_business_unit_router
from app.api.v1.endpoints.master_department import router as master_department_router
from app.api.v1.endpoints.master_patrol_points import router as master_patrol_points_router
from app.api.v1.endpoints.master_job_position import router as master_job_position_router
from app.api.v1.endpoints.master_asset import router as master_asset_router
from app.api.v1.endpoints.assets import router as assets_router
from app.api.v1.endpoints.master_asset_category import router as master_asset_category_router
from app.api.v1.endpoints.master_cctv_zone import router as master_cctv_zone_router
from app.api.v1.endpoints.admin_user_access import router as admin_user_access_router
from app.api.v1.endpoints.admin_incident_access import router as admin_incident_access_router
from app.api.v1.endpoints.admin_translation import router as admin_translation_router
from app.api.v1.endpoints.information_cctv_status import router as information_cctv_status_router
from app.api.v1.endpoints.information_notification import router as information_notification_router
from app.core.sync_routes import router as sync_router
from app.divisions.security.routes import router as security_router
from app.divisions.cleaning.routes import router as cleaning_router
from app.divisions.driver.routes import router as driver_router
from app.divisions.parking.routes import router as parking_router

api_router = APIRouter()

# Core
# #region agent log
try:
    with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"A","location":"router.py:62","message":"About to register auth router","data":{"auth_router_type":type(auth_routes.router).__name__},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion
api_router.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
# #region agent log
try:
    with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"A","location":"router.py:65","message":"Auth router registered successfully","data":{},"timestamp":int(__import__("time").time()*1000)}) + "\n")
except: pass
# #endregion
api_router.include_router(attendance_router, tags=["attendance"])
api_router.include_router(supervisor_router, tags=["supervisor"])
api_router.include_router(announcement_router, tags=["announcements"])
api_router.include_router(checklist_template_router, tags=["checklist-templates"])
api_router.include_router(cctv_router, tags=["cctv"])
api_router.include_router(control_center_router, tags=["control-center"])
api_router.include_router(shift_routes, tags=["shifts"])
api_router.include_router(gps_router, tags=["gps"])
api_router.include_router(master_data_router, tags=["master-data"])
api_router.include_router(payroll_router, tags=["payroll"])
api_router.include_router(employee_router, tags=["employees"])
api_router.include_router(training_router, tags=["training"])
api_router.include_router(visitor_router, tags=["visitors"])
api_router.include_router(document_router, tags=["documents"])
api_router.include_router(kta_router, tags=["kta"])
api_router.include_router(admin_router, tags=["admin"])
if patrol_router is not None:
    api_router.include_router(patrol_router, tags=["patrol"])
api_router.include_router(calendar_router, tags=["calendar"])
api_router.include_router(heatmap_router, tags=["heatmap"])
api_router.include_router(dashboard_router, tags=["dashboard"])
api_router.include_router(dar_router, tags=["dar"])
api_router.include_router(patrol_schedules_router, tags=["patrol-schedules"])
api_router.include_router(patrol_assignments_router, tags=["patrol-assignments"])
api_router.include_router(incident_lk_lp_router, tags=["incidents-lk-lp"])
api_router.include_router(incident_bap_router, tags=["incidents-bap"])
api_router.include_router(incident_stplk_router, tags=["incidents-stplk"])
api_router.include_router(incident_findings_router, tags=["incidents-findings"])
api_router.include_router(incident_recap_router, tags=["incidents-recap"])
api_router.include_router(compliance_router, tags=["compliance"])
api_router.include_router(training_plan_router, tags=["training-plans"])
api_router.include_router(training_participant_router, tags=["training-participants"])
api_router.include_router(kpi_patrol_router, tags=["kpi-patrol"])
api_router.include_router(kpi_report_router, tags=["kpi-report"])
api_router.include_router(kpi_cctv_router, tags=["kpi-cctv"])
api_router.include_router(kpi_training_router, tags=["kpi-training"])
api_router.include_router(master_worker_router, tags=["master-worker"])
api_router.include_router(master_business_unit_router, tags=["master-business-unit"])
api_router.include_router(master_department_router, tags=["master-department"])
api_router.include_router(master_patrol_points_router, tags=["master-patrol-points"])
api_router.include_router(master_job_position_router, tags=["master-job-position"])
api_router.include_router(master_asset_router, tags=["master-asset"])
api_router.include_router(assets_router, tags=["assets"])
api_router.include_router(master_asset_category_router, tags=["master-asset-category"])
api_router.include_router(master_cctv_zone_router, tags=["master-cctv-zone"])
api_router.include_router(admin_user_access_router, tags=["admin-user-access"])
api_router.include_router(admin_incident_access_router, tags=["admin-incident-access"])
api_router.include_router(admin_translation_router, tags=["admin-translation"])
api_router.include_router(information_cctv_status_router, tags=["information-cctv-status"])
api_router.include_router(information_notification_router, tags=["information-notification"])
api_router.include_router(sync_router, tags=["sync"])

# Divisions
api_router.include_router(security_router, prefix="/security", tags=["security"])
api_router.include_router(cleaning_router, prefix="/cleaning", tags=["cleaning"])
api_router.include_router(driver_router, prefix="/driver", tags=["driver"])
api_router.include_router(parking_router, prefix="/parking", tags=["parking"])
