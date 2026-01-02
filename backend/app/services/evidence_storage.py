# backend/app/services/evidence_storage.py
"""
Evidence Storage Service - Menyimpan evidence files (foto) dengan watermark
"""

import os
from uuid import uuid4
from fastapi import UploadFile
from datetime import datetime, timezone
from typing import Optional, List
from app.services.watermark_service import watermark_service

EVIDENCE_ROOT = "uploads/evidence"

async def save_evidence_file(
    file: UploadFile,
    upload_dir: str = None,
    location: Optional[str] = None,
    site_name: Optional[str] = None,
    user_name: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    report_type: Optional[str] = None,
    additional_info: Optional[dict] = None
) -> str:
    """
    Simpan evidence file (foto) dengan watermark.
    
    Args:
        file: UploadFile dari FastAPI
        upload_dir: Directory untuk menyimpan (default: EVIDENCE_ROOT)
        location: Lokasi (GPS coordinates atau alamat)
        site_name: Nama site
        user_name: Nama user
        lat: Latitude GPS
        lng: Longitude GPS
        report_type: Tipe report (incident, daily, dll)
        additional_info: Info tambahan untuk watermark
    
    Returns:
        str: Path relatif ke file yang disimpan
    """
    upload_directory = upload_dir or EVIDENCE_ROOT
    os.makedirs(upload_directory, exist_ok=True)
    
    # Get file extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if ext not in [".jpg", ".jpeg", ".png"]:
        ext = ".jpg"
    
    # Generate unique filename
    timestamp = datetime.now(timezone.utc)
    timestamp_str = timestamp.strftime("%Y%m%d_%H%M%S")
    filename = f"evidence_{timestamp_str}_{uuid4().hex[:8]}{ext}"
    full_path = os.path.join(upload_directory, filename)
    
    # Read file content - use await for async UploadFile
    await file.seek(0)  # Reset file pointer
    content = await file.read()
    
    # Build location string
    location_str = location
    if not location_str and lat is not None and lng is not None:
        location_str = f"GPS: {lat:.6f}, {lng:.6f}"
    
    # Merge additional info
    watermark_info = additional_info or {}
    if report_type:
        watermark_info["Report Type"] = report_type
    
    # Add watermark
    try:
        watermarked_content = watermark_service.add_watermark(
            content,
            location=location_str,
            timestamp=timestamp,
            user_name=user_name,
            site_name=site_name,
            additional_info=watermark_info if watermark_info else None
        )
    except Exception as e:
        # If watermark fails, save original
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Watermark failed for evidence file, saving original: {e}")
        watermarked_content = content
    
    # Save watermarked file
    with open(full_path, "wb") as f:
        f.write(watermarked_content)
    
    return full_path

async def save_multiple_evidence_files(
    files: List[UploadFile],
    upload_dir: str = None,
    location: Optional[str] = None,
    site_name: Optional[str] = None,
    user_name: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    report_type: Optional[str] = None,
    additional_info: Optional[dict] = None
) -> List[str]:
    """
    Simpan multiple evidence files dengan watermark.
    
    Returns:
        List[str]: List of paths to saved files
    """
    paths = []
    for file in files:
        try:
            path = await save_evidence_file(
                file,
                upload_dir=upload_dir,
                location=location,
                site_name=site_name,
                user_name=user_name,
                lat=lat,
                lng=lng,
                report_type=report_type,
                additional_info=additional_info
            )
            paths.append(path)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to save evidence file {file.filename}: {e}")
            # Continue with other files
    
    return paths
