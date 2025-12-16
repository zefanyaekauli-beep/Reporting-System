#!/usr/bin/env python3
"""
Script to add role_id column to users table.
This fixes the OperationalError: no such column: users.role_id
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

# Check if column already exists
cursor.execute("PRAGMA table_info(users)")
columns = [row[1] for row in cursor.fetchall()]

if 'role_id' in columns:
    print("Column 'role_id' already exists in users table")
else:
    print("Adding 'role_id' column to users table...")
    try:
        # Add role_id column (nullable, no foreign key constraint for now)
        cursor.execute("ALTER TABLE users ADD COLUMN role_id INTEGER")
        print("Column 'role_id' added successfully")
        
        # Create index
        try:
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_role_id ON users(role_id)")
            print("Index 'ix_users_role_id' created successfully")
        except Exception as e:
            print(f"Warning: Could not create index: {e}")
        
        conn.commit()
        print("Migration completed successfully!")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        sys.exit(1)

conn.close()
print("Done!")

