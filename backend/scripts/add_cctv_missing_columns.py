#!/usr/bin/env python3
"""
Script to add missing columns to cctv_cameras table.
Run: python backend/scripts/add_cctv_missing_columns.py
Or: cd backend && python scripts/add_cctv_missing_columns.py
"""

import sys
import os
from pathlib import Path

# Get the backend directory (parent of scripts)
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Change to backend directory
os.chdir(backend_dir)

import sqlite3

# Database path
db_path = Path(__file__).parent.parent / "verolux_test.db"

if not db_path.exists():
    print(f"Database not found at {db_path}")
    sys.exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

def column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table."""
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [row[1] for row in cursor.fetchall()]
    return column_name in columns

def add_column_if_not_exists(cursor, table_name, column_name, column_definition):
    """Add a column to a table if it doesn't exist."""
    if column_exists(cursor, table_name, column_name):
        print(f"Column '{table_name}.{column_name}' already exists. Skipping.")
        return False
    
    print(f"Adding column '{table_name}.{column_name}'...")
    try:
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}")
        print(f"Column '{table_name}.{column_name}' added successfully.")
        return True
    except sqlite3.OperationalError as e:
        print(f"Error adding column '{table_name}.{column_name}': {e}")
        return False

try:
    # Add missing columns to cctv_cameras table
    print("\n=== Adding missing columns to 'cctv_cameras' table ===")
    add_column_if_not_exists(cursor, "cctv_cameras", "camera_type", "VARCHAR(32)")
    add_column_if_not_exists(cursor, "cctv_cameras", "brand", "VARCHAR(128)")
    add_column_if_not_exists(cursor, "cctv_cameras", "model", "VARCHAR(128)")
    add_column_if_not_exists(cursor, "cctv_cameras", "resolution", "VARCHAR(32)")
    add_column_if_not_exists(cursor, "cctv_cameras", "username", "VARCHAR(128)")
    add_column_if_not_exists(cursor, "cctv_cameras", "password", "VARCHAR(128)")
    add_column_if_not_exists(cursor, "cctv_cameras", "is_recording", "BOOLEAN NOT NULL DEFAULT 0")
    add_column_if_not_exists(cursor, "cctv_cameras", "notes", "TEXT")
    
    # Update existing rows to have default values
    cursor.execute("UPDATE cctv_cameras SET is_recording = 0 WHERE is_recording IS NULL")
    
    conn.commit()
    print("\nAll missing columns added successfully!")
    
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
    import traceback
    traceback.print_exc()
    conn.rollback()
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    conn.rollback()
    sys.exit(1)
finally:
    conn.close()

