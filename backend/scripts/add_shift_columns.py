#!/usr/bin/env python3
"""
Script to add missing columns to shifts table for Phase 5 (Shift & Overtime Calculation).
Run: python scripts/add_shift_columns.py
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import sqlite3
from pathlib import Path

# Database path
db_path = Path(__file__).parent.parent / "verolux_test.db"

if not db_path.exists():
    print(f"Database not found at {db_path}")
    sys.exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

def column_exists(cursor, table_name, column_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    return any(col[1] == column_name for col in cursor.fetchall())

def add_missing_shift_columns():
    table_name = "shifts"
    
    columns_to_add = [
        ('scheduled_start_time', 'DATETIME'),
        ('scheduled_end_time', 'DATETIME'),
        ('actual_start_time', 'DATETIME'),
        ('actual_end_time', 'DATETIME'),
        ('overtime_hours', 'INTEGER'),
        ('break_duration_minutes', 'INTEGER'),
        ('shift_category', 'VARCHAR(32)'),
    ]
    
    print(f"\nChecking and adding missing columns to '{table_name}' table...")
    for col_name, col_type in columns_to_add:
        if not column_exists(cursor, table_name, col_name):
            print(f"  [+] Adding column '{col_name}' ({col_type})...")
            try:
                cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}")
                print(f"    [OK] Column '{col_name}' added successfully")
                conn.commit()
            except Exception as e:
                print(f"    [FAIL] Error adding column '{col_name}': {e}")
                conn.rollback()
        else:
            print(f"  [OK] Column '{col_name}' already exists")
    
    # Create indexes if needed
    indexes_to_add = [
        ('idx_shifts_scheduled_start_time', 'scheduled_start_time'),
        ('idx_shifts_scheduled_end_time', 'scheduled_end_time'),
        ('idx_shifts_actual_start_time', 'actual_start_time'),
        ('idx_shifts_actual_end_time', 'actual_end_time'),
        ('idx_shifts_shift_category', 'shift_category'),
    ]
    
    print(f"\nChecking and creating indexes for '{table_name}' table...")
    for index_name, column_name in indexes_to_add:
        try:
            cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({column_name})")
            print(f"  [OK] Index '{index_name}' created or already exists")
            conn.commit()
        except Exception as e:
            print(f"  [WARN] Could not create index '{index_name}': {e}")

try:
    add_missing_shift_columns()
    print("\nAll columns and indexes checked and added successfully!")
    
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
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

