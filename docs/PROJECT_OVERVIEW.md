# Verolux Management System - Project Overview

Dokumentasi lengkap overview project, fitur, dan arsitektur sistem.

---

## Executive Summary

**Verolux Management System** adalah platform manajemen tenaga kerja dan pelaporan operasional terpadu yang dirancang untuk empat divisi layanan: **Security**, **Cleaning**, **Driver**, dan **Parking**. Sistem ini menggunakan arsitektur **unified platform** di mana divisi adalah field konfigurasi, bukan aplikasi terpisah.

### Key Highlights

- 🎯 **Unified Architecture**: Satu platform untuk semua divisi
- 🔐 **RBAC System**: Role-based access control dengan permissions
- 📱 **Mobile-First**: Responsive design untuk field staff
- 🗄️ **Master Data Management**: Centralized data management
- 📊 **Real-time Dashboard**: Supervisor dashboard dengan KPIs
- 🔄 **Division Filtering**: Data isolation per divisi
- 📝 **Comprehensive Reporting**: Reports dengan evidence tracking
- ✅ **Checklist System**: Template-based dengan completion tracking

---

## System Architecture

### Technology Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- Alembic (Database migrations)
- PostgreSQL/SQLite (Database)
- JWT (Authentication)
- Pydantic (Data validation)

**Frontend:**
- React 18 (UI framework)
- TypeScript (Type safety)
- Vite (Build tool)
- Tailwind CSS (Styling)
- Zustand (State management)
- React Router DOM v6 (Routing)
- Axios (HTTP client)
- Recharts (Data visualization)

### Architecture Pattern

**Unified Platform dengan Division Field:**

```
┌─────────────────────────────────────────┐
│         Unified Platform                │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Shared Core Modules             │  │
│  │   - Attendance                   │  │
│  │   - Checklists                   │  │
│  │   - Reports                      │  │
│  │   - Shifts                       │  │
│  │   - Master Data                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Division-Specific Extensions    │  │
│  │   - Security: Patrol, DAR        │  │
│  │   - Cleaning: Zones, Tasks       │  │
│  │   - Driver: Trips, Vehicles      │  │
│  │   - Parking: Entry/Exit          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Division = Field, not separate app    │
└─────────────────────────────────────────┘
```

---

## Core Features

### 1. Authentication & Authorization

**Features:**
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based fine-grained control
- Division-based data filtering
- Multi-tenant support (company_id)

**Roles:**
- **admin**: Full system access
- **supervisor**: Cross-division oversight
- **guard/cleaner/driver/parking**: Field staff

**Permissions:**
- Resources: `attendance`, `reports`, `checklists`, `master_data`, dll
- Actions: `read`, `write`, `delete`, `manage`

### 2. Attendance System

**Features:**
- QR code scanning
- GPS location validation
- Photo evidence capture
- Geofence validation
- Check-in/Check-out tracking
- Attendance correction workflow

**Flow:**
1. User scans QR code
2. System validates QR
3. User captures photo
4. System gets GPS location
5. System validates geofence
6. System saves attendance record

### 3. Checklist System

**Features:**
- Template-based checklists
- Division-specific templates
- Required vs optional items
- Photo evidence per item
- Completion percentage
- Status tracking (Pending, Completed, N/A, Failed)

**Usage:**
- **Security**: Patrol checklists
- **Cleaning**: Zone-based cleaning tasks
- **Driver**: Pre-trip/post-trip inspections

### 4. Reporting System

**Features:**
- Multiple report types
- Evidence attachment (photos, documents)
- Status workflow
- Division-specific reports
- Supervisor review
- PDF export

**Report Types:**
- Security incidents
- Daily Activity Reports (DAR)
- Cleaning issues
- Vehicle incidents

### 5. Master Data Management

**Structure:**
- Main menu dengan sub-menus
- Categories: Roles, Sites, Zones, Incident Types, Status Types, Visitor Categories, Vehicle Types, Other

**Features:**
- CRUD operations
- Division filtering
- Sort order
- Active/Inactive status
- Bulk operations (future)

**Connections:**
- Roles → Users (via role_id)
- Sites → Attendance, Reports, Checklists
- Zones → Checklists, Reports
- Master Data → Reports, Checklists (via category)

### 6. Passdown Notes (Division-Filtered)

**Features:**
- Create passdown notes
- Division-based filtering
- Acknowledge notes
- Priority levels
- Status tracking

**Filtering Logic:**
- Security users → Only security notes
- Cleaning users → Only cleaning notes
- Supervisor/Admin → All notes

