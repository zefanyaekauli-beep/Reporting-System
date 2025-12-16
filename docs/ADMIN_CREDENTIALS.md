# Admin User Credentials

## Cara Membuat Admin User

### Opsi 1: Auto-Create (Paling Mudah)
Sistem sudah mendukung auto-create user admin saat login pertama kali.

**Username:** `admin`  
**Password:** Password apapun yang Anda masukkan saat login pertama kali

**Cara:**
1. Buka halaman login
2. Masukkan username: `admin`
3. Masukkan password apapun (misalnya: `admin123`)
4. Klik Login
5. User admin akan otomatis dibuat dengan password yang Anda masukkan

### Opsi 2: Manual Create dengan Script

Jalankan script berikut (pastikan virtual environment aktif):

```bash
cd backend
# Aktifkan virtual environment
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# atau
source venv/bin/activate  # Linux/Mac

# Jalankan script
python scripts/create_admin_user.py
```

**Default Credentials:**
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `ADMIN`
- **Division:** `None` (dapat mengakses semua division)

### Opsi 3: Manual Create dengan SQL

Jika Anda ingin membuat langsung di database:

```sql
-- Pastikan password sudah di-hash dengan bcrypt
-- Password "admin123" yang sudah di-hash: $2b$12$...
-- Gunakan script Python untuk generate hash yang benar

INSERT INTO users (username, hashed_password, role, company_id, division)
VALUES ('admin', '<hashed_password>', 'ADMIN', 1, NULL);
```

## Credentials Default

Setelah user admin dibuat, gunakan kredensial berikut untuk login:

| Username | Password | Role | Division |
|----------|----------|------|----------|
| `admin` | `admin123` | ADMIN | None (All) |

## Fitur Admin

User dengan role `ADMIN` memiliki akses penuh ke semua fitur:
- ✅ Semua permission (semua resource dan action)
- ✅ Akses ke semua division (security, cleaning, parking, driver)
- ✅ Akses ke semua route supervisor
- ✅ Akses ke semua route admin
- ✅ User management
- ✅ Permission management
- ✅ Audit logs

## Mengubah Password Admin

Jika ingin mengubah password admin:

1. **Via Script:**
   ```bash
   python backend/scripts/create_admin_user.py
   ```
   Script akan mendeteksi user admin sudah ada dan menawarkan untuk update password.

2. **Via Login Auto-Create:**
   - Hapus user admin dari database
   - Login lagi dengan username `admin` dan password baru
   - User akan dibuat dengan password baru

## Troubleshooting

### Admin user tidak bisa login
1. Pastikan user admin sudah dibuat di database
2. Cek role user adalah `ADMIN` (bukan `admin` lowercase)
3. Pastikan password sudah di-hash dengan bcrypt
4. Coba login dengan auto-create (hapus user dulu, lalu login)

### Permission denied
- Pastikan role user adalah `ADMIN` (uppercase)
- Cek di database: `SELECT username, role FROM users WHERE username = 'admin';`

