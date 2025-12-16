#!/usr/bin/env python3
"""
Add 'name' column to users table if it doesn't exist.
"""

import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "verolux_test.db")

if not os.path.exists(DB_PATH):
    print(f"Database not found at: {DB_PATH}")
    exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    # Check if column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'name' not in columns:
        print("Adding 'name' column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN name TEXT")
        conn.commit()
        print("[SUCCESS] Column 'name' added to users table")
    else:
        print("[INFO] Column 'name' already exists in users table")
        
    # Update existing users: set name = username if name is NULL
    cursor.execute("UPDATE users SET name = username WHERE name IS NULL OR name = ''")
    conn.commit()
    updated = cursor.rowcount
    if updated > 0:
        print(f"[SUCCESS] Updated {updated} users: set name = username")
    
except Exception as e:
    print(f"[ERROR] Failed to add column: {e}")
    conn.rollback()
finally:
    conn.close()

print("\nDone!")

