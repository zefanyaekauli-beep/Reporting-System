# Verolux Management System - Ringkasan Lengkap Sistem

## 📋 Ringkasan Eksekutif

**Verolux Management System** adalah platform manajemen tenaga kerja dan pelaporan operasional terpadu yang dirancang untuk tiga divisi layanan: **Security**, **Cleaning**, dan **Driver/Parking**. Sistem ini menggunakan arsitektur unified platform di mana divisi adalah field konfigurasi, bukan aplikasi terpisah.

### Filosofi Arsitektur: Satu Platform, Tiga Divisi

**Keputusan Desain Kritis:** Sistem ini BUKAN tiga aplikasi terpisah. Ini adalah satu platform terpadu di mana:
- **Division adalah field**, bukan codebase terpisah
- **90% kode backend adalah shared**; divisi hanya berbeda dalam konfigurasi dan presentasi
- **Core modules dibagi** di semua divisi (attendance, checklist, reports, dll)
- **Maintenance burden 3x lebih kecil** dibanding implementasi terpisah

---

## 🏗️ Arsitektur Teknis

### Technology Stack

**Backend:**
- **Framework:** FastAPI (Python 3.10+)
- **Database:** PostgreSQL (SQLite untuk development)
- **ORM:** SQLAlchemy 2.x
- **Authentication:** JWT (JSON Web Tokens)
- **Migrations:** Alembic
- **API Style:** RESTful JSON APIs

**Frontend:**
- **Framework:** React 18 dengan Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom Theme System
- **State Management:** Zustand
- **Routing:** React Router DOM v6
- **Build Tool:** Vite

**Infrastructure:**
- **Arsitektur:** Monolithic (satu FastAPI app, satu database)
- **Deployment:** Docker-ready, Nginx configuration available
- **HTTPS:** Self-signed certificates untuk mobile camera access

### Struktur Backend

```
backend/app/
├── main.py                 # FastAPI application entry point
├── api/                    # API routes
│   ├── router.py          # Main router (includes all routes)
│   ├── auth_routes.py     # Authentication endpoints
│   ├── admin_routes.py    # Admin & RBAC endpoints
│   ├── supervisor_routes.py # Supervisor endpoints
│   ├── attendance_routes.py # Attendance endpoints
│   ├── master_data_routes.py # Master data CRUD
│   └── ...                 # Other route files
├── divisions/              # Division-specific modules
│   ├── security/
│   │   ├── routes.py      # Security-specific endpoints
│   │   ├── models.py      # Security models
│   │   └── schemas.py     # Security schemas
│   ├── cleaning/
│   ├── driver/
│   └── parking/
├── models/                 # Shared database models
│   ├── user.py
│   ├── attendance.py
│   ├── permission.py
│   ├── master_data.py
│   └── ...
├── services/               # Business logic services
│   ├── shift_calculator.py
│   ├── payroll_service.py
│   ├── pdf_service.py
│   └── ...
└── core/                   # Core utilities
    ├── database.py
    ├── security.py
    ├── exceptions.py
    └── ...
```

### Struktur Frontend

```
frontend/web/src/
├── main.tsx               # Application entry point
├── App.tsx                # Root component
├── routes/
│   └── AppRoutes.tsx     # Route definitions
├── modules/               # Feature modules
│   ├── security/          # Security division pages
│   ├── cleaning/          # Cleaning division pages
│   ├── driver/            # Driver division pages
│   ├── parking/           # Parking division pages
│   ├── supervisor/        # Supervisor pages
│   ├── admin/             # Admin pages
│   └── shared/            # Shared components
├── api/                   # API client functions
│   ├── authApi.ts
│   ├── securityApi.ts
│   ├── cleaningApi.ts
│   ├── supervisorApi.ts
│   └── ...
├── stores/                # State management
│   └── authStore.ts
└── components/            # Global components
```

---

## 🔑 Modul Inti yang Dibagi (Shared Core Modules)

### 1. Attendance Module (Shared untuk Semua Divisi)

**Fitur:**
- ✅ QR code-based attendance scanning
- ✅ GPS coordinate capture dan validasi (radius 100 meter dari site)
- ✅ Photo evidence requirement (direct camera capture)
- ✅ Location validation terhadap site geofence
- ✅ Real-time attendance status tracking
- ✅ Late arrival detection dengan grace period
- ✅ Offline mode dengan timestamp preservation
- ✅ Anti-fraud measures (GPS validation, mock location detection)

