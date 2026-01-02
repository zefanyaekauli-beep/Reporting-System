# Setup RBAC (Roles & Permissions)

## Langkah 1: Jalankan Script untuk Membuat Default Permissions & Roles

Jalankan script berikut di terminal WSL:

```bash
# Masuk ke folder backend
cd /mnt/c/Users/DELL\ GAMING/Downloads/kerja/Reporting-System/backend

# Aktifkan virtual environment
source venv/bin/activate

# Jalankan script
python scripts/create_default_permissions.py
```

Script ini akan:
- ✅ Membuat default permissions (reports.read, attendance.write, dll)
- ✅ Membuat default roles (ADMIN, SUPERVISOR, FIELD, GUARD, CLEANER, DRIVER)
- ✅ Men-assign permissions ke masing-masing role

## Langkah 2: Verifikasi Data di Database

Setelah script berjalan, verifikasi dengan:

```bash
# Di WSL, masuk ke Python shell
cd /mnt/c/Users/DELL\ GAMING/Downloads/kerja/Reporting-System/backend
source venv/bin/activate
python

# Di Python shell:
from app.core.database import SessionLocal
from app.models.permission import Role, Permission

db = SessionLocal()

# Cek roles
roles = db.query(Role).all()
print(f"Total roles: {len(roles)}")
for role in roles:
    print(f"  - {role.name}: {len(role.permissions)} permissions")

# Cek permissions
perms = db.query(Permission).all()
print(f"\nTotal permissions: {len(perms)}")

db.close()
```

## Langkah 3: Akses Halaman Roles & Permissions

1. Login sebagai **admin** di frontend
2. Navigate ke: `/supervisor/admin/roles`
3. Halaman akan menampilkan:
   - **Roles List** (sidebar kiri): Semua roles dari database
   - **Permissions Editor** (kanan): Permissions yang bisa di-assign ke role

## Struktur Data

### Roles Table
- `id` - Primary key
- `name` - Role name (ADMIN, SUPERVISOR, FIELD, dll)
- `display_name` - Display name untuk UI
- `description` - Deskripsi role
- `is_system` - System role tidak bisa dihapus
- `is_active` - Status aktif/tidak aktif

### Permissions Table
- `id` - Primary key
- `name` - Permission name (e.g., "reports.read")
- `resource` - Resource name (e.g., "reports", "attendance")
- `action` - Action type (e.g., "read", "write", "delete")
- `description` - Deskripsi permission
- `is_active` - Status aktif/tidak aktif

### Role-Permission Relationship
- `role_permissions` table (many-to-many)
- Menghubungkan roles dengan permissions

### User-Role Relationship
- `users.role_id` - Foreign key ke `roles.id`
- `users.role` - Legacy field (string) untuk backward compatibility

## API Endpoints

### Roles
- `GET /api/admin/roles` - List semua roles
- `GET /api/admin/roles/{role_id}/permissions` - Get permissions untuk role
- `POST /api/admin/roles/{role_id}/permissions` - Update permissions untuk role

### Permissions
- `GET /api/admin/permissions` - List semua permissions
  - Query params: `resource`, `action`, `is_active`

### Users
- `GET /api/admin/users` - List semua users dengan roles
  - Query params: `role`, `division`, `is_active`
- `PATCH /api/admin/users/{user_id}` - Update user role
- `POST /api/admin/users/{user_id}/permissions` - Update user permissions

## Troubleshooting

### Error: "No permissions found"
**Solusi:** Jalankan script `create_default_permissions.py`

### Error: "Role not found"
**Solusi:** Pastikan roles sudah dibuat di database dengan script

### Error: "Permission not found"
**Solusi:** Pastikan permissions sudah dibuat di database

### Data tidak muncul di frontend
**Solusi:**
1. Cek browser console untuk error
2. Cek network tab untuk melihat API response
3. Pastikan user login sebagai admin
4. Refresh halaman

## Catatan

- Script akan **skip** permissions/roles yang sudah ada (tidak akan duplicate)
- System roles (ADMIN, SUPERVISOR, FIELD) tidak bisa dihapus
- Permissions di-assign ke roles secara otomatis sesuai mapping di script
