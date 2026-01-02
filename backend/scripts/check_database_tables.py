#!/usr/bin/env python3
"""
Script to check if required database tables exist
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine
from sqlalchemy import inspect, text

def check_tables():
    """Check if required tables exist"""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    
    required_tables = {
        "users",
        "companies",
        "sites",
        "roles",
        "permissions",
        "role_permissions",
        "user_permissions",
    }
    
    print("=" * 60)
    print("Database Tables Check")
    print("=" * 60)
    print(f"\nExisting tables ({len(existing_tables)}):")
    for table in sorted(existing_tables):
        print(f"  ✓ {table}")
    
    print(f"\nRequired tables ({len(required_tables)}):")
    missing_tables = []
    for table in sorted(required_tables):
        if table in existing_tables:
            print(f"  ✓ {table}")
        else:
            print(f"  ✗ {table} (MISSING)")
            missing_tables.append(table)
    
    if missing_tables:
        print(f"\n⚠️  Missing tables: {', '.join(missing_tables)}")
        print("\nTo create missing tables, run:")
        print("  python -m alembic upgrade head")
        print("  OR")
        print("  python scripts/create_complete_mock_data_all.py")
    else:
        print("\n✅ All required tables exist!")
    
    # Check if companies table has data
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM companies"))
            count = result.scalar()
            if count == 0:
                print("\n⚠️  Companies table is empty. Creating default company...")
                conn.execute(text("""
                    INSERT INTO companies (id, name, code) 
                    VALUES (1, 'PT Verolux Security', 'VEROLUX')
                    ON CONFLICT(id) DO NOTHING
                """))
                conn.commit()
                print("✅ Default company created")
            else:
                print(f"\n✅ Companies table has {count} record(s)")
    except Exception as e:
        print(f"\n⚠️  Error checking companies: {e}")
    
    return len(missing_tables) == 0

if __name__ == "__main__":
    check_tables()

