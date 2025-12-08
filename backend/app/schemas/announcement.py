# backend/app/schemas/announcement.py

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum


class AnnouncementPriority(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AnnouncementScope(str, Enum):
    ALL = "all"
    DIVISIONS = "divisions"
    USERS = "users"


class AnnouncementBase(BaseModel):
    title: str
    message: str
    priority: AnnouncementPriority = AnnouncementPriority.INFO
    scope: AnnouncementScope = AnnouncementScope.ALL
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    require_ack: bool = False


class AnnouncementCreate(AnnouncementBase):
    # if scope == divisions
    division_ids: Optional[List[int]] = None
    # if scope == users
    user_ids: Optional[List[int]] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    priority: Optional[AnnouncementPriority] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None


class AnnouncementOut(AnnouncementBase):
    id: int
    company_id: int
    created_by_id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class AnnouncementWithState(AnnouncementOut):
    is_read: bool
    read_at: Optional[datetime] = None
    is_ack: bool
    ack_at: Optional[datetime] = None

    class Config:
        from_attributes = True

