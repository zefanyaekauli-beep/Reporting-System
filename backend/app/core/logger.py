# backend/app/core/logger.py

import logging
import sys
from typing import Optional
from pathlib import Path

# Create logs directory if it doesn't exist
LOG_DIR = Path(__file__).parent.parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(LOG_DIR / "app.log"),
        logging.StreamHandler(sys.stdout),
    ],
)

# Set specific loggers to DEBUG for watermark debugging
logging.getLogger("app.services.watermark_service").setLevel(logging.DEBUG)
logging.getLogger("app.services.file_storage").setLevel(logging.DEBUG)

# Create logger instances
logger = logging.getLogger("verolux")
api_logger = logging.getLogger("verolux.api")
db_logger = logging.getLogger("verolux.db")
auth_logger = logging.getLogger("verolux.auth")

def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get a logger instance"""
    if name:
        return logging.getLogger(f"verolux.{name}")
    return logger