**Penggunaan:**
- Security guards check in/out di security posts
- Cleaning staff check in/out di cleaning sites
- Drivers check in/out di vehicle depots
- Parking staff check in/out di parking areas
- **Engine yang sama, validasi yang sama, hanya berbeda division field**

### 2. Checklist System (Shared Engine, Template per Divisi)

**Fitur:**
- ✅ Template-based checklist system
- ✅ Multiple answer types: Boolean, Choice, Score, Text
- ✅ Photo requirements untuk specific tasks
- ✅ KPI-based tracking
- ✅ Automatic checklist creation berdasarkan context
- ✅ Status tracking: Pending, Completed, Not Applicable, Failed
- ✅ Evidence attachment (photos, GPS, notes)

**Penggunaan per Divisi:**
- **Security:** Patrol checklists tied to routes dan checkpoints
- **Cleaning:** Zone-based checklists (Toilet A, Lobby, Corridor) triggered by QR scan
- **Driver:** Pre-trip dan post-trip vehicle inspection checklists
- **Parking:** Entry/exit checklists

### 3. Reporting System (Shared Engine, Type-Based Differentiation)

**Fitur:**
- ✅ Type-based report categorization
- ✅ Division filtering
- ✅ Evidence attachment (photos, documents)
- ✅ Status workflow (Open, In Review, Closed)
- ✅ Supervisor review dan approval
- ✅ PDF export functionality
- ✅ Cross-division report viewing untuk supervisors

**Jenis Report per Divisi:**
- **Security:** Security incidents, Daily Activity Reports (DAR), visitor logs
- **Cleaning:** Cleaning issues, daily cleaning summaries, quality inspection reports
- **Driver:** Vehicle incidents, trip reports, maintenance issues
- **Parking:** Parking incidents, entry/exit issues

### 4. Announcement System (Fully Shared)

**Fitur:**
- ✅ Supervisor-only creation
- ✅ Priority levels (Info, Warning, Critical)
- ✅ Flexible targeting (all personnel, specific divisions, sites, atau users)
- ✅ Optional acknowledgment requirement
- ✅ Validity period setting
- ✅ Read/unread status tracking
- ✅ Dashboard card display untuk semua personnel

### 5. Shift Management (Shared Engine)

**Fitur:**
- ✅ Calendar-based shift view
- ✅ Shift assignment ke personnel
- ✅ Shift types (Morning, Afternoon, Night)
- ✅ Open shift management
- ✅ Shift exchange system dengan tier-based approval
- ✅ Shift confirmation oleh field staff
- ✅ Color-coded shift status

### 6. Sites dan Zones (Shared Infrastructure)

**Fitur:**
- ✅ Site management dengan GPS coordinates dan geofence
- ✅ QR code generation per site
- ✅ Zone definition per division
- ✅ Zone-to-checklist template linking

---

## 👥 Sistem Role dan Access Control

### Role Model

**Roles:**
- **guard/field** - Field personnel (guards, cleaners, drivers, parking staff)
- **supervisor** - Supervisory personnel
- **admin** - System administrators

**Supervisor Scope Model:**
Supervisors BUKAN divisi keempat. Mereka adalah role yang duduk di atas divisi dengan scope:
- **Division Supervisor:** Hanya melihat satu divisi (contoh: Security Supervisor)
- **Site Supervisor:** Melihat semua divisi di satu site
- **Area/Company Supervisor:** Melihat multiple sites dan semua divisi

**Access Control:**
- Field users hanya melihat data mereka sendiri dan assigned tasks
- Supervisors melihat data berdasarkan scope mereka (division, site, atau company)
- Admins melihat semua data di semua divisi dan sites

### RBAC (Role-Based Access Control)

**Resources:**
- attendance, reports, checklists, patrols, passdown, sites, master_data, roles, permissions, dll

**Actions:**
- read: View data
- write: Create/Update data
- delete: Delete data
- manage: Full control

---

## 🎯 Fitur Divisi-Spesifik

### Security Division

