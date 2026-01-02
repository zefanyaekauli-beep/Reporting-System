# 🧪 TESTING GUIDE - Reporting System
**Tanggal**: 25 Desember 2024
**Untuk**: Testing semua fitur yang baru di-fix

---

## 📋 PERSIAPAN TESTING

### 1. Pastikan Backend & Frontend Running

```bash
# Terminal 1 - Backend
cd backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend/web
npm run dev
```

**Verify**:
- Backend: http://localhost:8000/health
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

### 2. Login Credentials

```
Username: dummy
Password: dummy123
Role: supervisor/admin
```

---

## 🎯 TEST PLAN

### FASE 1: Menu Sidebar Navigation ✅

**Objective**: Verify semua 80+ menu items accessible

#### Test Steps:

1. **Login ke sistem**
   - Navigate ke http://localhost:5173
   - Login dengan credentials di atas
   - Verify redirect ke `/supervisor/dashboard`

2. **Test Menu Collapse/Expand**
   - [ ] Click "Dashboard" - should navigate
   - [ ] Click "Officer" header - should expand/collapse
   - [ ] Click "Attendance" header - should expand/collapse
   - [ ] Click "Reporting" header - should expand/collapse
   - [ ] Verify smooth animation

3. **Test All Menu Categories** (16 categories):
   
   **Dashboard**:
   - [ ] Dashboard Overview → `/supervisor/dashboard`
   
   **Officer**:
   - [ ] Officer List → `/supervisor/officers`
   - [ ] Manpower → `/supervisor/manpower`
   
   **Attendance** (7 items):
   - [ ] Attendance Overview → `/supervisor/attendance`
   - [ ] Simple Attendance → `/supervisor/attendance/simple`
   - [ ] Attendance Correction → `/supervisor/attendance/correction`
   - [ ] Overtime → `/supervisor/attendance/overtime`
   - [ ] Outstation → `/supervisor/attendance/outstation`
   - [ ] Leave Requests → `/supervisor/attendance/leave`
   - [ ] Approval Queue → `/supervisor/attendance/approval`
   
   **Reporting** (5 items):
   - [ ] All Reports → `/supervisor/reports`
   - [ ] DAR → `/supervisor/reporting/dar`
   - [ ] Visitor Reports → `/supervisor/reporting/visitors`
   - [ ] Intelligence Reports → `/supervisor/reporting/intelligent`
   - [ ] Compliance → `/supervisor/reporting/compliance`
   
   **Patrol Management** (8 items):
   - [ ] Patrol Activity → `/supervisor/patrol-activity`
   - [ ] Patrol Schedule → `/supervisor/patrol/schedule`
   - [ ] Patrol Assignment → `/supervisor/patrol/assignment`
   - [ ] Security Patrol → `/supervisor/patrol/security`
   - [ ] Joint Patrol → `/supervisor/patrol/joint`
   - [ ] Patrol Report → `/supervisor/patrol/report`
   - [ ] Patrol Targets → `/supervisor/patrol/targets`
   - [ ] Patrol Teams → `/supervisor/patrol/teams`
   
   **Incident Management** (6 items):
   - [ ] LK-LP → `/supervisor/incident/lk-lp`
   - [ ] BAP → `/supervisor/incident/bap`
   - [ ] STPLK → `/supervisor/incident/stplk`
   - [ ] Findings → `/supervisor/incident/findings`
   - [ ] Incident Recap → `/supervisor/incident/recap`
   - [ ] Perpetrators → `/supervisor/incidents/perpetrators`
   
   **Checklist & Inspection** (3 items):
   - [ ] Checklists → `/supervisor/checklists`
   - [ ] Checklist Templates → `/supervisor/checklist-templates`
   - [ ] Inspect Points → `/supervisor/inspectpoints`
   
   **Training** (3 items):
   - [ ] Training Overview → `/supervisor/training`
   - [ ] Training Plan → `/supervisor/training/plan`
   - [ ] Participants → `/supervisor/training/participant`
   
   **KPI & Analytics** (5 items):
   - [ ] KPI Patrol → `/supervisor/kpi/patrol`
   - [ ] KPI Report → `/supervisor/kpi/report`
   - [ ] KPI CCTV → `/supervisor/kpi/cctv`
   - [ ] KPI Training → `/supervisor/kpi/training`
   - [ ] Activity Heatmap → `/supervisor/heatmap`
   
   **Sites & Locations**:
   - [ ] Sites Management → `/supervisor/sites`
   
   **Division Dashboards**:
   - [ ] Cleaning Dashboard → `/supervisor/cleaning/dashboard`
   
   **Scheduling** (2 items):
   - [ ] Shifts Calendar → `/supervisor/shifts`
   - [ ] Activity Calendar → `/supervisor/calendar`
   
   **Master Data** (9 items):
   - [ ] Master Data Main → `/supervisor/admin/master-data`
   - [ ] Workers → `/supervisor/master/worker`
   - [ ] Business Units → `/supervisor/master/business-unit`
   - [ ] Departments → `/supervisor/master/department`
   - [ ] Patrol Points → `/supervisor/master/patrol-points`
   - [ ] Job Positions → `/supervisor/master/job-position`
   - [ ] Assets → `/supervisor/master/asset`
   - [ ] Asset Categories → `/supervisor/master/asset-category`
   - [ ] CCTV Zones → `/supervisor/master/cctv-zone`
   
   **Information** (3 items):
   - [ ] Documents → `/supervisor/information/document`
   - [ ] CCTV Status → `/supervisor/information/cctv`
   - [ ] Notifications → `/supervisor/information/notification`
   
   **Administration** (8 items):
   - [ ] User Management → `/supervisor/admin/users`
   - [ ] User Access Control → `/supervisor/admin/user-access`
   - [ ] Roles & Permissions → `/supervisor/admin/roles`
   - [ ] Employees → `/supervisor/admin/employees`
   - [ ] Incident Access → `/supervisor/admin/incident-access`
   - [ ] Translation → `/supervisor/admin/translation`
   - [ ] Audit Logs → `/supervisor/admin/audit-logs`
   - [ ] KTA Management → `/supervisor/kta`
   
   **Control Center**:
   - [ ] Control Center → `/supervisor/control-center`

