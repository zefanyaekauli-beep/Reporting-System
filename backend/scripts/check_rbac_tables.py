#!/usr/bin/env python3
"""
Script to check if RBAC tables exist and have data
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import inspect, text
from app.core.database import SessionLocal, engine
from app.models.permission import Role, Permission

def check_tables():
    """Check if RBAC tables exist"""
    db = SessionLocal()
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print("=" * 60)
        print("Checking RBAC Tables")
        print("=" * 60)
        
        # Check roles table
        if 'roles' in tables:
            print("✅ 'roles' table exists")
            role_count = db.query(Role).count()
            print(f"   Found {role_count} roles")
            if role_count > 0:
                roles = db.query(Role).all()
                print("   Roles:")
                for role in roles:
                    perm_count = len(role.permissions) if hasattr(role, 'permissions') else 0
                    print(f"     - {role.name} ({role.display_name or 'N/A'}) - {perm_count} permissions")
            else:
                print("   ⚠️  No roles found. Run: python scripts/create_default_permissions.py")
        else:
            print("❌ 'roles' table does NOT exist")
            print("   Run migrations: alembic upgrade head")
        
        # Check permissions table
        if 'permissions' in tables:
            print("\n✅ 'permissions' table exists")
            perm_count = db.query(Permission).count()
            print(f"   Found {perm_count} permissions")
            if perm_count > 0:
                # Group by resource
                perms = db.query(Permission).all()
                by_resource = {}
                for perm in perms:
                    if perm.resource not in by_resource:
                        by_resource[perm.resource] = []
                    by_resource[perm.resource].append(perm.action)
                print("   Permissions by resource:")
                for resource, actions in sorted(by_resource.items()):
                    print(f"     - {resource}: {', '.join(sorted(set(actions)))}")
            else:
                print("   ⚠️  No permissions found. Run: python scripts/create_default_permissions.py")
        else:
            print("\n❌ 'permissions' table does NOT exist")
            print("   Run migrations: alembic upgrade head")
        
        # Check role_permissions table
        if 'role_permissions' in tables:
            print("\n✅ 'role_permissions' table exists")
            # Count relationships
            result = db.execute(text("SELECT COUNT(*) FROM role_permissions"))
            count = result.scalar()
            print(f"   Found {count} role-permission relationships")
        else:
            print("\n❌ 'role_permissions' table does NOT exist")
            print("   Run migrations: alembic upgrade head")
        
        # Check user_permissions table
        if 'user_permissions' in tables:
            print("\n✅ 'user_permissions' table exists")
            result = db.execute(text("SELECT COUNT(*) FROM user_permissions"))
            count = result.scalar()
            print(f"   Found {count} user-permission relationships")
        else:
            print("\n❌ 'user_permissions' table does NOT exist")
            print("   Run migrations: alembic upgrade head")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    check_tables()
