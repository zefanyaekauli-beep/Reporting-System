# backend/app/api/v1/endpoints/dar.py

"""
Daily Activity Report (DAR) API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import os
import uuid
from pathlib import Path

from app.core.database import get_db
from app.core.logger import api_logger
from app.core.exceptions import handle_exception
from app.core.pagination import get_pagination_params, PaginationParams, create_paginated_response
from app.api.deps import require_supervisor
from app.schemas.dar import (
    DailyActivityReportCreate,
    DailyActivityReportUpdate,
    DailyActivityReportOut,
    DailyActivityReportList,
)
from app.services.dar_service import (
    create_dar,
    get_dar,
    list_dars,
    update_dar,
    submit_dar,
    approve_dar,
    reject_dar,
    delete_dar,
)
from app.models.user import User
from app.models.site import Site

router = APIRouter(prefix="/dar", tags=["dar"])


@router.post("", response_model=DailyActivityReportOut, status_code=status.HTTP_201_CREATED)
def create_dar_endpoint(
    data: DailyActivityReportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Create a new DAR"""
    try:
        company_id = current_user.get("company_id", 1)
        created_by = current_user.get("id")
        
        if not created_by:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        dar = create_dar(
            db=db,
            company_id=company_id,
            created_by=created_by,
            data=data
        )
        return dar
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        api_logger.error(f"Error creating DAR: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "create_dar")


@router.get("", response_model=List[DailyActivityReportList])
def list_dars_endpoint(
    site_id: Optional[int] = Query(None),
    report_date: Optional[date] = Query(None),
    shift: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List DARs with filters"""
    try:
        company_id = current_user.get("company_id", 1)
        
        dars = list_dars(
            db=db,
            company_id=company_id,
            site_id=site_id,
            report_date=report_date,
            shift=shift,
            status=status,
            skip=skip,
            limit=limit,
        )

        # Enrich with site names and user names
        result = []
        site_ids = {dar.site_id for dar in dars}
        user_ids = {dar.created_by for dar in dars}
        
        sites = {s.id: s.name for s in db.query(Site).filter(Site.id.in_(site_ids)).all()}
        users = {u.id: u.username for u in db.query(User).filter(User.id.in_(user_ids)).all()}

        for dar in dars:
            result.append(DailyActivityReportList(
                id=dar.id,
                site_id=dar.site_id,
                site_name=sites.get(dar.site_id),
                report_date=dar.report_date,
                shift=dar.shift,
                status=dar.status,
                created_by=dar.created_by,
                created_by_name=users.get(dar.created_by),
                created_at=dar.created_at,
                activities_count=len(dar.activities),
                personnel_count=len(dar.personnel),
            ))

        return result
    except Exception as e:
        api_logger.error(f"Error listing DARs: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "list_dars")


@router.get("/{dar_id}", response_model=DailyActivityReportOut)
def get_dar_endpoint(
    dar_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get DAR detail"""
    try:
        company_id = current_user.get("company_id", 1)
        
        dar = get_dar(db=db, dar_id=dar_id, company_id=company_id)
        if not dar:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="DAR not found"
            )
        return dar
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting DAR: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "get_dar")


@router.put("/{dar_id}", response_model=DailyActivityReportOut)
def update_dar_endpoint(
    dar_id: int,
    data: DailyActivityReportUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Update DAR"""
    try:
        company_id = current_user.get("company_id", 1)
        
        dar = update_dar(
            db=db,
            dar_id=dar_id,
            company_id=company_id,
            data=data,
        )
        if not dar:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="DAR not found"
            )
        return dar
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error updating DAR: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "update_dar")


@router.delete("/{dar_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dar_endpoint(
    dar_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Delete DAR"""
    try:
        company_id = current_user.get("company_id", 1)
        
        success = delete_dar(
            db=db,
            dar_id=dar_id,
            company_id=company_id,
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="DAR not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error deleting DAR: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "delete_dar")


@router.post("/{dar_id}/submit", response_model=DailyActivityReportOut)
def submit_dar_endpoint(
    dar_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Submit DAR for review"""
    try:
        company_id = current_user.get("company_id", 1)
        
        dar = submit_dar(
            db=db,
            dar_id=dar_id,
            company_id=company_id,
        )
        if not dar:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="DAR not found"
            )
        return dar
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error submitting DAR: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "submit_dar")


@router.post("/{dar_id}/approve", response_model=DailyActivityReportOut)
def approve_dar_endpoint(
    dar_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Approve DAR"""
    try:
        company_id = current_user.get("company_id", 1)
        approved_by = current_user.get("id")
        
        if not approved_by:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        dar = approve_dar(
            db=db,
            dar_id=dar_id,
            company_id=company_id,
            approved_by=approved_by,
        )
        if not dar:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="DAR not found"
            )
        return dar
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error approving DAR: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "approve_dar")


@router.post("/{dar_id}/reject", response_model=DailyActivityReportOut)
def reject_dar_endpoint(
    dar_id: int,
    rejection_reason: str = Query(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Reject DAR"""
    try:
        company_id = current_user.get("company_id", 1)
        rejected_by = current_user.get("id")
        
        if not rejected_by:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )

        dar = reject_dar(
            db=db,
            dar_id=dar_id,
            company_id=company_id,
            rejected_by=rejected_by,
            rejection_reason=rejection_reason,
        )
        if not dar:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="DAR not found"
            )
        return dar
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error rejecting DAR: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "reject_dar")


@router.get("/{dar_id}/export-pdf")
def export_dar_pdf(
    dar_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Export DAR to PDF"""
    try:
        company_id = current_user.get("company_id", 1)
        
        dar = get_dar(db=db, dar_id=dar_id, company_id=company_id)
        if not dar:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="DAR not found"
            )

        # TODO: Implement PDF generation
        # For now, return a placeholder response
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="PDF export not yet implemented"
        )
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error exporting DAR PDF: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "export_dar_pdf")


# Upload directory for DAR photos
UPLOAD_DIR = Path("uploads/dar")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload-photo")
async def upload_dar_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_supervisor),
):
    """Upload a photo for DAR activity"""
    try:
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower() if file.filename else ""
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Read file content
        content = await file.read()
        
        # Validate file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )

        # Generate unique filename
        unique_id = uuid.uuid4().hex[:12]
        filename = f"dar_{unique_id}{file_ext}"
        file_path = UPLOAD_DIR / filename

        # Save file
        with open(file_path, "wb") as f:
            f.write(content)

        # Return the URL path
        photo_url = f"/uploads/dar/{filename}"
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "photo_url": photo_url,
                "filename": filename,
                "size": len(content),
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error uploading DAR photo: {str(e)}", exc_info=True)
        raise handle_exception(e, api_logger, "upload_dar_photo")

