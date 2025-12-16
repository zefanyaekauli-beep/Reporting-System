# Verolux Management System - System Flowcharts

Dokumentasi flowchart lengkap untuk semua fitur utama sistem.

---

## 1. Authentication & Login Flow

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Navigate to /login
       ▼
┌─────────────────┐
│  Login Page     │
│  - Username     │
│  - Password     │
└──────┬──────────┘
       │
       │ 2. Submit form
       ▼
┌─────────────────┐
│  POST /api/auth/│
│      login       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Validate     │
│  - Check user   │
│  - Verify pwd   │
└──────┬──────────┘
       │
       │ Valid?
       ├─── NO ───► Return 401 Error
       │
       ▼ YES
┌─────────────────┐
│  Generate JWT   │
│  - User ID      │
│  - Role         │
│  - Division     │
│  - Company ID   │
└──────┬──────────┘
       │
       │ 3. Return token + user data
       ▼
┌─────────────────┐
│  Frontend       │
│  - Store token  │
│  - Store user   │
│  - Set division │
└──────┬──────────┘
       │
       │ 4. Redirect based on division
       ▼
┌─────────────────┐
│  Division       │
│  Dashboard      │
└─────────────────┘
```

---

## 2. Attendance Check-In Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Open Attendance Page
       ▼
┌─────────────────┐
│  Attendance     │
│  Page           │
└──────┬──────────┘
       │
       │ 2. Select Site (if multiple)
       ▼
┌─────────────────┐
│  QR Scan /     │
│  Manual Entry   │
└──────┬──────────┘
       │
       │ 3. Scan QR Code
       ▼
┌─────────────────┐
│  Validate QR   │
│  - Check site   │
│  - Verify code │
└──────┬──────────┘
       │
       │ Valid?
       ├─── NO ───► Show Error
       │
       ▼ YES
┌─────────────────┐
│  Capture Photo  │
│  (Required)      │
└──────┬──────────┘
       │
       │ 4. Get GPS Location
       ▼
┌─────────────────┐
│  GPS Validation │
│  - Get coords   │
│  - Check geofence│
└──────┬──────────┘
       │
       │ Within geofence?
       ├─── NO ───► Show Warning (allow with override)
       │
       ▼ YES
┌─────────────────┐
│  POST /api/     │
│  attendance/    │
│  checkin        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Save record  │
│  - Store photo  │
│  - Save GPS     │
│  - Set status   │
└──────┬──────────┘
       │
       │ Success?
       ├─── NO ───► Show Error
       │
       ▼ YES
┌─────────────────┐
│  Show Success   │
│  - Check-in time│
│  - Location     │
└─────────────────┘
```

---

## 3. Report Creation Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Click "Create Report"
       ▼
┌─────────────────┐
│  Report Form    │
│  - Type         │
│  - Title        │
│  - Description  │
│  - Location     │
└──────┬──────────┘
       │
       │ 2. Fill form
       ▼
┌─────────────────┐
│  Add Evidence   │
│  - Photos       │
│  - Documents    │
└──────┬──────────┘
       │
       │ 3. Submit
       ▼
┌─────────────────┐
│  POST /api/     │
│  {division}/    │
│  reports        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Validate     │
│  - Set division │
│  - Save report  │
│  - Upload files │
│  - Link evidence│
└──────┬──────────┘
       │
       │ Success?
       ├─── NO ───► Show Error
       │
       ▼ YES
┌─────────────────┐
│  Show Success   │
│  Redirect to    │
│  Reports List   │
└─────────────────┘
```

---

## 4. Checklist Completion Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Scan QR / Select Task
       ▼
┌─────────────────┐
│  Load Template  │
│  GET /api/      │
│  checklist-     │
│  templates/{id} │
└──────┬──────────┘
       │
       │ 2. Display Items
       ▼
┌─────────────────┐
│  Checklist      │
│  Form           │
│  - Item 1       │
│  - Item 2       │
│  - ...          │
└──────┬──────────┘
       │
       │ 3. Complete Items
       │    - Mark status
       │    - Add photos
       │    - Add notes
       ▼
┌─────────────────┐
│  Validate       │
│  - Required items│
│  - Photo reqs   │
└──────┬──────────┘
       │
       │ Valid?
       ├─── NO ───► Show Error
       │
       ▼ YES
┌─────────────────┐
│  POST /api/     │
│  {division}/    │
│  checklist      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Save checklist│
│  - Save items   │
│  - Save evidence│
│  - Calc %       │
│  - Update status│
└──────┬──────────┘
       │
       │ Success?
       ├─── NO ───► Show Error
       │
       ▼ YES
┌─────────────────┐
│  Show Success   │
│  Completion %    │
└─────────────────┘
```

