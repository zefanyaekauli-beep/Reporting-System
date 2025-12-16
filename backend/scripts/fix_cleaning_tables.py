#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to fix cleaning_zones and security_reports tables.
Adds missing columns if they don't exist.
"""

import sqlite3
import os
import sys

def check_and_fix_cleaning_zones(db_path: str):
    """Check and fix cleaning_zones table."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cleaning_zones'")
        if not cursor.fetchone():
            print("Table 'cleaning_zones' does not exist. Please run migrations first.")
            return False
        
        # Get current columns
        cursor.execute("PRAGMA table_info(cleaning_zones)")
        columns = {row[1]: row for row in cursor.fetchall()}
        
        print(f"Current columns in cleaning_zones: {list(columns.keys())}")
        
        # Check and add division column if missing
        if 'division' not in columns:
            print("Adding 'division' column to cleaning_zones...")
            try:
                cursor.execute("ALTER TABLE cleaning_zones ADD COLUMN division VARCHAR(32) DEFAULT 'CLEANING'")
                cursor.execute("UPDATE cleaning_zones SET division = 'CLEANING' WHERE division IS NULL")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_cleaning_zones_division ON cleaning_zones(division)")
                print("[OK] Added 'division' column")
            except sqlite3.OperationalError as e:
                if "duplicate column" in str(e).lower():
                    print("[OK] 'division' column already exists (duplicate error)")
                else:
                    raise
        else:
            # Update existing NULL values
            cursor.execute("UPDATE cleaning_zones SET division = 'CLEANING' WHERE division IS NULL")
            print("[OK] 'division' column already exists, updated NULL values")
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Error fixing cleaning_zones: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def check_and_fix_security_reports(db_path: str):
    """Check and fix security_reports table."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='security_reports'")
        if not cursor.fetchone():
            print("Table 'security_reports' does not exist. Please run migrations first.")
            return False
        
        # Get current columns
        cursor.execute("PRAGMA table_info(security_reports)")
        columns = {row[1]: row for row in cursor.fetchall()}
        
        print(f"Current columns in security_reports: {list(columns.keys())}")
        
        # Check and add division column if missing
        if 'division' not in columns:
            print("Adding 'division' column to security_reports...")
            try:
                cursor.execute("ALTER TABLE security_reports ADD COLUMN division VARCHAR(32) DEFAULT 'SECURITY'")
                cursor.execute("UPDATE security_reports SET division = 'SECURITY' WHERE division IS NULL")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_security_reports_division ON security_reports(division)")
                print("[OK] Added 'division' column")
            except sqlite3.OperationalError as e:
                if "duplicate column" in str(e).lower():
                    print("[OK] 'division' column already exists (duplicate error)")
                else:
                    raise
        else:
            print("[OK] 'division' column already exists")
        
        # Check and add zone_id column if missing
        if 'zone_id' not in columns:
            print("Adding 'zone_id' column to security_reports...")
            try:
                cursor.execute("ALTER TABLE security_reports ADD COLUMN zone_id INTEGER")
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_security_reports_zone_id ON security_reports(zone_id)")
                print("[OK] Added 'zone_id' column")
            except sqlite3.OperationalError as e:
                if "duplicate column" in str(e).lower():
                    print("[OK] 'zone_id' column already exists (duplicate error)")
                else:
                    raise
        else:
            print("[OK] 'zone_id' column already exists")
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Error fixing security_reports: {e}")
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
        print("Database file not found. Please specify the path.")
        return
    
    print(f"Using database: {db_path}")
    print("=" * 50)
    
    print("\n1. Fixing cleaning_zones table...")
    check_and_fix_cleaning_zones(db_path)
    
    print("\n2. Fixing security_reports table...")
    check_and_fix_security_reports(db_path)
    
    print("\n" + "=" * 50)
    print("Done!")

if __name__ == "__main__":
    main()
