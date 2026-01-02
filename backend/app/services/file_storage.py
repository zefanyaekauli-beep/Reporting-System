# backend/app/services/file_storage.py

import os
from uuid import uuid4
from fastapi import UploadFile
from datetime import datetime, timezone
from typing import Optional
import logging
from app.services.watermark_service import watermark_service

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # Ensure debug logs are shown

UPLOAD_ROOT = "uploads/attendance_photos"

async def save_attendance_photo(
    file: UploadFile, 
    prefix: str,
    location: Optional[str] = None,
    site_name: Optional[str] = None,
    user_name: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    additional_info: Optional[dict] = None
) -> str:
    """
    Simpan foto ke disk dengan watermark. Return path relatif.
    
    Args:
        file: UploadFile dari FastAPI
        prefix: Prefix untuk filename (misal 'checkin' atau 'checkout')
        location: Lokasi (GPS coordinates atau alamat)
        site_name: Nama site
        user_name: Nama user
        lat: Latitude GPS
        lng: Longitude GPS
        additional_info: Info tambahan untuk watermark
    
    Returns:
        str: Path relatif ke file yang disimpan
    """
    os.makedirs(UPLOAD_ROOT, exist_ok=True)
    
    # Get file extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if ext not in [".jpg", ".jpeg", ".png"]:
        ext = ".jpg"
    
    # Generate unique filename
    timestamp = datetime.now(timezone.utc)
    timestamp_str = timestamp.strftime("%Y%m%d_%H%M%S")
    filename = f"{prefix}_{timestamp_str}_{uuid4().hex[:8]}{ext}"
    full_path = os.path.join(UPLOAD_ROOT, filename)
    
    # Read file content - use await for async UploadFile
    logger.debug(f"Reading file: {file.filename}, content_type: {file.content_type}")
    
    # Reset file pointer multiple times to ensure we get the full content
    try:
        await file.seek(0)
        logger.debug("File seek(0) successful")
    except AttributeError:
        # If seek is not async, try sync
        if hasattr(file, 'file'):
            file.file.seek(0)
            logger.debug("File seek(0) via file.file successful")
    except Exception as seek_err:
        logger.warning(f"Could not seek file: {seek_err}, continuing anyway")
    
    # Read content - CRITICAL: Must read ALL bytes
    content = None
    try:
        # Try async read first
        content = await file.read()
        logger.debug(f"File read successful (async): {len(content)} bytes")
    except Exception as read_err:
        logger.warning(f"Async read failed: {read_err}, trying sync read...")
        # Try sync read as fallback
        try:
            if hasattr(file, 'file'):
                file.file.seek(0)
                content = file.file.read()
                logger.debug(f"File read successful (sync): {len(content)} bytes")
            else:
                # Last resort: try to read from bytes if available
                if hasattr(file, 'spool_max_size'):
                    # This is a SpooledTemporaryFile
                    file.seek(0)
                    content = file.read()
                    logger.debug(f"File read successful (spooled): {len(content)} bytes")
                else:
                    raise ValueError(f"Failed to read file: {read_err}")
        except Exception as sync_err:
            logger.error(f"Sync read also failed: {sync_err}", exc_info=True)
            raise ValueError(f"Failed to read file: {read_err} -> {sync_err}")
    
    # Verify we got content
    if not content or len(content) == 0:
        logger.error(f"ERROR: No content read from file {file.filename}")
        raise ValueError(f"Failed to read file content from {file.filename} - file appears to be empty")
    
    # Verify it's actually image data (check magic bytes)
    is_jpeg = content[:2] == b'\xff\xd8'
    is_png = content[:8] == b'\x89PNG\r\n\x1a\n'
    if not (is_jpeg or is_png):
        logger.warning(f"WARNING: File doesn't appear to be a valid image (magic bytes: {content[:8].hex()})")
    else:
        logger.debug(f"✓ File is valid image format: {'JPEG' if is_jpeg else 'PNG'}")
    
    logger.info(f"✓ File content read successfully: {len(content)} bytes")
    
    logger.info(f"Saving attendance photo: {filename}, size: {len(content)} bytes")
    logger.info(f"Watermark info - location: {location}, site: {site_name}, user: {user_name}, lat: {lat}, lng: {lng}")
    
    # Build location string
    location_str = location
    if not location_str and lat is not None and lng is not None:
        location_str = f"GPS: {lat:.6f}, {lng:.6f}"
    
    # Add watermark - MUST ALWAYS APPLY
    logger.info("=" * 60)
    logger.info("APPLYING WATERMARK TO PHOTO")
    logger.info("=" * 60)
    logger.info(f"File: {filename}")
    logger.info(f"Content size: {len(content)} bytes")
    logger.info(f"Location: {location_str}")
    logger.info(f"Site: {site_name}")
    logger.info(f"User: {user_name}")
    logger.info(f"Timestamp: {timestamp}")
    logger.info(f"Additional info: {additional_info}")
    logger.info("=" * 60)
    
    try:
        watermarked_content = watermark_service.add_watermark(
            content,
            location=location_str,
            timestamp=timestamp,
            user_name=user_name,
            site_name=site_name,
            additional_info=additional_info
        )
        
        # Verify watermark was applied
        if not watermarked_content or len(watermarked_content) == 0:
            logger.error("ERROR: Watermarked content is empty!")
            raise ValueError("Watermarked content is empty")
        
        logger.info("=" * 60)
        logger.info("✓ WATERMARK APPLIED SUCCESSFULLY")
        logger.info("=" * 60)
        logger.info(f"  Original size: {len(content)} bytes")
        logger.info(f"  Watermarked size: {len(watermarked_content)} bytes")
        logger.info(f"  Size change: {len(watermarked_content) - len(content)} bytes")
        logger.info("=" * 60)
        
    except Exception as e:
        # If watermark fails, this is a critical error
        logger.error("=" * 60)
        logger.error("⚠⚠⚠ WATERMARK FAILED - CRITICAL ERROR ⚠⚠⚠")
        logger.error("=" * 60)
        logger.error(f"Error: {type(e).__name__}: {str(e)}", exc_info=True)
        logger.error("=" * 60)
        logger.error("Attempting to save with minimal watermark (text only)...")
        logger.error("=" * 60)
        
        # Try to save with at least text watermark (fallback)
        try:
            from PIL import Image, ImageDraw, ImageFont
            from io import BytesIO
            
            img = Image.open(BytesIO(content))
            img_mode = img.mode
            if img.mode != "RGBA":
                img = img.convert("RGBA")
            
            overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)
            
            # Add simple text watermark
            font = ImageFont.load_default()
            time_str = timestamp.strftime("%Y-%m-%d %H:%M:%S")
            company_name = watermark_service.company_name
            text = f"© {company_name} | {time_str}"
            if site_name:
                text += f" | {site_name}"
            if user_name:
                text += f" | {user_name}"
            
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = img.width - text_width - 10
            y = img.height - text_height - 10
            
            draw.rectangle([x-4, y-4, x+text_width+4, y+text_height+4], fill=(0, 0, 0, 180))
            draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
            
            watermarked = Image.alpha_composite(img, overlay)
            if img_mode == "RGB":
                watermarked = watermarked.convert("RGB")
            
            output = BytesIO()
            watermarked.save(output, format="JPEG", quality=95)
            watermarked_content = output.getvalue()
            logger.warning("✓ Saved with minimal text watermark (fallback)")
        except Exception as fallback_err:
            logger.error(f"Fallback watermark also failed: {fallback_err}", exc_info=True)
            # Last resort: save original but log as critical error
            watermarked_content = content
            logger.critical("⚠⚠⚠ FILE SAVED WITHOUT WATERMARK - THIS IS AN ERROR ⚠⚠⚠")
    
    # Save watermarked file
    logger.debug(f"Saving watermarked file to: {full_path}")
    try:
        with open(full_path, "wb") as f:
            f.write(watermarked_content)
        logger.info(f"✓ Photo saved successfully to: {full_path}")
        logger.info(f"  File size: {len(watermarked_content)} bytes")
        
        # Verify file was written
        if os.path.exists(full_path):
            file_size = os.path.getsize(full_path)
            logger.info(f"  Verified file exists: {file_size} bytes on disk")
            if file_size != len(watermarked_content):
                logger.warning(f"  WARNING: File size mismatch! Expected {len(watermarked_content)}, got {file_size}")
        else:
            logger.error(f"  ERROR: File was not created at {full_path}")
    except Exception as save_err:
        logger.error(f"ERROR saving file: {save_err}", exc_info=True)
        raise
    
    # Return relative path
    return full_path