---

## 5. Passdown Notes Flow (Division-Filtered)

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Open Passdown Page
       ▼
┌─────────────────┐
│  GET /api/      │
│  security/      │
│  passdown/notes │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Get user      │
│  - Get division  │
│  - Get role      │
└──────┬──────────┘
       │
       │ Is Supervisor/Admin?
       ├─── YES ───┐
       │           │
       │           ▼
       │    ┌─────────────────┐
       │    │ Return ALL notes│
       │    │ (no filter)     │
       │    └─────────────────┘
       │
       ▼ NO
┌─────────────────┐
│  Filter by      │
│  Division:      │
│  - Join User    │
│  - Match division│
└──────┬──────────┘
       │
       │ 2. Return filtered notes
       ▼
┌─────────────────┐
│  Frontend       │
│  - Display notes│
│  - Show division│
└──────┬──────────┘
       │
       │ 3. User Actions
       ▼
┌─────────────────┐
│  Options:       │
│  - View detail  │
│  - Create note  │
│  - Acknowledge  │
└─────────────────┘
```

---

## 6. Master Data Management Flow

```
┌─────────────┐
│   Admin     │
└──────┬──────┘
       │
       │ 1. Open Master Data Main Page
       ▼
┌─────────────────┐
│  Master Data    │
│  Main Page       │
│  (Grid Menu)     │
└──────┬──────────┘
       │
       │ 2. Select Category
       ▼
┌─────────────────┐
│  Categories:    │
│  - Roles         │
│  - Sites         │
│  - Zones         │
│  - Incident Types│
│  - Status Types  │
│  - Visitor Cats  │
│  - Vehicle Types │
│  - Other         │
└──────┬──────────┘
       │
       │ 3. Navigate to Sub-Page
       ▼
┌─────────────────┐
│  Sub-Page       │
│  (e.g., Sites)  │
└──────┬──────────┘
       │
       │ 4. Load Data
       ▼
┌─────────────────┐
│  GET /api/      │
│  master-data?   │
│  category=...   │
└──────┬──────────┘
       │
       │ 5. Display Table
       ▼
┌─────────────────┐
│  Data Table     │
│  - List items    │
│  - Actions       │
└──────┬──────────┘
       │
       │ 6. User Action
       ▼
┌─────────────────┐
│  Actions:       │
│  - Create New   │
│  - Edit         │
│  - Delete       │
│  - Filter       │
└──────┬──────────┘
       │
       │ 7. CRUD Operation
       ▼
┌─────────────────┐
│  API Call:      │
│  - POST (Create) │
│  - PUT (Update) │
│  - DELETE       │
└──────┬──────────┘
       │
       │ 8. Refresh List
       ▼
┌─────────────────┐
│  Updated Table  │
└─────────────────┘
```

---

## 7. RBAC Flow (Role & Permission Management)

```
┌─────────────┐
│   Admin     │
└──────┬──────┘
       │
       │ 1. Open Roles & Permissions
       ▼
┌─────────────────┐
│  Load Data:     │
│  - Roles        │
│  - Permissions  │
└──────┬──────────┘
       │
       │ 2. Select Role
       ▼
┌─────────────────┐
│  Load Role      │
│  Permissions    │
│  GET /api/admin/│
│  roles/{id}/    │
│  permissions    │
└──────┬──────────┘
       │
       │ 3. Display Permissions
       ▼
┌─────────────────┐
│  Permission     │
│  Checkboxes     │
│  - Resource     │
│  - Action       │
└──────┬──────────┘
       │
       │ 4. Admin checks/unchecks
       ▼
┌─────────────────┐
│  Save Changes   │
│  POST /api/admin/│
│  roles/{id}/    │
│  permissions    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Clear old    │
│  - Add new      │
│  - Update table │
└──────┬──────────┘
       │
       │ 5. Load Users
       ▼
