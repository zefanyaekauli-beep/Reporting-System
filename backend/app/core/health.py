# backend/app/core/health.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from typing import Dict, Any
from app.core.database import SessionLocal
from app.core.logger import logger

def check_database() -> Dict[str, Any]:
    """Check database connectivity and basic queries"""
    try:
        db = SessionLocal()
        try:
            # Test basic query
            result = db.execute(text("SELECT 1")).scalar()
            if result != 1:
                return {"status": "error", "message": "Database query returned unexpected result"}
            
            # Check table existence
            tables = db.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'sites', 'attendance')"
            )).fetchall()
            
            table_count = len(tables)
            
            return {
                "status": "healthy",
                "tables_checked": table_count,
                "response_time_ms": 0,  # Could add timing if needed
            }
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "message": str(e),
        }


def check_disk_space() -> Dict[str, Any]:
    """Check available disk space (basic check)"""
    try:
        import shutil
        total, used, free = shutil.disk_usage("/")
        
        # Convert to GB
        free_gb = free / (1024 ** 3)
        total_gb = total / (1024 ** 3)
        used_percent = (used / total) * 100
        
        status = "healthy"
        if free_gb < 1:  # Less than 1GB free
            status = "warning"
        elif free_gb < 0.5:  # Less than 500MB free
            status = "error"
        
        return {
            "status": status,
            "free_gb": round(free_gb, 2),
            "total_gb": round(total_gb, 2),
            "used_percent": round(used_percent, 2),
        }
    except Exception as e:
        logger.warning(f"Disk space check failed: {str(e)}")
        return {
            "status": "unknown",
            "message": "Could not check disk space",
        }


def get_system_health() -> Dict[str, Any]:
    """Get comprehensive system health status"""
    db_health = check_database()
    disk_health = check_disk_space()
    
    # Overall status
    overall_status = "healthy"
    if db_health.get("status") == "error" or disk_health.get("status") == "error":
        overall_status = "error"
    elif db_health.get("status") == "warning" or disk_health.get("status") == "warning":
        overall_status = "warning"
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_health,
            "disk": disk_health,
        },
        "version": "1.0.0",  # Could be from settings or git
    }

