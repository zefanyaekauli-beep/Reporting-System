#!/usr/bin/env python3
"""
Script to add division column to checklist_templates table if it doesn't exist.
This fixes the database schema issue where the column is missing.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import engine
from sqlalchemy import text, inspect

def add_division_column():
    """Add division column to checklist_templates if it doesn't exist."""
    inspector = inspect(engine)
    
    # Check if table exists
    if 'checklist_templates' not in inspector.get_table_names():
        print("Table 'checklist_templates' does not exist. Please run migrations first.")
        return False
    
    # Check if column exists
    columns = [col['name'] for col in inspector.get_columns('checklist_templates')]
    
    if 'division' in columns:
        print("Column 'division' already exists in 'checklist_templates' table.")
        return True
    
    # Add the column
    print("Adding 'division' column to 'checklist_templates' table...")
    with engine.connect() as conn:
        # For SQLite, we need to use ALTER TABLE
        # Set default value for existing rows
        conn.execute(text("""
            ALTER TABLE checklist_templates 
            ADD COLUMN division VARCHAR(32) NOT NULL DEFAULT 'SECURITY'
        """))
        
        # Create index
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_checklist_templates_division 
                ON checklist_templates(division)
            """))
        except Exception as e:
            print(f"Warning: Could not create index (might already exist): {e}")
        
        conn.commit()
        print("Successfully added 'division' column to 'checklist_templates' table.")
        return True

if __name__ == "__main__":
    try:
        success = add_division_column()
        if success:
            print("Database update completed successfully!")
        else:
            print("Database update failed or was not needed.")
            sys.exit(1)
    except Exception as e:
        print(f"Error updating database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

