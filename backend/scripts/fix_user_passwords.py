#!/usr/bin/env python3
"""
Fix user passwords in the database.
Replaces invalid passwords (like "dummy") with proper bcrypt hashes.

Usage:
    python scripts/fix_user_passwords.py
    python scripts/fix_user_passwords.py --password mypassword
"""

import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash, verify_password

def fix_passwords(default_password: str = "password123", dry_run: bool = False):
    """
    Fix all user passwords that are invalid or use "dummy".
    
    Args:
        default_password: Password to set for all users
        dry_run: If True, only show what would be changed without actually changing
    """
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        updated_count = 0
        
        print("=" * 60)
        print("User Password Fix Script")
        print("=" * 60)
        print(f"Default password: {default_password}")
        print(f"Mode: {'DRY RUN (no changes)' if dry_run else 'LIVE (will update)'}")
        print()
        
        for user in users:
            needs_update = False
            reason = ""
            
            # Check if password is invalid
            if user.hashed_password == "dummy":
                needs_update = True
                reason = "uses 'dummy' placeholder"
            elif len(user.hashed_password) < 20:
                needs_update = True
                reason = "too short (likely invalid)"
            else:
                # Try to verify - if it fails, password is invalid
                try:
                    # Try verifying with a dummy password - if it doesn't raise, it's not bcrypt
                    verify_password("test", user.hashed_password)
                    # If we get here without exception, it's not a valid bcrypt hash
                    needs_update = True
                    reason = "invalid bcrypt format"
                except:
                    # Bcrypt verification failed (expected) - password might be valid
                    # But let's check if it's actually bcrypt format
                    if not user.hashed_password.startswith("$2b$") and not user.hashed_password.startswith("$2a$"):
                        needs_update = True
                        reason = "not bcrypt format"
            
            if needs_update:
                new_hash = get_password_hash(default_password)
                print(f"  🔧 {user.username:20} ({user.role:12}) - {reason}")
                if not dry_run:
                    user.hashed_password = new_hash
                    updated_count += 1
            else:
                print(f"  ✅ {user.username:20} ({user.role:12}) - password OK")
        
        if not dry_run:
            db.commit()
            print()
            print(f"✅ Updated {updated_count} user passwords")
            print(f"📝 All users now have password: {default_password}")
        else:
            print()
            print(f"📊 Would update {sum(1 for u in users if u.hashed_password == 'dummy' or len(u.hashed_password) < 20)} users")
            print("   Run without --dry-run to apply changes")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix user passwords in database")
    parser.add_argument(
        "--password",
        default="password123",
        help="Default password to set for all users (default: password123)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be changed without actually changing"
    )
    
    args = parser.parse_args()
    
    fix_passwords(default_password=args.password, dry_run=args.dry_run)

