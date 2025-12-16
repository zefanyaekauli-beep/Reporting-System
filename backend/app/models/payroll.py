# backend/app/models/payroll.py

from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, date
import enum
from app.models.base import Base


class PayrollStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER = "BANK_TRANSFER"
    CASH = "CASH"
    E_WALLET = "E_WALLET"
    PAYMENT_GATEWAY = "PAYMENT_GATEWAY"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class Payroll(Base):
    """
    Payroll calculation and management.
    """
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Period
    period_start = Column(Date, nullable=False, index=True)
    period_end = Column(Date, nullable=False, index=True)
    pay_date = Column(Date, nullable=True)
    
    # Earnings (in cents to avoid floating point issues)
    base_salary = Column(Integer, nullable=False, default=0)  # Monthly base salary
    overtime_hours = Column(Integer, default=0, nullable=False)
    overtime_pay = Column(Integer, default=0, nullable=False)
    allowances = Column(Integer, default=0, nullable=False)  # Total allowances
    bonuses = Column(Integer, default=0, nullable=False)
    other_earnings = Column(Integer, default=0, nullable=False)
    
    # Deductions (in cents)
    tax = Column(Integer, default=0, nullable=False)
    insurance = Column(Integer, default=0, nullable=False)
    loan_deduction = Column(Integer, default=0, nullable=False)
    other_deductions = Column(Integer, default=0, nullable=False)
    
    # Totals
    total_gross = Column(Integer, nullable=False)  # Sum of all earnings
    total_deductions = Column(Integer, nullable=False)  # Sum of all deductions
    net_pay = Column(Integer, nullable=False)  # total_gross - total_deductions
    
    # Status
    status = Column(SQLEnum(PayrollStatus), default=PayrollStatus.DRAFT, nullable=False, index=True)
    
    # Approval
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # Invoice
    invoice_number = Column(String(128), unique=True, nullable=True, index=True)
    invoice_path = Column(String(512), nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])
    creator = relationship("User", foreign_keys=[created_by])
    payments = relationship("Payment", back_populates="payroll", cascade="all, delete-orphan")


class Payment(Base):
    """
    Payment processing and tracking.
    """
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payroll_id = Column(Integer, ForeignKey("payrolls.id"), nullable=False, index=True)
    
    # Payment Details
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    payment_gateway = Column(String(64), nullable=True)  # "MIDTRANS", "XENDIT", etc.
    amount = Column(Integer, nullable=False)  # Amount in cents
    
    # Transaction
    transaction_id = Column(String(128), unique=True, nullable=True, index=True)  # Gateway transaction ID
    reference_number = Column(String(128), nullable=True)
    
    # Status
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    
    # Timestamps
    initiated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    
    # Gateway Response
    gateway_response = Column(Text, nullable=True)  # JSON response from gateway
    gateway_url = Column(String(512), nullable=True)  # Payment URL from gateway
    
    # Error handling
    error_message = Column(Text, nullable=True)
    error_code = Column(String(64), nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    payroll = relationship("Payroll", back_populates="payments")

