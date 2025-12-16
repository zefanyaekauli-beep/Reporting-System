# backend/app/api/checklist_template_routes.py

"""
API Routes for Checklist Template Management
Handles CRUD operations for checklist templates and template items.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.api.deps import require_supervisor
from app.divisions.security.models import ChecklistTemplate, ChecklistTemplateItem
from app.models.site import Site

router = APIRouter(prefix="/supervisor/checklist-templates", tags=["checklist-templates"])

# ========== Schemas ==========

class ChecklistTemplateItemCreate(BaseModel):
    order: int
    title: str
    description: Optional[str] = None
    required: bool = True
    evidence_type: str = "none"  # "none", "photo", "note", "patrol_log", "asset_scan"
    kpi_key: Optional[str] = None
    answer_type: Optional[str] = None  # 'BOOLEAN', 'CHOICE', 'SCORE', 'TEXT'
    photo_required: bool = False
    auto_complete_rule: Optional[dict] = None

class ChecklistTemplateItemOut(BaseModel):
    id: int
    template_id: int
    order: int
    title: str
    description: Optional[str]
    required: bool
    evidence_type: str
    kpi_key: Optional[str]
    answer_type: Optional[str]
    photo_required: bool

    class Config:
        from_attributes = True

class ChecklistTemplateCreate(BaseModel):
    name: str
    site_id: Optional[int] = None
    division: str  # 'SECURITY', 'CLEANING', 'DRIVER', 'PARKING'
    role: Optional[str] = None
    shift_type: Optional[str] = None  # "MORNING", "NIGHT", "DAY"
    is_active: bool = True
    items: List[ChecklistTemplateItemCreate] = []

class ChecklistTemplateUpdate(BaseModel):
    name: Optional[str] = None
    site_id: Optional[int] = None
    division: Optional[str] = None
    role: Optional[str] = None
    shift_type: Optional[str] = None
    is_active: Optional[bool] = None
    items: Optional[List[ChecklistTemplateItemCreate]] = None

class ChecklistTemplateOut(BaseModel):
    id: int
    company_id: int
    site_id: Optional[int]
    division: str
    name: str
    role: Optional[str]
    shift_type: Optional[str]
    is_active: bool
    site_name: Optional[str] = None
    items: List[ChecklistTemplateItemOut] = []
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

# ========== Helper Functions ==========

def safe_datetime_to_str(dt) -> str:
    """Safely convert datetime to ISO format string"""
    if dt is None:
        return ""
    try:
        if hasattr(dt, 'isoformat'):
            return dt.isoformat()
        return str(dt)
    except Exception as e:
        api_logger.warning(f"Failed to convert datetime: {e}")
        return ""

def template_to_dict(template, items: List, site_name: Optional[str] = None) -> dict:
    """Convert template ORM object to dictionary"""
    return {
        "id": template.id,
        "company_id": template.company_id,
        "site_id": template.site_id,
        "division": template.division,
        "name": template.name,
        "role": getattr(template, 'role', None),
        "shift_type": getattr(template, 'shift_type', None),
        "is_active": getattr(template, 'is_active', True),
        "site_name": site_name,
        "items": [
            ChecklistTemplateItemOut(
                id=item.id,
                template_id=item.template_id,
                order=item.order,
                title=item.title,
                description=getattr(item, 'description', None),
                required=getattr(item, 'required', True),
                evidence_type=getattr(item, 'evidence_type', 'none'),
                kpi_key=getattr(item, 'kpi_key', None),
                answer_type=getattr(item, 'answer_type', None),
                photo_required=getattr(item, 'photo_required', False),
            )
            for item in items
        ],
        "created_at": safe_datetime_to_str(getattr(template, 'created_at', None)),
        "updated_at": safe_datetime_to_str(getattr(template, 'updated_at', None)),
    }

# ========== Endpoints ==========

@router.get("", response_model=List[ChecklistTemplateOut])
def list_checklist_templates(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
    division: Optional[str] = Query(None, description="Filter by division"),
    site_id: Optional[int] = Query(None, description="Filter by site"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    company_id: Optional[int] = Query(None, description="Filter by company"),
):
    """
    List all checklist templates with optional filters.
    """
    try:
        company_id_filter = company_id or current_user.get("company_id", 1)
        
        query = db.query(ChecklistTemplate).filter(
            ChecklistTemplate.company_id == company_id_filter
        )
        
        if division:
            query = query.filter(ChecklistTemplate.division == division.upper())
        
        if site_id:
            query = query.filter(ChecklistTemplate.site_id == site_id)
        
        if is_active is not None:
            query = query.filter(ChecklistTemplate.is_active == is_active)
        
        templates = query.order_by(ChecklistTemplate.created_at.desc()).all()
        
        # Pre-load all sites at once
        site_ids = [t.site_id for t in templates if t.site_id is not None]
        sites = {}
        if site_ids:
            try:
                site_list = db.query(Site).filter(Site.id.in_(site_ids)).all()
                sites = {s.id: getattr(s, 'name', None) for s in site_list}
            except Exception as site_err:
                api_logger.warning(f"Failed to load sites: {site_err}")
        
        # Build results
        results = []
        for template in templates:
            try:
                # Load items for this template
                items = db.query(ChecklistTemplateItem).filter(
                    ChecklistTemplateItem.template_id == template.id
                ).order_by(ChecklistTemplateItem.order).all()
                
                # Get site name
                site_name = sites.get(template.site_id) if template.site_id else None
                
                # Convert to dict
                result_dict = template_to_dict(template, items, site_name)
                results.append(ChecklistTemplateOut(**result_dict))
                
            except Exception as template_error:
                api_logger.error(
                    f"Error processing template {template.id}: {str(template_error)}", 
                    exc_info=True
                )
                # Skip this template and continue
                continue
        
        return results
    
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error in list_checklist_templates: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list templates: {str(e)}"
        )

@router.get("/{template_id}", response_model=ChecklistTemplateOut)
def get_checklist_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """
    Get a single checklist template by ID.
    """
    try:
        company_id_filter = current_user.get("company_id", 1)
        
        template = db.query(ChecklistTemplate).filter(
            ChecklistTemplate.id == template_id,
            ChecklistTemplate.company_id == company_id_filter
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Checklist template not found"
            )
        
        # Load items
        items = db.query(ChecklistTemplateItem).filter(
            ChecklistTemplateItem.template_id == template.id
        ).order_by(ChecklistTemplateItem.order).all()
        
        # Load site
        site_name = None
        if template.site_id:
            try:
                site = db.query(Site).filter(Site.id == template.site_id).first()
                if site:
                    site_name = getattr(site, 'name', None)
            except Exception as site_err:
                api_logger.warning(f"Failed to load site {template.site_id}: {site_err}")
        
        # Convert to dict
        result_dict = template_to_dict(template, items, site_name)
        return ChecklistTemplateOut(**result_dict)
    
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error in get_checklist_template: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get template: {str(e)}"
        )

@router.post("", response_model=ChecklistTemplateOut, status_code=status.HTTP_201_CREATED)
def create_checklist_template(
    payload: ChecklistTemplateCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """
    Create a new checklist template with items.
    """
    try:
        company_id_filter = current_user.get("company_id", 1)
        
        # Validate required fields
        if not payload.name or not payload.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template name is required"
            )
        
        if not payload.division:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Division is required"
            )
        
        if not payload.items or len(payload.items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one checklist item is required"
            )
        
        # Validate site_id if provided
        if payload.site_id:
            site = db.query(Site).filter(Site.id == payload.site_id).first()
            if not site:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Site with ID {payload.site_id} not found"
                )
        
        # Create template
        template = ChecklistTemplate(
            company_id=company_id_filter,
            site_id=payload.site_id,
            division=str(payload.division).upper(),
            name=str(payload.name).strip(),
            role=payload.role.strip() if payload.role and payload.role.strip() else None,
            shift_type=payload.shift_type.strip() if payload.shift_type and payload.shift_type.strip() else None,
            is_active=payload.is_active if payload.is_active is not None else True,
        )
        db.add(template)
        db.flush()
        
        # Create items
        items_created = []
        for idx, item_data in enumerate(payload.items):
            # Validate item
            if not item_data.title or not item_data.title.strip():
                continue  # Skip items without title
            
            item = ChecklistTemplateItem(
                template_id=template.id,
                order=item_data.order if item_data.order and item_data.order > 0 else (idx + 1),
                title=item_data.title.strip(),
                description=item_data.description.strip() if item_data.description and item_data.description.strip() else None,
                required=item_data.required if item_data.required is not None else True,
                evidence_type=str(item_data.evidence_type).strip() if item_data.evidence_type else "none",
                kpi_key=item_data.kpi_key.strip() if item_data.kpi_key and item_data.kpi_key.strip() else None,
                answer_type=item_data.answer_type.strip() if item_data.answer_type and item_data.answer_type.strip() else None,
                photo_required=item_data.photo_required if item_data.photo_required is not None else False,
                auto_complete_rule=item_data.auto_complete_rule,
            )
            db.add(item)
            items_created.append(item)
        
        # Validate that at least one item was created
        if not items_created:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one valid checklist item is required"
            )
        
        db.commit()
        db.refresh(template)
        
        # Load items for response
        items = db.query(ChecklistTemplateItem).filter(
            ChecklistTemplateItem.template_id == template.id
        ).order_by(ChecklistTemplateItem.order).all()
        
        # Load site
        site_name = None
        if template.site_id:
            try:
                site = db.query(Site).filter(Site.id == template.site_id).first()
                if site:
                    site_name = getattr(site, 'name', None)
            except Exception as site_err:
                api_logger.warning(f"Failed to load site {template.site_id}: {site_err}")
        
        # Convert to dict
        result_dict = template_to_dict(template, items, site_name)
        return ChecklistTemplateOut(**result_dict)
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error in create_checklist_template: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create template: {str(e)}"
        )

@router.put("/{template_id}", response_model=ChecklistTemplateOut)
def update_checklist_template(
    template_id: int,
    payload: ChecklistTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """
    Update a checklist template and optionally update items.
    """
    try:
        company_id_filter = current_user.get("company_id", 1)
        
        template = db.query(ChecklistTemplate).filter(
            ChecklistTemplate.id == template_id,
            ChecklistTemplate.company_id == company_id_filter
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Checklist template not found"
            )
        
        # Update template fields
        if payload.name is not None:
            template.name = payload.name.strip()
        if payload.site_id is not None:
            # Validate site_id if provided
            if payload.site_id:
                site = db.query(Site).filter(Site.id == payload.site_id).first()
                if not site:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Site with ID {payload.site_id} not found"
                    )
            template.site_id = payload.site_id
        if payload.division is not None:
            template.division = payload.division.upper()
        if payload.role is not None:
            template.role = payload.role.strip() if payload.role and payload.role.strip() else None
        if payload.shift_type is not None:
            template.shift_type = payload.shift_type.strip() if payload.shift_type and payload.shift_type.strip() else None
        if payload.is_active is not None:
            template.is_active = payload.is_active
        
        # Update items if provided
        if payload.items is not None:
            # Delete existing items
            db.query(ChecklistTemplateItem).filter(
                ChecklistTemplateItem.template_id == template.id
            ).delete()
            
            # Create new items
            for item_data in payload.items:
                if not item_data.title or not item_data.title.strip():
                    continue
                    
                item = ChecklistTemplateItem(
                    template_id=template.id,
                    order=item_data.order,
                    title=item_data.title.strip(),
                    description=item_data.description.strip() if item_data.description and item_data.description.strip() else None,
                    required=item_data.required,
                    evidence_type=item_data.evidence_type or "none",
                    kpi_key=item_data.kpi_key.strip() if item_data.kpi_key and item_data.kpi_key.strip() else None,
                    answer_type=item_data.answer_type.strip() if item_data.answer_type and item_data.answer_type.strip() else None,
                    photo_required=item_data.photo_required or False,
                    auto_complete_rule=item_data.auto_complete_rule,
                )
                db.add(item)
        
        db.commit()
        db.refresh(template)
        
        # Load items for response
        items = db.query(ChecklistTemplateItem).filter(
            ChecklistTemplateItem.template_id == template.id
        ).order_by(ChecklistTemplateItem.order).all()
        
        # Load site
        site_name = None
        if template.site_id:
            try:
                site = db.query(Site).filter(Site.id == template.site_id).first()
                if site:
                    site_name = getattr(site, 'name', None)
            except Exception as site_err:
                api_logger.warning(f"Failed to load site {template.site_id}: {site_err}")
        
        # Convert to dict
        result_dict = template_to_dict(template, items, site_name)
        return ChecklistTemplateOut(**result_dict)
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error in update_checklist_template: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update template: {str(e)}"
        )

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """
    Delete a checklist template.
    Note: This will also delete all template items (cascade).
    Existing checklist instances will not be affected.
    """
    try:
        company_id_filter = current_user.get("company_id", 1)
        
        template = db.query(ChecklistTemplate).filter(
            ChecklistTemplate.id == template_id,
            ChecklistTemplate.company_id == company_id_filter
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Checklist template not found"
            )
        
        # Delete template (items will be cascade deleted)
        db.delete(template)
        db.commit()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        api_logger.error(f"Error in delete_checklist_template: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete template: {str(e)}"
        )