# backend/app/api/security_report_routes.py

"""
Fixed Security Report Routes with comprehensive error handling
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import uuid

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user
from app.models.site import Site

router = APIRouter(prefix="/security/reports", tags=["security-reports"])

# Assuming you have a SecurityReport model
# from app.divisions.security.models import SecurityReport

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

async def save_uploaded_file(
    file: UploadFile, 
    upload_dir: str = "uploads/evidence",
    location: Optional[str] = None,
    site_name: Optional[str] = None,
    user_name: Optional[str] = None,
    report_type: Optional[str] = None,
    additional_info: Optional[dict] = None
) -> str:
    """Save uploaded file with watermark and return the file path"""
    try:
        from app.services.evidence_storage import save_evidence_file
        return await save_evidence_file(
            file,
            upload_dir=upload_dir,
            location=location,
            site_name=site_name,
            user_name=user_name,
            report_type=report_type,
            additional_info=additional_info
        )
    except Exception as e:
        api_logger.error(f"Failed to save file {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_security_report(
    report_type: str = Form(...),
    site_id: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    severity: Optional[str] = Form(None),
    location_text: Optional[str] = Form(None),
    location_id: Optional[int] = Form(None),
    evidence_files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new security report with evidence files.
    
    This endpoint handles multipart/form-data for file uploads.
    """
    try:
        # Log incoming request for debugging
        api_logger.info(
            f"Creating security report: type={report_type}, site_id={site_id}, "
            f"user_id={current_user.get('sub')}, title={title}"
        )
        
        # Validate required fields
        if not title or not title.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report title is required"
            )
        
        if not report_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report type is required"
            )
        
        # Validate site exists
        site = db.query(Site).filter(Site.id == site_id).first()
        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site with ID {site_id} not found"
            )
        
        # Get user ID from token
        user_id = current_user.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )
        
        # Validate severity if provided
        valid_severities = ["low", "medium", "high"]
        if severity and severity not in valid_severities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid severity. Must be one of: {', '.join(valid_severities)}"
            )
        
        # Validate report_type
        valid_report_types = ["incident", "daily", "finding"]
        if report_type not in valid_report_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid report type. Must be one of: {', '.join(valid_report_types)}"
            )
        
        # Get site and user info for watermark
        from app.models.site import Site
        from app.models.user import User
        site = db.query(Site).filter(Site.id == site_id).first()
        user = db.query(User).filter(User.id == user_id).first()
        
        # Save evidence files with watermark
        evidence_paths = []
        if evidence_files:
            for file in evidence_files:
                if file.filename:  # Skip empty file uploads
                    try:
                        filepath = await save_uploaded_file(
                            file,
                            location=location_text,
                            site_name=site.name if site else None,
                            user_name=user.username if user else None,
                            report_type=report_type,
                            additional_info={"Title": title[:50] if title else None, "Severity": severity}
                        )
                        evidence_paths.append(filepath)
                        api_logger.info(f"Saved evidence file with watermark: {filepath}")
                    except Exception as file_err:
                        api_logger.error(f"Failed to save evidence file: {file_err}")
                        # Continue with other files even if one fails
                        continue
        
        # Create the report
        # NOTE: Replace this with your actual SecurityReport model
        # This is a generic example - adjust based on your model
        
        report_data = {
            "report_type": report_type,
            "site_id": site_id,
            "user_id": user_id,
            "title": title.strip(),
            "description": description.strip() if description else None,
            "severity": severity,
            "location_text": location_text.strip() if location_text else None,
            "location_id": location_id,
            "status": "OPEN",  # Default status
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        # If you store evidence paths in a JSON column or separate table
        if evidence_paths:
            report_data["evidence_paths"] = evidence_paths
        
        # Example of creating the report (adjust based on your actual model)
        # report = SecurityReport(**report_data)
        # db.add(report)
        # db.commit()
        # db.refresh(report)
        
        # For now, return a mock response
        # Remove this and uncomment the above when you have the actual model
        mock_report = {
            "id": 1,
            "report_number": f"SR-{datetime.now().strftime('%Y%m%d')}-001",
            **report_data,
            "evidence_count": len(evidence_paths),
            "created_at": safe_datetime_to_str(report_data["created_at"]),
            "updated_at": safe_datetime_to_str(report_data["updated_at"]),
        }
        
        api_logger.info(f"Successfully created report with ID: {mock_report['id']}")
        
        return mock_report
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error with traceback
        api_logger.error(
            f"Unexpected error creating security report: {str(e)}", 
            exc_info=True
        )
        # Return a detailed error message
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create report: {str(e)}"
        )

@router.get("")
async def list_security_reports(
    site_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    report_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    List security reports with filters.
    """
    try:
        # Build query
        # query = db.query(SecurityReport)
        
        # Apply filters
        # if site_id:
        #     query = query.filter(SecurityReport.site_id == site_id)
        
        # if report_type:
        #     query = query.filter(SecurityReport.report_type == report_type)
        
        # if status:
        #     query = query.filter(SecurityReport.status == status)
        
        # if from_date:
        #     query = query.filter(SecurityReport.created_at >= from_date)
        
        # if to_date:
        #     query = query.filter(SecurityReport.created_at <= to_date)
        
        # reports = query.order_by(SecurityReport.created_at.desc()).all()
        
        # Mock response
        reports = [
            {
                "id": 1,
                "report_number": "SR-20231201-001",
                "report_type": "incident",
                "site_id": site_id or 1,
                "title": "Test Report",
                "severity": "medium",
                "status": "OPEN",
                "created_at": safe_datetime_to_str(datetime.utcnow()),
            }
        ]
        
        return reports
        
    except Exception as e:
        api_logger.error(f"Error listing reports: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list reports: {str(e)}"
        )

@router.get("/{report_id}")
async def get_security_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get a single security report by ID.
    """
    try:
        # report = db.query(SecurityReport).filter(
        #     SecurityReport.id == report_id
        # ).first()
        
        # if not report:
        #     raise HTTPException(
        #         status_code=status.HTTP_404_NOT_FOUND,
        #         detail="Report not found"
        #     )
        
        # Mock response
        report = {
            "id": report_id,
            "report_number": "SR-20231201-001",
            "report_type": "incident",
            "site_id": 1,
            "title": "Test Report",
            "description": "Test description",
            "severity": "medium",
            "status": "OPEN",
            "created_at": safe_datetime_to_str(datetime.utcnow()),
            "updated_at": safe_datetime_to_str(datetime.utcnow()),
        }
        
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Error getting report {report_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get report: {str(e)}"
        )

# Additional helper endpoint for debugging
@router.get("/debug/test")
async def debug_test(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Test endpoint to verify backend is working.
    """
    return {
        "status": "ok",
        "message": "Backend is working",
        "user_id": current_user.get("sub"),
        "timestamp": safe_datetime_to_str(datetime.utcnow()),
    }