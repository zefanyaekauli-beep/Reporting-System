# backend/app/models/training.py

from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, date
import enum
from app.models.base import Base


class TrainingStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    POSTPONED = "POSTPONED"


class TrainingAttendanceStatus(str, enum.Enum):
    REGISTERED = "REGISTERED"
    ATTENDED = "ATTENDED"
    ABSENT = "ABSENT"
    CANCELLED = "CANCELLED"


class Training(Base):
    """
    Training and development module.
    """
    __tablename__ = "trainings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True, index=True)
    
    # Training Details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(64), nullable=True, index=True)  # "SAFETY", "SKILL", "COMPLIANCE", etc.
    
    # Schedule
    scheduled_date = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)
    
    # Instructor
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    instructor_name = Column(String(255), nullable=True)  # External instructor
    
    # Capacity
    max_participants = Column(Integer, nullable=True)
    min_participants = Column(Integer, default=1, nullable=False)
    
    # Status
    status = Column(SQLEnum(TrainingStatus), default=TrainingStatus.SCHEDULED, nullable=False, index=True)
    
    # Materials
    materials_url = Column(String(512), nullable=True)
    materials_path = Column(String(512), nullable=True)
    
    # Division
    division = Column(String(32), nullable=True, index=True)  # SECURITY, CLEANING, DRIVER, or NULL for all
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    site = relationship("Site", foreign_keys=[site_id])
    instructor = relationship("User", foreign_keys=[instructor_id])
    creator = relationship("User", foreign_keys=[created_by])
    attendances = relationship("TrainingAttendance", back_populates="training", cascade="all, delete-orphan")


class TrainingAttendance(Base):
    """
    Training attendance and completion tracking.
    """
    __tablename__ = "training_attendances"

    id = Column(Integer, primary_key=True, index=True)
    training_id = Column(Integer, ForeignKey("trainings.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Registration
    registered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Attendance
    attendance_status = Column(SQLEnum(TrainingAttendanceStatus), default=TrainingAttendanceStatus.REGISTERED, nullable=False)
    attended_at = Column(DateTime, nullable=True)
    
    # Completion
    score = Column(Integer, nullable=True)  # Test score if applicable
    passed = Column(Boolean, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    
    # Certificate
    certificate_url = Column(String(512), nullable=True)
    certificate_path = Column(String(512), nullable=True)
    
    # Feedback
    feedback = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5 rating
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    training = relationship("Training", back_populates="attendances")
    user = relationship("User", foreign_keys=[user_id])


class DevelopmentPlan(Base):
    """
    Employee development / pembinaan plans.
    """
    __tablename__ = "development_plans"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Plan Details
    development_type = Column(String(64), nullable=False)  # "TRAINING", "COACHING", "MENTORING", "PROJECT"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Timeline
    start_date = Column(Date, nullable=True)
    target_date = Column(Date, nullable=True, index=True)
    completion_date = Column(Date, nullable=True)
    
    # Status
    status = Column(String(32), default="PLANNED", nullable=False, index=True)  # PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    
    # Evaluation
    evaluation = Column(Text, nullable=True)
    evaluation_date = Column(Date, nullable=True)
    evaluated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    evaluator = relationship("User", foreign_keys=[evaluated_by])
    creator = relationship("User", foreign_keys=[created_by])

