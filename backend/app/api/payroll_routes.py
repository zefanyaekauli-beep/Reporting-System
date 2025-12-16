# backend/app/api/payroll_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

from app.core.database import get_db
from app.core.logger import api_logger
from app.api.deps import require_supervisor
from app.models.payroll import Payroll, Payment, PayrollStatus, PaymentStatus, PaymentMethod
from app.models.user import User
from app.services.payroll_service import PayrollService

router = APIRouter(prefix="/payroll", tags=["payroll"])


class PayrollBase(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    period_start: date
    period_end: date
    base_salary: int
    overtime_pay: int
    allowances: int
    total_gross: int
    total_deductions: int
    net_pay: int
    status: str
    invoice_number: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PayrollGenerate(BaseModel):
    user_id: int
    period_start: date
    period_end: date


@router.post("/generate", response_model=PayrollBase, status_code=201)
def generate_payroll(
    payload: PayrollGenerate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Generate payroll for a user in a period."""
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        # Verify user exists
        user = db.query(User).filter(
            User.id == payload.user_id,
            User.company_id == company_id,
        ).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if payroll already exists
        existing = (
            db.query(Payroll)
            .filter(
                Payroll.company_id == company_id,
                Payroll.user_id == payload.user_id,
                Payroll.period_start == payload.period_start,
                Payroll.period_end == payload.period_end,
            )
            .first()
        )
        
        if existing:
            raise HTTPException(status_code=400, detail="Payroll for this period already exists")
        
        # Generate payroll using service
        payroll_service = PayrollService()
        payroll_data = payroll_service.calculate_payroll(
            db=db,
            user_id=payload.user_id,
            period_start=payload.period_start,
            period_end=payload.period_end,
        )
        
        # Generate invoice number
        invoice_number = f"INV-{payload.period_start.strftime('%Y%m')}-{payload.user_id:04d}-{datetime.now().strftime('%d%H%M')}"
        
        payroll = Payroll(
            company_id=company_id,
            user_id=payload.user_id,
            period_start=payload.period_start,
            period_end=payload.period_end,
            base_salary=payroll_data["base_salary"],
            overtime_hours=payroll_data["overtime_hours"],
            overtime_pay=payroll_data["overtime_pay"],
            allowances=payroll_data["allowances"],
            bonuses=payroll_data.get("bonuses", 0),
            other_earnings=payroll_data.get("other_earnings", 0),
            tax=payroll_data.get("tax", 0),
            insurance=payroll_data.get("insurance", 0),
            loan_deduction=payroll_data.get("loan_deduction", 0),
            other_deductions=payroll_data.get("other_deductions", 0),
            total_gross=payroll_data["total_gross"],
            total_deductions=payroll_data["total_deductions"],
            net_pay=payroll_data["net_pay"],
            status=PayrollStatus.DRAFT,
            invoice_number=invoice_number,
            created_by=user_id,
        )
        
        db.add(payroll)
        db.commit()
        db.refresh(payroll)
        
        api_logger.info(f"Generated payroll {payroll.id} for user {payload.user_id}, period {payload.period_start} to {payload.period_end}")
        return PayrollBase(
            id=payroll.id,
            user_id=payroll.user_id,
            user_name=user.username,
            period_start=payroll.period_start,
            period_end=payroll.period_end,
            base_salary=payroll.base_salary,
            overtime_pay=payroll.overtime_pay,
            allowances=payroll.allowances,
            total_gross=payroll.total_gross,
            total_deductions=payroll.total_deductions,
            net_pay=payroll.net_pay,
            status=payroll.status.value if hasattr(payroll.status, 'value') else str(payroll.status),
            invoice_number=payroll.invoice_number,
            created_at=payroll.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error generating payroll: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate payroll: {error_msg}"
        )


@router.get("", response_model=List[PayrollBase])
def list_payrolls(
    user_id: Optional[int] = Query(None),
    period_start: Optional[date] = Query(None),
    period_end: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """List payrolls."""
    try:
        company_id = current_user.get("company_id", 1)
        
        q = db.query(Payroll).filter(Payroll.company_id == company_id)
        
        if user_id:
            q = q.filter(Payroll.user_id == user_id)
        if period_start:
            q = q.filter(Payroll.period_start >= period_start)
        if period_end:
            q = q.filter(Payroll.period_end <= period_end)
        if status:
            q = q.filter(Payroll.status == PayrollStatus[status.upper()])
        
        payrolls = q.order_by(Payroll.period_end.desc(), Payroll.created_at.desc()).limit(100).all()
        
        result = []
        for payroll in payrolls:
            user = db.query(User).filter(User.id == payroll.user_id).first()
            result.append(PayrollBase(
                id=payroll.id,
                user_id=payroll.user_id,
                user_name=user.username if user else f"User {payroll.user_id}",
                period_start=payroll.period_start,
                period_end=payroll.period_end,
                base_salary=payroll.base_salary,
                overtime_pay=payroll.overtime_pay,
                allowances=payroll.allowances,
                total_gross=payroll.total_gross,
                total_deductions=payroll.total_deductions,
                net_pay=payroll.net_pay,
                status=payroll.status.value if hasattr(payroll.status, 'value') else str(payroll.status),
                invoice_number=payroll.invoice_number,
                created_at=payroll.created_at,
            ))
        
        return result
        
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error listing payrolls: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list payrolls: {error_msg}"
        )


@router.post("/{payroll_id}/approve")
def approve_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Approve payroll."""
    try:
        company_id = current_user.get("company_id", 1)
        user_id = current_user.get("id")
        
        payroll = (
            db.query(Payroll)
            .filter(
                Payroll.id == payroll_id,
                Payroll.company_id == company_id,
            )
            .first()
        )
        
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll not found")
        
        if payroll.status != PayrollStatus.DRAFT:
            raise HTTPException(status_code=400, detail="Payroll is not in draft status")
        
        payroll.status = PayrollStatus.APPROVED
        payroll.approved_by = user_id
        payroll.approved_at = datetime.utcnow()
        
        db.commit()
        db.refresh(payroll)
        
        api_logger.info(f"Approved payroll {payroll_id} by user {user_id}")
        return {"message": "Payroll approved", "payroll_id": payroll_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error approving payroll: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to approve payroll: {error_msg}"
        )


@router.post("/{payroll_id}/pay")
def process_payment(
    payroll_id: int,
    payment_method: str = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Process payment for approved payroll."""
    try:
        company_id = current_user.get("company_id", 1)
        
        payroll = (
            db.query(Payroll)
            .filter(
                Payroll.id == payroll_id,
                Payroll.company_id == company_id,
            )
            .first()
        )
        
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll not found")
        
        if payroll.status != PayrollStatus.APPROVED:
            raise HTTPException(status_code=400, detail="Payroll must be approved before payment")
        
        # Create payment record
        payment = Payment(
            payroll_id=payroll_id,
            payment_method=PaymentMethod[payment_method.upper()],
            amount=payroll.net_pay,
            status=PaymentStatus.PENDING,
        )
        
        db.add(payment)
        db.flush()
        
        # Process payment via gateway if needed
        if payment_method.upper() == "PAYMENT_GATEWAY":
            # TODO: Integrate with payment gateway (Midtrans/Xendit)
            # For now, just mark as processing
            payment.status = PaymentStatus.PROCESSING
            payment.payment_gateway = "MIDTRANS"  # or XENDIT
            # payment.gateway_url = gateway_response["payment_url"]
            # payment.transaction_id = gateway_response["transaction_id"]
        
        db.commit()
        db.refresh(payment)
        
        # Update payroll status
        payroll.status = PayrollStatus.PAID
        payroll.pay_date = date.today()
        db.commit()
        
        api_logger.info(f"Processed payment {payment.id} for payroll {payroll_id}")
        return {
            "message": "Payment processed",
            "payment_id": payment.id,
            "transaction_id": payment.transaction_id,
            "gateway_url": payment.gateway_url,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error processing payment: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process payment: {error_msg}"
        )


@router.get("/{payroll_id}/invoice")
def get_payroll_invoice(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supervisor),
):
    """Get payroll invoice PDF."""
    try:
        company_id = current_user.get("company_id", 1)
        
        payroll = (
            db.query(Payroll)
            .filter(
                Payroll.id == payroll_id,
                Payroll.company_id == company_id,
            )
            .first()
        )
        
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll not found")
        
        # Generate invoice PDF
        from app.services.pdf_service import PDFService
        from fastapi.responses import StreamingResponse
        
        user = db.query(User).filter(User.id == payroll.user_id).first()
        
        invoice_data = {
            "invoice_number": payroll.invoice_number,
            "user_name": user.username if user else f"User {payroll.user_id}",
            "period_start": payroll.period_start.isoformat(),
            "period_end": payroll.period_end.isoformat(),
            "base_salary": payroll.base_salary / 100,  # Convert from cents
            "overtime_pay": payroll.overtime_pay / 100,
            "allowances": payroll.allowances / 100,
            "total_gross": payroll.total_gross / 100,
            "total_deductions": payroll.total_deductions / 100,
            "net_pay": payroll.net_pay / 100,
        }
        
        pdf_service = PDFService()
        pdf_buffer = pdf_service.generate_payroll_invoice(invoice_data)
        
        filename = f"Invoice_{payroll.invoice_number}_{date.today().strftime('%Y%m%d')}.pdf"
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        api_logger.error(f"Error generating invoice: {error_type} - {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate invoice: {error_msg}"
        )