**Fitur v1:**
- ✅ Attendance dengan QR + GPS + photo
- ✅ Patrol routes dengan checkpoints
- ✅ QR scan di setiap checkpoint
- ✅ Patrol log (time, user, site, checkpoint)
- ✅ Incident reports (type, description, site, photos, GPS)
- ✅ Status workflow (Open, In Review, Closed)
- ✅ Daily Activity Report (DAR)
- ✅ Passdown & Handover notes
- ✅ Panic Button & Dispatch
- ✅ Visitor Management
- ✅ GPS Tracking
- ✅ Shift Management
- ✅ Post Orders

**Planned v1.5+:**
- Advanced patrol SLA (must scan point X within Y minutes)
- Client portal read-only view
- Advanced anti-fake GPS (speed/jump pattern analysis)

### Cleaning Division

**Fitur v1:**
- ✅ Attendance (engine yang sama dengan security)
- ✅ Zone-based cleaning tasks
- ✅ QR Code Scanning untuk Area
- ✅ Checklist per Zone
- ✅ Zone definitions per site (Toilet A, Lobby, Corridor, dll)
- ✅ Cleaning Reports
- ✅ Quality Inspection

**Planned v1.5+:**
- Quality inspection scoring oleh supervisors
- SLA-based tracking (contoh: Toilet harus dibersihkan setiap 2 jam)
- Trend charts dan KPI scoring per cleaner

### Driver Division

**Fitur v1:**
- ✅ Attendance (engine yang sama)
- ✅ Vehicle management
- ✅ Trip logging (start: select vehicle + site + destination, capture GPS dan time)
- ✅ Pre-trip checklist (vehicle safety)
- ✅ Post-trip checklist (damage, issues)
- ✅ Vehicle incident reports (breakdown, accident, near-miss)

**Planned v1.5+:**
- Route dengan multiple planned stops
- Live GPS tracking + route playback
- Maintenance scheduling integration

### Parking Division

**Fitur v1:**
- ✅ Attendance (engine yang sama)
- ✅ Entry/Exit Management
- ✅ Session Tracking
- ✅ Checklist System
- ✅ Reports

---

## 👨‍💼 Supervisor System

### Supervisor Core Jobs (5 Masalah Utama)

Supervisor menyelesaikan lima masalah fundamental sebelum pulang:

1. **Siapa yang hadir dan benar-benar bekerja?** - Attendance, late, no-show, early checkout
2. **Apakah tugas kritis sudah selesai?** - Patrols, cleaning zones, pre/post trip checks
3. **Ada insiden atau masalah?** - Security incident, cleaning complaint, vehicle issue
4. **Ada yang perlu disetujui atau diputuskan?** - Attendance correction, shift change, leave, dll
5. **Apa yang perlu saya sampaikan ke tim?** - Announcements / instructions

### Supervisor Dashboard Features

**1. Dashboard Overview (Cross-Division)**
- Attendance Snapshot per divisi
- Task/Checklist Completion status
- Open Issues (consolidated list dari reports)
- Announcements

**2. Attendance Console**
- Filter: Date range, Site, Division, Status
- Table: Officer name, Division, Site, Check-in/out time, GPS valid?, Photo evidence?, Status
- Actions: Open details, Approve correction

**3. Task / Checklist Console**
- Filter: Date, Site, Division, Context, Status
- Table: Template name, Division, Site/Zone/Vehicle, Assigned user, Completion %, Evidence available?

**4. Report / Incident Console**
- Filter: Date range, Division, Type, Status, Site
- Table: Time, Division, Type, Title, Site, Reporter, Status
- Actions: View details, Change status, Add notes, Export PDF

**5. Announcements Management**
- Create announcements dengan targeting
- Filter: active/expired, division, site
- List: Title, Priority, Target, Validity period, Read count

**6. Shifts Management**
- Calendar view per site + division
- Assign user ke shift
- Mark shift as "open" (vacant)
- Shift exchange system

**7. Officers Management**
- View officer list dengan division, site, status
- Officer profiles
- Assignment management
- Basic activity monitoring

**8. Master Data Management**
- Sites, Zones, Roles, Incident Types, Status Types, Visitor Categories, Vehicle Types, dll

**9. Advanced Features**
- Heatmap visualization
- Control Center (real-time monitoring)
- Manpower tracking
- Patrol Activity tracking
- Training management
- KTA Management
- Audit Logs

---

## 📊 Database Schema

### Core Shared Tables

