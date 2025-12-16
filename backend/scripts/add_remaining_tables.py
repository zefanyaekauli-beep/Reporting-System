#!/usr/bin/env python3
"""
Script to add remaining missing tables (master_data, cctv_cameras, gps_tracks, permissions, roles, audit_logs).
Run: python scripts/add_remaining_tables.py
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

def table_exists(cursor, table_name):
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    return cursor.fetchone() is not None

def create_table_if_not_exists(cursor, table_name, create_sql, indexes_sql=None):
    if table_exists(cursor, table_name):
        print(f"Table '{table_name}' already exists. Skipping.")
        return False
    
    print(f"Creating table '{table_name}'...")
    cursor.execute(create_sql)
    
    if indexes_sql:
        for index_sql in indexes_sql:
            try:
                cursor.execute(index_sql)
            except sqlite3.OperationalError as e:
                if "already exists" not in str(e).lower():
                    print(f"  Warning: Could not create index: {e}")
    
    print(f"Table '{table_name}' created successfully.")
    return True

try:
    # 1. Master Data table
    create_table_if_not_exists(
        cursor,
        "master_data",
        """
        CREATE TABLE master_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER,
            category VARCHAR(64) NOT NULL,
            code VARCHAR(128) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            parent_id INTEGER,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            extra_data TEXT,
            division VARCHAR(32),
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            created_by INTEGER,
            updated_by INTEGER,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (parent_id) REFERENCES master_data(id),
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (updated_by) REFERENCES users(id)
        )
        """,
        [
            "CREATE INDEX idx_master_data_company_id ON master_data(company_id)",
            "CREATE INDEX idx_master_data_category ON master_data(category)",
            "CREATE INDEX idx_master_data_code ON master_data(code)",
            "CREATE INDEX idx_master_data_parent_id ON master_data(parent_id)",
            "CREATE INDEX idx_master_data_is_active ON master_data(is_active)",
            "CREATE INDEX idx_master_data_division ON master_data(division)",
        ]
    )
    
    # 2. CCTV Cameras table
    create_table_if_not_exists(
        cursor,
        "cctv_cameras",
        """
        CREATE TABLE cctv_cameras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            site_id INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            stream_url VARCHAR(512) NOT NULL,
            stream_type VARCHAR(32) DEFAULT 'RTSP',
            is_active BOOLEAN NOT NULL DEFAULT 1,
            position_lat REAL,
            position_lng REAL,
            description TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (site_id) REFERENCES sites(id)
        )
        """,
        [
            "CREATE INDEX idx_cctv_cameras_company_id ON cctv_cameras(company_id)",
            "CREATE INDEX idx_cctv_cameras_site_id ON cctv_cameras(site_id)",
            "CREATE INDEX idx_cctv_cameras_is_active ON cctv_cameras(is_active)",
        ]
    )
    
    # 3. GPS Tracks table
    create_table_if_not_exists(
        cursor,
        "gps_tracks",
        """
        CREATE TABLE gps_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            site_id INTEGER NOT NULL,
            patrol_log_id INTEGER,
            start_time DATETIME NOT NULL,
            end_time DATETIME,
            track_data TEXT NOT NULL,
            distance_km REAL,
            duration_minutes INTEGER,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (site_id) REFERENCES sites(id),
            FOREIGN KEY (patrol_log_id) REFERENCES security_patrol_logs(id)
        )
        """,
        [
            "CREATE INDEX idx_gps_tracks_company_id ON gps_tracks(company_id)",
            "CREATE INDEX idx_gps_tracks_user_id ON gps_tracks(user_id)",
            "CREATE INDEX idx_gps_tracks_site_id ON gps_tracks(site_id)",
            "CREATE INDEX idx_gps_tracks_patrol_log_id ON gps_tracks(patrol_log_id)",
            "CREATE INDEX idx_gps_tracks_start_time ON gps_tracks(start_time)",
        ]
    )
    
    # 4. Permissions table
    create_table_if_not_exists(
        cursor,
        "permissions",
        """
        CREATE TABLE permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(128) NOT NULL UNIQUE,
            resource VARCHAR(128) NOT NULL,
            action VARCHAR(64) NOT NULL,
            description TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
        """,
        [
            "CREATE INDEX idx_permissions_name ON permissions(name)",
            "CREATE INDEX idx_permissions_resource ON permissions(resource)",
            "CREATE INDEX idx_permissions_action ON permissions(action)",
        ]
    )
    
    # 5. Roles table
    create_table_if_not_exists(
        cursor,
        "roles",
        """
        CREATE TABLE roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(64) NOT NULL UNIQUE,
            description TEXT,
            is_system_role BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
        """,
        [
            "CREATE INDEX idx_roles_name ON roles(name)",
        ]
    )
    
    # 6. Role Permissions junction table (many-to-many)
    create_table_if_not_exists(
        cursor,
        "role_permissions",
        """
        CREATE TABLE role_permissions (
            role_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        )
        """,
        [
            "CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id)",
            "CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id)",
        ]
    )
    
    # 7. User Permissions junction table (many-to-many)
    create_table_if_not_exists(
        cursor,
        "user_permissions",
        """
        CREATE TABLE user_permissions (
            user_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,
            PRIMARY KEY (user_id, permission_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        )
        """,
        [
            "CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id)",
            "CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id)",
        ]
    )
    
    # 8. Audit Logs table
    create_table_if_not_exists(
        cursor,
        "audit_logs",
        """
        CREATE TABLE audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            company_id INTEGER,
            action VARCHAR(64) NOT NULL,
            resource_type VARCHAR(64) NOT NULL,
            resource_id INTEGER,
            details TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
        """,
        [
            "CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)",
            "CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id)",
            "CREATE INDEX idx_audit_logs_action ON audit_logs(action)",
            "CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type)",
            "CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id)",
            "CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)",
        ]
    )
    
    conn.commit()
    print("\nAll remaining tables checked and created successfully!")
    
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
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

