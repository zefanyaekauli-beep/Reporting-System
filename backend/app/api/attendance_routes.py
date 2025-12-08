# backend/app/api/attendance_routes.py

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.attendance import Attendance, AttendanceStatus
from app.models.site import Site
from app.services.location_validation import is_location_within_site_radius
from app.services.file_storage import save_attendance_photo

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("/checkin")
async def checkin(
    site_id: int = Form(...),
    role_type: str = Form(...),  # SECURITY / CLEANING / DRIVER
    lat: float = Form(...),
    lng: float = Form(...),
    accuracy: float = Form(None),  # GPS accuracy in meters
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Check-in dengan GPS dan foto dari kamera.
    Berlaku untuk semua role: SECURITY, CLEANING, DRIVER.
    """
    # Validasi role_type
    role_type_upper = role_type.upper()
    if role_type_upper not in ["SECURITY", "CLEANING", "DRIVER"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role_type. Must be SECURITY, CLEANING, or DRIVER."
        )
    
    # Cek apakah user sudah punya attendance IN_PROGRESS di site yang sama
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == current_user.get("id"),
            Attendance.site_id == site_id,
            Attendance.role_type == role_type_upper,
            Attendance.status == AttendanceStatus.IN_PROGRESS,
        )
        .first()
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already checked in. Please checkout first."
        )
    
    # Validasi lokasi
    is_valid = is_location_within_site_radius(db, site_id, lat, lng)
    
    # Validasi foto
    if photo.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo format. Use JPEG or PNG."
        )
    
    # Simpan foto
    photo_path = save_attendance_photo(photo, prefix="checkin")
    
    # Buat attendance record
    attendance = Attendance(
        user_id=current_user.get("id"),
        site_id=site_id,
        company_id=current_user.get("company_id", 1),
        role_type=role_type_upper,
        checkin_time=datetime.utcnow(),  # Waktu server, untuk audit
        checkin_lat=lat,
        checkin_lng=lng,
        checkin_photo_path=photo_path,
        checkin_accuracy=accuracy,
        status=AttendanceStatus.IN_PROGRESS,
        is_valid_location=is_valid,
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return {
        "attendance_id": attendance.id,
        "is_valid_location": is_valid,
        "message": "Check-in recorded successfully",
        "checkin_time": attendance.checkin_time.isoformat(),
    }

@router.post("/checkout")
async def checkout(
    attendance_id: int = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    accuracy: float = Form(None),  # GPS accuracy in meters
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Check-out dengan GPS dan foto dari kamera.
    Update attendance record yang sudah ada.
    """
    # Cari attendance record
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.id == attendance_id,
            Attendance.user_id == current_user.get("id"),
            Attendance.status == AttendanceStatus.IN_PROGRESS,
        )
        .first()
    )
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active attendance not found"
        )
    
    # Validasi lokasi checkout (bisa pakai radius yang sama atau berbeda)
    is_valid = is_location_within_site_radius(db, attendance.site_id, lat, lng)
    
    # Validasi foto
    if photo.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo format. Use JPEG or PNG."
        )
    
    # Simpan foto
    photo_path = save_attendance_photo(photo, prefix="checkout")
    
    # Update attendance
    attendance.checkout_time = datetime.utcnow()
    attendance.checkout_lat = lat
    attendance.checkout_lng = lng
    attendance.checkout_photo_path = photo_path
    attendance.checkout_accuracy = accuracy
    attendance.status = AttendanceStatus.COMPLETED
    
    # Kalau salah satu checkin/checkout invalid, flag ini akan false
    attendance.is_valid_location = attendance.is_valid_location and is_valid
    
    db.commit()
    db.refresh(attendance)
    
    return {
        "attendance_id": attendance.id,
        "is_valid_location": is_valid,
        "message": "Checkout recorded successfully",
        "checkout_time": attendance.checkout_time.isoformat(),
    }