### 7. Shift Management

**Features:**
- Shift scheduling
- Shift assignment
- Shift exchange requests
- Shift handover
- Calendar view

### 8. GPS Tracking

**Features:**
- Real-time location tracking
- Patrol route visualization
- Geofence validation
- Location history

### 9. CCTV Integration

**Features:**
- Camera management
- Video stream display
- Camera selection
- Fullscreen mode

### 10. Control Center

**Features:**
- Real-time dashboard
- Active patrols map
- Active incidents list
- CCTV grid view
- Panic alerts
- Dispatch tickets

---

## Database Schema Overview

### Core Tables

**Users & Auth:**
- `users`: User accounts
- `roles`: Role definitions
- `permissions`: Permission definitions
- `role_permissions`: Role-Permission mapping
- `user_permissions`: Direct user permissions

**Attendance:**
- `attendance`: Unified attendance table

**Checklists:**
- `checklist_templates`: Template definitions
- `checklists`: Checklist instances
- `checklist_items`: Item instances
- `evidence`: Photo/document evidence

**Reports:**
- `security_reports`: Security reports & DAR

**Master Data:**
- `master_data`: Generic master data
- `sites`: Site definitions
- `cleaning_zones`: Zone definitions

**Shifts:**
- `shifts`: Shift definitions
- `shift_handovers`: Passdown notes

**Other:**
- `gps_tracks`: GPS tracking data
- `cctv_cameras`: CCTV cameras
- `visitors`: Visitor management
- `trainings`: Training records
- `documents`: Document control
- `payrolls`: Payroll records
- `employees`: Employee database
- `audit_logs`: Audit trail

---

## API Structure

### Base Routes

```
/api/auth/*          - Authentication
/api/attendance/*    - Attendance
/api/supervisor/*    - Supervisor endpoints
/api/admin/*         - Admin & RBAC
/api/master-data/*   - Master data CRUD
/api/security/*     - Security division
/api/cleaning/*     - Cleaning division
/api/driver/*       - Driver division
/api/parking/*      - Parking division
```

### Key Endpoints

**Authentication:**
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Master Data:**
- `GET /api/master-data` - List all
- `GET /api/master-data/{category}` - Get by category
- `POST /api/master-data` - Create
- `PUT /api/master-data/{id}` - Update
- `DELETE /api/master-data/{id}` - Delete

**Passdown Notes:**
- `GET /api/security/passdown/notes` - List (division-filtered)
- `POST /api/security/passdown/notes` - Create
- `POST /api/security/passdown/notes/{id}/acknowledge` - Acknowledge

---

## Frontend Structure

### Routing

```
/ (root)
├── /login
├── /security/*
├── /cleaning/*
├── /driver/*
├── /parking/*
└── /supervisor/*
    └── /admin/*
        └── /master-data/*
```

### Component Organization

```
modules/
├── security/        # Security division pages
├── cleaning/        # Cleaning division pages
├── driver/          # Driver division pages
├── parking/         # Parking division pages
├── supervisor/      # Supervisor pages
├── admin/           # Admin pages
└── shared/          # Shared components
```

---

## Security Features

### Authentication
- JWT tokens dengan expiration
- Password hashing (bcrypt)
- Token refresh mechanism

### Authorization
- Role-based access control
- Permission-based fine-grained control
- Division-based data filtering

### Data Security
- Company-level isolation
- Division-based filtering
- Input validation
- SQL injection prevention (SQLAlchemy)

---

## Development Workflow

### Adding New Feature

1. **Backend:**
   - Create model
   - Create routes
   - Create services
   - Create migration
   - Test

2. **Frontend:**
   - Create page
   - Create API functions
   - Add route
   - Add menu item
   - Test

### Database Migration

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

Manual testing via browser:
- Chrome DevTools
- React DevTools
- Network tab monitoring

---

## Deployment

### Development

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend/web
npm run dev
```

### Production

```bash
# Backend (with Gunicorn)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Frontend (build)
npm run build
# Serve with Nginx
```

---

## Future Enhancements

- [ ] WebSocket untuk real-time updates
- [ ] Advanced analytics
- [ ] Mobile native apps
- [ ] Offline-first dengan IndexedDB
- [ ] Advanced GPS tracking
- [ ] Integration dengan external systems
- [ ] Automated testing
- [ ] CI/CD pipeline

---

## Support

Untuk pertanyaan atau dukungan, silakan hubungi tim development.

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15  
**Maintained by:** Verolux Development Team

