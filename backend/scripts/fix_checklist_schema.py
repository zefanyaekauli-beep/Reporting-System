#!/usr/bin/env python3
"""
Fix checklist table schema - add missing columns.
Run: python3 scripts/fix_checklist_schema.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from sqlalchemy import text

def fix_schema():
    db = SessionLocal()
    try:
        # Add context_type column if it doesn't exist
        try:
            db.execute(text("ALTER TABLE checklists ADD COLUMN context_type VARCHAR(32)"))
            db.commit()
            print("✓ Added context_type column")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("✓ context_type column already exists")
            else:
                print(f"  Warning: {e}")
                db.rollback()
        
        # Add context_id column if it doesn't exist
        try:
            db.execute(text("ALTER TABLE checklists ADD COLUMN context_id INTEGER"))
            db.commit()
            print("✓ Added context_id column")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("✓ context_id column already exists")
            else:
                print(f"  Warning: {e}")
                db.rollback()
        
        # Add KPI columns to checklist_items
        kpi_columns = [
            ("kpi_key", "VARCHAR(64)"),
            ("answer_type", "VARCHAR(16)"),
            ("answer_bool", "BOOLEAN"),
            ("answer_int", "INTEGER"),
            ("answer_text", "TEXT"),
            ("photo_id", "INTEGER"),
            ("gps_lat", "FLOAT"),
            ("gps_lng", "FLOAT"),
            ("gps_accuracy", "FLOAT"),
            ("mock_location", "BOOLEAN"),
        ]
        
        for col_name, col_type in kpi_columns:
            try:
                db.execute(text(f"ALTER TABLE checklist_items ADD COLUMN {col_name} {col_type}"))
                db.commit()
                print(f"✓ Added checklist_items.{col_name} column")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"✓ checklist_items.{col_name} column already exists")
                else:
                    print(f"  Warning: {e}")
                    db.rollback()
        
        print("\n✅ Schema fixed!")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    fix_schema()

