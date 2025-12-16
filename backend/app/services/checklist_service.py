# backend/app/services/checklist_service.py

"""
Service layer for Checklist operations.
Contains business logic for checklist creation, completion tracking, and validation.
"""

from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional, List
from app.divisions.security.models import (
    Checklist,
    ChecklistTemplate,
    ChecklistItem,
    ChecklistTemplateItem,
    ChecklistStatus,
    ChecklistItemStatus,
)


class ChecklistService:
    """Service for checklist operations"""
    
    @staticmethod
    def create_checklist_from_template(
        db: Session,
        template_id: int,
        user_id: int,
        site_id: int,
        company_id: int,
        shift_date: date,
        division: str,
        context_type: Optional[str] = None,
        context_id: Optional[int] = None,
        attendance_id: Optional[int] = None,
        shift_type: Optional[str] = None,
    ) -> Checklist:
        """
        Create a checklist instance from a template.
        This copies all template items to checklist items.
        
        Args:
            db: Database session
            template_id: ID of the checklist template
            user_id: ID of the user assigned to this checklist
            site_id: ID of the site
            company_id: ID of the company
            shift_date: Date of the shift
            division: Division (SECURITY, CLEANING, DRIVER, PARKING)
            context_type: Context type (SECURITY_PATROL, CLEANING_ZONE, etc.)
            context_id: Context ID (zone_id, trip_id, etc.)
            attendance_id: Optional attendance ID
            shift_type: Optional shift type
        
        Returns:
            Created Checklist instance
        """
        # Get template
        template = db.query(ChecklistTemplate).filter(
            ChecklistTemplate.id == template_id
        ).first()
        
        if not template:
            raise ValueError(f"Checklist template {template_id} not found")
        
        if not template.is_active:
            raise ValueError(f"Checklist template {template_id} is not active")
        
        # Check if checklist already exists for this user/date/context
        existing = db.query(Checklist).filter(
            Checklist.template_id == template_id,
            Checklist.user_id == user_id,
            Checklist.site_id == site_id,
            Checklist.shift_date == shift_date,
            Checklist.division == division.upper(),
        )
        
        if context_type:
            existing = existing.filter(Checklist.context_type == context_type.upper())
        if context_id:
            existing = existing.filter(Checklist.context_id == context_id)
        
        existing_checklist = existing.first()
        if existing_checklist:
            return existing_checklist
        
        # Create checklist instance
        checklist = Checklist(
            company_id=company_id,
            site_id=site_id,
            user_id=user_id,
            attendance_id=attendance_id,
            template_id=template_id,
            division=division.upper(),
            shift_date=shift_date,
            shift_type=shift_type,
            status=ChecklistStatus.OPEN,
            context_type=context_type.upper() if context_type else None,
            context_id=context_id,
        )
        db.add(checklist)
        db.flush()
        
        # Get template items ordered by order field
        template_items = db.query(ChecklistTemplateItem).filter(
            ChecklistTemplateItem.template_id == template_id
        ).order_by(ChecklistTemplateItem.order).all()
        
        # Create checklist items from template items
        for template_item in template_items:
            checklist_item = ChecklistItem(
                checklist_id=checklist.id,
                template_item_id=template_item.id,
                order=template_item.order,
                title=template_item.title,
                description=template_item.description,
                required=template_item.required,
                evidence_type=template_item.evidence_type,
                status=ChecklistItemStatus.PENDING,
                # Copy KPI fields
                kpi_key=template_item.kpi_key,
                answer_type=template_item.answer_type,
            )
            db.add(checklist_item)
        
        db.commit()
        db.refresh(checklist)
        
        return checklist
    
    @staticmethod
    def complete_checklist_item(
        db: Session,
        checklist_id: int,
        item_id: int,
        user_id: int,
        status: ChecklistItemStatus = ChecklistItemStatus.COMPLETED,
        note: Optional[str] = None,
        evidence_id: Optional[str] = None,
        answer_bool: Optional[bool] = None,
        answer_int: Optional[int] = None,
        answer_text: Optional[str] = None,
        photo_id: Optional[int] = None,
        gps_lat: Optional[float] = None,
        gps_lng: Optional[float] = None,
        gps_accuracy: Optional[float] = None,
        mock_location: Optional[bool] = None,
    ) -> ChecklistItem:
        """
        Mark a checklist item as completed.
        
        Args:
            db: Database session
            checklist_id: ID of the checklist
            item_id: ID of the checklist item
            user_id: ID of the user completing the item
            status: Status to set (default: COMPLETED)
            note: Optional note
            evidence_id: Optional evidence ID (photo path, etc.)
            answer_bool: Optional boolean answer (for KPI)
            answer_int: Optional integer answer (for KPI)
            answer_text: Optional text answer (for KPI)
            photo_id: Optional photo ID
            gps_lat: Optional GPS latitude
            gps_lng: Optional GPS longitude
            gps_accuracy: Optional GPS accuracy
            mock_location: Optional mock location flag
        
        Returns:
            Updated ChecklistItem
        """
        # Verify checklist belongs to user
        checklist = db.query(Checklist).filter(
            Checklist.id == checklist_id,
            Checklist.user_id == user_id
        ).first()
        
        if not checklist:
            raise ValueError(f"Checklist {checklist_id} not found or not owned by user {user_id}")
        
        # Get item
        item = db.query(ChecklistItem).filter(
            ChecklistItem.id == item_id,
            ChecklistItem.checklist_id == checklist_id
        ).first()
        
        if not item:
            raise ValueError(f"Checklist item {item_id} not found")
        
        # Update item
        item.status = status
        if note is not None:
            item.note = note
        if evidence_id is not None:
            item.evidence_id = evidence_id
        if answer_bool is not None:
            item.answer_bool = answer_bool
        if answer_int is not None:
            item.answer_int = answer_int
        if answer_text is not None:
            item.answer_text = answer_text
        if photo_id is not None:
            item.photo_id = photo_id
        if gps_lat is not None:
            item.gps_lat = gps_lat
        if gps_lng is not None:
            item.gps_lng = gps_lng
        if gps_accuracy is not None:
            item.gps_accuracy = gps_accuracy
        if mock_location is not None:
            item.mock_location = mock_location
        
        if status == ChecklistItemStatus.COMPLETED:
            item.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(item)
        
        # Update checklist status based on items
        ChecklistService._update_checklist_status(db, checklist_id)
        
        return item
    
    @staticmethod
    def _update_checklist_status(db: Session, checklist_id: int) -> None:
        """
        Update checklist status based on completion of items.
        Internal method.
        """
        checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
        if not checklist:
            return
        
        items = db.query(ChecklistItem).filter(ChecklistItem.checklist_id == checklist_id).all()
        
        if not items:
            checklist.status = ChecklistStatus.OPEN
            db.commit()
            return
        
        total_items = len(items)
        required_items = [item for item in items if item.required]
        completed_items = [item for item in items if item.status == ChecklistItemStatus.COMPLETED]
        failed_items = [item for item in items if item.status == ChecklistItemStatus.FAILED]
        
        completed_required = len([item for item in completed_items if item.required])
        total_required = len(required_items)
        
        # Determine status
        if total_required > 0 and completed_required == total_required:
            # All required items completed
            checklist.status = ChecklistStatus.COMPLETED
            if not checklist.completed_at:
                checklist.completed_at = datetime.utcnow()
        elif len(failed_items) > 0:
            # Some items failed
            checklist.status = ChecklistStatus.INCOMPLETE
        elif len(completed_items) == total_items:
            # All items completed (including optional)
            checklist.status = ChecklistStatus.COMPLETED
            if not checklist.completed_at:
                checklist.completed_at = datetime.utcnow()
        elif len(completed_items) > 0:
            # Some items completed but not all
            checklist.status = ChecklistStatus.INCOMPLETE
        else:
            # No items completed
            checklist.status = ChecklistStatus.OPEN
        
        db.commit()
    
    @staticmethod
    def get_checklist_completion_percent(db: Session, checklist_id: int) -> float:
        """
        Calculate completion percentage for a checklist.
        
        Args:
            db: Database session
            checklist_id: ID of the checklist
        
        Returns:
            Completion percentage (0-100)
        """
        items = db.query(ChecklistItem).filter(ChecklistItem.checklist_id == checklist_id).all()
        
        if not items:
            return 0.0
        
        total_items = len(items)
        completed_items = len([
            item for item in items 
            if item.status == ChecklistItemStatus.COMPLETED
        ])
        
        return (completed_items / total_items * 100) if total_items > 0 else 0.0
    
    @staticmethod
    def get_checklist_summary(
        db: Session,
        checklist_id: int
    ) -> dict:
        """
        Get summary statistics for a checklist.
        
        Args:
            db: Database session
            checklist_id: ID of the checklist
        
        Returns:
            Dictionary with summary statistics
        """
        checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
        if not checklist:
            raise ValueError(f"Checklist {checklist_id} not found")
        
        items = db.query(ChecklistItem).filter(ChecklistItem.checklist_id == checklist_id).all()
        
        total_items = len(items)
        required_items = [item for item in items if item.required]
        completed_items = [item for item in items if item.status == ChecklistItemStatus.COMPLETED]
        pending_items = [item for item in items if item.status == ChecklistItemStatus.PENDING]
        failed_items = [item for item in items if item.status == ChecklistItemStatus.FAILED]
        
        completion_percent = ChecklistService.get_checklist_completion_percent(db, checklist_id)
        
        return {
            "checklist_id": checklist_id,
            "status": checklist.status.value if hasattr(checklist.status, 'value') else str(checklist.status),
            "total_items": total_items,
            "required_items": len(required_items),
            "completed_items": len(completed_items),
            "pending_items": len(pending_items),
            "failed_items": len(failed_items),
            "completion_percent": completion_percent,
            "completed_at": checklist.completed_at.isoformat() if checklist.completed_at else None,
        }

