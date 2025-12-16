#!/usr/bin/env python3
"""
Script to create default permissions and roles in the database
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.permission import Permission, Role

# Default permissions to create
DEFAULT_PERMISSIONS = [
    # Reports
    {"name": "reports.read", "resource": "reports", "action": "read", "description": "View reports"},
    {"name": "reports.write", "resource": "reports", "action": "write", "description": "Create and edit reports"},
    {"name": "reports.delete", "resource": "reports", "action": "delete", "description": "Delete reports"},
    
    # Attendance
    {"name": "attendance.read", "resource": "attendance", "action": "read", "description": "View attendance"},
    {"name": "attendance.write", "resource": "attendance", "action": "write", "description": "Create and edit attendance"},
    
    # Patrols
    {"name": "patrols.read", "resource": "patrols", "action": "read", "description": "View patrols"},
    {"name": "patrols.write", "resource": "patrols", "action": "write", "description": "Create and edit patrols"},
    
    # Checklists
    {"name": "checklists.read", "resource": "checklists", "action": "read", "description": "View checklists"},
    {"name": "checklists.write", "resource": "checklists", "action": "write", "description": "Create and edit checklists"},
    
    # Shifts
    {"name": "shifts.read", "resource": "shifts", "action": "read", "description": "View shifts"},
    {"name": "shifts.write", "resource": "shifts", "action": "write", "description": "Create and edit shifts"},
    
    # Dashboard
    {"name": "dashboard.read", "resource": "dashboard", "action": "read", "description": "View dashboard"},
    
    # Incidents
    {"name": "incidents.read", "resource": "incidents", "action": "read", "description": "View incidents"},
    {"name": "incidents.write", "resource": "incidents", "action": "write", "description": "Create and edit incidents"},
    
    # Visitors
    {"name": "visitors.read", "resource": "visitors", "action": "read", "description": "View visitors"},
    {"name": "visitors.write", "resource": "visitors", "action": "write", "description": "Create and edit visitors"},
    
    # Training
    {"name": "training.read", "resource": "training", "action": "read", "description": "View training"},
    {"name": "training.write", "resource": "training", "action": "write", "description": "Create and edit training"},
    
    # Employees
    {"name": "employees.read", "resource": "employees", "action": "read", "description": "View employees"},
    {"name": "employees.write", "resource": "employees", "action": "write", "description": "Create and edit employees"},
    
    # Payroll
    {"name": "payroll.read", "resource": "payroll", "action": "read", "description": "View payroll"},
    {"name": "payroll.write", "resource": "payroll", "action": "write", "description": "Manage payroll"},
    
    # Master Data
    {"name": "master_data.read", "resource": "master_data", "action": "read", "description": "View master data"},
    {"name": "master_data.write", "resource": "master_data", "action": "write", "description": "Manage master data"},
    
    # Sites
    {"name": "sites.read", "resource": "sites", "action": "read", "description": "View sites"},
    {"name": "sites.write", "resource": "sites", "action": "write", "description": "Manage sites"},
    
    # CCTV
    {"name": "cctv.read", "resource": "cctv", "action": "read", "description": "View CCTV"},
    {"name": "cctv.write", "resource": "cctv", "action": "write", "description": "Manage CCTV"},
    
    # Control Center
    {"name": "control_center.read", "resource": "control_center", "action": "read", "description": "View control center"},
    {"name": "control_center.write", "resource": "control_center", "action": "write", "description": "Manage control center"},
    
    # Announcements
    {"name": "announcements.read", "resource": "announcements", "action": "read", "description": "View announcements"},
    {"name": "announcements.write", "resource": "announcements", "action": "write", "description": "Create and edit announcements"},
    
    # Manpower
    {"name": "manpower.read", "resource": "manpower", "action": "read", "description": "View manpower"},
    
    # Patrol Targets
    {"name": "patrol_targets.read", "resource": "patrol_targets", "action": "read", "description": "View patrol targets"},
    {"name": "patrol_targets.write", "resource": "patrol_targets", "action": "write", "description": "Manage patrol targets"},
    
    # Patrol Teams
    {"name": "patrol_teams.read", "resource": "patrol_teams", "action": "read", "description": "View patrol teams"},
    {"name": "patrol_teams.write", "resource": "patrol_teams", "action": "write", "description": "Manage patrol teams"},
    
    # KTA
    {"name": "kta.read", "resource": "kta", "action": "read", "description": "View KTA"},
    {"name": "kta.write", "resource": "kta", "action": "write", "description": "Manage KTA"},
    
    # Calendar
    {"name": "calendar.read", "resource": "calendar", "action": "read", "description": "View calendar"},
]

# Default roles to create
DEFAULT_ROLES = [
    {"name": "ADMIN", "display_name": "Administrator", "description": "Full system access", "is_system": True},
    {"name": "SUPERVISOR", "display_name": "Supervisor", "description": "Supervisory access", "is_system": True},
    {"name": "FIELD", "display_name": "Field User", "description": "Field personnel access", "is_system": True},
    {"name": "GUARD", "display_name": "Security Guard", "description": "Security guard access", "is_system": True},
    {"name": "CLEANER", "display_name": "Cleaner", "description": "Cleaning staff access", "is_system": True},
    {"name": "DRIVER", "display_name": "Driver", "description": "Driver access", "is_system": True},
]

def create_permissions(db: Session):
    """Create default permissions"""
    created = 0
    skipped = 0
    
    for perm_data in DEFAULT_PERMISSIONS:
        existing = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
        if existing:
            skipped += 1
            continue
        
        permission = Permission(**perm_data)
        db.add(permission)
        created += 1
    
    db.commit()
    print(f"✅ Created {created} permissions, skipped {skipped} existing")
    return created

def create_roles(db: Session):
    """Create default roles"""
    created = 0
    skipped = 0
    
    for role_data in DEFAULT_ROLES:
        existing = db.query(Role).filter(Role.name == role_data["name"]).first()
        if existing:
            skipped += 1
            continue
        
        role = Role(**role_data)
        db.add(role)
        created += 1
    
    db.commit()
    print(f"✅ Created {created} roles, skipped {skipped} existing")
    return created

def assign_role_permissions(db: Session):
    """Assign default permissions to roles"""
    # Get all permissions
    all_permissions = {p.name: p for p in db.query(Permission).all()}
    
    # Role permission mappings
    role_permission_mappings = {
        "ADMIN": ["*"],  # All permissions
        "SUPERVISOR": [
            "dashboard.read", "attendance.read", "attendance.write",
            "reports.read", "reports.write", "checklists.read", "checklists.write",
            "patrols.read", "patrols.write", "incidents.read", "incidents.write",
            "visitors.read", "visitors.write", "training.read", "training.write",
            "employees.read", "employees.write", "payroll.read",
            "master_data.read", "master_data.write", "sites.read", "sites.write",
            "cctv.read", "control_center.read", "announcements.read", "announcements.write",
            "shifts.read", "shifts.write", "manpower.read",
            "patrol_targets.read", "patrol_targets.write", "patrol_teams.read", "patrol_teams.write",
            "kta.read", "kta.write", "calendar.read",
        ],
        "FIELD": [
            "dashboard.read", "attendance.read", "attendance.write",
            "reports.read", "reports.write", "checklists.read", "checklists.write",
            "patrols.read", "patrols.write", "incidents.read", "incidents.write",
            "shifts.read", "profile.read", "profile.write",
        ],
        "GUARD": [
            "dashboard.read", "attendance.read", "attendance.write",
            "reports.read", "reports.write", "checklists.read", "checklists.write",
            "patrols.read", "patrols.write", "incidents.read", "incidents.write",
            "visitors.read", "visitors.write", "shifts.read", "profile.read", "profile.write",
        ],
        "CLEANER": [
            "dashboard.read", "attendance.read", "attendance.write",
            "reports.read", "reports.write", "checklists.read", "checklists.write",
            "shifts.read", "profile.read", "profile.write",
        ],
        "DRIVER": [
            "dashboard.read", "attendance.read", "attendance.write",
            "reports.read", "reports.write", "shifts.read", "profile.read", "profile.write",
        ],
    }
    
    for role_name, perm_names in role_permission_mappings.items():
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            print(f"⚠️  Role {role_name} not found, skipping")
            continue
        
        if perm_names == ["*"]:
            # Admin gets all permissions
            role.permissions = list(all_permissions.values())
        else:
            # Assign specific permissions
            permissions = [all_permissions[name] for name in perm_names if name in all_permissions]
            role.permissions = permissions
        
        print(f"✅ Assigned {len(role.permissions)} permissions to {role_name}")
    
    db.commit()

def main():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("Creating Default Permissions and Roles")
        print("=" * 60)
        
        # Create permissions
        create_permissions(db)
        
        # Create roles
        create_roles(db)
        
        # Assign permissions to roles
        assign_role_permissions(db)
        
        print("=" * 60)
        print("✅ Default permissions and roles created successfully!")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()