4. **Verify Visual States**
   - [ ] Active menu item has blue background
   - [ ] Active menu item has blue left border
   - [ ] Active menu item has bold text
   - [ ] Hover effect works on menu items
   - [ ] Scroll works for long menu

**Expected Result**: ✅ Semua menu accessible, no 404 errors

---

### FASE 2: Parking Division API Testing ✅

**Objective**: Verify parkingApi.ts functions work correctly

#### Test Setup:
```typescript
// Open browser console (F12)
// Import functions untuk testing
import { 
  listParkingSessions, 
  createParkingEntry,
  getParkingDashboard 
} from '@/api/parkingApi';
```

#### Test Cases:

**1. Parking Dashboard**
```typescript
// Test 1: Get parking dashboard
const testDashboard = async () => {
  try {
    const { data } = await getParkingDashboard({ site_id: 1 });
    console.log('Dashboard:', data);
    // Expected: { total_sessions_today, active_sessions, etc }
  } catch (err) {
    console.error('Error:', err);
  }
};
testDashboard();
```
- [ ] Returns dashboard data
- [ ] No errors in console
- [ ] Response time < 2s

**2. List Parking Sessions**
```typescript
// Test 2: List sessions
const testList = async () => {
  const { data } = await listParkingSessions({ 
    site_id: 1,
    status: 'ACTIVE'
  });
  console.log('Sessions:', data);
};
testList();
```
- [ ] Returns array of sessions
- [ ] Filter by status works
- [ ] Data structure correct

**3. Create Parking Entry**
```typescript
// Test 3: Create entry
const testEntry = async () => {
  const { data } = await createParkingEntry({
    site_id: 1,
    vehicle_type: 'CAR',
    license_plate: 'B 1234 TEST',
    driver_name: 'Test Driver'
  });
  console.log('Entry created:', data);
};
testEntry();
```
- [ ] Entry created successfully
- [ ] Returns session data
- [ ] entry_time is set