**Users & Authentication:**
- `users` - User accounts dengan role, division, company_id
- `roles` - Role definitions (admin, supervisor, guard, dll)
- `permissions` - Permission definitions (read, write, delete, manage)
- `role_permissions` - Many-to-many relationship
- `user_permissions` - Direct user permissions (optional)

**Attendance:**
- `attendance` - Unified attendance table untuk semua divisi
  - Fields: user_id, site_id, checkin_time, checkout_time, division, status, gps_lat, gps_lng, photo_url

**Checklists:**
- `checklist_templates` - Template definitions
- `checklists` - Checklist instances (shared table)
- `checklist_items` - Checklist item instances
- `evidence` - Photo/document evidence

**Reports:**
- `security_reports` - Security incident reports & DAR
  - Fields: division, report_type, title, description, status

**Master Data:**
- `master_data` - Generic master data table
  - Fields: category, code, name, division, is_active
  - Categories: ZONE_TYPE, INCIDENT_TYPE, STATUS_TYPE, VISITOR_CATEGORY, VEHICLE_TYPE, dll

**Sites & Zones:**
- `sites` - Site/location definitions
- `cleaning_zones` - Zone definitions (division field untuk filtering)

**Shifts:**
- `shifts` - Shift definitions
- `shift_handovers` - Passdown/handover notes

**Other Tables:**
- `gps_tracks` - GPS tracking data
- `cctv_cameras` - CCTV camera definitions
- `visitors` - Visitor management
- `trainings` - Training management
- `documents` - Document control
- `payrolls` - Payroll records
- `employees` - Employee database
- `audit_logs` - Audit trail

---

## 🔐 Security & Authentication

### Authentication Flow

1. User login via `/api/auth/login`
2. Backend validate credentials
3. Generate JWT token
4. Return token + user data
5. Frontend store token dan redirect

### Authorization Flow (RBAC)

1. Request dengan JWT token
2. Backend decode JWT dan get user
3. Get role dan permissions
4. Check permission untuk resource dan action
5. Allow atau Deny access

### Security Features

- ✅ JWT-based authentication dengan expiration
- ✅ Password hashing dengan bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Permission-based fine-grained control
- ✅ Division-based data filtering
- ✅ Company-level data isolation
- ✅ Input validation dan sanitization
- ✅ CORS configuration
- ✅ SQL injection prevention (ORM)

---

## 📱 Mobile Support

Sistem dirancang **mobile-first** dengan responsive design untuk:
- ✅ Field staff mobile interface
- ✅ Supervisor web dashboard
- ✅ QR code scanning
- ✅ GPS tracking
- ✅ Photo evidence capture
- ✅ Offline mode support

---

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info dengan permissions

### Attendance
- `POST /api/attendance/checkin` - Check-in dengan QR, GPS, photo
- `POST /api/attendance/checkout` - Check-out
- `GET /api/attendance` - List attendance dengan filters

### Reports
- `GET /api/security/reports` - List security reports
- `POST /api/security/reports` - Create report
- `GET /api/cleaning/reports` - List cleaning reports
- `POST /api/cleaning/reports` - Create cleaning report

### Checklists
- `GET /api/checklists` - List checklists
- `POST /api/checklists` - Create checklist
- `GET /api/checklist-templates` - List templates

### Supervisor
- `GET /api/supervisor/overview` - Dashboard overview dengan KPIs
- `GET /api/supervisor/manpower` - Manpower per area
- `GET /api/supervisor/patrol-activity` - Patrol activity list

### Admin
- `GET /api/admin/roles` - List roles
- `GET /api/admin/permissions` - List permissions
- `POST /api/admin/roles/{id}/permissions` - Update role permissions
- `GET /api/admin/users` - List users

### Master Data
- `GET /api/master-data` - List master data
- `GET /api/master-data/{category}` - Get by category
- `POST /api/master-data` - Create master data
- `PUT /api/master-data/{id}` - Update master data
- `DELETE /api/master-data/{id}` - Delete master data

---

## 📦 Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (optional, SQLite untuk development)

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup database
alembic upgrade head

