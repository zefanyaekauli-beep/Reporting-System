# backend/app/api/employee_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import get_current_user, require_supervisor
from app.models.employee import Employee, Contract, EmployeeStatus, ContractType
from app.models.user import User
from app.models.site import Site

router = APIRouter(prefix="/employees", tags=["employees"])


class EmployeeBase(BaseModel):
    id: int
    company_id: int
    user_id: Optional[int] = None
    nik: Optional[str] = None
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    division: Optional[str] = None
    site_id: Optional[int] = None
    hire_date: Optional[date] = None
    status: str
    photo_path: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class EmployeeCreate(BaseModel):
    user_id: Optional[int] = None
    nik: Optional[str] = None
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    place_of_birth: Optional[str] = None
    gender: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    employee_number: Optional[str] = None
    position: Optional[str] = None
    division: Optional[str] = None
    site_id: Optional[int] = None
    department: Optional[str] = None
    hire_date: Optional[date] = None
    photo_path: Optional[str] = None
    notes: Optional[str] = None


class ContractBase(BaseModel):
    id: int
    employee_id: int
    contract_type: str
    contract_number: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    base_salary: Optional[int] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ContractCreate(BaseModel):
    employee_id: int
    contract_type: str
    contract_number: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    base_salary: Optional[int] = None
    allowances: int = 0
    benefits: Optional[str] = None
    terms: Optional[str] = None
    probation_period_days: Optional[int] = None
    signed_date: Optional[date] = None
    signed_by: Optional[str] = None
    notes: Optional[str] = None


@router.get("", response_model=List[EmployeeBase])
def list_employees(
    site_id: Optional[int] = Query(None),
    division: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List employees."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(Employee).filter(Employee.company_id == company_id)
        
        if site_id:
            q = q.filter(Employee.site_id == site_id)
        if division:
            q = q.filter(Employee.division == division.upper())
        if status:
            q = q.filter(Employee.status == EmployeeStatus[status.upper()])
        
        employees = q.order_by(Employee.full_name.asc()).limit(200).all()
        
        result = []
        for emp in employees:
            result.append(EmployeeBase(
                id=emp.id,
                company_id=emp.company_id,
                user_id=emp.user_id,
                nik=emp.nik,
                full_name=emp.full_name,
                email=emp.email,
                phone=emp.phone,
                position=emp.position,
                division=emp.division,
                site_id=emp.site_id,
                hire_date=emp.hire_date,
                status=emp.status.value if hasattr(emp.status, 'value') else str(emp.status),
                photo_path=emp.photo_path,
                created_at=emp.created_at,
            ))
        
        api_logger.info(f"Listed {len(result)} employees for user {current_user.get('id')}")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing employees: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list employees: {error_msg}"
        )


@router.get("/{employee_id}", response_model=EmployeeBase)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get employee detail."""
    try:
        company_id = current_user.get("company_id", 1)
        
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
        
        return EmployeeBase(
            id=employee.id,
            company_id=employee.company_id,
            user_id=employee.user_id,
            nik=employee.nik,
            full_name=employee.full_name,
            email=employee.email,
            phone=employee.phone,
            position=employee.position,
            division=employee.division,
            site_id=employee.site_id,
            hire_date=employee.hire_date,
            status=employee.status.value if hasattr(employee.status, 'value') else str(employee.status),
            photo_path=employee.photo_path,
            created_at=employee.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting employee: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get employee: {error_msg}"
        )


@router.post("", response_model=EmployeeBase, status_code=201)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Create employee (admin/supervisor only)."""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Check if NIK already exists
        if payload.nik:
            existing = (
                db.query(Employee)
                .filter(
                    Employee.company_id == company_id,
                    Employee.nik == payload.nik,
                )
                .first()
            )
            if existing:
                raise HTTPException(status_code=400, detail=f"Employee with NIK {payload.nik} already exists")
        
        # Check if employee_number already exists
        if payload.employee_number:
            existing = (
                db.query(Employee)
                .filter(
                    Employee.company_id == company_id,
                    Employee.employee_number == payload.employee_number,
                )
                .first()
            )
            if existing:
                raise HTTPException(status_code=400, detail=f"Employee with number {payload.employee_number} already exists")
        
        employee = Employee(
            company_id=company_id,
            user_id=payload.user_id,
            nik=payload.nik,
            full_name=payload.full_name,
            first_name=payload.first_name,
            last_name=payload.last_name,
            date_of_birth=payload.date_of_birth,
            place_of_birth=payload.place_of_birth,
            gender=payload.gender,
            email=payload.email,
            phone=payload.phone,
            address=payload.address,
            city=payload.city,
            postal_code=payload.postal_code,
            employee_number=payload.employee_number,
            position=payload.position,
            division=payload.division.upper() if payload.division else None,
            site_id=payload.site_id,
            department=payload.department,
            hire_date=payload.hire_date,
            photo_path=payload.photo_path,
            notes=payload.notes,
            status=EmployeeStatus.ACTIVE,
        )
        
        db.add(employee)
        db.commit()
        db.refresh(employee)
        
        api_logger.info(f"Created employee {employee.id} by user {current_user.get('id')}")
        return EmployeeBase(
            id=employee.id,
            company_id=employee.company_id,
            user_id=employee.user_id,
            nik=employee.nik,
            full_name=employee.full_name,
            email=employee.email,
            phone=employee.phone,
            position=employee.position,
            division=employee.division,
            site_id=employee.site_id,
            hire_date=employee.hire_date,
            status=employee.status.value if hasattr(employee.status, 'value') else str(employee.status),
            photo_path=employee.photo_path,
            created_at=employee.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error creating employee: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create employee: {error_msg}"
        )


