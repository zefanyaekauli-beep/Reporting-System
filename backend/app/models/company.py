from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .base import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    code = Column(String, unique=True, nullable=False, index=True)  # Company code/identifier
    
    # Relationships (optional, for future use)
    # users = relationship("User", back_populates="company")
    # sites = relationship("Site", back_populates="company")

