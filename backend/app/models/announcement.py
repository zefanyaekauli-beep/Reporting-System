# backend/app/models/announcement.py

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import Base


class AnnouncementPriority(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AnnouncementScope(str, enum.Enum):
    ALL = "all"  # all active users
    DIVISIONS = "divisions"  # specific divisions
    USERS = "users"  # specific users


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(Enum(AnnouncementPriority), nullable=False, default=AnnouncementPriority.INFO)
    scope = Column(Enum(AnnouncementScope), nullable=False, default=AnnouncementScope.ALL)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    valid_from = Column(DateTime, default=datetime.utcnow, nullable=False)
    valid_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    require_ack = Column(Boolean, default=False, nullable=False)  # Require explicit acknowledgment

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    targets = relationship("AnnouncementTarget", back_populates="announcement", cascade="all, delete-orphan")


class AnnouncementTarget(Base):
    __tablename__ = "announcement_targets"

    id = Column(Integer, primary_key=True, index=True)
    announcement_id = Column(Integer, ForeignKey("announcements.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    is_ack = Column(Boolean, default=False, nullable=False)  # explicit acknowledge
    ack_at = Column(DateTime, nullable=True)

    # Relationships
    announcement = relationship("Announcement", back_populates="targets")
    user = relationship("User")

