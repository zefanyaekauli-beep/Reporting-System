# backend/app/api/visitor_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date
import os
import re

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_supervisor
from app.models.visitor import Visitor
from app.models.user import User
from app.models.site import Site

router = APIRouter(prefix="/visitors", tags=["visitors"])

MEDIA_BASE = "media"
VISITOR_DIR = f"{MEDIA_BASE}/visitors"
os.makedirs(VISITOR_DIR, exist_ok=True)


class VisitorBase(BaseModel):
    id: int
    company_id: int
    site_id: int
    name: str
    company: Optional[str] = None
    id_card_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    purpose: Optional[str] = None
    category: Optional[str] = None
    visit_date: datetime
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    is_checked_in: bool
    host_user_id: Optional[int] = None
    host_name: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[VisitorBase])
def list_visitors(
    site_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List visitors."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(Visitor).filter(Visitor.company_id == company_id)
        
        if site_id:
            q = q.filter(Visitor.site_id == site_id)
        if category:
            q = q.filter(Visitor.category == category.upper())
        if status:
            q = q.filter(Visitor.status == status.upper())
        if from_date:
            q = q.filter(func.date(Visitor.visit_date) >= from_date)
        if to_date:
            q = q.filter(func.date(Visitor.visit_date) <= to_date)
        
        visitors = q.order_by(Visitor.visit_date.desc()).limit(200).all()
        
        result = []
        for visitor in visitors:
            result.append(VisitorBase(
                id=visitor.id,
                company_id=visitor.company_id,
                site_id=visitor.site_id,
                name=visitor.name,
                company=visitor.company,
                id_card_number=visitor.id_card_number,
                phone=visitor.phone,
                email=visitor.email,
                purpose=visitor.purpose,
                category=visitor.category,
                visit_date=visitor.visit_date,
                check_in_time=visitor.check_in_time,
                check_out_time=visitor.check_out_time,
                is_checked_in=visitor.is_checked_in,
                host_user_id=visitor.host_user_id,
                host_name=visitor.host_name,
                status=visitor.status,
                created_at=visitor.created_at,
            ))
        
        api_logger.info(f"Listed {len(result)} visitors for user {current_user.get('id')}")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing visitors: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list visitors: {error_msg}"
        )


