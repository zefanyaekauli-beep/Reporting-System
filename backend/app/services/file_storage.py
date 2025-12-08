# backend/app/services/file_storage.py

import os
from uuid import uuid4
from fastapi import UploadFile
from datetime import datetime

UPLOAD_ROOT = "uploads/attendance_photos"

def save_attendance_photo(file: UploadFile, prefix: str) -> str:
    """
    Simpan foto ke disk. Return path relatif.
    prefix misal 'checkin' atau 'checkout'.
    """
    os.makedirs(UPLOAD_ROOT, exist_ok=True)
    
    # Get file extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if ext not in [".jpg", ".jpeg", ".png"]:
        ext = ".jpg"
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{prefix}_{timestamp}_{uuid4().hex[:8]}{ext}"
    full_path = os.path.join(UPLOAD_ROOT, filename)
    
    # Read and save file
    with open(full_path, "wb") as f:
        content = file.file.read()
        f.write(content)
    
    # Return relative path
    return full_path
