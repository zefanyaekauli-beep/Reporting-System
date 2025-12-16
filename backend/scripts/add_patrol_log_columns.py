#!/usr/bin/env python3
"""
Add missing columns to security_patrol_logs table.
Run: python scripts/add_patrol_log_columns.py
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'verolux_test.db')

def column_exists(cursor, table_name, column_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    return any(col[1] == column_name for col in cursor.fetchall())

def add_missing_patrol_log_columns():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    table_name = "security_patrol_logs"
    
    columns_to_add = [
        ('patrol_type', 'VARCHAR(32)'),
        ('distance_covered', 'REAL'),
        ('steps_count', 'INTEGER'),
        ('route_id', 'INTEGER'),
        ('team_id', 'INTEGER'),
        ('gps_track_id', 'INTEGER'),
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
    
    # Create indexes for foreign keys
    indexes_to_add = [
        ('ix_security_patrol_logs_route_id', 'route_id'),
        ('ix_security_patrol_logs_team_id', 'team_id'),
        ('ix_security_patrol_logs_gps_track_id', 'gps_track_id'),
    ]
    
    print("\nCreating indexes...")
    for index_name, col_name in indexes_to_add:
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='index' AND name='{index_name}'")
        if not cursor.fetchone():
            print(f"  [+] Creating index '{index_name}'...")
            try:
                cursor.execute(f"CREATE INDEX {index_name} ON {table_name} ({col_name})")
                print(f"    [OK] Index '{index_name}' created")
                conn.commit()
            except Exception as e:
                print(f"    [FAIL] Error creating index '{index_name}': {e}")
                conn.rollback()
        else:
            print(f"  [OK] Index '{index_name}' already exists")

    print("\n[OK] Migration completed successfully!")
    conn.close()
    print("Done!")

if __name__ == "__main__":
    add_missing_patrol_log_columns()