**4. Create Parking Exit**
```typescript
// Test 4: Create exit (need session_id from test 3)
const testExit = async (sessionId) => {
  const { data } = await createParkingExit({
    session_id: sessionId,
    parking_fee: 5000,
    payment_status: 'PAID'
  });
  console.log('Exit created:', data);
};
testExit(1); // Replace with actual session_id
```
- [ ] Exit created successfully
- [ ] exit_time is set
- [ ] Status changed to COMPLETED

**5. Parking Reports**
```typescript
// Test 5: Create report
const testReport = async () => {
  const { data } = await createParkingReport({
    report_type: 'incident',
    site_id: 1,
    title: 'Test Parking Report',
    description: 'Testing parking report creation',
    severity: 'medium'
  });
  console.log('Report created:', data);
};
testReport();
```
- [ ] Report created successfully
- [ ] division is 'PARKING'
- [ ] Can list reports

**6. Parking Statistics**
```typescript
// Test 6: Get statistics
const testStats = async () => {
  const data = await getParkingStatistics({ site_id: 1 });
  console.log('Statistics:', data);
};
testStats();
```
- [ ] Returns statistics
- [ ] Revenue data correct
- [ ] Vehicle type breakdown works

**Expected Result**: ✅ All parking API functions work, no errors

---

### FASE 3: Driver Division API Testing ✅

**Objective**: Verify driverApi.ts functions work correctly

#### Test Cases:

**1. List Trips**
```typescript
// Test 1: List trips
const testTrips = async () => {
  const { data } = await listTrips({ 
    site_id: 1,
    status: 'IN_PROGRESS'
  });
  console.log('Trips:', data);
};
testTrips();
```
- [ ] Returns array of trips
- [ ] Filter works
- [ ] Data structure correct

**2. Create Trip**
```typescript
// Test 2: Create trip
const testCreateTrip = async () => {
  const { data } = await createTrip({
    site_id: 1,
    vehicle_id: 1,
    trip_type: 'DELIVERY',
    origin: 'Warehouse A',
    destination: 'Client Office',
    departure_time: new Date().toISOString()
  });
  console.log('Trip created:', data);
  return data.id;
};
testCreateTrip();
```
- [ ] Trip created successfully
- [ ] Status is 'PLANNED'
- [ ] Returns trip data

**3. Start Trip**
```typescript
// Test 3: Start trip (need trip_id from test 2)
const testStartTrip = async (tripId) => {
  const { data } = await startTrip(tripId);
  console.log('Trip started:', data);
};
testStartTrip(1); // Replace with actual trip_id
```
- [ ] Status changed to 'IN_PROGRESS'
- [ ] departure_time is set
- [ ] No errors

**4. Complete Trip**
```typescript
// Test 4: Complete trip
const testCompleteTrip = async (tripId) => {
  const { data } = await completeTrip(tripId, {
    arrival_time: new Date().toISOString(),
    distance_km: 15.5,
    notes: 'Trip completed successfully'
  });
  console.log('Trip completed:', data);
};
testCompleteTrip(1);
```
- [ ] Status changed to 'COMPLETED'
- [ ] arrival_time is set
- [ ] distance_km is saved

**5. Driver Checklist**
```typescript
// Test 5: Get today's checklist
const testChecklist = async () => {
  const { data } = await getTodayDriverChecklist();
  console.log('Checklist:', data);
};
testChecklist();
```
- [ ] Returns checklist or null
- [ ] Items array present
- [ ] context_type correct

**6. Pre-Trip Checklist**
```typescript
// Test 6: Create pre-trip checklist
const testPreTrip = async (tripId) => {
  const { data } = await createPreTripChecklist(1, tripId);
  console.log('Pre-trip checklist:', data);
};
testPreTrip(1);
```
- [ ] Checklist created
- [ ] context_type is 'DRIVER_PRE_TRIP'
- [ ] Items loaded from template

**7. Driver Reports**
```typescript
// Test 7: Create driver report
const testDriverReport = async () => {
  const { data } = await createDriverReport({
    report_type: 'vehicle_incident',
    site_id: 1,
    vehicle_id: 1,
    title: 'Test Vehicle Report',
    description: 'Testing driver report',
    severity: 'low'
  });
  console.log('Report created:', data);
};
testDriverReport();
```
- [ ] Report created
- [ ] division is 'DRIVER'
- [ ] vehicle_id is saved

