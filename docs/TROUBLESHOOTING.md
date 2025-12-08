# Troubleshooting Guide - Verolux Management System

## Status Server Saat Ini

✅ **Backend (FastAPI)**: Running di port 8000
✅ **Frontend (React)**: Running di port 5173
✅ **Network Access**: Enabled (0.0.0.0)

## Cara Akses

### Dari Komputer (Localhost)
```
http://localhost:5173
```

### Dari Mobile/Device Lain (WiFi yang sama)
```
http://192.168.100.143:5173
```

## Troubleshooting

### 1. Tidak Bisa Akses dari Browser

**Cek:**
- Pastikan server masih running:
  ```bash
  lsof -i :5173
  lsof -i :8000
  ```

**Solusi:**
- Restart server jika perlu:
  ```bash
  # Backend
  cd backend
  python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

  # Frontend
  cd frontend/web
  npm run dev
  ```

### 2. Error "Cannot connect to API" atau "Network Error"

**Penyebab:** Frontend tidak bisa connect ke backend

**Solusi:**
1. Pastikan file `.env` ada di `frontend/web/.env`:
   ```
   VITE_API_BASE_URL=http://192.168.100.143:8000/api
   ```

2. **Restart frontend** setelah membuat/mengubah `.env`:
   ```bash
   # Stop frontend (Ctrl+C atau kill process)
   # Lalu start lagi
   cd frontend/web
   npm run dev
   ```

3. Cek apakah backend accessible:
   ```bash
   curl http://192.168.100.143:8000/health
   # Harus return: {"status":"ok"}
   ```

### 3. Error CORS

**Penyebab:** Backend menolak request dari frontend

**Solusi:**
- Cek `backend/app/core/config.py` - `CORS_ORIGINS` harus `["*"]` untuk development
- Restart backend setelah perubahan

### 4. Login Gagal

**Credentials:**
- Username: `security`
- Password: (kosong)

**Cek:**
```bash
curl -X POST http://192.168.100.143:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"security","password":""}'
```

Harus return: `{"access_token":"dummy-token","division":"security","role":"user"}`

### 5. Mobile Tidak Bisa Akses

**Penyebab:**
- Device tidak di WiFi yang sama
- Firewall memblokir port
- IP address berubah

**Solusi:**
1. Cek IP address komputer:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `.env` dengan IP yang benar:
   ```
   VITE_API_BASE_URL=http://[IP_KOMPUTER]:8000/api
   ```

3. Restart frontend

4. Pastikan device mobile di WiFi yang sama

5. Cek firewall:
   ```bash
   # macOS
   System Preferences > Security & Privacy > Firewall
   ```

### 6. Halaman Blank atau Error di Browser

**Cek Browser Console:**
- Buka Developer Tools (F12)
- Lihat tab Console untuk error messages
- Lihat tab Network untuk failed requests

**Common Issues:**
- JavaScript errors → Cek console
- 404 errors → Cek routing
- CORS errors → Cek backend CORS config

### 7. Port Sudah Digunakan

**Error:** `Port 5173 is already in use`

**Solusi:**
```bash
# Cari process yang pakai port
lsof -i :5173

# Kill process
kill [PID]

# Atau gunakan port lain
# Edit vite.config.ts, ubah port: 5174
```

## Quick Fix Commands

```bash
# Restart semua server
pkill -f "uvicorn.*Laporan Verol"
pkill -f "vite.*Laporan Verol"

# Start backend
cd "/Users/zefanyaekaulii/Desktop/Laporan Verol/backend"
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &

# Start frontend
cd "/Users/zefanyaekaulii/Desktop/Laporan Verol/frontend/web"
npm run dev &
```

## Test Koneksi

```bash
# Test backend
curl http://localhost:8000/health
curl http://192.168.100.143:8000/health

# Test frontend
curl http://localhost:5173 | grep "Verolux"
curl http://192.168.100.143:5173 | grep "Verolux"

# Test login API
curl -X POST http://192.168.100.143:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"security","password":""}'
```

## Jika Masih Bermasalah

1. **Cek log server:**
   - Backend: Lihat output terminal uvicorn
   - Frontend: Lihat output terminal vite

2. **Cek browser console:**
   - Buka Developer Tools (F12)
   - Lihat error messages

3. **Cek network:**
   - Pastikan device di WiFi yang sama
   - Test ping: `ping 192.168.100.143`

4. **Restart semua:**
   - Stop semua server
   - Start ulang dari awal


