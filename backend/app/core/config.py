from pydantic_settings import BaseSettings
from typing import List
import os
import secrets

class Settings(BaseSettings):
    PROJECT_NAME: str = "Verolux Management System"
    API_V1_STR: str = "/api"
    
    # Database configuration
    # Use SQLite for quick testing if PostgreSQL not available
    # For production, use PostgreSQL: postgresql://user:password@localhost:5432/verolux_db
    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./verolux_test.db"
    )
    
    # CORS configuration
    # In production, set CORS_ORIGINS in .env (comma-separated list)
    # Example: CORS_ORIGINS=https://app.verolux.com,https://admin.verolux.com
    # For development, allow common origins
    _cors_origins_env = os.getenv("CORS_ORIGINS", "")
    CORS_ORIGINS: List[str] = (
        [origin.strip() for origin in _cors_origins_env.split(",") if origin.strip()]
        if _cors_origins_env and _cors_origins_env != "*"
        else ["*"]  # Development default: allow all
    )
    
    # Security - MUST be set via environment variable in production
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        secrets.token_urlsafe(32)  # Generate random key if not set (for dev only)
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours default
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")  # development, staging, production
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Security warnings
if settings.ENVIRONMENT == "production":
    if settings.SECRET_KEY == "change-this-secret-key-in-production" or len(settings.SECRET_KEY) < 32:
        raise ValueError(
            "SECRET_KEY must be set via environment variable in production "
            "and must be at least 32 characters long"
        )
    if "*" in settings.CORS_ORIGINS:
        raise ValueError(
            "CORS_ORIGINS must not be '*' in production. "
            "Set specific allowed origins via CORS_ORIGINS environment variable."
        )
