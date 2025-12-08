from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    """
    User model with role and scope support.
    
    Roles:
    - FIELD: Field personnel (guards, cleaners, drivers)
    - SUPERVISOR: Supervisory personnel
    - ADMIN: System administrators
    
    Scope (for supervisors):
    - scope_type: DIVISION, SITE, COMPANY (nullable)
    - scope_id: division_code, site_id, or company_id (depending on scope_type)
    
    Division:
    - security, cleaning, driver, parking (for field users)
    - null or 'all' for supervisors/admins who see multiple divisions
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Division assignment (for field users)
    # For supervisors/admins: null or 'all' if they see multiple divisions
    division = Column(String, nullable=True)  # 'security', 'cleaning', 'driver', 'parking', or null
    
    # Role: FIELD, SUPERVISOR, ADMIN
    role = Column(String, nullable=False, default="FIELD", index=True)
    
    # Supervisor scope model (for SUPERVISOR role)
    # scope_type: DIVISION, SITE, COMPANY (nullable for FIELD users)
    scope_type = Column(String(32), nullable=True)  # 'DIVISION', 'SITE', 'COMPANY'
    # scope_id: division_code (e.g., 'security'), site_id, or company_id
    scope_id = Column(Integer, nullable=True, index=True)
    
    # Multi-tenant support
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True, index=True)
    
    # Relationships (optional, for future use)
    # company = relationship("Company", back_populates="users")
    # site = relationship("Site", back_populates="users")
