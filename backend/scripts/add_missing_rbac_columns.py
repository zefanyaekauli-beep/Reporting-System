#!/usr/bin/env python3
"""
Script to add missing columns to roles and permissions tables.
Run: python backend/scripts/add_missing_rbac_columns.py
Or: cd backend && python scripts/add_missing_rbac_columns.py
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
    # Add missing columns to roles table
    print("\n=== Adding missing columns to 'roles' table ===")
    add_column_if_not_exists(cursor, "roles", "display_name", "VARCHAR(128)")
    add_column_if_not_exists(cursor, "roles", "is_active", "BOOLEAN NOT NULL DEFAULT 1")
    
    # Check if is_system_role exists, if so rename it to is_system
    if column_exists(cursor, "roles", "is_system_role"):
        if not column_exists(cursor, "roles", "is_system"):
            print("Renaming 'is_system_role' to 'is_system'...")
            # SQLite doesn't support RENAME COLUMN directly, so we need to recreate the table
            # For now, just add is_system column and copy data
            cursor.execute("ALTER TABLE roles ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT 0")
            cursor.execute("UPDATE roles SET is_system = is_system_role WHERE is_system_role IS NOT NULL")
            print("Column 'is_system' added and data copied from 'is_system_role'.")
        else:
            print("Column 'is_system' already exists.")
    else:
        add_column_if_not_exists(cursor, "roles", "is_system", "BOOLEAN NOT NULL DEFAULT 0")
    
    # Add missing columns to permissions table
    print("\n=== Adding missing columns to 'permissions' table ===")
    add_column_if_not_exists(cursor, "permissions", "is_active", "BOOLEAN NOT NULL DEFAULT 1")
    
    # Update existing rows to have is_active = 1
    cursor.execute("UPDATE roles SET is_active = 1 WHERE is_active IS NULL")
    cursor.execute("UPDATE permissions SET is_active = 1 WHERE is_active IS NULL")
    
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

