#!/usr/bin/env python3
"""
Diagnostic script to check the schema of checklist_templates table.
Run this to see what columns actually exist in the database.
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

print(f"Using database: {db_path}\n")

try:
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='checklist_templates'")
    if not cursor.fetchone():
        print("[ERROR] Table 'checklist_templates' does not exist!")
        sys.exit(1)
    
    print("[OK] Table 'checklist_templates' exists\n")
    
    # Get column information
    cursor.execute("PRAGMA table_info(checklist_templates)")
    columns = cursor.fetchall()
    
    print("Columns in checklist_templates table:")
    print("-" * 60)
    print(f"{'Name':<20} {'Type':<15} {'NotNull':<10} {'Default':<15}")
    print("-" * 60)
    
    column_names = []
    for col in columns:
        cid, name, col_type, notnull, default, pk = col
        column_names.append(name)
        notnull_str = "YES" if notnull else "NO"
        default_str = str(default) if default else "NULL"
        print(f"{name:<20} {col_type:<15} {notnull_str:<10} {default_str:<15}")
    
    print("-" * 60)
    print(f"\nTotal columns: {len(column_names)}")
    print(f"Column names: {', '.join(column_names)}")
    
    # Check specifically for division column
    if 'division' in column_names:
        print("\n[OK] Column 'division' EXISTS")
        
        # Check for NULL values
        cursor.execute("SELECT COUNT(*) FROM checklist_templates WHERE division IS NULL")
        null_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM checklist_templates")
        total_count = cursor.fetchone()[0]
        
        print(f"  Total rows: {total_count}")
        print(f"  Rows with NULL division: {null_count}")
        
        if null_count > 0:
            print(f"  [WARNING] {null_count} rows have NULL division values")
    else:
        print("\n[ERROR] Column 'division' DOES NOT EXIST")
        print("  This is the problem! The column needs to be added.")
    
    # Check indexes
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='checklist_templates'")
    indexes = [row[0] for row in cursor.fetchall()]
    print(f"\nIndexes on checklist_templates: {', '.join(indexes) if indexes else 'None'}")
    
    if 'ix_checklist_templates_division' in indexes:
        print("[OK] Index 'ix_checklist_templates_division' exists")
    else:
        print("[WARNING] Index 'ix_checklist_templates_division' does not exist")
    
    # Sample data
    cursor.execute("SELECT COUNT(*) FROM checklist_templates")
    count = cursor.fetchone()[0]
    print(f"\nTotal rows in table: {count}")
    
    if count > 0:
        cursor.execute("SELECT * FROM checklist_templates LIMIT 1")
        sample = cursor.fetchone()
        if sample:
            print("\nSample row (first row):")
            for i, col_name in enumerate(column_names):
                print(f"  {col_name}: {sample[i]}")
    
    conn.close()
    
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

