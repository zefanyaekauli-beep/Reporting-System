# Mock Data untuk Verolux Management System

## Quick Start

### 1. Pastikan Database Berjalan
```bash
# Check PostgreSQL status
pg_isready

# Jika tidak running, start:
# macOS:
brew services start postgresql
```

### 2. Jalankan Migrations
```bash
cd backend
alembic upgrade head
```

### 3. Import Mock Data

**Opsi A: Menggunakan SQL File (Paling Mudah)**
```bash
cd backend
psql -U postgres -d verolux_db -f scripts/mock_data.sql
```

**Opsi B: Menggunakan Python Script**
```bash
cd backend
python3 scripts/create_mock_data.py
```

## Data yang Dibuat

### Users untuk Testing
- **Username:** `security` (ID: 1)
  - Role: guard
  - Site: Gedung Perkantoran A
  - Password: (kosong)

- **Username:** `guard1` (ID: 2)
  - Role: guard
  - Site: Gedung Perkantoran A

- **Username:** `supervisor1` (ID: 4)
  - Role: supervisor
  - Site: Gedung Perkantoran A

### Checklist Templates
1. **Security Guard - Site A - Morning Shift** (5 tasks)
2. **Security Guard - Site A - Night Shift** (5 tasks)
3. **Security Guard - Global Template** (2 tasks)
4. **Supervisor Template** (2 tasks)

### Sample Checklists
- **Hari Ini:** 3 checklist (semua OPEN, items PENDING)
- **Kemarin:** 2 checklist (1 COMPLETED, 1 INCOMPLETE)

## Testing Checklist

1. ✅ Login dengan `security` (password kosong)
2. ✅ Buka `/security/checklist` - lihat checklist hari ini
3. ✅ Mark beberapa items sebagai "Selesai"
4. ✅ Buka `/security/checklist/supervisor` - lihat dashboard supervisor
5. ✅ Filter berdasarkan tanggal, site, atau status

## File Locations
- SQL File: `backend/scripts/mock_data.sql`
- Python Script: `backend/scripts/create_mock_data.py`
- Documentation: `backend/scripts/README_MOCK_DATA.md`
