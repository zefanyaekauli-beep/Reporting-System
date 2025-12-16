#!/usr/bin/env python3
"""
Add missing columns to shift_handovers table.
Run: python scripts/add_shift_handover_columns.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'verolux_test.db')

def column_exists(cursor, table_name, column_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    return any(col[1] == column_name for col in cursor.fetchall())

def add_missing_shift_handover_columns():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    table_name = "shift_handovers"
    
    columns_to_add = [
        ('handover_type', 'VARCHAR(32)'),
        ('priority_items', 'TEXT'),  # JSON stored as TEXT in SQLite
        ('pending_tasks', 'TEXT'),  # JSON stored as TEXT in SQLite
    ]

    print("\nChecking and adding missing columns...")
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

    print("\n[OK] Migration completed successfully!")
    conn.close()
    print("Done!")

if __name__ == "__main__":
    add_missing_shift_handover_columns()

