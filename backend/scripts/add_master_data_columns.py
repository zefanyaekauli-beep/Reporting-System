#!/usr/bin/env python3
"""
Script to add missing columns to master_data table (division, updated_by).
Run: python scripts/add_master_data_columns.py
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

def add_missing_columns():
    table_name = "master_data"
    
    columns_to_add = [
        ('division', 'VARCHAR(32)'),
        ('updated_by', 'INTEGER'),
    ]
    
    print(f"\nChecking and adding missing columns to '{table_name}' table...")
    for col_name, col_type in columns_to_add:
        if not column_exists(cursor, table_name, col_name):
            print(f"  [+] Adding column '{col_name}' ({col_type})...")
            try:
                if col_name == 'updated_by':
                    cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type} REFERENCES users(id)")
                else:
                    cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}")
                print(f"    [OK] Column '{col_name}' added successfully")
                conn.commit()
            except Exception as e:
                print(f"    [FAIL] Error adding column '{col_name}': {e}")
                conn.rollback()
        else:
            print(f"  [OK] Column '{col_name}' already exists")
    
    # Create index for division if it doesn't exist
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_master_data_division ON master_data(division)")
        print("  [OK] Index for 'division' created or already exists")
        conn.commit()
    except Exception as e:
        print(f"  [WARN] Could not create index for 'division': {e}")

try:
    add_missing_columns()
    print("\nAll columns checked and added successfully!")
    
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

