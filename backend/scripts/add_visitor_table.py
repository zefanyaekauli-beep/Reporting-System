# backend/scripts/add_visitor_table.py
# Script to manually add visitors table to SQLite database

import sqlite3
import os
from pathlib import Path

# Get database path
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = os.path.join(BASE_DIR, "verolux_test.db")

def add_visitor_table():
    """Add visitors table to SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='visitors'
        """)
        
        if cursor.fetchone():
            print("Table 'visitors' already exists. Skipping creation.")
            return
        
        # Create visitors table
        cursor.execute("""
            CREATE TABLE visitors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                site_id INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                company VARCHAR(255),
                id_card_number VARCHAR(64),
                id_card_type VARCHAR(32),
                phone VARCHAR(32),
                email VARCHAR(255),
                purpose VARCHAR(255),
                category VARCHAR(64),
                visit_date DATETIME NOT NULL,
                expected_duration_minutes INTEGER,
                check_in_time DATETIME,
                check_out_time DATETIME,
                is_checked_in BOOLEAN NOT NULL DEFAULT 0,
                host_user_id INTEGER,
                host_name VARCHAR(255),
                security_user_id INTEGER,
                badge_number VARCHAR(32),
                photo_path VARCHAR(512),
                id_card_photo_path VARCHAR(512),
                status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED',
                notes TEXT,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY (company_id) REFERENCES companies(id),
                FOREIGN KEY (site_id) REFERENCES sites(id),
                FOREIGN KEY (host_user_id) REFERENCES users(id),
                FOREIGN KEY (security_user_id) REFERENCES users(id)
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX idx_visitors_company_id ON visitors(company_id)")
        cursor.execute("CREATE INDEX idx_visitors_site_id ON visitors(site_id)")
        cursor.execute("CREATE INDEX idx_visitors_category ON visitors(category)")
        cursor.execute("CREATE INDEX idx_visitors_visit_date ON visitors(visit_date)")
        cursor.execute("CREATE INDEX idx_visitors_check_in_time ON visitors(check_in_time)")
        cursor.execute("CREATE INDEX idx_visitors_check_out_time ON visitors(check_out_time)")
        cursor.execute("CREATE INDEX idx_visitors_is_checked_in ON visitors(is_checked_in)")
        cursor.execute("CREATE INDEX idx_visitors_status ON visitors(status)")
        
        conn.commit()
        print("[OK] Successfully created 'visitors' table with indexes")
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Error creating visitors table: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("Adding visitors table to database...")
    add_visitor_table()
    print("Done!")

