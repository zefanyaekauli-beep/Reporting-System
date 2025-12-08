# Login Debug Guide

## ✅ Backend Status
- **Backend running**: ✅ Port 8000
- **Login endpoint**: ✅ `/api/auth/login`
- **CORS**: ✅ Enabled for all origins

## 🔍 Test Login API Directly

Open browser and go to:
```
http://localhost:8000/api/auth/login
```

Or test with curl:
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"security","password":"test"}'
```

Expected response:
```json
{
  "access_token": "dummy-token",
  "division": "security",
  "role": "user"
}
```

## 🔑 Login Credentials

**Username options:**
- `security` → Security dashboard
- `cleaning` → Cleaning dashboard
- `driver` → Driver dashboard
- `parking` → Parking dashboard

**Password:** Any value (can be empty)

## 🐛 Troubleshooting

### 1. Check Browser Console (F12)
- Open Developer Tools
- Go to **Console** tab
- Look for errors (red text)
- Common errors:
  - `Network Error` → Backend not running
  - `CORS error` → CORS misconfiguration
  - `404 Not Found` → Wrong API URL

### 2. Check Network Tab
- Open Developer Tools
- Go to **Network** tab
- Try to login
- Look for `/api/auth/login` request
- Check:
  - Status: Should be `200 OK`
  - Response: Should contain JSON with `access_token`, `division`, `role`

### 3. Check API Base URL
Frontend uses: `http://localhost:8000/api`
- Make sure backend is running on port 8000
- Check if `VITE_API_BASE_URL` env var is set correctly

### 4. Restart Services
```bash
# Backend
cd backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend/web
npm run dev
```

### 5. Clear Browser Cache
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Or clear browser cache completely

## 📝 Expected Behavior

1. Enter username: `security`
2. Enter password: (any value)
3. Click "Masuk" (Login)
4. Should redirect to `/security/dashboard`
5. If error appears, check console for details

## 🔧 Quick Fixes

If login still fails:
1. Check if backend is running: `curl http://localhost:8000/health`
2. Check if frontend can reach backend: Open Network tab, try login
3. Check browser console for JavaScript errors
4. Try different browser or incognito mode