**8. Vehicle Management**
```typescript
// Test 8: List vehicles
const testVehicles = async () => {
  const { data } = await listVehicles({ status: 'AVAILABLE' });
  console.log('Vehicles:', data);
};
testVehicles();
```
- [ ] Returns vehicles array
- [ ] Filter by status works
- [ ] Vehicle data complete

**9. Maintenance**
```typescript
// Test 9: Get maintenance due
const testMaintenance = async () => {
  const { data } = await getMaintenanceDue({ days_ahead: 30 });
  console.log('Maintenance due:', data);
};
testMaintenance();
```
- [ ] Returns vehicles due for maintenance
- [ ] next_maintenance_date checked
- [ ] Data accurate

**10. GPS Tracking**
```typescript
// Test 10: Update trip location
const testGPS = async (tripId) => {
  const result = await updateTripLocation({
    trip_id: tripId,
    latitude: '-6.2088',
    longitude: '106.8456',
    accuracy: '10',
    speed: '45'
  });
  console.log('Location updated:', result);
};
testGPS(1);
```
- [ ] Location saved
- [ ] No errors
- [ ] Can retrieve route

**Expected Result**: ✅ All driver API functions work, no errors

---

### FASE 4: Integration Testing ✅

**Objective**: Test complete user flows

#### Flow 1: Parking Entry to Exit

1. **Navigate to Parking Entry**
   - [ ] Go to `/parking/entry`
   - [ ] Page loads correctly

2. **Create Entry**
   - [ ] Enter license plate: "B 9999 TEST"
   - [ ] Select vehicle type: "CAR"
   - [ ] Upload photo (optional)
   - [ ] Click "Confirm Entry"
   - [ ] Verify success message
   - [ ] Redirected to dashboard

3. **Verify Entry in Dashboard**
   - [ ] Go to `/parking/dashboard`
   - [ ] See active sessions count increased
   - [ ] Can see the new entry

4. **Create Exit**
   - [ ] Go to `/parking/exit`
   - [ ] Enter same license plate: "B 9999 TEST"
   - [ ] Enter fee: "5000"
   - [ ] Click "Confirm Exit"
   - [ ] Verify success message

5. **Verify Exit in Dashboard**
   - [ ] Active sessions count decreased
   - [ ] Completed sessions count increased
   - [ ] Revenue updated

**Expected Result**: ✅ Complete flow works end-to-end

#### Flow 2: Driver Trip Management

1. **Create Trip**
   - [ ] Go to `/driver/trips`
   - [ ] Click "New Trip"
   - [ ] Fill form:
     - Origin: "Warehouse"
     - Destination: "Client Office"
     - Vehicle: Select from dropdown
   - [ ] Submit
   - [ ] Verify trip created

2. **Start Trip**
   - [ ] Click on the trip
   - [ ] Click "Start Trip"
   - [ ] Verify status changed to "IN_PROGRESS"

3. **Complete Pre-Trip Checklist**
   - [ ] Go to checklist tab
   - [ ] Complete all items
   - [ ] Verify checklist completed

4. **Complete Trip**
   - [ ] Click "Complete Trip"
   - [ ] Enter distance: "15.5 km"
   - [ ] Add notes
   - [ ] Submit
   - [ ] Verify status changed to "COMPLETED"

5. **Complete Post-Trip Checklist**
   - [ ] Complete post-trip items
   - [ ] Verify all saved

**Expected Result**: ✅ Complete trip flow works

#### Flow 3: Supervisor Menu Navigation

1. **Test Reporting Flow**
   - [ ] Navigate: Reporting → DAR
   - [ ] Page loads
   - [ ] Can create new DAR
   - [ ] Navigate: Reporting → Visitors
   - [ ] Page loads
   - [ ] Navigate: Reporting → Intelligence
   - [ ] Page loads

2. **Test Patrol Flow**
   - [ ] Navigate: Patrol → Schedule
   - [ ] Page loads
   - [ ] Navigate: Patrol → Assignment
   - [ ] Page loads
   - [ ] Navigate: Patrol → Targets
   - [ ] Page loads

