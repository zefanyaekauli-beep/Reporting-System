#!/usr/bin/env python3
"""
Script to check if all required tables and columns exist for heatmap functionality.
"""

import sqlite3
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database path - try multiple locations
backend_dir = os.path.dirname(os.path.dirname(__file__))
possible_paths = [
    os.path.join(backend_dir, "instance", "reporting_system.db"),
    os.path.join(backend_dir, "reporting_system.db"),
    os.path.join(backend_dir, "verolux_test.db"),  # Found database
    "instance/reporting_system.db",
    "reporting_system.db",
]

DB_PATH = None
for path in possible_paths:
    abs_path = os.path.abspath(path) if not os.path.isabs(path) else path
    if os.path.exists(abs_path):
        DB_PATH = abs_path
        break

if not DB_PATH:
    # Try to find any .db file in backend directory
    for root, dirs, files in os.walk(backend_dir):
        for file in files:
            if file.endswith('.db'):
                DB_PATH = os.path.join(root, file)
                break
        if DB_PATH:
            break

if not os.path.exists(DB_PATH):
    print(f"Database not found at: {DB_PATH}")
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Required tables and columns for heatmap
required_schema = {
    "attendance": {
        "required_columns": [
            "id", "company_id", "user_id", "site_id", "role_type",
            "checkin_time", "checkin_lat", "checkin_lng",
            "checkout_time", "checkout_lat", "checkout_lng"
        ],
        "optional_columns": ["division"]  # Some queries use division but it might not exist
    },
    "gps_tracks": {
        "required_columns": [
            "id", "company_id", "user_id", "site_id",
            "track_type", "latitude", "longitude", "recorded_at"
        ]
    },
    "checklist_items": {
        "required_columns": [
            "id", "checklist_id", "gps_lat", "gps_lng"
        ]
    },
    "checklists": {
        "required_columns": [
            "id", "company_id", "site_id", "division", "user_id", "created_at", "status"
        ]
    },
    "sites": {
        "required_columns": [
            "id", "company_id", "name", "lat", "lng"
        ]
    },
    "security_reports": {
        "required_columns": [
            "id", "company_id", "site_id", "division", "user_id", "created_at"
        ]
    },
    "users": {
        "required_columns": [
            "id", "company_id", "name", "username", "division"
        ]
    }
}

print("=" * 80)
print("HEATMAP TABLES & COLUMNS CHECK")
print("=" * 80)
print()

missing_tables = []
missing_columns = {}
all_ok = True

# Check each table
for table_name, schema in required_schema.items():
    print(f"Checking table: {table_name}")
    
    # Check if table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
    """, (table_name,))
    
    if not cursor.fetchone():
        print(f"  [ERROR] Table '{table_name}' does NOT exist!")
        missing_tables.append(table_name)
        all_ok = False
        print()
        continue
    
    # Get existing columns
    cursor.execute(f"PRAGMA table_info({table_name})")
    existing_columns = {row[1] for row in cursor.fetchall()}
    
    # Check required columns
    required_cols = schema.get("required_columns", [])
    missing_cols = [col for col in required_cols if col not in existing_columns]
    
    if missing_cols:
        print(f"  [WARNING] Missing columns: {', '.join(missing_cols)}")
        missing_columns[table_name] = missing_cols
        all_ok = False
    else:
        print(f"  [OK] All required columns exist")
    
    # Check optional columns
    optional_cols = schema.get("optional_columns", [])
    if optional_cols:
        missing_optional = [col for col in optional_cols if col not in existing_columns]
        if missing_optional:
            print(f"  [INFO] Optional columns missing: {', '.join(missing_optional)}")
    
    # Show all columns for reference
    print(f"  Columns: {', '.join(sorted(existing_columns))}")
    print()

conn.close()

# Summary
print("=" * 80)
print("SUMMARY")
print("=" * 80)

if all_ok:
    print("[SUCCESS] All required tables and columns exist!")
else:
    print("[ERROR] Issues found:")
    
    if missing_tables:
        print(f"\n  Missing tables ({len(missing_tables)}):")
        for table in missing_tables:
            print(f"    - {table}")
    
    if missing_columns:
        print(f"\n  Missing columns:")
        for table, cols in missing_columns.items():
            print(f"    - {table}: {', '.join(cols)}")
    
    print("\n[TIP] To fix missing columns, you may need to:")
    print("   1. Run database migrations")
    print("   2. Create manual SQL scripts to add columns")
    print("   3. Check if models match database schema")

print()

