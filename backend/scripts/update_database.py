#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to update database schema for cleaning reports.
This script ensures all required columns exist and are properly configured.
"""

import sqlite3
import os
import sys

def update_database(db_path: str):
    """Update database schema for cleaning reports."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("=" * 60)
        print("DATABASE UPDATE SCRIPT")
        print("=" * 60)
        
        # 1. Check and fix cleaning_zones table
        print("\n[1] Checking cleaning_zones table...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cleaning_zones'")
        if cursor.fetchone():
            cursor.execute("PRAGMA table_info(cleaning_zones)")
            columns = {row[1]: row for row in cursor.fetchall()}
            
            if 'division' not in columns:
                print("  -> Adding 'division' column...")
                cursor.execute("ALTER TABLE cleaning_zones ADD COLUMN division VARCHAR(32) DEFAULT 'CLEANING'")
                cursor.execute("UPDATE cleaning_zones SET division = 'CLEANING' WHERE division IS NULL")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_cleaning_zones_division ON cleaning_zones(division)")
                print("  [OK] Added 'division' column")
            else:
                cursor.execute("UPDATE cleaning_zones SET division = 'CLEANING' WHERE division IS NULL")
                print("  [OK] 'division' column exists, updated NULL values")
        else:
            print("  [WARNING] Table 'cleaning_zones' does not exist")
        
        # 2. Check and fix security_reports table
        print("\n[2] Checking security_reports table...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='security_reports'")
        if cursor.fetchone():
            cursor.execute("PRAGMA table_info(security_reports)")
            columns = {row[1]: row for row in cursor.fetchall()}
            
            # Check division column
            if 'division' not in columns:
                print("  -> Adding 'division' column...")
                cursor.execute("ALTER TABLE security_reports ADD COLUMN division VARCHAR(32) DEFAULT 'SECURITY'")
                cursor.execute("UPDATE security_reports SET division = 'SECURITY' WHERE division IS NULL")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_security_reports_division ON security_reports(division)")
                print("  [OK] Added 'division' column")
            else:
                print("  [OK] 'division' column exists")
            
            # Check zone_id column
            if 'zone_id' not in columns:
                print("  -> Adding 'zone_id' column...")
                cursor.execute("ALTER TABLE security_reports ADD COLUMN zone_id INTEGER")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_security_reports_zone_id ON security_reports(zone_id)")
                print("  [OK] Added 'zone_id' column")
            else:
                print("  [OK] 'zone_id' column exists")
        else:
            print("  [WARNING] Table 'security_reports' does not exist")
        
        # 3. Verify indexes
        print("\n[3] Verifying indexes...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'ix_%division%'")
        indexes = [row[0] for row in cursor.fetchall()]
        print(f"  Found {len(indexes)} division-related indexes: {indexes}")
        
        # 4. Show statistics
        print("\n[4] Database Statistics:")
        try:
            cursor.execute("SELECT COUNT(*) FROM cleaning_zones")
            zone_count = cursor.fetchone()[0]
            print(f"  cleaning_zones: {zone_count} rows")
            
            cursor.execute("SELECT COUNT(*) FROM cleaning_zones WHERE division = 'CLEANING'")
            cleaning_zone_count = cursor.fetchone()[0]
            print(f"  cleaning_zones (CLEANING): {cleaning_zone_count} rows")
        except:
            print("  Could not get cleaning_zones statistics")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM security_reports")
            report_count = cursor.fetchone()[0]
            print(f"  security_reports: {report_count} rows")
            
            cursor.execute("SELECT COUNT(*) FROM security_reports WHERE division = 'CLEANING'")
            cleaning_report_count = cursor.fetchone()[0]
            print(f"  security_reports (CLEANING): {cleaning_report_count} rows")
        except:
            print("  Could not get security_reports statistics")
        
        conn.commit()
        print("\n" + "=" * 60)
        print("[SUCCESS] Database update completed!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Database update failed: {e}")
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
        print("Please ensure verolux_test.db exists in one of these locations:")
        for path in db_paths:
            print(f"  - {path}")
        return 1
    
    print(f"Using database: {os.path.abspath(db_path)}\n")
    
    success = update_database(db_path)
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())

