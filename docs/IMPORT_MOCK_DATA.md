# Cara Import Mock Data

## Opsi 1: Start PostgreSQL dan Import SQL (Recommended)

### 1. Start PostgreSQL
```bash
# macOS dengan Homebrew:
brew services start postgresql

# Atau check status:
brew services list | grep postgresql
```

### 2. Buat Database (jika belum ada)
```bash
# Connect ke PostgreSQL
psql postgres

# Di dalam psql:
CREATE DATABASE verolux_db;
CREATE USER verolux_user WITH PASSWORD 'verolux_pass';
GRANT ALL PRIVILEGES ON DATABASE verolux_db TO verolux_user;
\q
```

### 3. Update .env File
Buat file `backend/.env`:
```bash
cd backend
cat > .env << 'EOF'
SQLALCHEMY_DATABASE_URI=postgresql://verolux_user:verolux_pass@localhost:5432/verolux_db
EOF
```

### 4. Jalankan Migrations
```bash
cd backend
alembic upgrade head
```

### 5. Import Mock Data
```bash
# Opsi A: Menggunakan SQL file
psql -U verolux_user -d verolux_db -f scripts/mock_data.sql

# Opsi B: Menggunakan Python script
python3 scripts/create_mock_data.py
```

## Opsi 2: Quick Test dengan SQLite (Temporary)

Jika PostgreSQL tidak tersedia, kita bisa ubah ke SQLite untuk testing cepat:

### 1. Update config untuk SQLite
Edit `backend/app/core/config.py`:
```python
SQLALCHEMY_DATABASE_URI: str = "sqlite:///./verolux.db"
```

### 2. Restart backend
Backend akan otomatis create database file.

### 3. Import data via API atau manual insert

## Opsi 3: Manual Insert via API (Jika backend sudah running)

Backend sudah running, jadi kita bisa create data via API calls:

```bash
# 1. Login untuk get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"security","password":""}' | jq -r '.access_token')

# 2. Create checklist template via API
curl -X POST http://localhost:8000/api/security/admin/checklist-templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Security Guard - Morning Shift",
    "site_id": 1,
    "role": "guard",
    "shift_type": "MORNING",
    "items": [
      {"title": "Periksa kunci pintu utama", "required": true, "evidence_type": "photo", "order": 1},
      {"title": "Patroli area parkir", "required": true, "evidence_type": "patrol_log", "order": 2}
    ]
  }'
```

## Check Status

```bash
# Check PostgreSQL
pg_isready

# Check database connection
cd backend
python3 -c "from app.core.database import SessionLocal; db = SessionLocal(); print('✅ Connected'); db.close()"
```

