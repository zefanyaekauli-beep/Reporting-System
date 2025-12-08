from fastapi import APIRouter

from app.api import auth_routes
from app.api.attendance_routes import router as attendance_router
from app.api.supervisor_routes import router as supervisor_router
from app.api.announcement_routes import router as announcement_router
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
api_router.include_router(sync_router, tags=["sync"])

# Divisions
api_router.include_router(security_router, prefix="/security", tags=["security"])
api_router.include_router(cleaning_router, prefix="/cleaning", tags=["cleaning"])
api_router.include_router(driver_router, prefix="/driver", tags=["driver"])
api_router.include_router(parking_router, prefix="/parking", tags=["parking"])
