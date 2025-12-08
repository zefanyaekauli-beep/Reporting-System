# Debug Frontend - Mock Data Not Showing

## ✅ Data Exists in Database
- Checklist: ✅ Found for user_id=1, today
- Reports: ✅ 6 reports for user_id=1
- Patrols: ✅ 5 patrols for user_id=1

## ✅ API Endpoints Working
Test these URLs directly in browser:
- Checklist: http://localhost:8000/api/security/me/checklist/today
- Reports: http://localhost:8000/api/security/reports?site_id=1
- Patrols: http://localhost:8000/api/security/patrols?site_id=1

## 🔍 Debug Steps

### 1. Open Browser Developer Tools (F12)
- Go to **Console** tab
- Look for errors (red text)
- Common errors:
  - CORS errors
  - 404 errors
  - Network errors
  - API base URL wrong

### 2. Check Network Tab
- Go to **Network** tab
- Refresh the page
- Look for API calls:
  - `/api/security/me/checklist/today`
  - `/api/security/reports?site_id=1`
  - `/api/security/patrols?site_id=1`
- Check if they return 200 OK or error
- Check the response body

### 3. Check API Base URL
Frontend uses: `http://localhost:8000/api`
- Make sure backend is running on port 8000
- Check if CORS is enabled

### 4. Check Date Filtering
- Reports page filters by "today" by default
- Make sure reports have `created_at` from today
- Try changing period filter to "week" or "month"

### 5. Hard Refresh
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`
- Or clear browser cache

## Quick Fix Commands

```bash
# Restart backend
cd backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Restart frontend
cd frontend/web
npm run dev

# Verify data
cd backend
python3 scripts/fix_mock_data_dates.py
```

## Expected Results

After hard refresh, you should see:
- **Checklist page**: 4 items (Periksa kunci, Patroli, Alarm, CCTV)
- **Reports page**: At least 2-3 reports from today
- **Patrols page**: At least 2-3 patrols from today

