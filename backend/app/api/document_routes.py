# backend/app/api/document_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date
import os
import re

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import require_supervisor, get_current_user
from app.models.document import Document, DocumentVersion, DocumentType, DocumentStatus
from app.models.user import User

router = APIRouter(prefix="/documents", tags=["documents"])

MEDIA_BASE = "media"
DOCUMENTS_DIR = f"{MEDIA_BASE}/documents"
os.makedirs(DOCUMENTS_DIR, exist_ok=True)


class DocumentBase(BaseModel):
    id: int
    company_id: Optional[int] = None
    title: str
    document_type: str
    document_number: Optional[str] = None
    version: str
    status: str
    category: Optional[str] = None
    division: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[DocumentBase])
def list_documents(
    document_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List documents."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(Document).filter(
            (Document.company_id == company_id) | (Document.company_id.is_(None))
        )
        
        if document_type:
            q = q.filter(Document.document_type == DocumentType[document_type.upper()])
        if category:
            q = q.filter(Document.category == category)
        if division:
            q = q.filter(
                (Document.division == division.upper()) | (Document.division.is_(None))
            )
        if status:
            q = q.filter(Document.status == DocumentStatus[status.upper()])
        
        documents = q.order_by(Document.title.asc()).limit(200).all()
        
        result = []
        for doc in documents:
            result.append(DocumentBase(
                id=doc.id,
                company_id=doc.company_id,
                title=doc.title,
                document_type=doc.document_type.value if hasattr(doc.document_type, 'value') else str(doc.document_type),
                document_number=doc.document_number,
                version=doc.version,
                status=doc.status.value if hasattr(doc.status, 'value') else str(doc.status),
                category=doc.category,
                division=doc.division,
                created_at=doc.created_at,
            ))
        
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing documents: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list documents: {error_msg}"
        )


@router.post("", response_model=DocumentBase, status_code=201)
async def upload_document(
    title: str = Form(...),
    document_type: str = Form(...),
    document_number: Optional[str] = Form(None),
    version: str = Form("1.0"),
    category: Optional[str] = Form(None),
    division: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Upload document (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        # Save file - apply watermark if it's an image
        safe_filename = re.sub(r'[^\w\-_\.]', '_', file.filename or 'document')
        timestamp = int(datetime.utcnow().timestamp())
        filename = f"{timestamp}_{safe_filename}"
        file_path = os.path.join(DOCUMENTS_DIR, filename)
        
        await file.seek(0)
        content = await file.read()
        mime_type = file.content_type or "application/octet-stream"
        
        # Apply watermark if it's an image
        if mime_type and mime_type.startswith("image/"):
            from app.services.watermark_service import watermark_service
            from app.models.site import Site
            from datetime import timezone as tz
            try:
                user = db.query(User).filter(User.id == user_id).first()
                # Get user's default site if available
                site = None
                if hasattr(user, 'default_site_id') and user.default_site_id:
                    site = db.query(Site).filter(Site.id == user.default_site_id).first()
                
                watermarked_content = watermark_service.add_watermark(
                    content,
                    timestamp=datetime.now(tz.utc),
                    user_name=user.username if user else None,
                    site_name=site.name if site else None,
                    additional_info={"Document": title, "Type": document_type}
                )
                content = watermarked_content
                api_logger.info(f"Watermark applied to document image: {filename}")
            except Exception as e:
                api_logger.warning(f"Failed to apply watermark to document, saving original: {e}")
                # Continue with original content
        
        with open(file_path, "wb") as out:
            out.write(content)
        
        file_size = len(content)
        
        document = Document(
            company_id=company_id,
            title=title,
            document_type=DocumentType[document_type.upper()],
            document_number=document_number,
            version=version,
            status=DocumentStatus.DRAFT,
            file_path=file_path,
            file_name=file.filename or filename,
            file_size=file_size,
            mime_type=mime_type,
            category=category,
            division=division.upper() if division else None,
            description=description,
            created_by=user_id,
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        api_logger.info(f"Uploaded document {document.id} by user {user_id}")
        return DocumentBase(
            id=document.id,
            company_id=document.company_id,
            title=document.title,
            document_type=document.document_type.value if hasattr(document.document_type, 'value') else str(document.document_type),
            document_number=document.document_number,
            version=document.version,
            status=document.status.value if hasattr(document.status, 'value') else str(document.status),
            category=document.category,
            division=document.division,
            created_at=document.created_at,
        )
        
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error uploading document: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {error_msg}"
        )


@router.post("/{document_id}/approve")
def approve_document(
    document_id: int,
    approval_notes: Optional[str] = Body(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Approve document (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        document = (
            db.query(Document)
            .filter(
                Document.id == document_id,
                (Document.company_id == company_id) | (Document.company_id.is_(None)),
            )
            .first()
        )
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document.status = DocumentStatus.APPROVED
        document.approved_by = user_id
        document.approved_at = datetime.utcnow()
        if approval_notes:
            document.approval_notes = approval_notes
        
        db.commit()
        db.refresh(document)
        
        api_logger.info(f"Approved document {document_id} by user {user_id}")
        return {"message": "Document approved", "document_id": document_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error approving document: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to approve document: {error_msg}"
        )


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Download document."""
    try:
        company_id = current_user.get("company_id", 1)
        
        document = (
            db.query(Document)
            .filter(
                Document.id == document_id,
                (Document.company_id == company_id) | (Document.company_id.is_(None)),
            )
            .first()
        )
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        if not os.path.exists(document.file_path):
            raise HTTPException(status_code=404, detail="Document file not found")
        
        from fastapi.responses import FileResponse
        return FileResponse(
            document.file_path,
            media_type=document.mime_type or "application/octet-stream",
            filename=document.file_name,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error downloading document: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download document: {error_msg}"
        )