@router.post("", response_model=VisitorBase, status_code=201)
async def register_visitor(
    site_id: int = Form(...),
    name: str = Form(...),
    company: Optional[str] = Form(None),
    id_card_number: Optional[str] = Form(None),
    id_card_type: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    purpose: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    host_user_id: Optional[int] = Form(None),
    host_name: Optional[str] = Form(None),
    expected_duration_minutes: Optional[int] = Form(None),
    photo: Optional[UploadFile] = File(None),
    id_card_photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Register visitor."""
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        # Validate site
        site = db.query(Site).filter(
            Site.id == site_id,
            Site.company_id == company_id,
        ).first()
        
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        
        # Handle photo uploads
        photo_path = None
        id_card_photo_path = None
        
        if photo:
            safe_filename = re.sub(r'[^\w\-_\.]', '_', photo.filename or 'photo')
            timestamp = int(datetime.utcnow().timestamp())
            filename = f"{timestamp}_{safe_filename}"
            photo_path = os.path.join(VISITOR_DIR, filename)
            with open(photo_path, "wb") as out:
                content = await photo.read()
                out.write(content)
        
        if id_card_photo:
            safe_filename = re.sub(r'[^\w\-_\.]', '_', id_card_photo.filename or 'id_card')
            timestamp = int(datetime.utcnow().timestamp())
            filename = f"{timestamp}_{safe_filename}"
            id_card_photo_path = os.path.join(VISITOR_DIR, filename)
            with open(id_card_photo_path, "wb") as out:
                content = await id_card_photo.read()
                out.write(content)
        
        # Generate badge number
        from datetime import date
        today = date.today()
        visitor_count_today = (
            db.query(Visitor)
            .filter(
                Visitor.company_id == company_id,
                func.date(Visitor.visit_date) == today,
            )
            .count()
        )
        badge_number = f"V{today.strftime('%Y%m%d')}{visitor_count_today + 1:03d}"
        
        visitor = Visitor(
            company_id=company_id,
            site_id=site_id,
            name=name,
            company=company,
            id_card_number=id_card_number,
            id_card_type=id_card_type,
            phone=phone,
            email=email,
            purpose=purpose,
            category=category.upper() if category else None,
            visit_date=datetime.utcnow(),
            expected_duration_minutes=expected_duration_minutes,
            host_user_id=host_user_id,
            host_name=host_name,
            security_user_id=user_id,
            badge_number=badge_number,
            photo_path=photo_path,
            id_card_photo_path=id_card_photo_path,
            status="REGISTERED",
            is_checked_in=False,
        )
        
        db.add(visitor)
        db.commit()
        db.refresh(visitor)
        
        api_logger.info(f"Registered visitor {visitor.id} by user {user_id}")
        return VisitorBase(
            id=visitor.id,
            company_id=visitor.company_id,
            site_id=visitor.site_id,
            name=visitor.name,
            company=visitor.company,
            id_card_number=visitor.id_card_number,
            phone=visitor.phone,
            email=visitor.email,
            purpose=visitor.purpose,
            category=visitor.category,
            visit_date=visitor.visit_date,
            check_in_time=visitor.check_in_time,
            check_out_time=visitor.check_out_time,
            is_checked_in=visitor.is_checked_in,
            host_user_id=visitor.host_user_id,
            host_name=visitor.host_name,
            status=visitor.status,
            created_at=visitor.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error registering visitor: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to register visitor: {error_msg}"
        )


@router.get("/{visitor_id}", response_model=VisitorBase)
def get_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get visitor by ID."""
    try:
        company_id = current_user.get("company_id", 1)
        
        visitor = (
            db.query(Visitor)
            .filter(
                Visitor.id == visitor_id,
                Visitor.company_id == company_id,
            )
            .first()
        )
        
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        return VisitorBase(
            id=visitor.id,
            company_id=visitor.company_id,
            site_id=visitor.site_id,
            name=visitor.name,
            company=visitor.company,
            id_card_number=visitor.id_card_number,
            phone=visitor.phone,
            email=visitor.email,
            purpose=visitor.purpose,
            category=visitor.category,
            visit_date=visitor.visit_date,
            check_in_time=visitor.check_in_time,
            check_out_time=visitor.check_out_time,
            is_checked_in=visitor.is_checked_in,
            host_user_id=visitor.host_user_id,
            host_name=visitor.host_name,
            status=visitor.status,
            created_at=visitor.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting visitor: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get visitor: {error_msg}"
        )


@router.patch("/{visitor_id}", response_model=VisitorBase)
async def update_visitor(
    visitor_id: int,
    name: Optional[str] = Form(None),
    company: Optional[str] = Form(None),
    id_card_number: Optional[str] = Form(None),
    id_card_type: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    purpose: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    host_user_id: Optional[int] = Form(None),
    host_name: Optional[str] = Form(None),
    expected_duration_minutes: Optional[int] = Form(None),
    notes: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    id_card_photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update visitor."""
    try:
        company_id = current_user.get("company_id", 1)
        
        visitor = (
            db.query(Visitor)
            .filter(
                Visitor.id == visitor_id,
                Visitor.company_id == company_id,
            )
            .first()
        )
        
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        # Update fields
        if name is not None:
            visitor.name = name
        if company is not None:
            visitor.company = company
        if id_card_number is not None:
            visitor.id_card_number = id_card_number
        if id_card_type is not None:
            visitor.id_card_type = id_card_type
        if phone is not None:
            visitor.phone = phone
        if email is not None:
            visitor.email = email
        if purpose is not None:
            visitor.purpose = purpose
        if category is not None:
            visitor.category = category.upper()
        if host_user_id is not None:
            visitor.host_user_id = host_user_id
        if host_name is not None:
            visitor.host_name = host_name
        if expected_duration_minutes is not None:
            visitor.expected_duration_minutes = expected_duration_minutes
        if notes is not None:
            visitor.notes = notes
        
        # Handle photo uploads
        if photo:
            safe_filename = re.sub(r'[^\w\-_\.]', '_', photo.filename or 'photo')
            timestamp = int(datetime.utcnow().timestamp())
            filename = f"{timestamp}_{safe_filename}"
            photo_path = os.path.join(VISITOR_DIR, filename)
            with open(photo_path, "wb") as out:
                content = await photo.read()
                out.write(content)
            visitor.photo_path = photo_path
        
        if id_card_photo:
            safe_filename = re.sub(r'[^\w\-_\.]', '_', id_card_photo.filename or 'id_card')
            timestamp = int(datetime.utcnow().timestamp())
            filename = f"{timestamp}_{safe_filename}"
            id_card_photo_path = os.path.join(VISITOR_DIR, filename)
            with open(id_card_photo_path, "wb") as out:
                content = await id_card_photo.read()
                out.write(content)
            visitor.id_card_photo_path = id_card_photo_path
        
        visitor.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(visitor)
        
        api_logger.info(f"Updated visitor {visitor_id} by user {current_user.get('id')}")
        return VisitorBase(
            id=visitor.id,
            company_id=visitor.company_id,
            site_id=visitor.site_id,
            name=visitor.name,
            company=visitor.company,
            id_card_number=visitor.id_card_number,
            phone=visitor.phone,
            email=visitor.email,
            purpose=visitor.purpose,
            category=visitor.category,
            visit_date=visitor.visit_date,
            check_in_time=visitor.check_in_time,
            check_out_time=visitor.check_out_time,
            is_checked_in=visitor.is_checked_in,
            host_user_id=visitor.host_user_id,
            host_name=visitor.host_name,
            status=visitor.status,
            created_at=visitor.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error updating visitor: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update visitor: {error_msg}"
        )


@router.delete("/{visitor_id}", status_code=204)
def delete_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete visitor."""
    try:
        company_id = current_user.get("company_id", 1)
        
        visitor = (
            db.query(Visitor)
            .filter(
                Visitor.id == visitor_id,
                Visitor.company_id == company_id,
            )
            .first()
        )
        
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        db.delete(visitor)
        db.commit()
        
        api_logger.info(f"Deleted visitor {visitor_id} by user {current_user.get('id')}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error deleting visitor: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete visitor: {error_msg}"
        )


@router.post("/{visitor_id}/check-in", response_model=VisitorBase)
def checkin_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Check-in visitor."""
    try:
        company_id = current_user.get("company_id", 1)
        
        visitor = (
            db.query(Visitor)
            .filter(
                Visitor.id == visitor_id,
                Visitor.company_id == company_id,
            )
            .first()
        )
        
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        if visitor.is_checked_in:
            raise HTTPException(status_code=400, detail="Visitor already checked in")
        
        visitor.is_checked_in = True
        visitor.check_in_time = datetime.utcnow()
        visitor.status = "CHECKED_IN"
        
        db.commit()
        db.refresh(visitor)
        
        api_logger.info(f"Checked in visitor {visitor_id} by user {current_user.get('id')}")
        return VisitorBase(
            id=visitor.id,
            company_id=visitor.company_id,
            site_id=visitor.site_id,
            name=visitor.name,
            company=visitor.company,
            id_card_number=visitor.id_card_number,
            phone=visitor.phone,
            email=visitor.email,
            purpose=visitor.purpose,
            category=visitor.category,
            visit_date=visitor.visit_date,
            check_in_time=visitor.check_in_time,
            check_out_time=visitor.check_out_time,
            is_checked_in=visitor.is_checked_in,
            host_user_id=visitor.host_user_id,
            host_name=visitor.host_name,
            status=visitor.status,
            created_at=visitor.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error checking in visitor: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check in visitor: {error_msg}"
        )


@router.post("/{visitor_id}/check-out", response_model=VisitorBase)
def checkout_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Check-out visitor."""
    try:
        company_id = current_user.get("company_id", 1)
        
        visitor = (
            db.query(Visitor)
            .filter(
                Visitor.id == visitor_id,
                Visitor.company_id == company_id,
            )
            .first()
        )
        
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        if not visitor.is_checked_in:
            raise HTTPException(status_code=400, detail="Visitor is not checked in")
        
        visitor.is_checked_in = False
        visitor.check_out_time = datetime.utcnow()
        visitor.status = "CHECKED_OUT"
        
        db.commit()
        db.refresh(visitor)
        
        api_logger.info(f"Checked out visitor {visitor_id} by user {current_user.get('id')}")
        return VisitorBase(
            id=visitor.id,
            company_id=visitor.company_id,
            site_id=visitor.site_id,
            name=visitor.name,
            company=visitor.company,
            id_card_number=visitor.id_card_number,
            phone=visitor.phone,
            email=visitor.email,
            purpose=visitor.purpose,
            category=visitor.category,
            visit_date=visitor.visit_date,
            check_in_time=visitor.check_in_time,
            check_out_time=visitor.check_out_time,
            is_checked_in=visitor.is_checked_in,
            host_user_id=visitor.host_user_id,
            host_name=visitor.host_name,
            status=visitor.status,
            created_at=visitor.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error checking out visitor: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check out visitor: {error_msg}"
        )


@router.get("/categories", response_model=List[str])
def get_visitor_categories(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get visitor categories from master data."""
    try:
        from app.models.master_data import MasterData
        
        categories = (
            db.query(MasterData)
            .filter(
                MasterData.category == "VISITOR_CATEGORY",
                MasterData.is_active == True,
            )
            .order_by(MasterData.sort_order.asc())
            .all()
        )
        
        if categories:
            return [cat.name for cat in categories]
        
        # Default categories if master data not available
        return ["GUEST", "CONTRACTOR", "VENDOR", "CLIENT", "OTHER"]
        
    except Exception as e:
        # Return default categories on error
        return ["GUEST", "CONTRACTOR", "VENDOR", "CLIENT", "OTHER"]

