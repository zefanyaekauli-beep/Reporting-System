# backend/app/api/kta_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_supervisor
from app.models.user import User
from app.models.site import Site
from datetime import timedelta

router = APIRouter(prefix="/kta", tags=["kta"])


class KTABase(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    site_id: int
    site_name: Optional[str] = None
    kta_number: str
    issue_date: date
    expiry_date: date
    status: str  # "ACTIVE", "EXPIRED", "REVOKED"
    created_at: datetime
    
    class Config:
        from_attributes = True


class KTACreate(BaseModel):
    user_id: int
    site_id: int
    issue_date: date
    expiry_date: date
    notes: Optional[str] = None


@router.get("", response_model=List[KTABase])
def list_ktas(
    user_id: Optional[int] = Query(None),
    site_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List KTA (Kartu Tanda Anggota / ID Cards)."""
    from datetime import timedelta
    try:
        company_id = current_user.get("company_id", 1)
        
        # KTA is typically stored in employee or user model
        # For now, we'll create a simple implementation
        # In production, you might have a separate KTA table
        
        from app.models.employee import Employee
        
        q = db.query(Employee).filter(Employee.company_id == company_id)
        
        if user_id:
            q = q.filter(Employee.user_id == user_id)
        if site_id:
            q = q.filter(Employee.site_id == site_id)
        if status:
            q = q.filter(Employee.status == status.upper())
        
        employees = q.all()
        
        result = []
        for emp in employees:
            # Generate KTA number from employee
            kta_number = emp.employee_number or f"KTA{emp.id:06d}"
            
            # Calculate expiry (assume 1 year from hire date)
            issue_date = emp.hire_date or date.today()
            expiry_date = date(issue_date.year + 1, issue_date.month, issue_date.day)
            
            # Check if expired
            kta_status = "ACTIVE"
            if expiry_date < date.today():
                kta_status = "EXPIRED"
            
            user = db.query(User).filter(User.id == emp.user_id).first() if emp.user_id else None
            site = db.query(Site).filter(Site.id == emp.site_id).first() if emp.site_id else None
            
            result.append(KTABase(
                id=emp.id,  # Using employee ID as KTA ID
                user_id=emp.user_id or 0,
                user_name=user.username if user else emp.full_name,
                site_id=emp.site_id or 0,
                site_name=site.name if site else None,
                kta_number=kta_number,
                issue_date=issue_date,
                expiry_date=expiry_date,
                status=kta_status,
                created_at=emp.created_at,
            ))
        
        api_logger.info(f"Listed {len(result)} KTAs for user {current_user.get('id')}")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing KTAs: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list KTAs: {error_msg}"
        )


@router.get("/expiring", response_model=List[KTABase])
def get_expiring_ktas(
    days_ahead: int = Query(30, description="Days ahead to check"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get KTAs expiring within specified days."""
    try:
        company_id = current_user.get("company_id", 1)
        today = date.today()
        expiry_date = today + timedelta(days=days_ahead)
        
        from app.models.employee import Employee
        from datetime import timedelta
        
        employees = (
            db.query(Employee)
            .filter(
                Employee.company_id == company_id,
                Employee.hire_date.isnot(None),
            )
            .all()
        )
        
        result = []
        for emp in employees:
            if not emp.hire_date:
                continue
            
            issue_date = emp.hire_date
            calculated_expiry = date(issue_date.year + 1, issue_date.month, issue_date.day)
            
            if today <= calculated_expiry <= expiry_date:
                kta_number = emp.employee_number or f"KTA{emp.id:06d}"
                user = db.query(User).filter(User.id == emp.user_id).first() if emp.user_id else None
                site = db.query(Site).filter(Site.id == emp.site_id).first() if emp.site_id else None
                
                result.append(KTABase(
                    id=emp.id,
                    user_id=emp.user_id or 0,
                    user_name=user.username if user else emp.full_name,
                    site_id=emp.site_id or 0,
                    site_name=site.name if site else None,
                    kta_number=kta_number,
                    issue_date=issue_date,
                    expiry_date=calculated_expiry,
                    status="ACTIVE" if calculated_expiry >= today else "EXPIRED",
                    created_at=emp.created_at,
                ))
        
        api_logger.info(f"Found {len(result)} KTAs expiring within {days_ahead} days")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting expiring KTAs: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get expiring KTAs: {error_msg}"
        )


@router.post("/{kta_id}/renew", response_model=KTABase)
def renew_kta(
    kta_id: int,
    payload: KTACreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Renew KTA (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        from app.models.employee import Employee
        
        employee = (
            db.query(Employee)
            .filter(
                Employee.id == kta_id,
                Employee.company_id == company_id,
            )
            .first()
        )
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee/KTA not found")
        
        # Update hire_date to extend KTA validity
        # In production, you might want a separate KTA table with renewal history
        employee.hire_date = payload.issue_date
        
        db.commit()
        db.refresh(employee)
        
        user = db.query(User).filter(User.id == employee.user_id).first() if employee.user_id else None
        site = db.query(Site).filter(Site.id == employee.site_id).first() if employee.site_id else None
        kta_number = employee.employee_number or f"KTA{employee.id:06d}"
        issue_date = employee.hire_date or date.today()
        expiry_date = date(issue_date.year + 1, issue_date.month, issue_date.day)
        
        api_logger.info(f"Renewed KTA {kta_id} by user {current_user.get('id')}")
        return KTABase(
            id=employee.id,
            user_id=employee.user_id or 0,
            user_name=user.username if user else employee.full_name,
            site_id=employee.site_id or 0,
            site_name=site.name if site else None,
            kta_number=kta_number,
            issue_date=issue_date,
            expiry_date=expiry_date,
            status="ACTIVE",
            created_at=employee.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error renewing KTA: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to renew KTA: {error_msg}"
        )


@router.get("/{employee_id}/generate")
def generate_kta(
    employee_id: int,
    format: str = Query("PNG", description="Format: PNG or PDF"),
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Generate KTA card for employee (admin/supervisor only)."""
    from fastapi.responses import StreamingResponse
    from app.services.kta_service import KTAService
    
    try:
        company_id = current_user.get("company_id", 1)
        
        from app.models.employee import Employee
        
        employee = (
            db.query(Employee)
            .filter(
                Employee.id == employee_id,
                Employee.company_id == company_id,
            )
            .first()
        )
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        kta_service = KTAService()
        
        if format.upper() == "PDF":
            buffer = kta_service.generate_kta_pdf(db, employee_id)
            media_type = "application/pdf"
            filename = f"KTA_{employee.employee_number or employee_id}_{date.today().strftime('%Y%m%d')}.pdf"
        else:
            buffer = kta_service.generate_kta_image(db, employee_id, include_qr=True)
            media_type = "image/png"
            filename = f"KTA_{employee.employee_number or employee_id}_{date.today().strftime('%Y%m%d')}.png"
        
        api_logger.info(f"Generated KTA {format} for employee {employee_id} by user {current_user.get('id')}")
        return StreamingResponse(
            buffer,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error generating KTA: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate KTA: {error_msg}"
        )


@router.post("/batch-generate")
def batch_generate_kta(
    employee_ids: List[int] = Body(...),
    format: str = Query("PNG", description="Format: PNG or PDF"),
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Batch generate KTA cards for multiple employees (admin/supervisor only)."""
    from fastapi.responses import StreamingResponse
    from app.services.kta_service import KTAService
    import zipfile
    from io import BytesIO
    
    try:
        company_id = current_user.get("company_id", 1)
        
        from app.models.employee import Employee
        
        employees = (
            db.query(Employee)
            .filter(
                Employee.id.in_(employee_ids),
                Employee.company_id == company_id,
            )
            .all()
        )
        
        if not employees:
            raise HTTPException(status_code=404, detail="No employees found")
        
        kta_service = KTAService()
        results = kta_service.batch_generate_kta(db, employee_ids, format=format)
        
        # Create ZIP file
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for emp_id_str, buffer in results.items():
                emp_id = int(emp_id_str)
                employee = next((e for e in employees if e.id == emp_id), None)
                if employee:
                    ext = "pdf" if format.upper() == "PDF" else "png"
                    filename = f"KTA_{employee.employee_number or emp_id}.{ext}"
                    buffer.seek(0)
                    zip_file.writestr(filename, buffer.read())
        
        zip_buffer.seek(0)
        
        api_logger.info(f"Batch generated {len(results)} KTAs by user {current_user.get('id')}")
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=KTA_Batch_{date.today().strftime('%Y%m%d')}.zip"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error batch generating KTA: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to batch generate KTA: {error_msg}"
        )