@router.get("/contracts/expiring", response_model=List[ContractBase])
def get_expiring_contracts(
    days_ahead: int = Query(30, description="Days ahead to check"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get contracts expiring within specified days."""
    try:
        company_id = current_user.get("company_id", 1)
        today = date.today()
        expiry_date = today + timedelta(days=days_ahead)
        
        contracts = (
            db.query(Contract)
            .join(Employee)
            .filter(
                Employee.company_id == company_id,
                Contract.end_date.isnot(None),
                Contract.end_date >= today,
                Contract.end_date <= expiry_date,
                Contract.status == "ACTIVE",
            )
            .order_by(Contract.end_date.asc())
            .all()
        )
        
        result = []
        for contract in contracts:
            result.append(ContractBase(
                id=contract.id,
                employee_id=contract.employee_id,
                contract_type=contract.contract_type.value if hasattr(contract.contract_type, 'value') else str(contract.contract_type),
                contract_number=contract.contract_number,
                start_date=contract.start_date,
                end_date=contract.end_date,
                base_salary=contract.base_salary,
                status=contract.status,
                created_at=contract.created_at,
            ))
        
        api_logger.info(f"Found {len(result)} contracts expiring within {days_ahead} days")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting expiring contracts: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get expiring contracts: {error_msg}"
        )


@router.post("/{employee_id}/contract", response_model=ContractBase, status_code=201)
def add_employee_contract(
    employee_id: int,
    payload: ContractCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Add or renew employee contract."""
    try:
        company_id = current_user.get("company_id", 1)
        
        # Verify employee exists
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
        
        # Check if contract_number already exists
        if payload.contract_number:
            existing = (
                db.query(Contract)
                .filter(Contract.contract_number == payload.contract_number)
                .first()
            )
            if existing:
                raise HTTPException(status_code=400, detail=f"Contract number {payload.contract_number} already exists")
        
        contract = Contract(
            employee_id=employee_id,
            contract_type=ContractType[payload.contract_type.upper()],
            contract_number=payload.contract_number,
            start_date=payload.start_date,
            end_date=payload.end_date,
            base_salary=payload.base_salary,
            allowances=payload.allowances,
            benefits=payload.benefits,
            terms=payload.terms,
            probation_period_days=payload.probation_period_days,
            status="ACTIVE",
            signed_date=payload.signed_date,
            signed_by=payload.signed_by,
            notes=payload.notes,
        )
        
        db.add(contract)
        db.commit()
        db.refresh(contract)
        
        api_logger.info(f"Added contract {contract.id} for employee {employee_id} by user {current_user.get('id')}")
        return ContractBase(
            id=contract.id,
            employee_id=contract.employee_id,
            contract_type=contract.contract_type.value if hasattr(contract.contract_type, 'value') else str(contract.contract_type),
            contract_number=contract.contract_number,
            start_date=contract.start_date,
            end_date=contract.end_date,
            base_salary=contract.base_salary,
            status=contract.status,
            created_at=contract.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error adding contract: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add contract: {error_msg}"
        )


@router.get("/contracts/expiring", response_model=List[ContractBase])
def get_expiring_contracts(
    days_ahead: int = Query(30, description="Days ahead to check"),
    db: Session = Depends(get_db),
    current_user=Depends(require_supervisor),
):
    """Get contracts expiring within specified days."""
    try:
        company_id = current_user.get("company_id", 1)
        from app.services.notification_service import NotificationService
        
        notification_service = NotificationService()
        contracts_info = notification_service.check_contract_expiry(db, days_ahead=days_ahead)
        
        result = []
        for contract_info in contracts_info:
            contract = (
                db.query(Contract)
                .filter(
                    Contract.id == contract_info["contract_id"],
                    Contract.employee.has(Employee.company_id == company_id),
                )
                .first()
            )
            if contract:
                result.append(ContractBase(
                    id=contract.id,
                    employee_id=contract.employee_id,
                    contract_type=contract.contract_type.value if hasattr(contract.contract_type, 'value') else str(contract.contract_type),
                    contract_number=contract.contract_number,
                    start_date=contract.start_date,
                    end_date=contract.end_date,
                    base_salary=contract.base_salary,
                    status=contract.status,
                    created_at=contract.created_at,
                ))
        
        api_logger.info(f"Found {len(result)} contracts expiring within {days_ahead} days")
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error getting expiring contracts: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get expiring contracts: {error_msg}"
        )


@router.post("/contracts/check-expiry")
def check_contract_expiry(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Check and send notifications for expiring contracts (admin/supervisor only)."""
    try:
        from app.services.notification_service import NotificationService
        
        notification_service = NotificationService()
        notification_count = notification_service.send_contract_expiry_notifications(db)
        
        api_logger.info(f"Sent {notification_count} contract expiry notifications")
        return {
            "success": True,
            "notifications_sent": notification_count,
            "message": f"Sent {notification_count} contract expiry notifications"
        }
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error checking contract expiry: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check contract expiry: {error_msg}"
        )
