# Verolux Management System - Architecture Summary

## 📋 Overview

**Verolux Management System** adalah sistem manajemen terpadu untuk operasional Security, Cleaning, dan Parking dengan fitur lengkap untuk attendance, reporting, checklist, dan monitoring real-time.

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Frontend)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Mobile     │  │   Web        │  │   Admin      │      │
│  │   (React)    │  │   (React)    │  │   (React)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │ HTTPS/REST API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (FastAPI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   Business   │  │   Services   │      │
│  │   Routes     │  │   Routes     │  │   Layer      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (SQLAlchemy ORM)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   SQLite    │  │   File       │      │
│  │  (Production)│  │  (Dev/Test)  │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | FastAPI | 0.104.1 | Modern Python web framework dengan async support |
| **Server** | Uvicorn | 0.24.0 | ASGI server dengan standard extensions |
| **ORM** | SQLAlchemy | ≥2.0.36 | Database ORM dengan Python 3.13 compatibility |
| **Migrations** | Alembic | ≥1.13.0 | Database schema versioning |
| **Database** | PostgreSQL/SQLite | - | Production (PostgreSQL) / Development (SQLite) |
| **Auth** | JWT (python-jose) | 3.3.0 | Token-based authentication |
| **Security** | bcrypt, passlib | 4.0.1, 1.7.4 | Password hashing |
| **Validation** | Pydantic | ≥2.9.0 | Data validation & serialization |
| **Image Processing** | Pillow | ≥11.0.0 | Image manipulation & watermarking |
| **QR Codes** | qrcode[pil] | 7.4.2 | QR code generation |
| **PDF** | reportlab | 4.0.7 | PDF report generation |

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 18.2.0 | UI library |
| **Language** | TypeScript | 5.2.2 | Type-safe JavaScript |
| **Build Tool** | Vite | 5.0.8 | Fast build tool & dev server |
| **Styling** | Tailwind CSS | 4.1.17 | Utility-first CSS framework |
| **State Management** | Zustand | 4.4.7 | Lightweight state management |
| **Routing** | React Router DOM | 6.20.0 | Client-side routing |
| **HTTP Client** | Axios | 1.6.2 | API communication |
| **Charts** | Recharts | 3.5.1 | Data visualization |
| **QR Scanner** | html5-qrcode | 2.3.8 | QR code scanning |
| **PDF Export** | jsPDF + autotable | 3.0.4, 5.0.2 | PDF generation |
| **Excel Export** | xlsx | 0.18.5 | Excel file generation |

---

## 📁 Project Structure

### Backend Structure

```
backend/
├── app/
│   ├── api/                    # API Routes
│   │   ├── router.py           # Main API router
│   │   ├── auth_routes.py      # Authentication endpoints
│   │   ├── attendance_routes.py # Attendance management
│   │   ├── supervisor_routes.py # Supervisor dashboard
│   │   └── [division]_routes.py # Division-specific routes
│   │
│   ├── core/                   # Core utilities
│   │   ├── config.py           # Configuration management
│   │   ├── database.py         # Database connection
│   │   ├── security.py         # JWT & password hashing
│   │   ├── logger.py           # Logging configuration
│   │   ├── exceptions.py       # Custom exceptions
│   │   └── pagination.py       # Pagination utilities
│   │
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py             # User model
│   │   ├── attendance.py       # Attendance model
│   │   ├── security_report.py  # Security reports
│   │   ├── shift.py            # Shift management
│   │   └── [other_models].py
│   │
│   ├── divisions/              # Division-specific modules
│   │   ├── security/
│   │   │   ├── models.py       # Security models
│   │   │   ├── routes.py       # Security routes
│   │   │   ├── schemas.py     # Security schemas
│   │   │   └── services/       # Security services
│   │   ├── cleaning/
│   │   └── parking/
│   │
│   ├── services/               # Business logic services
│   │   ├── watermark_service.py    # Image watermarking
│   │   ├── file_storage.py         # File upload/storage
│   │   ├── pdf_service.py          # PDF generation
│   │   ├── checklist_service.py    # Checklist logic
│   │   └── [other_services].py
│   │
│   └── main.py                 # FastAPI application entry
│
├── alembic/                    # Database migrations
│   └── versions/               # Migration files
│
├── scripts/                     # Utility scripts
└── requirements.txt            # Python dependencies
```

### Frontend Structure

```
frontend/web/
├── src/
│   ├── api/                    # API client functions
│   │   ├── client.ts           # Axios instance
│   │   ├── attendanceApi.ts    # Attendance API
│   │   ├── securityApi.ts      # Security API
│   │   └── [other]Api.ts
│   │
│   ├── modules/                # Feature modules
│   │   ├── security/           # Security module
│   │   │   ├── pages/          # Security pages
│   │   │   └── components/     # Security components
│   │   ├── cleaning/           # Cleaning module
│   │   ├── parking/            # Parking module
│   │   ├── supervisor/         # Supervisor module
│   │   │   ├── pages/          # Supervisor pages
│   │   │   ├── layout/         # Supervisor layout
│   │   │   └── components/     # Supervisor components
│   │   └── shared/             # Shared components
│   │       ├── components/     # Reusable components
│   │       ├── pages/          # Shared pages
│   │       └── hooks/          # Custom hooks
│   │
│   ├── stores/                 # Zustand stores
│   │   └── authStore.ts        # Authentication state
│   │
│   ├── i18n/                   # Internationalization
│   │   ├── translations.ts     # Translation strings
│   │   └── useTranslation.ts   # Translation hook
│   │
│   ├── routes/                 # Route configuration
│   │   └── AppRoutes.tsx       # Main routing
│   │
│   ├── components/             # Global components
│   └── icons/                  # Icon components
│
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
└── package.json                # Node dependencies
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

```
1. User Login
   └─> POST /api/auth/login
       └─> Verify credentials
       └─> Generate JWT token
       └─> Return token + user info

2. Protected Routes
   └─> Include JWT in Authorization header
       └─> Backend validates token
       └─> Extract user info
       └─> Check permissions (RBAC)
```

### RBAC (Role-Based Access Control)

**Roles:**
- **guard** - Field staff (Security/Cleaning/Parking)
- **supervisor** - Supervisor access
- **admin** - Full admin access

**Permission System:**
- Resources: `control_center`, `manpower`, `incidents`, `patrol_targets`, etc.
- Actions: `read`, `write`, `delete`, `approve`
- User → Role → Permissions mapping

---

## 🗄️ Database Architecture

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | id, username, role_id, division |
| `roles` | Role definitions | id, name, description |
| `permissions` | Permission definitions | id, name, resource, action |
| `role_permissions` | Role-Permission mapping | role_id, permission_id |
| `sites` | Site/location management | id, name, address, coordinates |
| `attendance` | Attendance records | id, user_id, site_id, checkin_time, checkout_time |
| `shifts` | Shift scheduling | id, user_id, site_id, start_time, end_time |

### Division-Specific Tables

**Security:**
- `security_reports` - Incident & daily reports
- `security_patrol_logs` - Patrol activity logs
- `security_checklists` - Checklist records
- `visitors` - Visitor management

**Cleaning:**
- `cleaning_reports` - Cleaning reports
- `cleaning_zones` - Zone definitions
- `cleaning_checklists` - Cleaning checklists

**Parking:**
- `parking_sessions` - Entry/exit records

---

## 🔄 API Architecture

### API Structure

```
/api
├── /auth                    # Authentication
│   ├── POST /login          # User login
│   └── POST /logout         # User logout
│
├── /attendance              # Attendance management
│   ├── GET /my              # Get user's attendance
│   ├── POST /scan-qr        # QR attendance scan
│   ├── POST /check-in       # Manual check-in
│   └── POST /check-out      # Manual check-out
│
├── /security                # Security division
│   ├── /reports             # Security reports
│   ├── /patrols             # Patrol logs
│   ├── /checklist           # Checklists
│   └── /panic               # Panic alerts
│
├── /cleaning                # Cleaning division
│   ├── /reports             # Cleaning reports
│   ├── /zones               # Zone management
│   └── /checklist           # Cleaning checklists
│
├── /supervisor              # Supervisor dashboard
│   ├── /overview            # Dashboard overview
│   ├── /attendance          # Attendance management
│   ├── /reports             # Report console
│   └── /sites               # Site management
│
└── /admin                   # Admin functions
    ├── /users               # User management
    ├── /roles               # Role management
    └── /master-data         # Master data
```

### Request/Response Pattern

**Standard Response Format:**
```json
{
  "data": {...},           // Success data
  "detail": "...",         // Error message
  "error_code": "...",     // Error code
  "metadata": {...}        // Additional metadata
}
```

**Pagination:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "has_next": true
}
```

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App
└─> Router (AppRoutes)
    ├─> Public Routes
    │   └─> LoginPage
    │
    └─> Protected Routes
        ├─> MobileLayout (Field Staff)
        │   ├─> SecurityDashboardPage
        │   ├─> CleaningDashboardPage
        │   ├─> QRAttendancePage
        │   └─> [Other Mobile Pages]
        │
        └─> SupervisorLayout (Supervisor/Admin)
            ├─> SupervisorDashboardPage
            ├─> SupervisorAttendancePage
            ├─> SupervisorReportsPage
            └─> [Other Supervisor Pages]
```

### State Management

**Zustand Stores:**
- `authStore` - Authentication state (user, token, login/logout)
- Future: `attendanceStore`, `reportStore` (if needed)

**Component State:**
- Local state dengan `useState` untuk component-specific data
- `useEffect` untuk data fetching

### Routing Strategy

- **Public Routes:** `/login`
- **Mobile Routes:** `/security/*`, `/cleaning/*`, `/parking/*`
- **Supervisor Routes:** `/supervisor/*`
- **Admin Routes:** `/supervisor/admin/*`

---

## 🔧 Key Features & Services

### 1. Watermark Service
- **Purpose:** Add watermark to uploaded photos
- **Features:**
  - Company logo
  - Location & timestamp
  - User information
  - Repeating pattern text
- **Technology:** Pillow (PIL)

### 2. File Storage Service
- **Purpose:** Handle file uploads & storage
- **Features:**
  - Photo upload with watermark
  - Evidence file management
  - File validation
- **Storage:** Local filesystem (`uploads/`)

### 3. PDF Service
- **Purpose:** Generate PDF reports
- **Features:**
  - Attendance reports
  - Security reports (DAR)
  - Summary reports
- **Technology:** reportlab

### 4. Checklist Service
- **Purpose:** Manage checklists
- **Features:**
  - Template-based checklists
  - Item completion tracking
  - Progress calculation
- **Integration:** Division-specific (Security/Cleaning)

### 5. Location Validation
- **Purpose:** Validate GPS location for attendance
- **Features:**
  - Coordinate validation
  - Site boundary checking
  - Distance calculation

---

## 📱 Mobile Support

### Mobile-First Design
- Responsive layouts dengan Tailwind CSS
- Touch-optimized UI components
- Camera integration untuk QR scanning & photo capture
- GPS integration untuk location tracking
- Offline capability (future enhancement)

### QR Code Integration
- **Library:** html5-qrcode
- **Features:**
  - Real-time QR scanning
  - Attendance QR codes
  - Zone QR codes (Cleaning)
  - Checkpoint QR codes (Security patrol)

---

## 🔒 Security Features

### Authentication
- JWT token-based authentication
- Token expiration & refresh
- Secure password hashing (bcrypt)

### Authorization
- RBAC (Role-Based Access Control)
- Permission-based route protection
- Division-based access control

### Data Security
- Input validation (Pydantic)
- SQL injection prevention (SQLAlchemy ORM)
- File upload validation
- CORS configuration

---

## 📊 Data Flow

### Attendance Flow

```
1. User scans QR code
   └─> Frontend: QRAttendancePage
       └─> Capture photo
       └─> Get GPS location
       └─> POST /api/attendance/scan-qr

2. Backend processes
   └─> Validate QR code
   └─> Validate location
   └─> Apply watermark to photo
   └─> Save attendance record
   └─> Return attendance data

3. Frontend updates UI
   └─> Show success message
   └─> Update dashboard
```

### Report Flow

```
1. User creates report
   └─> Fill form (type, description, photos)
   └─> POST /api/[division]/reports

2. Backend processes
   └─> Validate data
   └─> Apply watermark to photos
   └─> Save report to database
   └─> Return report data

3. Supervisor reviews
   └─> GET /api/supervisor/reports
   └─> View report details
   └─> Approve/reject (if applicable)
```

---

## 🚀 Deployment

### Development Setup
- **Backend:** `uvicorn app.main:app --reload --port 8000`
- **Frontend:** `npm run dev` (Vite dev server on port 5173)
- **Database:** SQLite (development)

### Production Setup
- **Backend:** Uvicorn with multiple workers
- **Frontend:** Build dengan `npm run build`, serve static files
- **Database:** PostgreSQL
- **HTTPS:** Required untuk camera access (mobile)

### Network Access
- **Local:** `http://localhost:5173`
- **Network:** `https://[IP]:5173` (with self-signed cert)
- **ngrok:** Tunnel untuk external access

---

## 📈 Scalability Considerations

### Current Architecture
- Monolithic backend (FastAPI)
- Single database (PostgreSQL/SQLite)
- File-based storage (local filesystem)

### Future Enhancements
- **Microservices:** Split by division (Security/Cleaning/Parking)
- **Cloud Storage:** S3/Cloud Storage untuk files
- **Caching:** Redis untuk session & frequently accessed data
- **Message Queue:** RabbitMQ/Kafka untuk async processing
- **CDN:** For static assets & images

---

## 🧪 Testing

### Backend Testing
- **Framework:** pytest
- **Coverage:** Unit tests untuk services, integration tests untuk API
- **Location:** `backend/tests/`

### Frontend Testing
- **Framework:** (To be implemented)
- **Strategy:** Component tests, API mock tests

---

## 📝 Development Workflow

### Code Organization
- **Backend:** Modular structure dengan division-based separation
- **Frontend:** Feature-based modules dengan shared components
- **Migrations:** Alembic untuk database schema changes

### Best Practices
- Type hints (Python) & TypeScript (Frontend)
- Error handling dengan custom exceptions
- Logging untuk debugging & monitoring
- API documentation (FastAPI auto-docs)

---

## 🔄 Integration Points

### External Services
- **GPS:** Browser Geolocation API
- **Camera:** Browser MediaDevices API
- **QR Codes:** html5-qrcode library
- **PDF:** reportlab (backend), jsPDF (frontend)

### Internal Services
- **Watermark Service** ← File Storage Service
- **Checklist Service** ← Division Routes
- **PDF Service** ← Report Routes
- **Location Validation** ← Attendance Routes

---

## 📚 Documentation

### Available Documentation
- `docs/API_REFERENCE.md` - API documentation
- `docs/DEPLOYMENT_GUIDE.md` - Deployment instructions
- `docs/RBAC_IMPLEMENTATION_GUIDE.md` - RBAC setup
- `docs/WATERMARK_SYSTEM.md` - Watermark implementation
- `docs/CHECKLIST_SYSTEM.md` - Checklist system
- And more in `docs/` directory

---

## 🎯 Key Design Decisions

1. **Division-Based Architecture:** Separate modules untuk Security, Cleaning, Parking
2. **Mobile-First:** Responsive design dengan touch optimization
3. **RBAC:** Flexible permission system untuk future expansion
4. **Watermark System:** Automatic watermarking untuk all uploaded photos
5. **QR Code Integration:** QR-based attendance & zone scanning
6. **Real-time Updates:** Dashboard updates dengan polling (future: WebSocket)

---

## 🔮 Future Enhancements

- **Real-time Updates:** WebSocket untuk live updates
- **Push Notifications:** Mobile push notifications
- **Offline Mode:** Service worker untuk offline capability
- **Analytics:** Advanced analytics & reporting
- **Mobile Apps:** Native iOS/Android apps
- **AI Integration:** Image recognition, anomaly detection

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Verolux Management System Team
