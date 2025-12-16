# Verolux Management System - Complete System Documentation

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Frontend Architecture](#frontend-architecture)
6. [Authentication & Authorization](#authentication--authorization)
7. [Feature Flowcharts](#feature-flowcharts)
8. [Deployment Guide](#deployment-guide)
9. [Development Guide](#development-guide)

---

## Executive Summary

**Verolux Management System** adalah platform manajemen tenaga kerja dan pelaporan operasional terpadu yang dirancang untuk tiga divisi layanan: **Security**, **Cleaning**, dan **Driver/Parking**. Sistem ini menggunakan arsitektur unified platform di mana divisi adalah field konfigurasi, bukan aplikasi terpisah.

### Key Features

- ✅ **Multi-Division Support**: Security, Cleaning, Driver, Parking
- ✅ **Unified Attendance System**: QR Code + GPS + Photo Evidence
- ✅ **Checklist System**: Template-based dengan evidence tracking
- ✅ **Reporting System**: Incident reports, DAR, cleaning issues
- ✅ **RBAC (Role-Based Access Control)**: Roles, Permissions, User Management
- ✅ **Master Data Management**: Sites, Zones, Incident Types, Status Types, dll
- ✅ **Shift Management**: Shift scheduling, exchange, handover
- ✅ **Passdown Notes**: Division-filtered handover notes
- ✅ **GPS Tracking**: Real-time location tracking
- ✅ **CCTV Integration**: Camera management dan streaming
- ✅ **Control Center**: Real-time dashboard untuk supervisor
- ✅ **Mobile-First Design**: Responsive untuk field staff

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Mobile     │  │    Web       │  │  Supervisor │       │
│  │   (React)    │  │  (React)     │  │  Dashboard  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼──────────────────┼─────────────────┼──────────────┘
          │                  │                 │
          └──────────────────┼─────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway    │
                    │  (FastAPI Router)│
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐    ┌───────▼──────┐   ┌──────▼──────┐
    │  Security │    │   Cleaning   │   │   Driver   │
    │  Routes   │    │   Routes     │   │   Routes    │
    └─────┬─────┘    └───────┬──────┘   └──────┬──────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Shared Services│
                    │  - Auth         │
                    │  - Attendance   │
                    │  - Checklist    │
                    │  - Reports      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Database      │
                    │  (SQLite/PostgreSQL)│
                    └─────────────────┘
```

### Backend Structure

```
backend/app/
├── main.py                 # FastAPI application entry point
├── api/                    # API routes
│   ├── router.py          # Main router (includes all routes)
│   ├── auth_routes.py     # Authentication endpoints
│   ├── admin_routes.py    # Admin & RBAC endpoints
│   ├── supervisor_routes.py # Supervisor endpoints
│   ├── master_data_routes.py # Master data CRUD
│   └── ...                 # Other route files
├── divisions/              # Division-specific modules
│   ├── security/
│   │   ├── routes.py      # Security-specific endpoints
│   │   ├── models.py      # Security models
│   │   └── schemas.py     # Security schemas
│   ├── cleaning/
│   └── driver/
├── models/                 # Shared database models
│   ├── user.py
│   ├── attendance.py
│   ├── permission.py
│   ├── master_data.py
│   └── ...
├── services/               # Business logic services
│   ├── shift_calculator.py
│   ├── payroll_service.py
│   ├── kta_service.py
│   └── ...
└── core/                   # Core utilities
    ├── database.py
    ├── security.py
    ├── exceptions.py
    └── ...
```

### Frontend Structure

```
frontend/web/src/
├── main.tsx               # Application entry point
├── App.tsx                # Root component
├── routes/
│   └── AppRoutes.tsx     # Route definitions
├── modules/               # Feature modules
│   ├── security/          # Security division pages
│   ├── cleaning/          # Cleaning division pages
│   ├── supervisor/       # Supervisor pages
│   ├── admin/            # Admin pages
│   └── shared/           # Shared components
├── api/                   # API client functions
│   ├── authApi.ts
│   ├── securityApi.ts
│   ├── supervisorApi.ts
│   └── ...
├── components/            # Global components
│   ├── PermissionGate.tsx
│   ├── RoleBasedRoute.tsx
│   └── ...
├── hooks/                 # Custom hooks
│   └── usePermissions.ts
└── stores/                # State management
    └── authStore.ts
```

---

## Database Schema

### Core Tables

#### Users & Authentication
- **users**: User accounts dengan role, division, company_id
- **roles**: Role definitions (admin, supervisor, guard, dll)
- **permissions**: Permission definitions (read, write, delete, manage)
- **role_permissions**: Many-to-many relationship
- **user_permissions**: Direct user permissions (optional)

#### Attendance
- **attendance**: Unified attendance table untuk semua divisi
  - Fields: user_id, site_id, checkin_time, checkout_time, division, status
  - GPS validation, photo evidence

#### Checklists
- **checklist_templates**: Template definitions
- **checklists**: Checklist instances (shared table)
- **checklist_items**: Checklist item instances
- **evidence**: Photo/document evidence

#### Reports
- **security_reports**: Security incident reports & DAR
  - Fields: division, report_type, title, description, status
  - Supports: SECURITY, CLEANING divisions

#### Master Data
- **master_data**: Generic master data table
  - Fields: category, code, name, division, is_active
  - Categories: ZONE_TYPE, INCIDENT_TYPE, STATUS_TYPE, VISITOR_CATEGORY, VEHICLE_TYPE, dll

#### Sites & Zones
- **sites**: Site/location definitions
- **cleaning_zones**: Zone definitions (division field untuk filtering)

#### Shifts
- **shifts**: Shift definitions
- **shift_handovers**: Passdown/handover notes

#### Other Tables
- **gps_tracks**: GPS tracking data
- **cctv_cameras**: CCTV camera definitions
- **visitors**: Visitor management
- **trainings**: Training management
- **documents**: Document control
- **payrolls**: Payroll records
- **employees**: Employee database
- **audit_logs**: Audit trail

### Entity Relationship Diagram (Simplified)

```
users ──┬── attendance
        ├── checklists
        ├── security_reports
        ├── shift_handovers
        └── roles (via role_id)

sites ──┬── attendance
        ├── checklists
        ├── security_reports
        └── cleaning_zones

roles ──┴── permissions (many-to-many via role_permissions)

master_data ── (standalone, referenced by other tables via category)
```

---

## API Documentation

### Base URL
- Development: `http://localhost:8000`
- Production: Configure via environment variables

### Authentication Endpoints

#### POST `/api/auth/login`
Login user dan mendapatkan JWT token.

**Request:**
```json
{
  "username": "user123",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "user123",
    "role": "guard",
    "division": "security",
    "company_id": 1
  }
}
```

#### GET `/api/auth/me`
Get current user information dengan permissions.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "username": "user123",
  "role": "guard",
  "division": "security",
  "permissions": [
    {"resource": "attendance", "action": "read"},
    {"resource": "reports", "action": "write"}
  ]
}
```

### Division-Specific Endpoints

#### Security Division

**Passdown Notes:**
- `GET /api/security/passdown/notes` - List passdown notes (filtered by division)
- `POST /api/security/passdown/notes` - Create passdown note
- `POST /api/security/passdown/notes/{id}/acknowledge` - Acknowledge note

**Patrol:**
- `GET /api/security/patrols` - List patrol logs
- `POST /api/security/patrols` - Create patrol log
- `GET /api/security/patrols/{id}/gps-track` - Get GPS track

**Reports:**
- `GET /api/security/reports` - List security reports
- `POST /api/security/reports` - Create report
- `GET /api/security/reports/{id}` - Get report detail

#### Cleaning Division

**Tasks/Checklists:**
- `GET /api/cleaning/tasks` - List cleaning tasks
- `GET /api/cleaning/tasks/{id}/detail` - Get task detail
- `POST /api/cleaning/tasks` - Create task

**Reports:**
- `GET /api/cleaning/reports` - List cleaning reports
- `POST /api/cleaning/reports` - Create report

### Supervisor Endpoints

**Dashboard:**
- `GET /api/supervisor/overview` - Dashboard overview dengan KPIs
- `GET /api/supervisor/manpower` - Manpower per area
- `GET /api/supervisor/patrol-activity` - Patrol activity list

**Management:**
- `GET /api/supervisor/sites` - List sites
- `POST /api/supervisor/sites` - Create site
- `PATCH /api/supervisor/sites/{id}` - Update site
- `DELETE /api/supervisor/sites/{id}` - Delete site

### Admin Endpoints

**RBAC:**
- `GET /api/admin/roles` - List roles
- `GET /api/admin/permissions` - List permissions
- `GET /api/admin/roles/{id}/permissions` - Get role permissions
- `POST /api/admin/roles/{id}/permissions` - Update role permissions
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/{id}` - Update user (role, division, etc.)

**Master Data:**
- `GET /api/master-data` - List master data
- `GET /api/master-data/{category}` - Get by category
- `POST /api/master-data` - Create master data
- `PUT /api/master-data/{id}` - Update master data
- `DELETE /api/master-data/{id}` - Delete master data

---

## Frontend Architecture

### Routing Structure

```
/ (root)
├── /login
├── /security/
│   ├── /dashboard
│   ├── /attendance
│   ├── /reports
│   ├── /patrols
│   ├── /passdown
│   └── ...
├── /cleaning/
│   ├── /dashboard
│   ├── /tasks
│   ├── /reports
│   └── ...
├── /supervisor/
│   ├── /dashboard
│   ├── /attendance
│   ├── /reports
│   ├── /admin/
│   │   ├── /master-data
│   │   ├── /master-data/roles
│   │   ├── /master-data/sites
│   │   └── ...
│   └── ...
└── /shared/
    ├── /profile
    └── /attendance/qr
```

### Component Hierarchy

```
App
└── BrowserRouter
    └── Routes
        ├── LoginPage
        ├── ProtectedRoute
        │   └── DivisionLayout (SecurityLayout/CleaningLayout)
        │       └── MobileLayout
        │           ├── Header
        │           ├── Page Content
        │           └── BottomNav
        └── SupervisorLayout
            └── Sidebar + Content
```

### State Management

**Zustand Stores:**
- `authStore`: Authentication state (user, token, division)
- `themeStore`: Theme preferences

**React Context:**
- `SiteContext`: Selected site untuk filtering

**Custom Hooks:**
- `usePermissions`: Permission checking
- `usePullToRefresh`: Pull-to-refresh functionality

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. POST /api/auth/login
     ▼
┌─────────────────┐
│   Backend       │
│  - Validate     │
│  - Check user   │
│  - Generate JWT │
└────┬────────────┘
     │ 2. Return token + user data
     ▼
┌─────────────────┐
│   Frontend      │
│  - Store token  │
│  - Store user   │
│  - Redirect     │
└─────────────────┘
```

### Authorization Flow (RBAC)

```
┌─────────┐
│  User   │
└────┬────┘
     │ Request with JWT
     ▼
┌─────────────────┐
│  get_current_user│
│  - Decode JWT   │
│  - Get user     │
│  - Get role     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Permission     │
│  Check          │
│  - Get role     │
│  - Get perms    │
│  - Check access │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Allow/Deny    │
└─────────────────┘
```

### Permission System

**Resources:**
- `attendance`, `reports`, `checklists`, `patrols`, `passdown`, `sites`, `master_data`, `roles`, `permissions`, dll

**Actions:**
- `read`: View data
- `write`: Create/Update data
- `delete`: Delete data
- `manage`: Full control

**Permission Checking:**
- Backend: Via `require_admin`, `require_supervisor`, atau custom permission check
- Frontend: Via `PermissionGate` component atau `usePermissions` hook

---

## Feature Flowcharts

### 1. Attendance Flow

```
START
  │
  ▼
User opens Attendance Page
  │
  ▼
Select Site (if multiple)
  │
  ▼
┌─────────────────────┐
│ Check-In Process    │
│ 1. Scan QR Code     │
│ 2. Capture Photo    │
│ 3. Get GPS Location │
│ 4. Validate Location│
└──────┬──────────────┘
       │
       ▼
   Valid?
   │    │
  YES  NO
   │    │
   │    └──► Show Error
   │
   ▼
POST /api/attendance/checkin
  │
  ▼
Success?
  │    │
 YES  NO
  │    │
  │    └──► Show Error
  │
  ▼
Show Success Message
  │
  ▼
END
```

### 2. Report Creation Flow

```
START
  │
  ▼
User clicks "Create Report"
  │
  ▼
Select Report Type
  │
  ▼
Fill Form:
  - Title
  - Description
  - Location
  - Evidence (photos)
  │
  ▼
Submit
  │
  ▼
POST /api/{division}/reports
  │
  ▼
Backend:
  - Validate data
  - Save report
  - Save evidence files
  - Set division from user
  │
  ▼
Success?
  │    │
 YES  NO
  │    │
  │    └──► Show Error
  │
  ▼
Show Success
  │
  ▼
Redirect to Reports List
  │
  ▼
END
```

### 3. Checklist Flow

```
START
  │
  ▼
User scans QR Code / Selects Task
  │
  ▼
Load Checklist Template
  │
  ▼
Display Checklist Items
  │
  ▼
User completes items:
  - Mark status
  - Add photos (if required)
  - Add notes
  │
  ▼
Submit Checklist
  │
  ▼
POST /api/{division}/checklist
  │
  ▼
Backend:
  - Validate required items
  - Save checklist
  - Save items
  - Save evidence
  - Calculate completion %
  │
  ▼
Success?
  │    │
 YES  NO
  │    │
  │    └──► Show Error
  │
  ▼
Show Success
  │
  ▼
END
```

### 4. Passdown Notes Flow (Division-Filtered)

```
START
  │
  ▼
User opens Passdown Page
  │
  ▼
GET /api/security/passdown/notes
  │
  ▼
Backend:
  - Get user division
  - Check role (supervisor/admin?)
  │
  ▼
Is Supervisor/Admin?
  │    │
 YES  NO
  │    │
  │    └──► Filter by division
  │         (Join with User table)
  │
  ▼
Return all notes
  │
  ▼
Return filtered notes
  │
  ▼
Display Notes List
  │
  ▼
User can:
  - View notes
  - Create note
  - Acknowledge note
  │
  ▼
END
```

### 5. Master Data Management Flow

```
START
  │
  ▼
Admin opens Master Data Main Page
  │
  ▼
Select Category:
  - Roles
  - Sites
  - Zones
  - Incident Types
  - Status Types
  - Visitor Categories
  - Vehicle Types
  - Other
  │
  ▼
Navigate to Sub-Page
  │
  ▼
Load Data (GET /api/master-data?category=...)
  │
  ▼
Display Table
  │
  ▼
User Actions:
  - Create New
  - Edit Existing
  - Delete
  - Filter by Division
  │
  ▼
CRUD Operations:
  - POST /api/master-data (Create)
  - PUT /api/master-data/{id} (Update)
  - DELETE /api/master-data/{id} (Delete)
  │
  ▼
Refresh List
  │
  ▼
END
```

### 6. RBAC Flow (Role & Permission Management)

```
START
  │
  ▼
Admin opens Roles & Permissions Page
  │
  ▼
Load Roles (GET /api/admin/roles)
Load Permissions (GET /api/admin/permissions)
  │
  ▼
Select Role
  │
  ▼
Load Role Permissions
  (GET /api/admin/roles/{id}/permissions)
  │
  ▼
Display Permission Checkboxes
  │
  ▼
Admin checks/unchecks permissions
  │
  ▼
Save (POST /api/admin/roles/{id}/permissions)
  │
  ▼
Backend:
  - Clear existing permissions
  - Add new permissions
  - Update role_permissions table
  │
  ▼
Success
  │
  ▼
Load Users with this Role
  │
  ▼
Admin can:
  - View users
  - Update user role
  │
  ▼
END
```

---

## Deployment Guide

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (production) atau SQLite (development)
- Nginx (optional, untuk reverse proxy)

### Backend Deployment

1. **Setup Virtual Environment:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure Environment:**
```bash
# Create .env file
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-secret-key
ENVIRONMENT=production
```

3. **Run Migrations:**
```bash
alembic upgrade head
```

4. **Create Admin User:**
```bash
python scripts/create_admin_user.py
```

5. **Start Server:**
```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production (with Gunicorn)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment

1. **Install Dependencies:**
```bash
cd frontend/web
npm install
```

2. **Build for Production:**
```bash
npm run build
```

3. **Serve with Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/frontend/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Development Guide

### Adding New Feature

1. **Backend:**
   - Create model in `backend/app/models/`
   - Create routes in `backend/app/api/` or `backend/app/divisions/{division}/routes.py`
   - Register routes in `backend/app/api/router.py`
   - Create migration: `alembic revision --autogenerate -m "description"`

2. **Frontend:**
   - Create page in `frontend/web/src/modules/{division}/pages/`
   - Create API functions in `frontend/web/src/api/{division}Api.ts`
   - Add route in `frontend/web/src/routes/AppRoutes.tsx`
   - Add menu item in layout (if needed)

### Database Migration

```bash
# Create migration
alembic revision --autogenerate -m "add_new_table"

# Review migration file
# Edit if needed

# Apply migration
alembic upgrade head

# Rollback (if needed)
alembic downgrade -1
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend (manual testing)
cd frontend/web
npm run dev
```

---

## Security Considerations

1. **Authentication:**
   - JWT tokens dengan expiration
   - Password hashing dengan bcrypt
   - Token refresh mechanism

2. **Authorization:**
   - Role-based access control (RBAC)
   - Permission-based fine-grained control
   - Division-based data filtering

3. **Data Security:**
   - Company-level data isolation
   - Division-based filtering untuk passdown notes
   - Input validation dan sanitization

4. **API Security:**
   - CORS configuration
   - Rate limiting (recommended)
   - HTTPS in production

---

## Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Check DATABASE_URL in .env
   - Verify database is running
   - Check credentials

2. **Permission Denied:**
   - Verify user role and permissions
   - Check PermissionGate components
   - Review RBAC configuration

3. **CORS Errors:**
   - Check CORS settings in backend
   - Verify frontend URL in allowed origins

4. **Missing Columns:**
   - Run migrations: `alembic upgrade head`
   - Or use manual scripts in `backend/scripts/`

---

## Future Enhancements

- [ ] WebSocket untuk real-time updates
- [ ] Advanced analytics dan reporting
- [ ] Mobile native apps (React Native)
- [ ] Offline-first dengan IndexedDB
- [ ] Advanced GPS tracking dengan geofencing
- [ ] Integration dengan external systems
- [ ] Automated testing (unit + integration)
- [ ] CI/CD pipeline

---

## Support & Contact

Untuk pertanyaan atau dukungan, silakan hubungi tim development.

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15  
**Maintained by:** Verolux Development Team

