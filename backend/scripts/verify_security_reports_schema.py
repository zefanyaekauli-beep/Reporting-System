#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verify and fix security_reports table schema.
Ensures all required columns exist for cleaning reports.
"""

import sqlite3
import os
import sys

def verify_and_fix_security_reports(db_path: str):
    """Verify and fix security_reports table schema."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("=" * 60)
        print("VERIFYING security_reports TABLE SCHEMA")
        print("=" * 60)
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='security_reports'")
        if not cursor.fetchone():
            print("[ERROR] Table 'security_reports' does not exist!")
            return False
        
        # Get current columns
        cursor.execute("PRAGMA table_info(security_reports)")
        columns = {row[1]: row for row in cursor.fetchall()}
        
        print(f"\nCurrent columns: {list(columns.keys())}")
        
        # Required columns for cleaning reports
        required_columns = {
            'id': 'INTEGER PRIMARY KEY',
            'company_id': 'INTEGER NOT NULL',
            'site_id': 'INTEGER NOT NULL',
            'user_id': 'INTEGER NOT NULL',
            'division': 'VARCHAR(32) NOT NULL DEFAULT "SECURITY"',
            'report_type': 'VARCHAR(32) NOT NULL',
            'location_id': 'INTEGER',
            'location_text': 'VARCHAR(255)',
            'title': 'VARCHAR(255) NOT NULL',
            'description': 'TEXT',
            'severity': 'VARCHAR(16)',
            'status': 'VARCHAR(32) NOT NULL DEFAULT "open"',
            'evidence_paths': 'TEXT',
            'zone_id': 'INTEGER',
            'vehicle_id': 'INTEGER',
            'trip_id': 'INTEGER',
            'checklist_id': 'INTEGER',
            'created_at': 'DATETIME NOT NULL',
            'updated_at': 'DATETIME NOT NULL',
        }
        
        missing_columns = []
        for col_name, col_type in required_columns.items():
            if col_name not in columns:
                missing_columns.append((col_name, col_type))
                print(f"  [MISSING] {col_name} ({col_type})")
        
        if missing_columns:
            print(f"\n[FIXING] Adding {len(missing_columns)} missing columns...")
            for col_name, col_type in missing_columns:
                try:
                    # For SQLite, we can only add columns with ALTER TABLE
                    # Remove constraints that SQLite doesn't support in ALTER TABLE
                    simple_type = col_type.split(' NOT NULL')[0].split(' DEFAULT')[0].split(' PRIMARY KEY')[0]
                    if 'PRIMARY KEY' in col_type:
                        print(f"  [SKIP] {col_name} - PRIMARY KEY cannot be added via ALTER TABLE")
                        continue
                    
                    alter_sql = f"ALTER TABLE security_reports ADD COLUMN {col_name} {simple_type}"
                    cursor.execute(alter_sql)
                    print(f"  [OK] Added {col_name}")
                except sqlite3.OperationalError as e:
                    if "duplicate column" in str(e).lower():
                        print(f"  [OK] {col_name} already exists (duplicate error)")
                    else:
                        print(f"  [ERROR] Failed to add {col_name}: {e}")
                        raise
        else:
            print("\n[OK] All required columns exist!")
        
        # Update NULL division values to SECURITY for existing rows
        cursor.execute("UPDATE security_reports SET division = 'SECURITY' WHERE division IS NULL")
        updated = cursor.rowcount
        if updated > 0:
            print(f"\n[OK] Updated {updated} rows with NULL division to 'SECURITY'")
        
        # Verify indexes
        print("\n[VERIFYING] Indexes...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='security_reports'")
        indexes = [row[0] for row in cursor.fetchall()]
        print(f"  Found {len(indexes)} indexes: {indexes}")
        
        # Create missing indexes
        required_indexes = {
            'ix_security_reports_division': 'division',
            'ix_security_reports_zone_id': 'zone_id',
            'ix_security_reports_company_id': 'company_id',
            'ix_security_reports_site_id': 'site_id',
            'ix_security_reports_user_id': 'user_id',
        }
        
        for idx_name, col_name in required_indexes.items():
            if idx_name not in indexes:
                try:
                    cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON security_reports({col_name})")
                    print(f"  [OK] Created index {idx_name}")
                except Exception as e:
                    print(f"  [WARNING] Could not create index {idx_name}: {e}")
        
        conn.commit()
        print("\n" + "=" * 60)
        print("[SUCCESS] Schema verification completed!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Schema verification failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def main():
    # Find database file
    db_paths = [
        "verolux_test.db",
        "backend/verolux_test.db",
        "../verolux_test.db",
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("ERROR: Database file not found.")
        return 1
    
    print(f"Using database: {os.path.abspath(db_path)}\n")
    
    success = verify_and_fix_security_reports(db_path)
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())