┌─────────────────┐
│  Display Users  │
│  with this Role │
└──────┬──────────┘
       │
       │ 6. Admin can update user role
       ▼
┌─────────────────┐
│  PATCH /api/    │
│  admin/users/   │
│  {id}           │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Update User    │
│  Role           │
└─────────────────┘
```

---

## 8. Supervisor Dashboard Flow

```
┌─────────────┐
│ Supervisor  │
└──────┬──────┘
       │
       │ 1. Open Dashboard
       ▼
┌─────────────────┐
│  Load Overview   │
│  GET /api/       │
│  supervisor/     │
│  overview        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Aggregate    │
│  - Calculate KPIs│
│  - Get stats    │
└──────┬──────────┘
       │
       │ 2. Return Data
       ▼
┌─────────────────┐
│  Display:       │
│  - KPI Cards     │
│  - Charts        │
│  - Quick Actions│
└──────┬──────────┘
       │
       │ 3. User Interaction
       ▼
┌─────────────────┐
│  Actions:       │
│  - View Details │
│  - Filter       │
│  - Export       │
└─────────────────┘
```

---

## 9. Patrol Logging Flow (Security)

```
┌─────────────┐
│   Guard     │
└──────┬──────┘
       │
       │ 1. Start Patrol
       ▼
┌─────────────────┐
│  POST /api/     │
│  security/      │
│  patrols        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Create log   │
│  - Set start    │
│  - Track GPS    │
└──────┬──────────┘
       │
       │ 2. During Patrol
       ▼
┌─────────────────┐
│  Update GPS     │
│  - Record track │
│  - Check points │
└──────┬──────────┘
       │
       │ 3. End Patrol
       ▼
┌─────────────────┐
│  PATCH /api/    │
│  security/      │
│  patrols/{id}   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Set end time │
│  - Calculate    │
│  - Save track   │
└─────────────────┘
```

---

## 10. Site Management Flow

```
┌─────────────┐
│   Admin     │
└──────┬──────┘
       │
       │ 1. Open Sites Page
       ▼
┌─────────────────┐
│  Load Sites     │
│  GET /api/      │
│  supervisor/     │
│  sites          │
└──────┬──────────┘
       │
       │ 2. Display Table
       ▼
┌─────────────────┐
│  Sites Table    │
│  - Name         │
│  - Address      │
│  - Coordinates  │
│  - Geofence     │
└──────┬──────────┘
       │
       │ 3. Create/Edit
       ▼
┌─────────────────┐
│  Site Form      │
│  - Name *       │
│  - Address      │
│  - Lat/Lng      │
│  - Geofence     │
└──────┬──────────┘
       │
       │ 4. Submit
       ▼
┌─────────────────┐
│  POST/PATCH     │
│  /api/supervisor│
│  /sites         │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Validate     │
│  - Generate QR  │
│  - Save site    │
└──────┬──────────┘
       │
       │ 5. Refresh List
       ▼
┌─────────────────┐
│  Updated Table  │
└─────────────────┘
```

---

## 11. Data Flow: Division-Based Filtering

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       │ 1. API Request with JWT
       ▼
┌─────────────────┐
│  Extract User   │
│  from JWT       │
│  - ID           │
│  - Division     │
│  - Role         │
└──────┬──────────┘
       │
       │ 2. Check Role
       ▼
┌─────────────────┐
│  Is Supervisor/ │
│  Admin?         │
└──────┬──────────┘
       │
       ├─── YES ───► Return ALL data (no filter)
       │
       ▼ NO
┌─────────────────┐
│  Apply Division │
│  Filter:        │
│  - Join User    │
│  - Match division│
│  - Filter query │
└──────┬──────────┘
       │
       │ 3. Return Filtered Data
       ▼
┌─────────────────┐
│  Response       │
│  (Division-only)│
└─────────────────┘
```

---

## 12. Permission Check Flow (Frontend)

