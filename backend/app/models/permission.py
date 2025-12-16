# backend/app/models/permission.py

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Table, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


# Many-to-many relationship table
user_permissions = Table(
    "user_permissions",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
)


class Permission(Base):
    """
    Permission model for RBAC.
    """
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, nullable=False, index=True)  # e.g., "reports.read", "reports.write"
    resource = Column(String(64), nullable=False, index=True)  # e.g., "reports", "attendance", "payroll"
    action = Column(String(32), nullable=False, index=True)  # e.g., "read", "write", "delete", "admin"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    users = relationship("User", secondary=user_permissions, back_populates="permissions")
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")


class Role(Base):
    """
    Role model for RBAC.
    """
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, nullable=False, index=True)  # e.g., "SUPER_ADMIN", "SUPERVISOR", "GUARD"
    display_name = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=False, nullable=False)  # System roles cannot be deleted
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = relationship("User", back_populates="role_obj")


class AuditLog(Base):
    """
    Audit log for tracking user actions.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    
    action = Column(String(64), nullable=False, index=True)  # e.g., "CREATE", "UPDATE", "DELETE", "VIEW"
    resource_type = Column(String(64), nullable=False, index=True)  # e.g., "REPORT", "ATTENDANCE", "USER"
    resource_id = Column(Integer, nullable=True, index=True)
    
    details = Column(Text, nullable=True)  # JSON or text description
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(String(512), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])

