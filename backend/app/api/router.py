from fastapi import APIRouter

from app.api import auth_routes
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
from app.api.patrol_routes import router as patrol_router
from app.api.calendar_routes import router as calendar_router
from app.api.heatmap_routes import router as heatmap_router
from app.core.sync_routes import router as sync_router
from app.divisions.security.routes import router as security_router
from app.divisions.cleaning.routes import router as cleaning_router
from app.divisions.driver.routes import router as driver_router
from app.divisions.parking.routes import router as parking_router

api_router = APIRouter()

# Core
api_router.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
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
api_router.include_router(patrol_router, tags=["patrol"])
api_router.include_router(calendar_router, tags=["calendar"])
api_router.include_router(heatmap_router, tags=["heatmap"])
api_router.include_router(sync_router, tags=["sync"])

# Divisions
api_router.include_router(security_router, prefix="/security", tags=["security"])
api_router.include_router(cleaning_router, prefix="/cleaning", tags=["cleaning"])
api_router.include_router(driver_router, prefix="/driver", tags=["driver"])
api_router.include_router(parking_router, prefix="/parking", tags=["parking"])
