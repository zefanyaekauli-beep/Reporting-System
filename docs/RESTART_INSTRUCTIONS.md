# Restart Instructions

## Backend sudah berjalan ✅
Backend server sudah running di port 8000.

## Data sudah tersedia ✅
- ✅ Checklist untuk user_id=1: **Found**
- ✅ Security Reports: **6 reports**
- ✅ Security Patrols: **5 patrols**

## Yang perlu dilakukan:

### 1. Restart Frontend (jika masih tidak muncul)

**Stop frontend:**
```bash
# Tekan Ctrl+C di terminal yang menjalankan frontend
# Atau cari process dan kill:
ps aux | grep vite
kill <PID>
```

**Start frontend:**
```bash
cd frontend/web
npm run dev
```

### 2. Hard Refresh Browser

Setelah frontend restart, lakukan **hard refresh** di browser:
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) atau `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) atau `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Option+R`

### 3. Clear Browser Cache (jika masih tidak muncul)

1. Buka Developer Tools (F12)
2. Klik kanan pada tombol refresh
3. Pilih "Empty Cache and Hard Reload"

### 4. Verifikasi API

Test API langsung di browser:
- Checklist: http://localhost:8000/api/security/me/checklist/today
- Reports: http://localhost:8000/api/security/reports?site_id=1
- Patrols: http://localhost:8000/api/security/patrols?site_id=1

Jika API mengembalikan data, berarti masalah di frontend cache.

### 5. Check Browser Console

Buka Developer Tools (F12) → Console tab, lihat apakah ada error:
- CORS errors?
- 404 errors?
- Network errors?

## Quick Test

Jalankan ini untuk memverifikasi semua data:
```bash
cd backend
python3 << 'EOF'
from app.core.database import SessionLocal
from app.divisions.security.models import Checklist, SecurityReport, SecurityPatrolLog
from datetime import date
db = SessionLocal()
today = date.today()

print("=== Data Verification ===\n")
c = db.query(Checklist).filter(Checklist.user_id == 1, Checklist.shift_date == today).first()
print(f"✅ Checklist: {'Found' if c else 'NOT FOUND'}")
print(f"✅ Reports: {db.query(SecurityReport).filter(SecurityReport.user_id == 1).count()}")
print(f"✅ Patrols: {db.query(SecurityPatrolLog).filter(SecurityPatrolLog.user_id == 1).count()}")
db.close()
EOF
```

