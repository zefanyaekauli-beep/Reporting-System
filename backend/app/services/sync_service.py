# backend/app/services/sync_service.py

from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, List, Optional
from app.models.sync_queue import SyncQueue, SyncStatus, SyncOperationType
from app.core.logger import api_logger


class SyncService:
    """Service for processing offline sync queue."""
    
    def process_sync_queue(self, db: Session, user_id: int, limit: int = 50) -> Dict:
        """
        Process pending sync queue items for a user.
        Returns dict with processed count and errors.
        """
        pending_items = (
            db.query(SyncQueue)
            .filter(
                SyncQueue.user_id == user_id,
                SyncQueue.status == SyncStatus.PENDING,
            )
            .order_by(SyncQueue.created_at.asc())
            .limit(limit)
            .all()
        )
        
        processed_count = 0
        errors = []
        
        for item in pending_items:
            try:
                # Mark as processing
                item.status = SyncStatus.PROCESSING
                item.processed_at = datetime.utcnow()
                db.commit()
                
                # Process based on resource type
                success = self._process_sync_item(db, item)
                
                if success:
                    item.status = SyncStatus.COMPLETED
                    item.completed_at = datetime.utcnow()
                    processed_count += 1
                else:
                    item.status = SyncStatus.FAILED
                    item.error_message = "Processing failed"
                    errors.append({
                        "item_id": item.id,
                        "resource_type": item.resource_type,
                        "error": "Processing failed",
                    })
                
                db.commit()
                
            except Exception as e:
                db.rollback()
                error_msg = str(e)
                item.status = SyncStatus.FAILED
                item.error_message = error_msg
                item.retry_count += 1
                
                if item.retry_count >= item.max_retries:
                    item.status = SyncStatus.FAILED
                else:
                    item.status = SyncStatus.RETRY
                
                db.commit()
                
                errors.append({
                    "item_id": item.id,
                    "resource_type": item.resource_type,
                    "error": error_msg,
                })
        
        return {
            "processed_count": processed_count,
            "errors": errors,
            "total_pending": len(pending_items),
        }
    
    def _process_sync_item(self, db: Session, item: SyncQueue) -> bool:
        """Process a single sync queue item."""
        try:
            data = item.data
            resource_type = item.resource_type
            operation_type = item.operation_type
            
            if resource_type == "ATTENDANCE":
                return self._process_attendance(db, operation_type, data)
            elif resource_type == "REPORT":
                return self._process_report(db, operation_type, data)
            elif resource_type == "PATROL":
                return self._process_patrol(db, operation_type, data)
            elif resource_type == "CHECKLIST":
                return self._process_checklist(db, operation_type, data)
            else:
                api_logger.warning(f"Unknown resource type: {resource_type}")
                return False
                
        except Exception as e:
            api_logger.error(f"Error processing sync item {item.id}: {str(e)}", exc_info=True)
            return False
    
    def _process_attendance(self, db: Session, operation: SyncOperationType, data: Dict) -> bool:
        """Process attendance sync."""
        from app.models.attendance import Attendance
        
        try:
            if operation == SyncOperationType.CREATE:
                # Check if already exists
                existing = (
                    db.query(Attendance)
                    .filter(Attendance.id == data.get("id"))
                    .first()
                )
                if existing:
                    return True  # Already synced
                
                attendance = Attendance(**data)
                db.add(attendance)
                db.commit()
                return True
            elif operation == SyncOperationType.UPDATE:
                attendance = db.query(Attendance).filter(Attendance.id == data.get("id")).first()
                if attendance:
                    for key, value in data.items():
                        if key != "id" and hasattr(attendance, key):
                            setattr(attendance, key, value)
                    db.commit()
                    return True
            elif operation == SyncOperationType.DELETE:
                attendance = db.query(Attendance).filter(Attendance.id == data.get("id")).first()
                if attendance:
                    db.delete(attendance)
                    db.commit()
                    return True
            
            return False
        except Exception as e:
            db.rollback()
            api_logger.error(f"Error processing attendance sync: {str(e)}", exc_info=True)
            return False
    
    def _process_report(self, db: Session, operation: SyncOperationType, data: Dict) -> bool:
        """Process report sync."""
        from app.divisions.security.models import SecurityReport
        
        try:
            if operation == SyncOperationType.CREATE:
                existing = (
                    db.query(SecurityReport)
                    .filter(SecurityReport.id == data.get("id"))
                    .first()
                )
                if existing:
                    return True
                
                report = SecurityReport(**data)
                db.add(report)
                db.commit()
                return True
            elif operation == SyncOperationType.UPDATE:
                report = db.query(SecurityReport).filter(SecurityReport.id == data.get("id")).first()
                if report:
                    for key, value in data.items():
                        if key != "id" and hasattr(report, key):
                            setattr(report, key, value)
                    db.commit()
                    return True
            elif operation == SyncOperationType.DELETE:
                report = db.query(SecurityReport).filter(SecurityReport.id == data.get("id")).first()
                if report:
                    db.delete(report)
                    db.commit()
                    return True
            
            return False
        except Exception as e:
            db.rollback()
            api_logger.error(f"Error processing report sync: {str(e)}", exc_info=True)
            return False
    
    def _process_patrol(self, db: Session, operation: SyncOperationType, data: Dict) -> bool:
        """Process patrol sync."""
        from app.divisions.security.models import SecurityPatrolLog
        
        try:
            if operation == SyncOperationType.CREATE:
                existing = (
                    db.query(SecurityPatrolLog)
                    .filter(SecurityPatrolLog.id == data.get("id"))
                    .first()
                )
                if existing:
                    return True
                
                patrol = SecurityPatrolLog(**data)
                db.add(patrol)
                db.commit()
                return True
            elif operation == SyncOperationType.UPDATE:
                patrol = db.query(SecurityPatrolLog).filter(SecurityPatrolLog.id == data.get("id")).first()
                if patrol:
                    for key, value in data.items():
                        if key != "id" and hasattr(patrol, key):
                            setattr(patrol, key, value)
                    db.commit()
                    return True
            elif operation == SyncOperationType.DELETE:
                patrol = db.query(SecurityPatrolLog).filter(SecurityPatrolLog.id == data.get("id")).first()
                if patrol:
                    db.delete(patrol)
                    db.commit()
                    return True
            
            return False
        except Exception as e:
            db.rollback()
            api_logger.error(f"Error processing patrol sync: {str(e)}", exc_info=True)
            return False
    
    def _process_checklist(self, db: Session, operation: SyncOperationType, data: Dict) -> bool:
        """Process checklist sync."""
        from app.divisions.security.models import Checklist
        
        try:
            if operation == SyncOperationType.CREATE:
                existing = (
                    db.query(Checklist)
                    .filter(Checklist.id == data.get("id"))
                    .first()
                )
                if existing:
                    return True
                
                checklist = Checklist(**data)
                db.add(checklist)
                db.commit()
                return True
            elif operation == SyncOperationType.UPDATE:
                checklist = db.query(Checklist).filter(Checklist.id == data.get("id")).first()
                if checklist:
                    for key, value in data.items():
                        if key != "id" and hasattr(checklist, key):
                            setattr(checklist, key, value)
                    db.commit()
                    return True
            elif operation == SyncOperationType.DELETE:
                checklist = db.query(Checklist).filter(Checklist.id == data.get("id")).first()
                if checklist:
                    db.delete(checklist)
                    db.commit()
                    return True
            
            return False
        except Exception as e:
            db.rollback()
            api_logger.error(f"Error processing checklist sync: {str(e)}", exc_info=True)
            return False

