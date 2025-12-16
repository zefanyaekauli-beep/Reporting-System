#!/usr/bin/env python3
"""
Script to add missing columns to security_reports table.
This fixes the OperationalError: no such column: security_reports.incident_category
"""
import sqlite3
import os
import sys

# Get database path
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'verolux_test.db')

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    sys.exit(1)

print(f"Connecting to database: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check existing columns
cursor.execute("PRAGMA table_info(security_reports)")
columns = {row[1]: row for row in cursor.fetchall()}

# Columns to add
columns_to_add = [
    ("incident_category", "TEXT"),
    ("incident_level", "TEXT"),
    ("incident_severity_score", "INTEGER"),
    ("incident_details", "TEXT"),
    ("perpetrator_name", "TEXT"),
    ("perpetrator_type", "TEXT"),
    ("perpetrator_details", "TEXT"),
    ("reported_at", "DATETIME"),
]

print("\nChecking and adding missing columns...")

for col_name, col_type in columns_to_add:
    if col_name in columns:
        print(f"  [OK] Column '{col_name}' already exists")
    else:
        print(f"  [+] Adding column '{col_name}' ({col_type})...")
        try:
            cursor.execute(f"ALTER TABLE security_reports ADD COLUMN {col_name} {col_type}")
            print(f"    [OK] Column '{col_name}' added successfully")
        except Exception as e:
            print(f"    [ERROR] Error adding column '{col_name}': {e}")
            conn.rollback()
            sys.exit(1)

# Create indexes for frequently queried columns
indexes_to_create = [
    ("ix_security_reports_incident_category", "security_reports", "incident_category"),
    ("ix_security_reports_incident_level", "security_reports", "incident_level"),
    ("ix_security_reports_reported_at", "security_reports", "reported_at"),
]

print("\nCreating indexes...")
for index_name, table_name, column_name in indexes_to_create:
    try:
        cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({column_name})")
        print(f"  [OK] Index '{index_name}' created")
    except Exception as e:
        print(f"  [ERROR] Error creating index '{index_name}': {e}")

conn.commit()
print("\n[OK] Migration completed successfully!")

conn.close()
print("Done!")

