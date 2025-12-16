# backend/app/models/sync_queue.py

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import Base


class SyncStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    RETRY = "RETRY"


class SyncOperationType(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


class SyncQueue(Base):
    """
    Offline to online sync queue.
    """
    __tablename__ = "sync_queue"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    
    # Operation Details
    operation_type = Column(SQLEnum(SyncOperationType), nullable=False, index=True)
    resource_type = Column(String(64), nullable=False, index=True)  # "ATTENDANCE", "REPORT", "PATROL", etc.
    resource_id = Column(Integer, nullable=True)  # ID of the resource (if exists)
    
    # Data
    data = Column(JSON, nullable=False)  # The actual data to sync
    original_data = Column(JSON, nullable=True)  # Original data for conflict resolution
    
    # Status
    status = Column(SQLEnum(SyncStatus), default=SyncStatus.PENDING, nullable=False, index=True)
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    processed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # Conflict resolution
    has_conflict = Column(Boolean, default=False, nullable=False)
    conflict_resolution = Column(String(32), nullable=True)  # "KEEP_LOCAL", "KEEP_SERVER", "MERGE"
    
    # Metadata
    device_id = Column(String(128), nullable=True)  # Device identifier
    offline_timestamp = Column(DateTime, nullable=True)  # When operation was created offline
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])

