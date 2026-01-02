# RBAC Troubleshooting Guide

## Problem: "Loaded roles: []" - Empty Roles Array

Jika halaman Roles & Permissions menampilkan array kosong, ikuti langkah-langkah berikut:

## 🔍 Step 1: Check Database Tables

Jalankan script untuk memeriksa apakah tabel sudah ada:

```bash
cd /mnt/c/Users/DELL\ GAMING/Downloads/kerja/Reporting-System/backend
source venv/bin/activate
python scripts/check_rbac_tables.py
```

**Expected Output:**
```
✅ 'roles' table exists
   Found 6 roles
✅ 'permissions' table exists
   Found 52 permissions
✅ 'role_permissions' table exists
   Found 150 role-permission relationships
```

**Jika tabel tidak ada:**
```bash
alembic upgrade head
```

## 🔍 Step 2: Create Default Data

Jika tabel ada tapi kosong, jalankan script untuk membuat data default:

```bash
python scripts/create_default_permissions.py
```

**Expected Output:**
```
============================================================
Creating Default Permissions and Roles
============================================================

📝 Creating permissions...
✅ Created 52 permissions, skipped 0 existing

👥 Creating roles...
✅ Created 6 roles, skipped 0 existing

🔗 Assigning permissions to roles...
✅ Assigned 52 permissions to ADMIN
✅ Assigned 25 permissions to SUPERVISOR
...
```

## 🔍 Step 3: Check API Endpoint

Test API endpoint langsung:

```bash
# Get auth token first (login)
TOKEN="your_jwt_token_here"

# Test roles endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/admin/roles

# Test permissions endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/admin/permissions
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "ADMIN",
    "display_name": "Administrator",
    "description": "Full system access",
    "is_active": true,
    "is_system": true,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  },
  ...
]
```

## 🔍 Step 4: Check User Role

Pastikan user yang login memiliki role yang tepat:

```bash
# Check current user role in database
python -c "
from app.core.database import SessionLocal
from app.models.user import User
db = SessionLocal()
user = db.query(User).filter(User.username == 'your_username').first()
print(f'User: {user.username}')
print(f'Role (string): {user.role}')
print(f'Role ID: {user.role_id}')
if user.role_obj:
    print(f'Role (RBAC): {user.role_obj.name}')
db.close()
"
```

**Required Roles:**
- User harus memiliki `role = "ADMIN"` atau `role = "SUPERVISOR"` (case-insensitive)
- Atau `role_id` yang mengarah ke Role dengan `name = "ADMIN"` atau `name = "SUPERVISOR"`

## 🔍 Step 5: Check Backend Logs

Cek log backend untuk error:

```bash
# Jika menggunakan uvicorn
tail -f logs/app.log

# Atau cek console output
```

**Look for:**
- `Error listing roles: ...`
- `Roles table does not exist`
- `Permission denied` atau `403 Forbidden`

## 🔍 Step 6: Verify Frontend API Call

Buka browser DevTools (F12) → Network tab:

1. Refresh halaman Roles & Permissions
2. Cari request ke `/api/admin/roles`
3. Check:
   - **Status Code**: Harus `200 OK`
   - **Request Headers**: Harus ada `Authorization: Bearer <token>`
   - **Response**: Harus berisi array roles

**Jika Status 403:**
- User tidak memiliki permission
- Check user role (Step 4)

**Jika Status 500:**
- Check backend logs (Step 5)
- Check database connection

## 🔍 Step 7: Database Connection

Pastikan database bisa diakses:

```bash
python -c "
from app.core.database import SessionLocal
from app.models.permission import Role
db = SessionLocal()
try:
    count = db.query(Role).count()
    print(f'✅ Database connected. Found {count} roles.')
except Exception as e:
    print(f'❌ Database error: {e}')
finally:
    db.close()
"
```

## ✅ Quick Fix Checklist

- [ ] Run migrations: `alembic upgrade head`
- [ ] Create default data: `python scripts/create_default_permissions.py`
- [ ] Verify tables: `python scripts/check_rbac_tables.py`
- [ ] Check user role (must be ADMIN or SUPERVISOR)
- [ ] Check API endpoint response
- [ ] Check browser console for errors
- [ ] Check backend logs for errors
- [ ] Restart backend server

## 🐛 Common Issues

### Issue 1: "Roles table does not exist"
**Solution:** Run migrations
```bash
alembic upgrade head
```

### Issue 2: "No roles found"
**Solution:** Create default data
```bash
python scripts/create_default_permissions.py
```

### Issue 3: "403 Forbidden"
**Solution:** User role tidak sesuai. Update user role:
```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';
-- atau
UPDATE users SET role_id = 1 WHERE username = 'your_username';  -- 1 = ADMIN role id
```

### Issue 4: "Empty array returned"
**Solution:** 
1. Check database has data (Step 1)
2. Check API endpoint directly (Step 3)
3. Check backend logs (Step 5)

### Issue 5: "CORS error" atau "Network error"
**Solution:** 
- Check backend is running
- Check API URL is correct
- Check CORS settings in `backend/app/main.py`

## 📞 Still Not Working?

Jika masih bermasalah setelah semua langkah di atas:

1. **Check database file exists:**
   ```bash
   ls -la verolux_test.db  # atau nama database Anda
   ```

2. **Check database schema:**
   ```bash
   sqlite3 verolux_test.db ".schema roles"
   sqlite3 verolux_test.db ".schema permissions"
   ```

3. **Manual check data:**
   ```bash
   sqlite3 verolux_test.db "SELECT * FROM roles;"
   sqlite3 verolux_test.db "SELECT * FROM permissions LIMIT 5;"
   ```

4. **Check backend is using correct database:**
   - Check `backend/app/core/config.py` → `SQLALCHEMY_DATABASE_URI`
   - Verify database path is correct