@router.get("/current")
async def get_current_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get current active attendance (IN_PROGRESS) untuk user.
    """
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == current_user.get("id"),
            Attendance.status == AttendanceStatus.IN_PROGRESS,
        )
        .first()
    )
    
    if not attendance:
        return {"attendance": None}
    
    return {
        "attendance": {
            "id": attendance.id,
            "site_id": attendance.site_id,
            "role_type": attendance.role_type,
            "checkin_time": attendance.checkin_time.isoformat() if attendance.checkin_time else None,
            "checkin_lat": attendance.checkin_lat,
            "checkin_lng": attendance.checkin_lng,
            "is_valid_location": attendance.is_valid_location,
        }
    }

@router.post("/clock-in")
async def clock_in(
    shift_id: str = Form(...),
    role_type: str = Form(...),  # SECURITY / CLEANING / DRIVER / PARKING
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(None),
    is_late: str = Form("false"),  # "true" or "false" as string
    late_reason: str = Form(""),
    client_time: str = Form(...),  # ISO string
    evidence: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Clock-in endpoint with shift, GPS, late detection, and evidence.
    """
    from app.models.user import User

    user_id = current_user.get("id", 1)
    company_id = current_user.get("company_id", 1)
    role_type_upper = role_type.upper()

    # Validate role type
    if role_type_upper not in ["SECURITY", "CLEANING", "DRIVER", "PARKING"]:
        raise HTTPException(status_code=400, detail="Invalid role_type")

    # Get user's default site or first available site
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    site = None
    if user.site_id:
        site = db.query(Site).filter(Site.id == user.site_id, Site.company_id == company_id).first()
    
    if not site:
        # Get first site for company
        site = db.query(Site).filter(Site.company_id == company_id).first()
    
    if not site:
        raise HTTPException(status_code=404, detail="No site found for user")

    # Check for existing IN_PROGRESS attendance
    open_attendance = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == user_id,
            Attendance.site_id == site.id,
            Attendance.role_type == role_type_upper,
            Attendance.status == AttendanceStatus.IN_PROGRESS,
        )
        .first()
    )

    if open_attendance:
        raise HTTPException(status_code=400, detail="User already has an active attendance record")

    # Validate location
    is_valid = True
    if site.lat and site.lng:
        is_valid = is_location_within_site_radius(db, site.id, latitude, longitude)

    # Save evidence photo if provided
    photo_path = None
    if evidence and evidence.filename:
        if evidence.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Invalid photo format. Use JPEG or PNG.")
        photo_path = save_attendance_photo(evidence, prefix="checkin")

    # Parse boolean
    is_late_bool = is_late.lower() == "true"

    now = datetime.utcnow()

    attendance = Attendance(
        user_id=user_id,
        site_id=site.id,
        company_id=company_id,
        role_type=role_type_upper,
        checkin_time=now,
        checkin_lat=latitude,
        checkin_lng=longitude,
        checkin_photo_path=photo_path,
        checkin_accuracy=accuracy,
        status=AttendanceStatus.IN_PROGRESS,
        is_valid_location=is_valid,
        shift=shift_id,
        is_overtime=False,
        is_backup=False,
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return {
        "attendance_id": attendance.id,
        "site_name": site.name,
        "clock_in_time": attendance.checkin_time.isoformat(),
        "is_valid_location": is_valid,
        "is_late": is_late_bool,
        "late_reason": late_reason if is_late_bool else None,
        "message": f"Clocked IN at {site.name}",
    }

@router.post("/scan-qr")
async def scan_qr_attendance(
    qr_data: str = Form(...),
    role_type: str = Form(...),  # SECURITY / CLEANING / DRIVER / PARKING
    lat: float = Form(None),
    lng: float = Form(None),
    accuracy: float = Form(None),
    photo: UploadFile = File(None),  # Optional photo
    shift: str = Form(None),  # Shift number/type
    overtime: str = Form("false"),  # "true" or "false" as string
    backup: str = Form("false"),  # "true" or "false" as string
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Scan QR code untuk attendance.
    Otomatis memutuskan clock-in atau clock-out berdasarkan:
    - Jika user belum punya attendance IN_PROGRESS untuk site tersebut → CLOCK IN
    - Jika user sudah punya attendance IN_PROGRESS untuk site tersebut → CLOCK OUT
    """
    # Validasi role_type
    role_type_upper = role_type.upper()
    if role_type_upper not in ["SECURITY", "CLEANING", "DRIVER", "PARKING"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role_type. Must be SECURITY, CLEANING, DRIVER, or PARKING."
        )
    
    # Cari site berdasarkan QR code
    site = (
        db.query(Site)
        .filter(
            Site.qr_code == qr_data,
            Site.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site dengan QR code '{qr_data}' tidak ditemukan"
        )
    
    user_id = current_user.get("id")
    
    # Cek apakah user sudah punya attendance IN_PROGRESS untuk site ini
    open_attendance = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == user_id,
            Attendance.site_id == site.id,
            Attendance.role_type == role_type_upper,
            Attendance.status == AttendanceStatus.IN_PROGRESS,
        )
        .first()
    )
    
    now = datetime.utcnow()
    
    if open_attendance is None:
        # CLOCK IN
        # Validasi lokasi
        is_valid = True
        if lat is not None and lng is not None:
            is_valid = is_location_within_site_radius(db, site.id, lat, lng)
        
        # Simpan foto (jika ada)
        photo_path = None
        if photo and photo.filename:
            if photo.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid photo format. Use JPEG or PNG."
                )
            photo_path = save_attendance_photo(photo, prefix="checkin")
        
        # Parse boolean fields
        is_overtime = overtime.lower() == "true" if overtime else False
        is_backup = backup.lower() == "true" if backup else False
        
        attendance = Attendance(
            user_id=user_id,
            site_id=site.id,
            company_id=current_user.get("company_id", 1),
            role_type=role_type_upper,
            checkin_time=now,
            checkin_lat=lat,
            checkin_lng=lng,
            checkin_photo_path=photo_path,
            checkin_accuracy=accuracy,
            status=AttendanceStatus.IN_PROGRESS,
            is_valid_location=is_valid,
            shift=shift,
            is_overtime=is_overtime,
            is_backup=is_backup,
        )
        
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
        return {
            "action": "clock_in",
            "attendance_id": attendance.id,
            "site_name": site.name,
            "checkin_time": attendance.checkin_time.isoformat(),
            "is_valid_location": is_valid,
            "message": f"Clocked IN at {site.name}",
        }
    else:
        # CLOCK OUT
        # Validasi lokasi
        is_valid = True
        if lat is not None and lng is not None:
            is_valid = is_location_within_site_radius(db, site.id, lat, lng)
        
        # Simpan foto (jika ada)
        if photo and photo.filename:
            photo_path = save_attendance_photo(photo, prefix="checkout")
            open_attendance.checkout_photo_path = photo_path
        
        # Update attendance
        open_attendance.checkout_time = now
        open_attendance.checkout_lat = lat
        open_attendance.checkout_lng = lng
        open_attendance.checkout_accuracy = accuracy
        open_attendance.status = AttendanceStatus.COMPLETED
        open_attendance.is_valid_location = open_attendance.is_valid_location and is_valid
        
        db.commit()
        db.refresh(open_attendance)
        
        return {
            "action": "clock_out",
            "attendance_id": open_attendance.id,
            "site_name": site.name,
            "checkin_time": open_attendance.checkin_time.isoformat(),
            "checkout_time": open_attendance.checkout_time.isoformat(),
            "is_valid_location": is_valid,
            "message": f"Clocked OUT at {site.name}",
        }

@router.get("/my")
async def list_my_attendance(
    role_type: str = Query(None),  # Optional filter by role
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    List semua attendance history untuk user saat ini.
    """
    user_id = current_user.get("id")
    
    query = (
        db.query(Attendance)
        .filter(Attendance.user_id == user_id)
    )
    
    if role_type:
        query = query.filter(Attendance.role_type == role_type.upper())
    
    records = query.order_by(Attendance.checkin_time.desc()).limit(100).all()
    
    result = []
    for att in records:
        site = db.query(Site).filter(Site.id == att.site_id).first()
        result.append({
            "id": att.id,
            "site_id": att.site_id,
            "site_name": site.name if site else f"Site {att.site_id}",
            "role_type": att.role_type,
            "checkin_time": att.checkin_time.isoformat() if att.checkin_time else None,
            "checkout_time": att.checkout_time.isoformat() if att.checkout_time else None,
            "checkin_lat": att.checkin_lat,
            "checkin_lng": att.checkin_lng,
            "checkout_lat": att.checkout_lat,
            "checkout_lng": att.checkout_lng,
            "status": att.status.value if hasattr(att.status, "value") else str(att.status),
            "is_valid_location": att.is_valid_location,
        })
    
    return result

@router.get("/status")
async def attendance_status(
    role_type: str = Query(None),  # Optional filter by role
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get status attendance saat ini (apakah sedang on shift atau tidak).
    """
    user_id = current_user.get("id")
    
    query = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == user_id,
            Attendance.status == AttendanceStatus.IN_PROGRESS,
        )
    )
    
    if role_type:
        query = query.filter(Attendance.role_type == role_type.upper())
    
    open_attendance = query.order_by(Attendance.checkin_time.desc()).first()
    
    if open_attendance:
        site = db.query(Site).filter(Site.id == open_attendance.site_id).first()
        return {
            "status": "on_shift",
            "current_attendance": {
                "id": open_attendance.id,
                "site_id": open_attendance.site_id,
                "site_name": site.name if site else f"Site {open_attendance.site_id}",
                "role_type": open_attendance.role_type,
                "checkin_time": open_attendance.checkin_time.isoformat() if open_attendance.checkin_time else None,
                "checkin_lat": open_attendance.checkin_lat,
                "checkin_lng": open_attendance.checkin_lng,
            }
        }
    
    return {
        "status": "not_clocked_in",
        "current_attendance": None
    }

