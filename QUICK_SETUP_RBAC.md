# Quick Setup RBAC - Roles & Permissions

## ⚡ Quick Command (Copy-Paste di WSL Terminal)

```bash
cd /mnt/c/Users/DELL\ GAMING/Downloads/kerja/Reporting-System/backend && \
source venv/bin/activate && \
python scripts/create_default_permissions.py
```

## 📋 Step-by-Step

### 1. Buka Terminal WSL

### 2. Masuk ke folder backend
```bash
cd /mnt/c/Users/DELL\ GAMING/Downloads/kerja/Reporting-System/backend
```

### 3. Aktifkan virtual environment
```bash
source venv/bin/activate
```

### 4. Jalankan script
```bash
python scripts/create_default_permissions.py
```

### 5. Output yang diharapkan:
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
✅ Assigned 9 permissions to FIELD
✅ Assigned 10 permissions to GUARD
✅ Assigned 7 permissions to CLEANER
✅ Assigned 6 permissions to DRIVER

🔍 Verifying data...
   Permissions in database: 52
   Roles in database: 6

============================================================
✅ Default permissions and roles created successfully!
============================================================

💡 You can now access Roles & Permissions page in the frontend
   URL: /supervisor/admin/roles
```

## ✅ Verifikasi

Setelah script berjalan, refresh halaman Roles & Permissions di frontend. Data seharusnya sudah muncul.

## 🔧 Troubleshooting

### Error: "Module not found: app.core.database"
**Solusi:** Pastikan Anda di folder `backend` dan virtual environment aktif

### Error: "Table 'permissions' doesn't exist"
**Solusi:** Jalankan migrations dulu:
```bash
alembic upgrade head
```

### Error: "No such file or directory"
**Solusi:** Pastikan path benar. Gunakan:
```bash
pwd  # Cek current directory
ls scripts/create_default_permissions.py  # Cek file ada
```

### Data tidak muncul di frontend
**Solusi:**
1. Refresh browser (Ctrl+F5 atau Cmd+Shift+R)
2. Cek browser console untuk error
3. Cek Network tab untuk melihat API response
4. Pastikan login sebagai admin

## 📊 Data yang Akan Dibuat

- **52 Permissions** (reports.read, attendance.write, dll)
- **6 Roles** (ADMIN, SUPERVISOR, FIELD, GUARD, CLEANER, DRIVER)
- **Role-Permission Assignments** (otomatis)

## 🔗 Setelah Setup

1. Login sebagai **admin** di frontend
2. Navigate ke: `/supervisor/admin/roles`
3. Pilih role untuk melihat dan edit permissions
4. Save changes untuk update permissions
