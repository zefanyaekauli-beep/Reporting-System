# backend/app/services/dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from datetime import datetime, date, timedelta, time
from typing import Optional, List
from app.models.attendance import Attendance, AttendanceStatus
from app.models.shift import Shift
from app.divisions.security.models import (
    SecurityPatrolLog,
    SecurityReport,
    Checklist,
    ChecklistStatus,
    ChecklistItemStatus
)
from app.schemas.dashboard import (
    AttendanceSummaryWidget,
    PatrolStatusWidget,
    IncidentSummaryWidget,
    TaskCompletionWidget,
    DashboardFilters
)
from app.core.logger import api_logger


class DashboardService:
    """Service for dashboard data aggregation"""
    
    @staticmethod
    def get_attendance_summary(
        db: Session,
        company_id: int,
        filters: Optional[DashboardFilters] = None
    ) -> AttendanceSummaryWidget:
        """Calculate attendance summary metrics"""
        try:
            # Build base query
            base_query = db.query(Attendance).filter(
                Attendance.company_id == company_id
            )
            
            # Apply date filters
            if filters:
                if filters.date_from:
                    start_datetime = datetime.combine(filters.date_from, datetime.min.time())
                    base_query = base_query.filter(Attendance.checkin_time >= start_datetime)
                if filters.date_to:
                    end_datetime = datetime.combine(filters.date_to + timedelta(days=1), datetime.min.time())
                    base_query = base_query.filter(Attendance.checkin_time < end_datetime)
                if filters.site_ids:
                    base_query = base_query.filter(Attendance.site_id.in_(filters.site_ids))
                if filters.division:
                    base_query = base_query.filter(Attendance.role_type == filters.division)
                if filters.shift:
                    base_query = base_query.filter(Attendance.shift == filters.shift)
            
            # Total On Duty (currently IN_PROGRESS)
            total_on_duty = base_query.filter(
                Attendance.status == AttendanceStatus.IN_PROGRESS
            ).count()
            
            # Calculate late arrivals
            # Late = check-in time is after shift start time + grace period (10 minutes)
            # For now, we'll use a simple heuristic: check-in after 8:10 AM for morning shift
            # This can be enhanced with actual shift data
            late_query = base_query.filter(
                Attendance.status == AttendanceStatus.IN_PROGRESS
            )
            
            # Simple late calculation: if checkin_time is after 8:10 AM and shift is morning
            # This is a simplified version - can be enhanced with Shift model
            total_late = 0
            if filters and filters.shift:
                # If filtering by shift, calculate late based on shift start time
                shift_start_times = {
                    "MORNING": time(8, 0),
                    "AFTERNOON": time(14, 0),
                    "NIGHT": time(20, 0),
                    "0": time(0, 0),
                    "1": time(8, 0),
                    "2": time(16, 0),
                    "3": time(0, 0),
                }
                start_time = shift_start_times.get(filters.shift, time(8, 0))
                grace_minutes = 10
                
                for attendance in late_query.all():
                    checkin_time_only = attendance.checkin_time.time()
                    if checkin_time_only > start_time:
                        # Check if more than grace period late
                        checkin_datetime = datetime.combine(attendance.checkin_time.date(), checkin_time_only)
                        start_datetime = datetime.combine(attendance.checkin_time.date(), start_time)
                        minutes_late = (checkin_datetime - start_datetime).total_seconds() / 60
                        if minutes_late > grace_minutes:
                            total_late += 1
            else:
                # Default: check if check-in is after 8:10 AM
                for attendance in late_query.all():
                    checkin_time_only = attendance.checkin_time.time()
                    if checkin_time_only > time(8, 10):
                        total_late += 1
            
            # Total Absent = Expected - On Duty (simplified)
            # For now, we'll use a simple calculation
            # Expected can be calculated from Shift model if available
            expected_attendance = base_query.count()
            total_absent = max(0, expected_attendance - total_on_duty)
            
            # Early Checkout = Checked out before shift end time
            # For now, count those who checked out before 4 PM (for day shift)
            early_checkout_query = base_query.filter(
                Attendance.status == AttendanceStatus.COMPLETED,
                Attendance.checkout_time.isnot(None)
            )
            total_early_checkout = 0
            for attendance in early_checkout_query.all():
                if attendance.checkout_time:
                    checkout_time_only = attendance.checkout_time.time()
                    # Early checkout if before 4 PM (for day shift)
                    if checkout_time_only < time(16, 0):
                        total_early_checkout += 1
            
            return AttendanceSummaryWidget(
                total_on_duty=total_on_duty,
                total_late=total_late,
                total_absent=total_absent,
                total_early_checkout=total_early_checkout
            )
        except Exception as e:
            api_logger.error(f"Error calculating attendance summary: {str(e)}", exc_info=True)
            return AttendanceSummaryWidget(
                total_on_duty=0,
                total_late=0,
                total_absent=0,
                total_early_checkout=0
            )
    
    @staticmethod
    def get_patrol_status(
        db: Session,
        company_id: int,
        filters: Optional[DashboardFilters] = None
    ) -> PatrolStatusWidget:
        """Calculate patrol status metrics"""
        try:
            base_query = db.query(SecurityPatrolLog).filter(
                SecurityPatrolLog.company_id == company_id
            )
            
            # Apply date filters
            if filters:
                if filters.date_from:
                    start_datetime = datetime.combine(filters.date_from, datetime.min.time())
                    base_query = base_query.filter(SecurityPatrolLog.start_time >= start_datetime)
                if filters.date_to:
                    end_datetime = datetime.combine(filters.date_to + timedelta(days=1), datetime.min.time())
                    base_query = base_query.filter(SecurityPatrolLog.start_time < end_datetime)
                if filters.site_ids:
                    base_query = base_query.filter(SecurityPatrolLog.site_id.in_(filters.site_ids))
            
            # Routes Completed (status = completed)
            routes_completed = base_query.filter(
                SecurityPatrolLog.status == "completed"
            ).count()
            
            # Routes In Progress (status = partial and end_time is None)
            routes_in_progress = base_query.filter(
                SecurityPatrolLog.status == "partial",
                SecurityPatrolLog.end_time.is_(None)
            ).count()
            
            # Routes Pending (scheduled but not started)
            # For now, we'll use a simple heuristic: patrols scheduled for today but not started
            # This can be enhanced with PatrolSchedule model when available
            today = date.today()
            today_start = datetime.combine(today, datetime.min.time())
            today_end = datetime.combine(today, datetime.max.time())
            
            routes_pending = base_query.filter(
                SecurityPatrolLog.start_time >= today_start,
                SecurityPatrolLog.start_time <= today_end,
                SecurityPatrolLog.status == "partial",
                SecurityPatrolLog.end_time.is_(None)
            ).count()
            
            # Missed Checkpoints
            # For now, we'll use a simplified calculation
            # This can be enhanced with PatrolCheckpoint model when available
            missed_checkpoints = 0
            # TODO: Calculate from patrol checkpoints when model is available
            
            return PatrolStatusWidget(
                routes_completed=routes_completed,
                routes_in_progress=routes_in_progress,
                routes_pending=routes_pending,
                missed_checkpoints=missed_checkpoints
            )
        except Exception as e:
            api_logger.error(f"Error calculating patrol status: {str(e)}", exc_info=True)
            return PatrolStatusWidget(
                routes_completed=0,
                routes_in_progress=0,
                routes_pending=0,
                missed_checkpoints=0
            )
    
    @staticmethod
    def get_incident_summary(
        db: Session,
        company_id: int,
        filters: Optional[DashboardFilters] = None
    ) -> IncidentSummaryWidget:
        """Calculate incident summary metrics"""
        try:
            base_query = db.query(SecurityReport).filter(
                SecurityReport.company_id == company_id,
                SecurityReport.report_type == "incident"
            )
            
            # Apply date filters
            if filters:
                if filters.date_from:
                    start_datetime = datetime.combine(filters.date_from, datetime.min.time())
                    base_query = base_query.filter(SecurityReport.created_at >= start_datetime)
                if filters.date_to:
                    end_datetime = datetime.combine(filters.date_to + timedelta(days=1), datetime.min.time())
                    base_query = base_query.filter(SecurityReport.created_at < end_datetime)
                if filters.site_ids:
                    base_query = base_query.filter(SecurityReport.site_id.in_(filters.site_ids))
                if filters.division:
                    base_query = base_query.filter(SecurityReport.division == filters.division)
            
            # Open Incidents (status = open)
            open_incidents = base_query.filter(
                SecurityReport.status == "open"
            ).count()
            
            # In Review (status = in_review or in_progress)
            in_review = base_query.filter(
                or_(
                    SecurityReport.status == "in_review",
                    SecurityReport.status == "in_progress"
                )
            ).count()
            
            # Closed Today
            today = date.today()
            today_start = datetime.combine(today, datetime.min.time())
            today_end = datetime.combine(today, datetime.max.time())
            
            closed_today = base_query.filter(
                SecurityReport.status == "closed",
                SecurityReport.updated_at >= today_start,
                SecurityReport.updated_at <= today_end
            ).count()
            
            # Critical Alerts (incident_level = CRITICAL or severity = high)
            critical_alerts = base_query.filter(
                or_(
                    SecurityReport.incident_level == "CRITICAL",
                    SecurityReport.severity == "high"
                ),
                SecurityReport.status != "closed"
            ).count()
            
            return IncidentSummaryWidget(
                open_incidents=open_incidents,
                in_review=in_review,
                closed_today=closed_today,
                critical_alerts=critical_alerts
            )
        except Exception as e:
            api_logger.error(f"Error calculating incident summary: {str(e)}", exc_info=True)
            return IncidentSummaryWidget(
                open_incidents=0,
                in_review=0,
                closed_today=0,
                critical_alerts=0
            )
    
    @staticmethod
    def get_task_completion(
        db: Session,
        company_id: int,
        filters: Optional[DashboardFilters] = None
    ) -> TaskCompletionWidget:
        """Calculate task completion metrics"""
        try:
            base_query = db.query(Checklist).filter(
                Checklist.company_id == company_id
            )
            
            # Apply date filters
            if filters:
                if filters.date_from:
                    base_query = base_query.filter(Checklist.shift_date >= filters.date_from)
                if filters.date_to:
                    base_query = base_query.filter(Checklist.shift_date <= filters.date_to)
                if filters.site_ids:
                    base_query = base_query.filter(Checklist.site_id.in_(filters.site_ids))
                if filters.division:
                    base_query = base_query.filter(Checklist.division == filters.division)
            
            # Get all checklists
            all_checklists = base_query.all()
            total_tasks = len(all_checklists)
            
            # Completed Today
            today = date.today()
            completed_today = base_query.filter(
                Checklist.status == ChecklistStatus.COMPLETED,
                Checklist.shift_date == today
            ).count()
            
            # Calculate completion percentage
            completed_checklists = base_query.filter(
                Checklist.status == ChecklistStatus.COMPLETED
            ).count()
            
            checklist_progress = 0.0
            if total_tasks > 0:
                checklist_progress = (completed_checklists / total_tasks) * 100
            
            # Overdue Tasks (status = OPEN and shift_date < today)
            overdue_tasks = base_query.filter(
                Checklist.status == ChecklistStatus.OPEN,
                Checklist.shift_date < today
            ).count()
            
            return TaskCompletionWidget(
                checklist_progress=round(checklist_progress, 2),
                overdue_tasks=overdue_tasks,
                completed_today=completed_today,
                total_tasks=total_tasks
            )
        except Exception as e:
            api_logger.error(f"Error calculating task completion: {str(e)}", exc_info=True)
            return TaskCompletionWidget(
                checklist_progress=0.0,
                overdue_tasks=0,
                completed_today=0,
                total_tasks=0
            )

