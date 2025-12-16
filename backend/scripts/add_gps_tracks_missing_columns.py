#!/usr/bin/env python3
"""
Script to add missing columns to gps_tracks table to match the GPSTrack model.
Run: python backend/scripts/add_gps_tracks_missing_columns.py
Or: cd backend && python scripts/add_gps_tracks_missing_columns.py
"""

import sys
import os
from pathlib import Path

# Get the backend directory (parent of scripts)
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Change to backend directory
os.chdir(backend_dir)

import sqlite3

# Database path
db_path = Path(__file__).parent.parent / "verolux_test.db"

if not db_path.exists():
    print(f"Database not found at {db_path}")
    sys.exit(1)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

def column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table."""
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [row[1] for row in cursor.fetchall()]
    return column_name in columns

def add_column_if_not_exists(cursor, table_name, column_name, column_definition):
    """Add a column to a table if it doesn't exist."""
    if column_exists(cursor, table_name, column_name):
        print(f"Column '{table_name}.{column_name}' already exists. Skipping.")
        return False
    
    print(f"Adding column '{table_name}.{column_name}'...")
    try:
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}")
        print(f"Column '{table_name}.{column_name}' added successfully.")
        return True
    except sqlite3.OperationalError as e:
        print(f"Error adding column '{table_name}.{column_name}': {e}")
        return False

def create_index_if_not_exists(cursor, index_name, table_name, column_name):
    """Create an index if it doesn't exist."""
    try:
        cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({column_name})")
        print(f"Index '{index_name}' created/verified.")
    except sqlite3.OperationalError as e:
        print(f"Error creating index '{index_name}': {e}")

try:
    # Add missing columns to gps_tracks table
    print("\n=== Adding missing columns to 'gps_tracks' table ===")
    
    # Track Context columns
    add_column_if_not_exists(cursor, "gps_tracks", "track_type", "VARCHAR(32) NOT NULL DEFAULT 'PATROL'")
    add_column_if_not_exists(cursor, "gps_tracks", "track_reference_id", "INTEGER")
    
    # GPS Coordinates columns
    add_column_if_not_exists(cursor, "gps_tracks", "latitude", "REAL NOT NULL DEFAULT 0")
    add_column_if_not_exists(cursor, "gps_tracks", "longitude", "REAL NOT NULL DEFAULT 0")
    add_column_if_not_exists(cursor, "gps_tracks", "altitude", "REAL")
    add_column_if_not_exists(cursor, "gps_tracks", "accuracy", "REAL")
    add_column_if_not_exists(cursor, "gps_tracks", "speed", "REAL")
    
    # Timestamp column
    add_column_if_not_exists(cursor, "gps_tracks", "recorded_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")
    
    # Device Info columns
    add_column_if_not_exists(cursor, "gps_tracks", "device_id", "VARCHAR(128)")
    add_column_if_not_exists(cursor, "gps_tracks", "is_mock_location", "BOOLEAN NOT NULL DEFAULT 0")
    
    # Update existing rows to have default values
    cursor.execute("UPDATE gps_tracks SET track_type = 'PATROL' WHERE track_type IS NULL")
    cursor.execute("UPDATE gps_tracks SET latitude = 0 WHERE latitude IS NULL")
    cursor.execute("UPDATE gps_tracks SET longitude = 0 WHERE longitude IS NULL")
    cursor.execute("UPDATE gps_tracks SET is_mock_location = 0 WHERE is_mock_location IS NULL")
    
    # Create indexes for new columns
    print("\n=== Creating indexes ===")
    create_index_if_not_exists(cursor, "idx_gps_tracks_track_type", "gps_tracks", "track_type")
    create_index_if_not_exists(cursor, "idx_gps_tracks_track_reference_id", "gps_tracks", "track_reference_id")
    create_index_if_not_exists(cursor, "idx_gps_tracks_recorded_at", "gps_tracks", "recorded_at")
    
    conn.commit()
    print("\nAll missing columns and indexes added successfully!")
    
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
    import traceback
    traceback.print_exc()
    conn.rollback()
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    conn.rollback()
    sys.exit(1)
finally:
    conn.close()