3. **Test Incident Flow**
   - [ ] Navigate: Incident → LK-LP
   - [ ] Page loads
   - [ ] Navigate: Incident → BAP
   - [ ] Page loads
   - [ ] Navigate: Incident → Findings
   - [ ] Page loads

4. **Test Master Data Flow**
   - [ ] Navigate: Master Data → Workers
   - [ ] Page loads
   - [ ] Navigate: Master Data → Assets
   - [ ] Page loads
   - [ ] Navigate: Master Data → CCTV Zones
   - [ ] Page loads

**Expected Result**: ✅ All menu navigation works, no 404

---

### FASE 5: Performance Testing ✅

**Objective**: Verify system performance

#### Test Cases:

**1. API Response Time**
```bash
# Test dengan curl
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/parking/dashboard?site_id=1
```
- [ ] Response time < 500ms for simple queries
- [ ] Response time < 2s for complex queries
- [ ] No timeout errors

**2. Menu Loading**
- [ ] Sidebar loads in < 100ms
- [ ] Menu expand/collapse is smooth
- [ ] No lag when clicking menu items

**3. Data Loading**
- [ ] Dashboard loads in < 2s
- [ ] List pages load in < 3s
- [ ] Detail pages load in < 1s

**4. File Upload**
- [ ] Photo upload works
- [ ] Multiple files upload works
- [ ] Progress indicator shows

**Expected Result**: ✅ System performs well

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: Menu tidak muncul
**Solution**:
- Clear browser cache (Ctrl+Shift+R)
- Check console for errors
- Verify user has supervisor/admin role

### Issue 2: API returns 404
**Solution**:
- Check backend is running
- Verify API endpoint exists
- Check network tab for actual URL called

### Issue 3: API returns 401 Unauthorized
**Solution**:
- Re-login
- Check token in localStorage
- Verify token not expired

### Issue 4: Data tidak muncul
**Solution**:
- Check if mock data exists in database
- Run: `python3 backend/scripts/create_mock_data.py`
- Verify filter parameters

### Issue 5: Photo upload gagal
**Solution**:
- Check file size < 10MB
- Check file type (jpg, png)
- Check media directory writable

---

## ✅ TESTING CHECKLIST SUMMARY

### Menu Sidebar (80+ items)
- [ ] All categories accessible
- [ ] Collapse/expand works
- [ ] Active state correct
- [ ] No 404 errors

### Parking API (25 functions)
- [ ] Dashboard works
- [ ] Entry/Exit works
- [ ] Reports work
- [ ] Statistics work
- [ ] Checklist works

### Driver API (35 functions)
- [ ] Trip management works
- [ ] Vehicle management works
- [ ] Checklist works
- [ ] Reports work
- [ ] GPS tracking works
- [ ] Maintenance works

### Integration
- [ ] Parking flow complete
- [ ] Driver flow complete
- [ ] Supervisor navigation complete

### Performance
- [ ] Response times acceptable
- [ ] UI smooth and responsive
- [ ] No memory leaks

---

## 📊 TESTING REPORT TEMPLATE

```
TESTING REPORT
Date: [Date]
Tester: [Name]
Environment: [Dev/Staging/Prod]

RESULTS:
✅ Passed: [X] tests
❌ Failed: [Y] tests
⚠️  Warnings: [Z] issues

CRITICAL ISSUES:
1. [Issue description]
2. [Issue description]

MINOR ISSUES:
1. [Issue description]
2. [Issue description]

RECOMMENDATIONS:
1. [Recommendation]
2. [Recommendation]

OVERALL STATUS: [PASS/FAIL]
```

---

## 🎯 NEXT STEPS AFTER TESTING

### If All Tests Pass ✅:
1. Deploy to staging
2. User acceptance testing
3. Deploy to production
4. Monitor for issues

### If Tests Fail ❌:
1. Document all failures
2. Create bug tickets
3. Fix issues
4. Re-test
5. Repeat until all pass

---

**Testing Guide Created By**: AI Assistant
**Date**: 25 Desember 2024
**Status**: Ready for Use ✅

**Good luck with testing!** 🚀

