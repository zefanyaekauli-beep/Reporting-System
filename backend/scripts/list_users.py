#!/usr/bin/env python3
"""
List all users in the database with their details.

Usage:
    python scripts/list_users.py
    python scripts/list_users.py --csv
"""

import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import verify_password

def list_users(format_output: str = "table"):
    """List all users in the database"""
    db = SessionLocal()
    
    try:
        users = db.query(User).order_by(User.username).all()
        
        if format_output == "csv":
            print("username,role,division,company_id,site_id,password_status")
            for user in users:
                # Check password status
                if user.hashed_password == "dummy":
                    pwd_status = "INVALID_DUMMY"
                elif len(user.hashed_password) < 20:
                    pwd_status = "INVALID_SHORT"
                elif not (user.hashed_password.startswith("$2b$") or user.hashed_password.startswith("$2a$")):
                    pwd_status = "INVALID_FORMAT"
                else:
                    pwd_status = "VALID"
                
                print(f"{user.username},{user.role},{user.division or ''},{user.company_id},{user.site_id or ''},{pwd_status}")
        else:
            print("=" * 80)
            print("User List")
            print("=" * 80)
            print(f"{'Username':<20} {'Role':<12} {'Division':<12} {'Company':<8} {'Site':<8} {'Password':<12}")
            print("-" * 80)
            
            for user in users:
                # Check password status
                if user.hashed_password == "dummy":
                    pwd_status = "❌ DUMMY"
                elif len(user.hashed_password) < 20:
                    pwd_status = "❌ INVALID"
                elif not (user.hashed_password.startswith("$2b$") or user.hashed_password.startswith("$2a$")):
                    pwd_status = "❌ INVALID"
                else:
                    pwd_status = "✅ VALID"
                
                print(f"{user.username:<20} {user.role:<12} {str(user.division or ''):<12} {user.company_id:<8} {str(user.site_id or ''):<8} {pwd_status}")
            
            print("-" * 80)
            print(f"Total users: {len(users)}")
            
            # Summary
            invalid_count = sum(1 for u in users if u.hashed_password == "dummy" or len(u.hashed_password) < 20)
            if invalid_count > 0:
                print(f"\n⚠️  {invalid_count} users have invalid passwords")
                print("   Run: python scripts/fix_user_passwords.py")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="List all users in database")
    parser.add_argument(
        "--csv",
        action="store_true",
        help="Output in CSV format"
    )
    
    args = parser.parse_args()
    
    list_users(format_output="csv" if args.csv else "table")

