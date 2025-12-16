# backend/app/models/document.py

from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, date
import enum
from app.models.base import Base


class DocumentType(str, enum.Enum):
    SOP = "SOP"  # Standard Operating Procedure
    WORK_INSTRUCTION = "WORK_INSTRUCTION"
    POLICY = "POLICY"
    MANUAL = "MANUAL"
    FORM = "FORM"
    OTHER = "OTHER"


class DocumentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    OBSOLETE = "OBSOLETE"


class Document(Base):
    """
    Document control system for SOP, work instructions, policies.
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)  # NULL for global documents
    
    # Document Details
    title = Column(String(255), nullable=False)
    document_type = Column(SQLEnum(DocumentType), nullable=False, index=True)
    document_number = Column(String(128), unique=True, nullable=True, index=True)
    
    # Version Control
    version = Column(String(32), nullable=False, default="1.0")
    revision_date = Column(Date, nullable=True)
    effective_date = Column(Date, nullable=True, index=True)
    
    # Status
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.DRAFT, nullable=False, index=True)
    
    # File
    file_path = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    mime_type = Column(String(128), nullable=True)
    
    # Category and Division
    category = Column(String(128), nullable=True, index=True)
    division = Column(String(32), nullable=True, index=True)  # SECURITY, CLEANING, DRIVER, or NULL for all
    
    # Approval
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approval_notes = Column(Text, nullable=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    tags = Column(String(512), nullable=True)  # Comma-separated tags
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    approver = relationship("User", foreign_keys=[approved_by])
    creator = relationship("User", foreign_keys=[created_by])
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base):
    """
    Document version history.
    """
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    
    version = Column(String(32), nullable=False)
    revision_date = Column(Date, nullable=True)
    
    # File snapshot
    file_path = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)
    
    # Change log
    change_summary = Column(Text, nullable=True)
    changes_made_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="versions")
    changer = relationship("User", foreign_keys=[changes_made_by])

