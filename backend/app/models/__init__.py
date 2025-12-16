# backend/app/models/__init__.py

from .base import Base
from .user import User
from .company import Company
from .site import Site
from .attendance import Attendance
from .announcement import Announcement
from .shift import Shift
from .permission import Permission, Role, AuditLog
from .patrol_target import PatrolTarget
from .patrol_team import PatrolTeam
from .employee import Employee
from .training import Training
from .visitor import Visitor
from .document import Document
from .sync_queue import SyncQueue
from .payroll import Payroll
from .gps_track import GPSTrack
from .master_data import MasterData
from .cctv import CCTV
from .inspect_point import InspectPoint
from .leave_request import LeaveRequest
from .attendance_correction import AttendanceCorrection

# Division-specific models
from app.divisions.security.models import (
    SecurityReport,
    SecurityPatrolLog,
    ChecklistTemplate,
    ChecklistTemplateItem,
    Checklist,
    ChecklistItem,
    DispatchTicket,
    PanicAlert,
    DailyActivityReport,
    ShiftHandover,
)

from app.divisions.cleaning import models as cleaning_models
from app.divisions.driver import models as driver_models
from app.divisions.parking import models as parking_models

__all__ = [
    "Base",
    "User",
    "Company",
    "Site",
    "Attendance",
    "Announcement",
    "Shift",
    "Permission",
    "Role",
    "AuditLog",
    "PatrolTarget",
    "PatrolTeam",
    "Employee",
    "Training",
    "Visitor",
    "Document",
    "SyncQueue",
    "Payroll",
    "GPSTrack",
    "MasterData",
    "CCTV",
    "InspectPoint",
    "LeaveRequest",
    "AttendanceCorrection",
    "SecurityReport",
    "SecurityPatrolLog",
    "ChecklistTemplate",
    "ChecklistTemplateItem",
    "Checklist",
    "ChecklistItem",
    "DispatchTicket",
    "PanicAlert",
    "DailyActivityReport",
    "ShiftHandover",
]

