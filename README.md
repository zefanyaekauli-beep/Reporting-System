# Verolux Management System

Sistem manajemen terpadu untuk Security, Cleaning, dan Parking dengan fitur lengkap untuk attendance, reporting, checklist, dan monitoring.

## 🚀 Fitur Utama

### Security Division
- ✅ Attendance & QR Attendance
- ✅ Patrol Logs & Routes
- ✅ Incident Reports (DAR)
- ✅ Checklist System
- ✅ Panic Button & Dispatch
- ✅ Shift Management
- ✅ Passdown & Handover

### Cleaning Division
- ✅ Zone-based Cleaning Tasks
- ✅ QR Code Scanning untuk Area
- ✅ Checklist per Zone
- ✅ Quality Inspection
- ✅ Attendance & Reports

### Parking Division
- ✅ Entry/Exit Management
- ✅ Session Tracking
- ✅ Checklist System
- ✅ Attendance & Reports

### Supervisor Panel
- ✅ Dashboard Overview
- ✅ Attendance Management
- ✅ Report Console
- ✅ Task/Checklist Console
- ✅ Shift Calendar
- ✅ Officer Management
- ✅ Site & QR Management
- ✅ Announcement System

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **PostgreSQL/SQLite** - Database
- **JWT** - Authentication

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Routing

## 📦 Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (optional, SQLite for development)

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
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
# Start both backend and frontend
bash start.sh
```

## 🔐 Authentication

Default roles:
- **guard** - Field staff (Security/Cleaning/Parking)
- **supervisor** - Supervisor access
- **admin** - Full admin access

## 📱 Mobile Support

Sistem dirancang mobile-first dengan responsive design untuk:
- Field staff mobile interface
- Supervisor web dashboard
- QR code scanning
- GPS tracking
- Photo evidence capture

## 📄 License

Proprietary - All rights reserved

## 👥 Author

Verolux Management System
