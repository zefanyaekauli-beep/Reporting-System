# 🏗️ SRM (Security Risk Management) - Complete System Architecture

## Overview

SRM (Security Risk Management) adalah sistem manajemen keamanan terintegrasi yang dirancang untuk mengelola seluruh aspek operasional keamanan perusahaan. Dokumentasi ini menjelaskan arsitektur lengkap sistem SRM berdasarkan analisis screenshot referensi.

**Dokumen ini dibuat:** Desember 2024  
**Versi:** 1.0

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Module Structure](#module-structure)
4. [Database Architecture](#database-architecture)
5. [API Architecture](#api-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Security Architecture](#security-architecture)
8. [Integration Points](#integration-points)

---

## 🎯 System Overview

### Purpose
SRM adalah platform manajemen keamanan yang menyediakan:
- Monitoring real-time operasional security
- Manajemen patroli dan checkpoint
- Pelaporan insiden dan aktivitas
- Tracking KPI dan compliance
- Manajemen training personel
- Pengelolaan master data dan aset

### Core Capabilities

| Capability | Description |
|-----------|-------------|
| **Real-time Monitoring** | Live dashboard dengan status operasional |
| **Patrol Management** | Scheduling, assignment, dan tracking patroli |
| **Incident Handling** | Sistem pelaporan dan investigasi insiden |
| **Visitor Management** | Registrasi dan tracking pengunjung |
| **Training Management** | Perencanaan dan tracking pelatihan |
| **KPI Analytics** | Dashboard performa dan metrics |
| **Document Control** | Manajemen dokumen dan SOP |
| **Asset Management** | Tracking aset dan peralatan |

### User Roles

```
┌─────────────────────────────────────────────────────────────┐
│                        USER ROLES                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    ADMIN     │  │  SUPERVISOR  │  │    FIELD     │      │
│  │              │  │              │  │              │      │
│  │ - Full Access│  │ - Site Mgmt  │  │ - Patrol     │      │
│  │ - User Mgmt  │  │ - Reporting  │  │ - Check-in   │      │
│  │ - Settings   │  │ - Approval   │  │ - Report     │      │
│  │ - Master Data│  │ - KPI View   │  │ - Incident   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Architecture Pattern

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Web Browser    │  │  Mobile App     │  │  Admin Panel    │     │
│  │  (React/Vue)    │  │  (React Native) │  │  (React)        │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
└───────────┼────────────────────┼────────────────────┼───────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                                  │
│                     (Nginx / Load Balancer)                         │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    FastAPI Backend                            │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │ Routers    │  │ Services   │  │ Models     │             │  │
│  │  │ (API)      │  │ (Business) │  │ (Data)     │             │  │
│  │  └────────────┘  └────────────┘  └────────────┘             │  │
│  │                                                              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │ Schemas    │  │ Repository │  │ Middleware │             │  │
│  │  │ (DTOs)     │  │ (Data Acc) │  │ (Auth/Log) │             │  │
│  │  └────────────┘  └────────────┘  └────────────┘             │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  PostgreSQL  │  │    Redis     │  │   Storage    │              │
│  │  (Primary)   │  │   (Cache)    │  │   (S3/Minio) │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Zustand |
| **Backend** | FastAPI (Python 3.10+), Pydantic, SQLAlchemy |
| **Database** | PostgreSQL (Production), SQLite (Development) |
| **Cache** | Redis |
| **Storage** | S3 / MinIO |
| **Deployment** | Docker, Docker Compose, Nginx |

---

## 📁 Module Structure

### Complete Menu Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SRM MENU STRUCTURE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📊 LIVE DASHBOARD                                                  │
│     └── Overview, Widgets, Real-time Stats                         │
│                                                                     │
│  📝 REPORTING                                                       │
│     ├── Daily Activity Report (DAR)                                 │
│     ├── Daily Visitors Report                                       │
│     ├── Laporan Intelligent                                         │
│     └── Compliance And Auditor                                      │
│                                                                     │
│  🚶 PATROL                                                          │
│     ├── Patrol Schedule                                             │
│     ├── Patrol Assignment                                           │
│     ├── Security Patrol                                             │
│     ├── Joint Patrol                                                │
│     └── Patrol Report                                               │
│                                                                     │
│  ⚠️  INCIDENT                                                        │
│     ├── LK dan LP (Laporan Kejadian)                               │
│     ├── BAP (Berita Acara Pemeriksaan)                             │
│     ├── NO STPLK (Surat Tanda Laporan Kehilangan)                  │
│     ├── Findings Report                                             │
│     └── Incident Recap                                              │
│                                                                     │
│  📚 TRAINING                                                        │
│     ├── Training Plan                                               │
│     └── Training Participant                                        │
│                                                                     │
│  📈 KPI                                                             │
│     ├── KPI Patrol                                                  │
│     ├── KPI Report                                                  │
│     ├── KPI CCTV                                                    │
│     └── KPI Training                                                │
│                                                                     │
│  📄 INFORMATION DATA                                                │
│     ├── Document Control                                            │
│     ├── CCTV Status                                                 │
│     └── Notification                                                │
│                                                                     │
│  🗃️  MASTER DATA                                                     │
│     ├── Worker Data                                                 │
│     ├── Business Unit                                               │
│     ├── Department                                                  │
│     ├── Patrol and Guard Points                                     │
│     ├── Job Position                                                │
│     ├── Asset Management                                            │
│     ├── Asset Category                                              │
│     └── CCTV Zone                                                   │
│                                                                     │
│  ⚙️  ADMINISTRATOR                                                   │
│     ├── User Management                                             │
│     ├── User Access                                                 │
│     ├── Incident User Access                                        │
│     └── Translation (i18n)                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Module Details

### 1. Live Dashboard Module

**Purpose:** Central monitoring hub untuk operasional real-time

#### Features
- **Attendance Summary Widget**
  - Total On Duty
  - Total Late
  - Total Absent
  - Early Checkout count
  
- **Patrol Status Widget**
  - Routes Completed
  - Routes In Progress
  - Routes Pending
  - Missed Checkpoints

- **Incident Summary Widget**
  - Open Incidents
  - In Review
  - Closed Today
  - Critical Alerts

- **Task Completion Widget**
  - Checklist Progress
  - Overdue Tasks
  - Completed Today

- **Filter Controls**
  - Date Range Picker
  - Site Selector (multi-select)
  - Shift Filter

#### Data Flow
```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Database    │────▶│ Aggregation   │────▶│   Dashboard   │
│   (Real-time) │     │   Service     │     │    Widget     │
└───────────────┘     └───────────────┘     └───────────────┘
         │                                          │
         │                                          ▼
         │                              ┌───────────────────┐
         └─────────────────────────────▶│  Auto-Refresh     │
                                        │  (30 seconds)     │
                                        └───────────────────┘
```

---

### 2. Reporting Module

#### 2.1 Daily Activity Report (DAR)

**Purpose:** Pencatatan aktivitas harian security shift

**Form Fields:**
- Site Selection (dropdown)
- Shift Selection (Morning/Afternoon/Night)
- Report Date (date picker)
- Personnel on Duty (multi-select)
- Weather Condition (dropdown)
- Summary (textarea)
- Activities Section (dynamic list):
  - Time
  - Activity Type
  - Description
  - Location
  - Photo Evidence
- Incidents Noted (reference)
- Handover Notes (textarea)

**Status Workflow:**
```
    DRAFT ──▶ SUBMITTED ──▶ APPROVED
                  │
                  └────▶ REJECTED (with reason)
```

#### 2.2 Daily Visitors Report

**Purpose:** Registrasi dan tracking pengunjung

**Visitor Information:**
- Visitor Name
- ID Number (KTP/SIM/Passport)
- Company/Organization
- Phone Number
- Photo (camera capture)

**Visit Details:**
- Site Selection
- Purpose of Visit
- Host/Person to Meet
- Expected Duration
- Vehicle Info (optional)

**Check-in/Check-out System:**
```
┌────────────┐     ┌────────────┐     ┌────────────┐
│  Register  │────▶│   Active   │────▶│  Checked   │
│            │     │ (On-site)  │     │    Out     │
└────────────┘     └────────────┘     └────────────┘
     │                   │                   │
     ▼                   ▼                   ▼
  Badge Issue      Track Duration      Log Complete
```

#### 2.3 Laporan Intelligent

**Purpose:** Laporan analitis dan intelligence gathering

**Features:**
- Trend Analysis
- Pattern Recognition
- Alert Generation
- Custom Report Builder

#### 2.4 Compliance And Auditor

**Purpose:** Audit kepatuhan dan compliance tracking

**Compliance Checklist:**
- Safety Compliance
- Security Procedures
- Equipment Check
- Documentation
- Personnel Compliance

**Audit Workflow:**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Schedule   │────▶│   Execute    │────▶│   Report     │
│    Audit     │     │    Audit     │     │  & Findings  │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

### 3. Patrol Module

#### 3.1 Patrol Schedule

**Purpose:** Penjadwalan patroli dengan calendar view

**Features:**
- Monthly/Weekly/Daily Calendar View
- Color-coded by Route
- Drag-and-drop Scheduling
- Recurring Schedule Support
- Multiple Personnel Assignment

**Schedule Entity:**
```
PatrolSchedule
├── route_id
├── site_id
├── scheduled_date
├── scheduled_time
├── frequency (ONCE/DAILY/WEEKLY)
├── recurrence_end_date
├── notes
└── created_by
```

#### 3.2 Patrol Assignment

**Purpose:** Penugasan personel ke jadwal patroli

**Kanban Board View:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  UNASSIGNED │  ASSIGNED   │ IN PROGRESS │  COMPLETED  │
├─────────────┼─────────────┼─────────────┼─────────────┤
│             │             │             │             │
│  [Task 1]   │  [Task 3]   │  [Task 5]   │  [Task 7]   │
│  [Task 2]   │  [Task 4]   │  [Task 6]   │  [Task 8]   │
│             │             │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Assignment Fields:**
- Schedule Selection
- Personnel Assignment (lead + members)
- Special Instructions
- Equipment Checklist

#### 3.3 Security Patrol (Execution)

**Purpose:** Eksekusi patroli dengan tracking checkpoint

**Mobile Interface Features:**
- Active Patrol View
- Checkpoint List
- QR Scan at Checkpoints
- GPS Tracking
- Photo Evidence
- Notes per Checkpoint

**Checkpoint Validation:**
```
┌─────────────────────────────────────────────────┐
│              CHECKPOINT SCAN                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐       │
│  │   QR    │ + │   GPS   │ + │  Photo  │       │
│  │  Scan   │   │  Valid  │   │Evidence │       │
│  └────┬────┘   └────┬────┘   └────┬────┘       │
│       │             │             │             │
│       └─────────────┼─────────────┘             │
│                     ▼                           │
│           ┌─────────────────┐                   │
│           │   Checkpoint    │                   │
│           │   Completed     │                   │
│           └─────────────────┘                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 3.4 Joint Patrol

**Purpose:** Patroli gabungan dengan multiple personnel

**Features:**
- Multiple Personnel Selection
- Lead Patrol Assignment
- Shared Route
- Synchronized Checkpoints
- Combined Report

#### 3.5 Patrol Report

**Purpose:** Laporan hasil patroli

**Report Contents:**
- Patrol Summary
- Checkpoint Details with Time
- Issue Documentation
- Photo Evidence
- Time Analysis

**Analytics:**
- Completion Rates
- Average Duration
- Common Issues
- Trend Charts

---

### 4. Incident Module

#### 4.1 LK dan LP (Laporan Kejadian)

**Purpose:** Pencatatan insiden dan laporan formal

**Incident Types:**
- Laporan Kejadian (LK) - Internal incident
- Laporan Polisi (LP) - Police report

**Form Fields:**
- Report Number (auto-generate)
- Date & Time of Incident
- Location (site + specific)
- Description
- Parties Involved:
  - Name, Role (Victim/Witness/Suspect)
  - Contact, Statement
- Evidence (Photos, Documents, CCTV)
- Actions Taken
- Follow-up Required

#### 4.2 BAP (Berita Acara Pemeriksaan)

**Purpose:** Rekam investigasi formal

**BAP Structure:**
```
┌─────────────────────────────────────────────────┐
│               BERITA ACARA PEMERIKSAAN           │
├─────────────────────────────────────────────────┤
│                                                 │
│  BAP Number: [Auto-generated]                   │
│  Related Incident: [Link to LK/LP]              │
│  Date: [Date]   Location: [Location]            │
│                                                 │
│  ─────────────────────────────────────────────  │
│  EXAMINER:                                      │
│  Name: [Examiner Name]                          │
│  Position: [Position]                           │
│                                                 │
│  ─────────────────────────────────────────────  │
│  PERSON EXAMINED:                               │
│  Name: [Name]                                   │
│  ID Number: [ID]                                │
│  Position: [Position]                           │
│                                                 │
│  ─────────────────────────────────────────────  │
│  QUESTIONS & ANSWERS:                           │
│  Q1: [Question]                                 │
│  A1: [Answer]                                   │
│  ...                                            │
│                                                 │
│  ─────────────────────────────────────────────  │
│  FINDINGS:                                      │
│  [Findings text]                                │
│                                                 │
│  CONCLUSIONS:                                   │
│  [Conclusions text]                             │
│                                                 │
│  ─────────────────────────────────────────────  │
│  SIGNATURES:                                    │
│  [Digital signatures]                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 4.3 NO STPLK (Surat Tanda Laporan Kehilangan)

**Purpose:** Sertifikat resmi laporan kehilangan

**Form Fields:**
- STPLK Number (unique)
- Reporter Information
- Lost Item Details:
  - Item Type
  - Description
  - Estimated Value
  - When/Where Lost
- Supporting Documents

**Certificate Generation:**
- Official format
- QR code for verification
- Watermark

#### 4.4 Findings Report

**Purpose:** Tracking temuan dan issue

**Finding Categories:**
- Safety Issue
- Security Issue
- Compliance Issue
- Other

**Risk Levels:**
```
┌──────────┬──────────┬──────────┬──────────┐
│   LOW    │  MEDIUM  │   HIGH   │ CRITICAL │
│   🟢     │    🟡    │    🟠    │    🔴    │
├──────────┼──────────┼──────────┼──────────┤
│ Monitor  │ Schedule │ Urgent   │ Immediate│
│ Only     │ Fix      │ Attention│ Action   │
└──────────┴──────────┴──────────┴──────────┘
```

**Tracking Workflow:**
```
OPEN ──▶ ASSIGNED ──▶ IN PROGRESS ──▶ RESOLVED ──▶ VERIFIED
           │
           └──▶ ESCALATED
```

#### 4.5 Incident Recap

**Purpose:** Dashboard ringkasan insiden

**Metrics:**
- Total Incidents by Type
- Incidents by Status
- Trend Chart (daily/weekly/monthly)
- Top Locations
- Resolution Time

---

### 5. Training Module

#### 5.1 Training Plan

**Purpose:** Perencanaan dan penjadwalan training

**Training Definition:**
- Training Name
- Category (Safety/Security/Skill/Compliance)
- Description
- Duration
- Instructor
- Max Participants
- Prerequisites
- Materials

**Session Management:**
- Date & Time
- Location/Venue
- Mode (Online/Offline/Hybrid)
- Status (Planned/Ongoing/Completed/Cancelled)

#### 5.2 Training Participant

**Purpose:** Enrollment dan tracking peserta

**Enrollment Features:**
- Select Training
- Register Participants
- Bulk Enrollment
- Waitlist Management

**Attendance & Assessment:**
- Check-in Participants
- Pre/Post Test Scores
- Pass/Fail Status
- Certificate Generation

**Participant Record:**
```
┌─────────────────────────────────────────────────┐
│             TRAINING PARTICIPANT RECORD          │
├─────────────────────────────────────────────────┤
│                                                 │
│  Name: [Participant Name]                       │
│  Training: [Training Name]                      │
│  Session: [Date & Time]                         │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Status: ✅ ATTENDED                      │   │
│  ├─────────────────────────────────────────┤   │
│  │ Pre-test Score:  75/100                 │   │
│  │ Post-test Score: 92/100                 │   │
│  │ Result: PASSED ✅                        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Certificate: [Download Link]                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 6. KPI Module

#### 6.1 KPI Patrol

**Metrics:**
- Patrol Completion Rate
- On-time Patrol Rate
- Checkpoint Coverage
- Average Patrol Duration
- Missed Checkpoints Trend

**Visualizations:**
- Line Chart (trend over time)
- Bar Chart (by guard)
- Heatmap (by time of day)
- Target vs Actual comparison

#### 6.2 KPI Report

**Metrics:**
- Total Reports Submitted
- Reports by Type
- Average Resolution Time
- Open vs Closed Ratio
- Quality Score

**Visualizations:**
- Pie Chart (by type)
- Bar Chart (by site)
- Trend Line
- SLA Compliance gauge

#### 6.3 KPI CCTV

**Metrics:**
- CCTV Uptime %
- Incidents Captured
- Coverage Areas
- Maintenance Status
- Storage Usage

**Visualizations:**
- Status Grid
- Uptime Chart
- Alert Timeline

#### 6.4 KPI Training

**Metrics:**
- Training Completion Rate
- Pass Rate
- Training Hours per Person
- Certification Status
- Overdue Trainings

**Visualizations:**
- Progress Bars
- Completion Chart
- Category Breakdown

---

### 7. Information Data Module

#### 7.1 Document Control

**Purpose:** Manajemen dokumen dan SOP

**Document Types:**
- SOP (Standard Operating Procedures)
- Policies
- Guidelines
- Forms/Templates
- Certifications

**Features:**
- Document Upload
- Version Control
- Approval Workflow
- Access Control
- Search & Filter
- Download Tracking

**Version Control:**
```
Document v1.0 ──▶ v1.1 ──▶ v2.0 ──▶ v2.1
    │             │         │         │
    └── Archive ──┴─────────┴─────────┘
```

#### 7.2 CCTV Status

**Purpose:** Monitoring status CCTV

**Monitoring Features:**
- Camera Status (Online/Offline)
- Recording Status
- Storage Status
- Alert Notifications

**Dashboard View:**
```
┌─────────────────────────────────────────────────┐
│                 CCTV STATUS GRID                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  │
│  │ 🟢  │  │ 🟢  │  │ 🔴  │  │ 🟢  │  │ 🟡  │  │
│  │CAM01│  │CAM02│  │CAM03│  │CAM04│  │CAM05│  │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  │
│                                                 │
│  🟢 Online: 18   🔴 Offline: 2   🟡 Warning: 1  │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 7.3 Notification System

**Notification Types:**
- System Alerts
- Task Reminders
- Approval Requests
- Incident Alerts
- Training Reminders

**Channels:**
- In-app Notifications
- Email Notifications
- Push Notifications (mobile)

**User Preferences:**
- Notification Settings per Type
- Quiet Hours Configuration
- Channel Preferences

---

### 8. Master Data Module

#### 8.1 Worker Data

**Worker Profile:**
- Personal Information
- Employment Details
- Division Assignment
- Site Assignment
- Role/Position
- Contact Details
- Emergency Contact
- Documents (ID, Certificates)
- Photo

**List Features:**
- Searchable Table
- Filter by Site, Division, Status
- Bulk Actions
- Export

#### 8.2 Business Unit

**Hierarchy Structure:**
```
Company
├── Region A
│   ├── Area A1
│   │   ├── Site A1.1
│   │   └── Site A1.2
│   └── Area A2
│       └── Site A2.1
└── Region B
    └── Area B1
        ├── Site B1.1
        └── Site B1.2
```

**Fields:**
- Unit Name
- Code
- Parent Unit
- Description
- Manager
- Status

#### 8.3 Department

**Fields:**
- Department Name
- Code
- Business Unit (link)
- Description
- Head of Department
- Status

#### 8.4 Patrol and Guard Points

**Guard Point Data:**
- Name
- Location Description
- GPS Coordinates
- QR Code (unique)
- Photo
- Associated Route
- Instructions

**Map View Features:**
- All Points on Map
- Route Visualization
- Point Details Popup
- Distance Calculation

#### 8.5 Job Position

**Fields:**
- Position Name
- Code
- Level/Grade
- Department
- Description
- Requirements
- Status

#### 8.6 Asset Management

**Asset Data:**
- Asset Name
- Category
- Asset Code/Tag
- Location/Site
- Assigned To
- Status (Active/Maintenance/Retired)
- Purchase Info
- Maintenance Schedule

**Asset Categories:**
- Category Name
- Description
- Depreciation Rules

#### 8.7 CCTV Zone

**Zone Data:**
- Zone Name
- Site
- Camera Count
- Coverage Area Description
- Recording Status
- Storage Days
- Maintenance Status

---

### 9. Administrator Module

#### 9.1 User Management

**Features:**
- User CRUD Operations
- Bulk User Import (CSV)
- Password Reset
- Account Activation/Deactivation
- Last Login Tracking
- Activity Log per User

**User Data:**
```
User
├── Basic Info (name, email, phone)
├── Credentials (password hash)
├── Role Assignment
├── Site Assignment
├── Division Assignment
├── Status (Active/Inactive)
└── Metadata (created_at, last_login)
```

#### 9.2 User Access (Permissions)

**Permission Matrix:**
```
┌────────────────┬────────┬────────┬────────┬────────┬────────┐
│    MODULE      │ CREATE │  READ  │ UPDATE │ DELETE │APPROVE │
├────────────────┼────────┼────────┼────────┼────────┼────────┤
│ Dashboard      │   -    │   ✓    │   -    │   -    │   -    │
│ DAR            │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │
│ Visitors       │   ✓    │   ✓    │   ✓    │   -    │   -    │
│ Patrol         │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │
│ Incident       │   ✓    │   ✓    │   ✓    │   -    │   ✓    │
│ Training       │   ✓    │   ✓    │   ✓    │   ✓    │   -    │
│ KPI            │   -    │   ✓    │   -    │   -    │   -    │
│ Master Data    │   ✓    │   ✓    │   ✓    │   ✓    │   -    │
│ Settings       │   ✓    │   ✓    │   ✓    │   ✓    │   -    │
└────────────────┴────────┴────────┴────────┴────────┴────────┘
```

**Role Types:**
- ADMIN - Full access
- SUPERVISOR - Site-level management
- FIELD - Operational access

#### 9.3 Incident User Access

**Special Permissions:**
- View Incidents (by type/site)
- Edit Incidents
- Approve/Close Incidents
- Department-based Access
- Site-based Access

#### 9.4 Translation (i18n)

**Features:**
- Multiple Language Support
- Translation Key Management
- Translation Value Editor
- Missing Translation Detection
- Import/Export Translations

**Supported Languages:**
- Bahasa Indonesia (id)
- English (en)

---

## 🗄️ Database Architecture

### Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE RELATIONSHIPS                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┐       ┌──────────┐       ┌──────────┐
│  Users   │──────▶│  Sites   │◀──────│ Bus.Unit │
└────┬─────┘       └────┬─────┘       └──────────┘
     │                  │
     │    ┌─────────────┼─────────────┐
     │    │             │             │
     ▼    ▼             ▼             ▼
┌──────────┐       ┌──────────┐  ┌──────────┐
│   DAR    │       │ Visitors │  │ Incidents│
└──────────┘       └──────────┘  └────┬─────┘
                                      │
                        ┌─────────────┼─────────────┐
                        ▼             ▼             ▼
                   ┌────────┐   ┌────────┐   ┌────────┐
                   │Parties │   │Evidence│   │Actions │
                   └────────┘   └────────┘   └────────┘

┌──────────┐       ┌──────────┐       ┌──────────┐
│  Routes  │──────▶│Checkpnts │       │Schedules │
└────┬─────┘       └──────────┘       └────┬─────┘
     │                                     │
     └─────────────────┬───────────────────┘
                       ▼
                 ┌──────────┐       ┌──────────┐
                 │Assignmnt │──────▶│PatrolLog │
                 └──────────┘       └──────────┘

┌──────────┐       ┌──────────┐       ┌──────────┐
│Trainings │──────▶│ Sessions │──────▶│Particpnt │
└──────────┘       └──────────┘       └──────────┘
```

### Core Tables Summary

| Table Group | Tables | Purpose |
|-------------|--------|---------|
| **Auth** | users, roles, permissions, role_permissions | Authentication & Authorization |
| **Organization** | sites, business_units, departments | Organizational structure |
| **Personnel** | workers, job_positions | Employee management |
| **Reporting** | daily_activity_reports, dar_activities, visitors | Daily reports |
| **Patrol** | patrol_routes, patrol_checkpoints, patrol_schedules, patrol_assignments, patrol_logs | Patrol management |
| **Incident** | incidents, incident_parties, incident_evidence, incident_actions | Incident tracking |
| **Training** | trainings, training_sessions, training_participants | Training management |
| **Compliance** | compliance_checklists, compliance_items, audits, audit_results | Audit & compliance |
| **Assets** | assets, asset_categories | Asset tracking |
| **CCTV** | cctv_zones, cctv_cameras, cctv_maintenance_logs | CCTV monitoring |
| **Documents** | documents, document_versions | Document control |
| **Notifications** | notifications, notification_preferences | Notification system |
| **KPI** | kpi_targets, kpi_snapshots | Performance metrics |
| **System** | translations, user_activity_logs | System configuration |

---

## 🔌 API Architecture

### API Structure

```
/api/v1/
├── /auth
│   ├── POST   /login
│   ├── POST   /logout
│   ├── POST   /refresh
│   └── GET    /me
│
├── /dashboard
│   ├── GET    /overview
│   ├── GET    /widgets
│   └── GET    /stats
│
├── /dar
│   ├── GET    /                    # List
│   ├── POST   /                    # Create
│   ├── GET    /{id}                # Detail
│   ├── PUT    /{id}                # Update
│   ├── DELETE /{id}                # Delete
│   ├── POST   /{id}/submit         # Submit
│   ├── POST   /{id}/approve        # Approve
│   ├── POST   /{id}/reject         # Reject
│   └── GET    /{id}/export-pdf     # Export
│
├── /visitors
│   ├── GET    /                    # List
│   ├── POST   /                    # Register
│   ├── GET    /current             # Currently on-site
│   ├── GET    /{id}                # Detail
│   ├── PUT    /{id}                # Update
│   ├── POST   /{id}/checkout       # Check out
│   └── GET    /stats               # Statistics
│
├── /patrol
│   ├── /routes
│   │   ├── GET    /                # List routes
│   │   ├── POST   /                # Create route
│   │   ├── GET    /{id}            # Route detail
│   │   ├── PUT    /{id}            # Update route
│   │   └── DELETE /{id}            # Delete route
│   │
│   ├── /checkpoints
│   │   ├── GET    /                # List checkpoints
│   │   ├── POST   /                # Create checkpoint
│   │   ├── PUT    /{id}            # Update checkpoint
│   │   └── DELETE /{id}            # Delete checkpoint
│   │
│   ├── /schedules
│   │   ├── GET    /                # List schedules
│   │   ├── POST   /                # Create schedule
│   │   ├── GET    /{id}            # Schedule detail
│   │   ├── PUT    /{id}            # Update schedule
│   │   └── DELETE /{id}            # Delete schedule
│   │
│   ├── /assignments
│   │   ├── GET    /                # List assignments
│   │   ├── POST   /                # Create assignment
│   │   ├── GET    /{id}            # Assignment detail
│   │   ├── PUT    /{id}            # Update assignment
│   │   ├── POST   /{id}/start      # Start patrol
│   │   └── POST   /{id}/complete   # Complete patrol
│   │
│   └── /execution
│       ├── POST   /scan-checkpoint # Scan checkpoint
│       └── GET    /active          # Get active patrol
│
├── /incidents
│   ├── GET    /                    # List all
│   ├── POST   /                    # Create
│   ├── GET    /{id}                # Detail
│   ├── PUT    /{id}                # Update
│   ├── DELETE /{id}                # Delete
│   ├── POST   /{id}/assign         # Assign
│   ├── POST   /{id}/resolve        # Resolve
│   └── GET    /recap               # Recap dashboard
│
├── /training
│   ├── /plans
│   │   ├── GET    /                # List trainings
│   │   ├── POST   /                # Create training
│   │   └── ...
│   │
│   ├── /sessions
│   │   ├── GET    /                # List sessions
│   │   ├── POST   /                # Create session
│   │   └── ...
│   │
│   └── /participants
│       ├── GET    /                # List participants
│       ├── POST   /enroll          # Enroll
│       ├── POST   /checkin         # Check-in
│       └── POST   /certificate     # Generate certificate
│
├── /kpi
│   ├── GET    /patrol              # Patrol KPIs
│   ├── GET    /report              # Report KPIs
│   ├── GET    /cctv                # CCTV KPIs
│   └── GET    /training            # Training KPIs
│
├── /master-data
│   ├── /workers                    # Worker CRUD
│   ├── /business-units             # Business Unit CRUD
│   ├── /departments                # Department CRUD
│   ├── /guard-points               # Guard Point CRUD
│   ├── /job-positions              # Job Position CRUD
│   ├── /assets                     # Asset CRUD
│   ├── /asset-categories           # Asset Category CRUD
│   └── /cctv-zones                 # CCTV Zone CRUD
│
├── /documents
│   ├── GET    /                    # List
│   ├── POST   /upload              # Upload
│   ├── GET    /{id}                # Detail
│   ├── PUT    /{id}                # Update
│   ├── POST   /{id}/approve        # Approve
│   └── GET    /{id}/download       # Download
│
├── /cctv
│   ├── GET    /status              # All camera status
│   ├── GET    /zones               # List zones
│   └── POST   /maintenance         # Log maintenance
│
├── /notifications
│   ├── GET    /                    # List notifications
│   ├── POST   /{id}/read           # Mark as read
│   ├── POST   /read-all            # Mark all as read
│   └── PUT    /preferences         # Update preferences
│
└── /admin
    ├── /users                      # User management
    ├── /permissions                # Permission management
    ├── /translations               # Translation management
    └── /activity-logs              # Activity logs
```

### API Standards

**Request/Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## 🖥️ Frontend Architecture

### Component Structure

```
src/
├── components/           # Shared components
│   ├── common/           # Button, Input, Modal, etc.
│   ├── layout/           # Header, Sidebar, Footer
│   ├── forms/            # Form components
│   └── charts/           # Chart components
│
├── pages/                # Page components
│   ├── Dashboard/
│   ├── Reporting/
│   │   ├── DAR/
│   │   ├── Visitors/
│   │   ├── Intelligence/
│   │   └── Compliance/
│   ├── Patrol/
│   │   ├── Schedule/
│   │   ├── Assignment/
│   │   ├── Security/
│   │   ├── Joint/
│   │   └── Report/
│   ├── Incident/
│   │   ├── LKLP/
│   │   ├── BAP/
│   │   ├── STPLK/
│   │   ├── Findings/
│   │   └── Recap/
│   ├── Training/
│   │   ├── Plan/
│   │   └── Participant/
│   ├── KPI/
│   │   ├── Patrol/
│   │   ├── Report/
│   │   ├── CCTV/
│   │   └── Training/
│   ├── Information/
│   │   ├── Documents/
│   │   ├── CCTVStatus/
│   │   └── Notifications/
│   ├── MasterData/
│   │   ├── Worker/
│   │   ├── BusinessUnit/
│   │   ├── Department/
│   │   ├── GuardPoints/
│   │   ├── JobPosition/
│   │   ├── Asset/
│   │   └── CCTVZone/
│   └── Admin/
│       ├── UserManagement/
│       ├── UserAccess/
│       ├── IncidentAccess/
│       └── Translation/
│
├── services/             # API services
├── hooks/                # Custom hooks
├── store/                # State management (Zustand)
├── types/                # TypeScript types
├── utils/                # Utility functions
└── i18n/                 # Internationalization
```

### State Management

**Using Zustand:**
```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => void;
}

// stores/notificationStore.ts
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}
```

### Routing Structure

```typescript
const routes = [
  { path: '/', element: <Dashboard /> },
  { path: '/reporting/dar', element: <DARList /> },
  { path: '/reporting/dar/new', element: <DARForm /> },
  { path: '/reporting/dar/:id', element: <DARDetail /> },
  { path: '/patrol/schedule', element: <PatrolSchedule /> },
  { path: '/patrol/assignment', element: <PatrolAssignment /> },
  // ... more routes
];
```

---

## 🔐 Security Architecture

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Login   │────▶│  Verify  │────▶│  Issue   │
│          │     │ Request  │     │Password  │     │   JWT    │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
┌──────────────────────────────────────────────────────┘
│
▼
┌──────────────────────────────────────────────────────────────┐
│                      JWT Token                                │
├──────────────────────────────────────────────────────────────┤
│  Header: { alg: "HS256", typ: "JWT" }                        │
│  Payload: {                                                  │
│    sub: "user_id",                                           │
│    role: "ADMIN",                                            │
│    site_ids: ["site1", "site2"],                             │
│    exp: timestamp,                                           │
│    iat: timestamp                                            │
│  }                                                           │
│  Signature: HMACSHA256(...)                                  │
└──────────────────────────────────────────────────────────────┘
```

### Authorization Model

**Role-Based Access Control (RBAC):**
```
                    ┌─────────────────┐
                    │      USER       │
                    └────────┬────────┘
                             │ has
                             ▼
                    ┌─────────────────┐
                    │      ROLE       │
                    └────────┬────────┘
                             │ grants
                             ▼
              ┌──────────────┴──────────────┐
              │                             │
     ┌────────▼────────┐          ┌────────▼────────┐
     │   PERMISSIONS   │          │  SITE ACCESS    │
     │  (Module+Action)│          │  (Site IDs)     │
     └─────────────────┘          └─────────────────┘
```

### Security Measures

| Layer | Measure |
|-------|---------|
| **Transport** | HTTPS/TLS 1.3 |
| **Authentication** | JWT with refresh tokens |
| **Authorization** | RBAC with permission matrix |
| **Password** | bcrypt hashing (cost 12) |
| **Input** | Validation with Pydantic/Zod |
| **Output** | Response sanitization |
| **Rate Limiting** | API rate limiting |
| **Audit** | Activity logging |

---

## 🔗 Integration Points

### External Integrations

```
┌─────────────────────────────────────────────────────────────────────┐
│                      INTEGRATION POINTS                              │
└─────────────────────────────────────────────────────────────────────┘

     ┌───────────────┐          ┌───────────────┐
     │  Email/SMTP   │          │  SMS Gateway  │
     │   (Notify)    │          │   (Alerts)    │
     └───────┬───────┘          └───────┬───────┘
             │                          │
             └──────────┬───────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                         SRM SYSTEM                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
└──────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐┌───────────────┐┌───────────────┐
│ Cloud Storage ││  Maps API     ││  Push Service │
│ (S3/MinIO)    ││  (GPS/Maps)   ││  (FCM/APNs)   │
└───────────────┘└───────────────┘└───────────────┘
```

### Webhook Support

**Outgoing Webhooks:**
- Incident Created
- Patrol Completed
- Training Completed
- Compliance Alert

**Incoming Webhooks:**
- CCTV Alert Notifications
- External System Updates

---

## 📊 Performance Considerations

### Optimization Strategies

| Area | Strategy |
|------|----------|
| **Database** | Indexing, Query optimization, Connection pooling |
| **API** | Response caching, Pagination, Lazy loading |
| **Frontend** | Code splitting, Image optimization, Service workers |
| **Real-time** | WebSocket for live updates, Redis pub/sub |

### Caching Strategy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    Redis    │────▶│  Database   │
│   Cache     │     │   Cache     │     │  (Source)   │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │
     │ TTL: 5min          │ TTL: 1-5min
     │ (Static)           │ (Dynamic)
```

---

## 📝 Summary

SRM (Security Risk Management) adalah sistem komprehensif yang mencakup:

| Module | Features Count | Priority |
|--------|----------------|----------|
| Dashboard | 4 widgets | HIGH |
| Reporting | 4 sub-modules | HIGH |
| Patrol | 5 sub-modules | HIGH |
| Incident | 5 sub-modules | HIGH |
| Training | 2 sub-modules | MEDIUM |
| KPI | 4 sub-modules | MEDIUM |
| Information | 3 sub-modules | MEDIUM |
| Master Data | 8 sub-modules | MEDIUM |
| Administrator | 4 sub-modules | LOW |

**Total Features:** 41+ unique features  
**Estimated API Endpoints:** 150+  
**Estimated Database Tables:** 50+

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Based on:** SRM Reference Screenshots Analysis