```
┌─────────────┐
│  Component  │
└──────┬──────┘
       │
       │ 1. Render Component
       ▼
┌─────────────────┐
│  PermissionGate │
│  - resource      │
│  - action       │
└──────┬──────────┘
       │
       │ 2. Check Permissions
       ▼
┌─────────────────┐
│  usePermissions │
│  Hook           │
└──────┬──────────┘
       │
       │ 3. Get User Data
       ▼
┌─────────────────┐
│  From Store/API │
│  - Role         │
│  - Permissions  │
└──────┬──────────┘
       │
       │ 4. Check Permission
       ▼
┌─────────────────┐
│  Has Permission?│
└──────┬──────────┘
       │
       ├─── YES ───► Render Component
       │
       ▼ NO
┌─────────────────┐
│  Hide Component │
│  (or show fallback)│
└─────────────────┘
```

---

## 13. Master Data Connection Flow (Roles → Users)

```
┌─────────────┐
│   Admin     │
└──────┬──────┘
       │
       │ 1. Open Master Data > Roles
       ▼
┌─────────────────┐
│  Roles Page    │
│  - List roles   │
│  - Permissions  │
└──────┬──────────┘
       │
       │ 2. Select Role
       ▼
┌─────────────────┐
│  Load Role      │
│  Details:       │
│  - Permissions  │
│  - Users        │
└──────┬──────────┘
       │
       │ 3. View Users with Role
       ▼
┌─────────────────┐
│  Users List     │
│  (Filtered by   │
│   role_id)      │
└──────┬──────────┘
       │
       │ 4. Select User
       ▼
┌─────────────────┐
│  User Details   │
│  - Current role  │
│  - Division      │
│  - Permissions  │
└──────┬──────────┘
       │
       │ 5. Update User Role
       ▼
┌─────────────────┐
│  PATCH /api/    │
│  admin/users/   │
│  {id}           │
│  {role_id: X}   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  - Update role_id│
│  - Update role   │
│  - Refresh user  │
└──────┬──────────┘
       │
       │ 6. User now has new role
       │    and inherits permissions
       ▼
┌─────────────────┐
│  Updated User   │
└─────────────────┘
```

---

## 14. Complete System Flow (End-to-End)

```
┌─────────────────────────────────────────────────────────┐
│                    SYSTEM STARTUP                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Backend: FastAPI Server                                │
│  - Load config                                          │
│  - Connect database                                      │
│  - Register routes                                       │
│  - Start server                                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend: React App                                    │
│  - Load routes                                          │
│  - Initialize stores                                     │
│  - Check auth state                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  User Login                                             │
│  - Authenticate                                         │
│  - Get JWT token                                        │
│  - Load permissions                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Route to Division Dashboard                            │
│  - Security → /security/dashboard                        │
│  - Cleaning → /cleaning/dashboard                       │
│  - Supervisor → /supervisor/dashboard                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  User Operations                                        │
│  - Attendance                                           │
│  - Reports                                              │
│  - Checklists                                           │
│  - Passdown Notes                                       │
│  - etc.                                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 15. Error Handling Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  API Endpoint   │
└──────┬──────────┘
       │
       │ Try
       ▼
┌─────────────────┐
│  Process        │
│  Request        │
└──────┬──────────┘
       │
       │ Error?
       ├─── YES ───┐
       │           │
       │           ▼
       │    ┌─────────────────┐
       │    │  Exception      │
       │    │  Handler        │
       │    └──────┬──────────┘
       │           │
       │           ▼
       │    ┌─────────────────┐
       │    │  Log Error      │
       │    │  - Type         │
       │    │  - Message      │
       │    │  - Stack trace  │
       │    └──────┬──────────┘
       │           │
       │           ▼
       │    ┌─────────────────┐
       │    │  Return Error   │
       │    │  Response:      │
       │    │  - Status code  │
       │    │  - Detail       │
       │    │  - Error code   │
       │    └──────┬──────────┘
       │           │
       │           ▼
       │    ┌─────────────────┐
       │    │  Frontend       │
       │    │  - Catch error  │
       │    │  - Show message │
       │    │  - Log to console│
       │    └─────────────────┘
       │
       ▼ NO
┌─────────────────┐
│  Return Success │
│  Response       │
└─────────────────┘
```

---

## Legend

- **Rectangle**: Process/Step
- **Diamond**: Decision Point
- **Arrow**: Flow Direction
- **Parallel Lines**: Multiple paths

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15

