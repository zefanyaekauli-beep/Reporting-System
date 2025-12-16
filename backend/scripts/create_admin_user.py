#!/usr/bin/env python3
"""
Script to create admin user in the database.
Run: python backend/scripts/create_admin_user.py
Or: cd backend && python scripts/create_admin_user.py
"""

import sys
import os
from pathlib import Path

# Get the backend directory (parent of scripts)
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Change to backend directory
os.chdir(backend_dir)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.user import User
from app.core.security import get_password_hash

# Database path
db_path = Path(__file__).parent.parent / "verolux_test.db"

if not db_path.exists():
    print(f"Database not found at {db_path}")
    print("Creating database...")
    # Create parent directory if it doesn't exist
    db_path.parent.mkdir(parents=True, exist_ok=True)

# Create engine
engine = create_engine(f"sqlite:///{db_path}", echo=False)

# Create session
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Check if admin user already exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    
    if admin_user:
        print(f"Admin user already exists!")
        print(f"Username: {admin_user.username}")
        print(f"Role: {admin_user.role}")
        print(f"Division: {admin_user.division}")
        print(f"Company ID: {admin_user.company_id}")
        
        # Update password to default
        default_password = "password123"
        admin_user.hashed_password = get_password_hash(default_password)
        db.commit()
        print(f"✅ Password reset to default!")
        print(f"Username: admin")
        print(f"Password: {default_password}")
    else:
        # Create new admin user
        print("Creating admin user...")
        
        # Default password
        default_password = "password123"
        password = default_password
        
        admin_user = User(
            username="admin",
            hashed_password=get_password_hash(password),
            division="security",  # Default division for admin (can access all)
            role="ADMIN",
            company_id=1,  # Default company
            site_id=None,  # Admin can access all sites
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("\n✅ Admin user created successfully!")
        print(f"Username: admin")
        print(f"Password: {password}")
        print(f"Role: ADMIN")
        print(f"Division: security (default, can access all divisions)")
        print(f"Company ID: 1")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()

print("\nYou can now login with:")
print("Username: admin")
print("Password: (the password you set)")

