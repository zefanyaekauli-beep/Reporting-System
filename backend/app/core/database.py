from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings
from app.models.base import Base

# Create database engine
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,  # Verify connections before using
    echo=False,  # Set to True for SQL query logging in development
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI routes.
    Usage: db: Session = Depends(get_db)
    """
    import json
    # #region agent log
    try:
        with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"database.py:19","message":"get_db called, creating session","data":{},"timestamp":int(__import__("time").time()*1000)}) + "\n")
    except: pass
    # #endregion
    db = SessionLocal()
    # #region agent log
    try:
        with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"database.py:25","message":"Session created, yielding","data":{"session_type":type(db).__name__},"timestamp":int(__import__("time").time()*1000)}) + "\n")
    except: pass
    # #endregion
    try:
        yield db
    finally:
        # #region agent log
        try:
            with open(r"c:\Users\DELL GAMING\Downloads\kerja\Reporting-System\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":"B","location":"database.py:30","message":"Closing database session","data":{},"timestamp":int(__import__("time").time()*1000)}) + "\n")
        except: pass
        # #endregion
        db.close()


def init_db() -> None:
    """
    Initialize database tables.
    Call this after all models are imported.
    """
    Base.metadata.create_all(bind=engine)


def test_database_connection() -> tuple:
    """
    Test database connection and verify critical tables exist.
    Returns: (success: bool, message: str)
    """
    try:
        from sqlalchemy import text
        db = SessionLocal()
        try:
            # Test basic connection
            result = db.execute(text("SELECT 1")).scalar()
            if result != 1:
                return False, "Database query returned unexpected result"
            
            # Check if users table exists
            if "sqlite" in str(engine.url):
                # SQLite
                tables = db.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'companies')"
                )).fetchall()
                table_names = [row[0] for row in tables]
            else:
                # PostgreSQL
                tables = db.execute(text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'companies')"
                )).fetchall()
                table_names = [row[0] for row in tables]
            
            missing_tables = []
            if "users" not in table_names:
                missing_tables.append("users")
            if "companies" not in table_names:
                missing_tables.append("companies")
            
            if missing_tables:
                return False, f"Missing critical tables: {', '.join(missing_tables)}"
            
            return True, "Database connection successful, all critical tables exist"
        finally:
            db.close()
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

