# backend/app/models/employee.py

from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, date
import enum
from app.models.base import Base


class EmployeeStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    TERMINATED = "TERMINATED"
    ON_LEAVE = "ON_LEAVE"


class ContractType(str, enum.Enum):
    PERMANENT = "PERMANENT"
    CONTRACT = "CONTRACT"
    INTERNSHIP = "INTERNSHIP"
    PART_TIME = "PART_TIME"


class Employee(Base):
    """
    Employee database with personal and employment data.
    """
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True, index=True)  # Link to user account
    
    # Personal Data
    nik = Column(String(32), unique=True, nullable=True, index=True)  # National ID
    full_name = Column(String(255), nullable=False)
    first_name = Column(String(128), nullable=True)
    last_name = Column(String(128), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    place_of_birth = Column(String(128), nullable=True)
    gender = Column(String(16), nullable=True)  # "MALE", "FEMALE"
    blood_type = Column(String(8), nullable=True)
    
    # Contact Information
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(32), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(128), nullable=True)
    postal_code = Column(String(16), nullable=True)
    
    # Employment Data
    employee_number = Column(String(64), unique=True, nullable=True, index=True)
    position = Column(String(128), nullable=True)
    division = Column(String(32), nullable=True)  # SECURITY, CLEANING, DRIVER
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True, index=True)
    department = Column(String(128), nullable=True)
    hire_date = Column(Date, nullable=True)
    
    # Status
    status = Column(SQLEnum(EmployeeStatus), default=EmployeeStatus.ACTIVE, nullable=False, index=True)
    
    # Photo
    photo_path = Column(String(512), nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    site = relationship("Site", foreign_keys=[site_id])
    contracts = relationship("Contract", back_populates="employee", cascade="all, delete-orphan")


class Contract(Base):
    """
    Employee contract management.
    """
    __tablename__ = "employee_contracts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    
    contract_type = Column(SQLEnum(ContractType), nullable=False)
    contract_number = Column(String(128), unique=True, nullable=True, index=True)
    
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=True, index=True)  # NULL for permanent
    
    # Compensation
    base_salary = Column(Integer, nullable=True)  # Monthly salary in cents
    allowances = Column(Integer, default=0, nullable=False)  # Total allowances in cents
    benefits = Column(Text, nullable=True)  # JSON or text description
    
    # Terms
    terms = Column(Text, nullable=True)  # Contract terms and conditions
    probation_period_days = Column(Integer, nullable=True)
    
    # Status
    status = Column(String(32), default="ACTIVE", nullable=False, index=True)  # ACTIVE, EXPIRED, TERMINATED
    
    # Metadata
    signed_date = Column(Date, nullable=True)
    signed_by = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    employee = relationship("Employee", back_populates="contracts")

