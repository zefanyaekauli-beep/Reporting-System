#!/usr/bin/env python3
"""
Script to add patrol_targets and patrol_teams tables to the database.
Run: python scripts/add_patrol_targets_and_teams_tables.py
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import sqlite3
from pathlib import Path

# Database path
db_path = Path(__file__).parent.parent / "verolux_test.db"

if not db_path.exists():
    print(f"Database not found at {db_path}")
    sys.exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

try:
    # Check if patrol_targets table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='patrol_targets'")
    if cursor.fetchone():
        print("Table 'patrol_targets' already exists. Skipping creation.")
    else:
        print("Creating 'patrol_targets' table...")
        cursor.execute("""
            CREATE TABLE patrol_targets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                site_id INTEGER NOT NULL,
                zone_id INTEGER,
                route_id INTEGER,
                target_date DATE NOT NULL,
                target_checkpoints INTEGER NOT NULL DEFAULT 0,
                target_duration_minutes INTEGER,
                target_patrols INTEGER NOT NULL DEFAULT 1,
                completed_checkpoints INTEGER NOT NULL DEFAULT 0,
                actual_duration_minutes INTEGER,
                completed_patrols INTEGER NOT NULL DEFAULT 0,
                completion_percentage REAL NOT NULL DEFAULT 0.0,
                missed_checkpoints INTEGER NOT NULL DEFAULT 0,
                status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
                notes VARCHAR(512),
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY (company_id) REFERENCES companies(id),
                FOREIGN KEY (site_id) REFERENCES sites(id),
                FOREIGN KEY (zone_id) REFERENCES cleaning_zones(id),
                FOREIGN KEY (route_id) REFERENCES patrol_routes(id)
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX idx_patrol_targets_company_id ON patrol_targets(company_id)")
        cursor.execute("CREATE INDEX idx_patrol_targets_site_id ON patrol_targets(site_id)")
        cursor.execute("CREATE INDEX idx_patrol_targets_zone_id ON patrol_targets(zone_id)")
        cursor.execute("CREATE INDEX idx_patrol_targets_route_id ON patrol_targets(route_id)")
        cursor.execute("CREATE INDEX idx_patrol_targets_target_date ON patrol_targets(target_date)")
        cursor.execute("CREATE INDEX idx_patrol_targets_status ON patrol_targets(status)")
        
        print("Table 'patrol_targets' created successfully with indexes.")
    
    # Check if patrol_teams table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='patrol_teams'")
    if cursor.fetchone():
        print("Table 'patrol_teams' already exists. Skipping creation.")
    else:
        print("Creating 'patrol_teams' table...")
        cursor.execute("""
            CREATE TABLE patrol_teams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                site_id INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                division VARCHAR(32) NOT NULL,
                team_members TEXT NOT NULL,
                assigned_routes TEXT,
                team_leader_id INTEGER,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                description TEXT,
                notes TEXT,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY (company_id) REFERENCES companies(id),
                FOREIGN KEY (site_id) REFERENCES sites(id),
                FOREIGN KEY (team_leader_id) REFERENCES users(id)
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX idx_patrol_teams_company_id ON patrol_teams(company_id)")
        cursor.execute("CREATE INDEX idx_patrol_teams_site_id ON patrol_teams(site_id)")
        cursor.execute("CREATE INDEX idx_patrol_teams_division ON patrol_teams(division)")
        cursor.execute("CREATE INDEX idx_patrol_teams_is_active ON patrol_teams(is_active)")
        cursor.execute("CREATE INDEX idx_patrol_teams_team_leader_id ON patrol_teams(team_leader_id)")
        
        print("Table 'patrol_teams' created successfully with indexes.")
    
    conn.commit()
    print("\nAll tables and indexes created successfully!")
    
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
    conn.rollback()
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
    sys.exit(1)
finally:
    conn.close()

