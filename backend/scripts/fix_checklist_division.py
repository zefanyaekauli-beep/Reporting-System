#!/usr/bin/env python3
"""
Quick script to add division column to checklist_templates table.
Run this from the backend directory with: python scripts/fix_checklist_division.py
"""

import sqlite3
import os
import sys
from pathlib import Path

# Try to find the database file
db_paths = [
    Path(__file__).parent.parent / "verolux_test.db",
    Path(__file__).parent.parent.parent / "verolux_test.db",
    Path.cwd() / "verolux_test.db",
]

db_path = None
for path in db_paths:
    if path.exists():
        db_path = path
        break

if not db_path:
    print("Error: Could not find database file (verolux_test.db)")
    print("Please specify the database path:")
    db_path = input("Database path: ").strip()
    if not os.path.exists(db_path):
        print(f"Error: File not found: {db_path}")
        sys.exit(1)

print(f"Using database: {db_path}")

try:
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(checklist_templates)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'division' in columns:
        print("[OK] Column 'division' already exists in checklist_templates table")
        print("  No changes needed. The database is already up to date.")
        
        # Verify that existing rows have division set
        cursor.execute("SELECT COUNT(*) FROM checklist_templates WHERE division IS NULL")
        null_count = cursor.fetchone()[0]
        if null_count > 0:
            print(f"  [WARNING] Found {null_count} rows with NULL division. Updating...")
            cursor.execute("UPDATE checklist_templates SET division = 'SECURITY' WHERE division IS NULL")
            conn.commit()
            print("  [OK] Updated NULL values to 'SECURITY'")
    else:
        print("Adding 'division' column to checklist_templates table...")
        
        # Add column (nullable first)
        cursor.execute("ALTER TABLE checklist_templates ADD COLUMN division VARCHAR(32)")
        
        # Update existing rows
        cursor.execute("UPDATE checklist_templates SET division = 'SECURITY' WHERE division IS NULL")
        
        # Create index
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_checklist_templates_division ON checklist_templates(division)")
        
        conn.commit()
        print("[OK] Successfully added 'division' column to checklist_templates table")
    
    # Verify
    cursor.execute("PRAGMA table_info(checklist_templates)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"\nCurrent columns in checklist_templates: {', '.join(columns)}")
    
    conn.close()
    print("\n[OK] Database update completed successfully!")
    
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