# Run backend
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend/web
npm install
npm run dev
```

### Start Script
```bash
# Start both backend dan frontend
bash start.sh  # atau start.bat di Windows
```

---

## 🎯 Product Scope

### Version 1.0 (Current MVP)

**Included:**
- ✅ Shared attendance system (QR + GPS + photo) untuk semua divisi
- ✅ Shared checklist system dengan division-specific templates
- ✅ Shared reporting system dengan type-based differentiation
- ✅ Shared announcement system
- ✅ Basic shift management
- ✅ Supervisor dashboard dengan cross-division overview
- ✅ Division-specific features:
  - Security: Patrol routes, incidents, DAR, panic button, dispatch
  - Cleaning: Zone-based cleaning, cleaning reports
  - Driver: Vehicle management, trips, pre/post-trip checklists
  - Parking: Entry/exit management, session tracking

### Version 1.5 (Planned)

**Planned Features:**
- Advanced patrol SLA tracking (Security)
- Quality inspection scoring (Cleaning)
- SLA-based cleaning tracking (Cleaning)
- Route dengan multiple stops (Driver)
- Live GPS tracking (Driver)
- Shift exchange system
- Attendance correction approval workflow
- Client portal read-only view
- Advanced anti-fake GPS (speed/jump pattern analysis)

### Version 2.0 (Future)

**Future Enhancements:**
- WebSocket live updates
- Predictive analytics
- Advanced scheduling algorithms
- Complex shift exchange dengan multi-level approvals
- Maintenance scheduling integration (Driver)
- Trend charts dan KPI scoring
- Mobile native applications
- Enhanced offline capabilities
- Integration dengan external systems

---

## 📈 System Benefits

### Untuk Field Personnel
- ✅ Simplified task management melalui unified interface
- ✅ Clear visibility of assignments
- ✅ Easy reporting dan documentation
- ✅ Mobile-friendly interface
- ✅ Offline capability
- ✅ Consistent experience di semua divisi

### Untuk Supervisors
- ✅ Real-time visibility ke operations di semua divisi
- ✅ Comprehensive dashboards dan analytics
- ✅ Efficient approval workflows
- ✅ Centralized management di satu interface
- ✅ Data-driven decision making
- ✅ Single console untuk semua divisi (bukan separate apps)

### Untuk Organizations
- ✅ Improved accountability melalui shared tracking
- ✅ Compliance tracking di semua divisi
- ✅ Operational efficiency melalui unified platform
- ✅ Data-driven insights
- ✅ Scalable solution dengan shared codebase
- ✅ Cost reduction melalui automation dan reduced maintenance
- ✅ Single system untuk dipelajari dan dioperasikan (bukan tiga aplikasi terpisah)

---

## 🏆 Architecture Benefits

### Maintenance Efficiency
- **Fix once, apply everywhere:** Bug fixes di shared modules benefit semua divisi
- **Feature additions:** New features di shared modules otomatis available ke semua divisi
- **Consistency:** Same validation, same logic, same behavior di semua divisi
- **Reduced complexity:** Satu codebase untuk maintain, bukan tiga

### Development Speed
- **Faster feature development:** Build once, configure untuk divisions
- **Easier testing:** Test shared modules once, bukan per division
- **Simpler deployment:** Satu application, satu database, satu deployment process

### Business Value
- **Lower total cost of ownership:** Less code untuk maintain
- **Faster time to market:** New divisions bisa ditambahkan dengan minimal code
- **Consistent user experience:** Same patterns di semua divisi
- **Easier training:** Satu system untuk dipelajari, bukan tiga

---

## 📝 Kesimpulan

Verolux Management System adalah platform terpadu untuk mengelola operasi tenaga kerja di Security, Cleaning, Driver, dan Parking divisions. Dengan mengimplementasikan shared core modules (attendance, checklists, reports, announcements, shifts) dan menggunakan division sebagai configuration field daripada separate implementations, sistem mencapai maintenance efficiency yang signifikan sambil menyediakan functionality yang komprehensif.

Platform ini berhasil menjembatani gap antara field operations dan management oversight, menyediakan tools yang diperlukan untuk efficient workforce management, compliance tracking, dan operational excellence. Supervisor system, yang dirancang di sekitar lima core jobs, menyediakan management interface yang focused dan efficient yang bekerja di semua divisi.

Melalui unified architecture-nya, sistem memungkinkan organizations untuk maintain high standards of service delivery sambil mengoptimalkan operational efficiency dan mengurangi total cost of ownership. Single-platform approach memastikan bahwa improvements dan fixes benefit semua divisi secara equal, membuat sistem powerful dan maintainable.

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15  
**Maintained by:** Verolux Development Team
