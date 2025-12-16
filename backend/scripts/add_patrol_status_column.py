#!/usr/bin/env python3
"""
Script to add status column to security_patrol_logs table if it doesn't exist.
Run: python backend/scripts/add_patrol_status_column.py
Or: cd backend && python scripts/add_patrol_status_column.py
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
    # Add status column to security_patrol_logs table
    print("\n=== Adding 'status' column to 'security_patrol_logs' table ===")
    # SQLite doesn't support ENUM directly, so we'll use VARCHAR
    # The application layer will handle enum conversion
    add_column_if_not_exists(cursor, "security_patrol_logs", "status", "VARCHAR(32) DEFAULT 'partial'")
    
    # Update existing rows to have default status
    cursor.execute("UPDATE security_patrol_logs SET status = 'partial' WHERE status IS NULL")
    cursor.execute("UPDATE security_patrol_logs SET status = 'completed' WHERE end_time IS NOT NULL AND status = 'partial'")
    
    conn.commit()
    print("\nStatus column added successfully!")
    
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

