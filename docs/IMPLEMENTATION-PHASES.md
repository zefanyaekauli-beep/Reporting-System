# 📋 Verolux Implementation Phases
## Based on SRM (Security Risk Management) Reference Project

**Created:** January 2025  
**Reference:** SRM Security Risk Management System  
**Target:** Verolux Management System

---

## 📊 Executive Summary

Dokumen ini berisi phase-by-phase implementation plan untuk menyelesaikan Verolux Management System berdasarkan referensi dari SRM (Security Risk Management) yang sudah jadi.

### Current Status Verolux: ~80% Complete

| Status | Count | Description |
|--------|-------|-------------|
| ✅ Complete | 12 | Fitur sudah selesai |
| ⚠️ Partial | 5 | Fitur ada tapi belum lengkap |
| ❌ Not Started | 28 | Fitur belum dibuat |

---

## 🎯 Implementation Phases Overview

| Phase | Name | Priority | Effort | Status |
|-------|------|----------|--------|--------|
| 1 | Core Dashboard Enhancement | HIGH | 1 week | 🔄 Ready |
| 2 | Daily Activity Report (DAR) | HIGH | 1 week | 🔄 Ready |
| 3 | Daily Visitors Report | HIGH | 1 week | 📋 Planned |
| 4 | Patrol Management System | HIGH | 2 weeks | 📋 Planned |
| 5 | Incident Management System | HIGH | 2 weeks | 📋 Planned |
| 6 | Compliance & Auditor | MEDIUM | 1 week | 📋 Planned |
| 7 | Training Management | MEDIUM | 1 week | 📋 Planned |
| 8 | KPI Dashboard & Analytics | MEDIUM | 2 weeks | 📋 Planned |
| 9 | Master Data Management | MEDIUM | 2 weeks | 📋 Planned |
| 10 | Administrator & Settings | LOW | 1 week | 📋 Planned |
| 11 | Information Data & Notifications | LOW | 1 week | 📋 Planned |
| 12 | Final Polish & Integration | LOW | 1 week | 📋 Planned |

**Total Estimated Time:** 14-16 weeks

---

## 📁 Phase 1: Core Dashboard Enhancement

### 🎯 Objective
Meningkatkan Live Dashboard dengan widget dan metrics yang komprehensif sesuai referensi SRM.

### 📋 Features to Implement

#### 1.1 Dashboard Widgets
```
□ Attendance Summary Widget
  - Total On Duty
  - Total Late
  - Total Absent
  - Total Early Checkout
  
□ Patrol Status Widget
  - Routes Completed
  - Routes In Progress
  - Routes Pending
  - Missed Checkpoints

□ Incident Summary Widget
  - Open Incidents
  - In Review
  - Closed Today
  - Critical Alerts

□ Task Completion Widget
  - Checklist Progress
  - Overdue Tasks
  - Completed Today
```

#### 1.2 Real-time Updates
```
□ Auto-refresh every 30 seconds
□ WebSocket integration (optional)
□ Loading states for each widget
□ Error handling per widget
```

#### 1.3 Filter Controls
```
□ Date Range Picker
□ Site Selector (multi-select)
□ Division Filter (Security/Cleaning/Driver)
□ Shift Filter
```

### 🗃️ Database Changes
```sql
-- No new tables needed
-- Use existing: attendance, checklist_instances, reports
```

### 📁 Files to Create/Modify

**Backend:**
```
□ app/api/v1/endpoints/dashboard.py (enhance)
□ app/schemas/dashboard.py (new)
□ app/services/dashboard_service.py (new)
```

**Frontend:**
```
□ src/pages/supervisor/Dashboard/
  ├── index.tsx (enhance)
  ├── components/
  │   ├── AttendanceWidget.tsx
  │   ├── PatrolWidget.tsx
  │   ├── IncidentWidget.tsx
  │   ├── TaskWidget.tsx
  │   ├── QuickStats.tsx
  │   └── DashboardFilters.tsx
  └── hooks/
      └── useDashboardData.ts
```

### ✅ Acceptance Criteria
- [ ] Dashboard loads within 2 seconds
- [ ] All widgets display real-time data
- [ ] Filters work correctly across all widgets
- [ ] Responsive design for desktop and tablet
- [ ] Error states handled gracefully

---

## 📁 Phase 2: Daily Activity Report (DAR)

### 🎯 Objective
Implementasi sistem Daily Activity Report untuk pencatatan aktivitas harian security.

### 📋 Features to Implement

#### 2.1 DAR Form Page
```
□ Form Fields:
  - Site Selection (dropdown)
  - Shift Selection (Morning/Afternoon/Night)
  - Report Date (date picker)
  - Personnel on Duty (multi-select)
  - Weather Condition (dropdown)
  - Summary/Ringkasan (textarea)
  - Activities Section (dynamic list)
    - Time
    - Activity Type
    - Description
    - Location
    - Photo Evidence (optional)
  - Incidents Noted (reference to incidents)
  - Handover Notes (textarea)
  - Signature/Confirmation

□ Form Validation:
  - Required fields validation
  - Date cannot be future
  - At least one activity required
  
□ Form Actions:
  - Save as Draft
  - Submit for Review
  - Cancel
```

#### 2.2 DAR List Page
```
□ Table Columns:
  - Date
  - Site
  - Shift
  - Created By
  - Status (Draft/Submitted/Approved/Rejected)
  - Actions

□ Filters:
  - Date Range
  - Site
  - Shift
  - Status
  - Search by creator

□ Pagination:
  - 10/25/50 per page
  - Load more / Page numbers

□ Actions:
  - View Detail
  - Edit (if draft)
  - Approve/Reject (supervisor)
  - Export PDF
  - Delete (admin only)
```

#### 2.3 DAR Detail Page
```
□ Header Info:
  - Site, Date, Shift
  - Created by, Created at
  - Status badge
  - Approval info

□ Content Sections:
  - Personnel List
  - Weather Info
  - Activities Timeline
  - Incidents Referenced
  - Handover Notes
  - Attachments/Photos

□ Actions:
  - Edit (if allowed)
  - Approve/Reject
  - Print/Export PDF
  - Share
```

### 🗃️ Database Schema

```sql
-- New table: daily_activity_reports
CREATE TABLE daily_activity_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    report_date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL, -- MORNING, AFTERNOON, NIGHT
    weather VARCHAR(50),
    summary TEXT,
    handover_notes TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, APPROVED, REJECTED
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(site_id, report_date, shift)
);

-- New table: dar_personnel
CREATE TABLE dar_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dar_id UUID NOT NULL REFERENCES daily_activity_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50),
    check_in_time TIME,
    check_out_time TIME
);

-- New table: dar_activities
CREATE TABLE dar_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dar_id UUID NOT NULL REFERENCES daily_activity_reports(id) ON DELETE CASCADE,
    activity_time TIME NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dar_site_date ON daily_activity_reports(site_id, report_date);
CREATE INDEX idx_dar_status ON daily_activity_reports(status);
CREATE INDEX idx_dar_created_by ON daily_activity_reports(created_by);
```

### 📁 Files to Create

**Backend:**
```
□ app/models/dar.py
□ app/schemas/dar.py
□ app/api/v1/endpoints/dar.py
□ app/services/dar_service.py
□ app/repositories/dar_repository.py
□ alembic/versions/xxx_create_dar_tables.py
```

**Frontend:**
```
□ src/pages/supervisor/DAR/
  ├── index.tsx (list page)
  ├── DARFormPage.tsx
  ├── DARDetailPage.tsx
  ├── components/
  │   ├── DARTable.tsx
  │   ├── DARFilters.tsx
  │   ├── DARForm.tsx
  │   ├── ActivityList.tsx
  │   ├── ActivityItem.tsx
  │   ├── PersonnelSelector.tsx
  │   └── DARStatusBadge.tsx
  └── hooks/
      ├── useDAR.ts
      └── useDARForm.ts

□ src/services/darService.ts
□ src/types/dar.ts
```

### 🔗 API Endpoints

```
POST   /api/v1/dar                    - Create DAR
GET    /api/v1/dar                    - List DAR (with filters)
GET    /api/v1/dar/{id}               - Get DAR detail
PUT    /api/v1/dar/{id}               - Update DAR
DELETE /api/v1/dar/{id}               - Delete DAR
POST   /api/v1/dar/{id}/submit        - Submit for review
POST   /api/v1/dar/{id}/approve       - Approve DAR
POST   /api/v1/dar/{id}/reject        - Reject DAR
GET    /api/v1/dar/{id}/export-pdf    - Export to PDF
```

### ✅ Acceptance Criteria
- [ ] Field staff can create DAR for their shift
- [ ] Activities can be added dynamically
- [ ] Photos can be attached to activities
- [ ] Supervisor can approve/reject DAR
- [ ] PDF export works correctly
- [ ] Duplicate DAR for same site/date/shift prevented

---

## 📁 Phase 3: Daily Visitors Report

### 🎯 Objective
Sistem pencatatan pengunjung harian untuk monitoring akses ke site.

### 📋 Features to Implement

#### 3.1 Visitor Registration Form
```
□ Visitor Information:
  - Visitor Name
  - ID Number (KTP/SIM/Passport)
  - Company/Organization
  - Phone Number
  - Email (optional)
  - Photo (camera capture)
  
□ Visit Details:
  - Site Selection
  - Purpose of Visit (dropdown + other)
  - Host/Person to Meet
  - Department to Visit
  - Expected Duration
  - Vehicle Info (optional)
    - Vehicle Type
    - Plate Number
    
□ Check-in/Check-out:
  - Check-in Time (auto)
  - Check-out Time
  - Badge Number Issued
  - Items Brought (optional list)
```

#### 3.2 Visitor List Page
```
□ Table Columns:
  - Visitor Name
  - Company
  - Purpose
  - Host
  - Check-in Time
  - Check-out Time
  - Status (In/Out)
  - Actions

□ Filters:
  - Date Range
  - Site
  - Status (Currently In / Checked Out / All)
  - Search by name/company

□ Quick Actions:
  - Check-out visitor
  - View detail
  - Print badge
```

#### 3.3 Visitor Dashboard Widget
```
□ Current Visitors Count
□ Today's Total Visitors
□ Visitors by Purpose (pie chart)
□ Peak Hours (bar chart)
```

### 🗃️ Database Schema

```sql
-- New table: visitors
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    
    -- Visitor Info
    visitor_name VARCHAR(255) NOT NULL,
    id_number VARCHAR(50),
    id_type VARCHAR(20), -- KTP, SIM, PASSPORT
    company VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    photo_url VARCHAR(500),
    
    -- Visit Details
    purpose VARCHAR(100) NOT NULL,
    purpose_other VARCHAR(255),
    host_name VARCHAR(255),
    host_department VARCHAR(100),
    expected_duration_minutes INTEGER,
    
    -- Vehicle Info
    has_vehicle BOOLEAN DEFAULT FALSE,
    vehicle_type VARCHAR(50),
    vehicle_plate VARCHAR(20),
    
    -- Check-in/out
    badge_number VARCHAR(50),
    check_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
    check_out_at TIMESTAMP,
    items_brought TEXT, -- JSON array
    
    -- Meta
    registered_by UUID NOT NULL REFERENCES users(id),
    checked_out_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_visitors_site_date ON visitors(site_id, DATE(check_in_at));
CREATE INDEX idx_visitors_status ON visitors(check_out_at) WHERE check_out_at IS NULL;
CREATE INDEX idx_visitors_name ON visitors(visitor_name);
```

### 📁 Files to Create

**Backend:**
```
□ app/models/visitor.py
□ app/schemas/visitor.py
□ app/api/v1/endpoints/visitors.py
□ app/services/visitor_service.py
□ alembic/versions/xxx_create_visitors_table.py
```

**Frontend:**
```
□ src/pages/supervisor/Visitors/
  ├── index.tsx (list page)
  ├── VisitorFormPage.tsx
  ├── VisitorDetailPage.tsx
  ├── components/
  │   ├── VisitorTable.tsx
  │   ├── VisitorFilters.tsx
  │   ├── VisitorForm.tsx
  │   ├── VisitorCard.tsx
  │   ├── CurrentVisitorsWidget.tsx
  │   └── CheckOutModal.tsx
  └── hooks/
      └── useVisitors.ts

□ src/services/visitorService.ts
□ src/types/visitor.ts
```

### 🔗 API Endpoints

```
POST   /api/v1/visitors                    - Register visitor
GET    /api/v1/visitors                    - List visitors
GET    /api/v1/visitors/current            - Get current visitors (not checked out)
GET    /api/v1/visitors/{id}               - Get visitor detail
PUT    /api/v1/visitors/{id}               - Update visitor
POST   /api/v1/visitors/{id}/checkout      - Check out visitor
GET    /api/v1/visitors/stats              - Get visitor statistics
GET    /api/v1/visitors/{id}/print-badge   - Print visitor badge
```

### ✅ Acceptance Criteria
- [ ] Guard can register visitors quickly
- [ ] Photo capture from camera works
- [ ] Current visitors list shows who's on-site
- [ ] Check-out process is simple (one click)
- [ ] Badge printing works
- [ ] Dashboard shows visitor statistics

---

## 📁 Phase 4: Patrol Management System

### 🎯 Objective
Sistem manajemen patroli lengkap: jadwal, penugasan, eksekusi, dan laporan.

### 📋 Features to Implement

#### 4.1 Patrol Schedule
```
□ Calendar View:
  - Monthly/Weekly/Daily view
  - Color-coded by route
  - Drag-and-drop scheduling
  - Recurring schedule support

□ Schedule Form:
  - Route Selection
  - Date/Time
  - Assigned Personnel
  - Frequency (Once/Daily/Weekly)
  - Notes

□ Schedule List:
  - Table view alternative
  - Filter by date, route, personnel
  - Bulk actions
```

#### 4.2 Patrol Assignment
```
□ Assignment Board:
  - Kanban-style view
  - Unassigned / Assigned / In Progress / Completed

□ Assignment Form:
  - Select Schedule
  - Assign Personnel
  - Special Instructions
  - Equipment Checklist

□ Assignment List:
  - Table with status
  - Filter and search
  - Quick reassign
```

#### 4.3 Security Patrol (Execution)
```
□ Mobile Patrol Interface:
  - Active patrol view
  - Checkpoint list
  - QR scan at checkpoints
  - GPS tracking
  - Photo evidence
  - Notes per checkpoint

□ Patrol Progress:
  - Real-time progress bar
  - Checkpoint completion status
  - Time tracking
  - Deviation alerts

□ Patrol Completion:
  - Summary view
  - All checkpoints status
  - Total time
  - Issues noted
  - Submit patrol
```

#### 4.4 Joint Patrol
```
□ Joint Patrol Form:
  - Multiple personnel selection
  - Lead patrol assignment
  - Shared route
  - Coordination notes

□ Joint Patrol Tracking:
  - All participants visible
  - Synchronized checkpoints
  - Combined report
```

#### 4.5 Patrol Report
```
□ Report List:
  - All completed patrols
  - Filter by date, route, personnel
  - Status indicators

□ Report Detail:
  - Patrol summary
  - Checkpoint details
  - Time analysis
  - Photos/evidence
  - Issues found

□ Report Analytics:
  - Completion rates
  - Average duration
  - Common issues
  - Trend charts
```

### 🗃️ Database Schema

```sql
-- Table: patrol_routes (may exist, enhance if needed)
CREATE TABLE patrol_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: patrol_checkpoints
CREATE TABLE patrol_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES patrol_routes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_order INTEGER NOT NULL,
    qr_code VARCHAR(100) UNIQUE,
    gps_lat DECIMAL(10, 8),
    gps_lng DECIMAL(11, 8),
    radius_meters INTEGER DEFAULT 50,
    expected_duration_minutes INTEGER,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: patrol_schedules
CREATE TABLE patrol_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES patrol_routes(id),
    site_id UUID NOT NULL REFERENCES sites(id),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    frequency VARCHAR(20) DEFAULT 'ONCE', -- ONCE, DAILY, WEEKLY
    recurrence_end_date DATE,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: patrol_assignments
CREATE TABLE patrol_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES patrol_schedules(id),
    user_id UUID NOT NULL REFERENCES users(id),
    is_lead BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ASSIGNED', -- ASSIGNED, IN_PROGRESS, COMPLETED, MISSED
    assigned_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT
);

-- Table: patrol_logs (execution records)
CREATE TABLE patrol_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES patrol_assignments(id),
    checkpoint_id UUID NOT NULL REFERENCES patrol_checkpoints(id),
    scanned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    gps_lat DECIMAL(10, 8),
    gps_lng DECIMAL(11, 8),
    gps_accuracy DECIMAL(6, 2),
    photo_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'OK', -- OK, ISSUE, SKIPPED
    notes TEXT,
    issue_type VARCHAR(50),
    issue_description TEXT
);

-- Table: patrol_reports
CREATE TABLE patrol_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES patrol_assignments(id),
    total_checkpoints INTEGER,
    completed_checkpoints INTEGER,
    missed_checkpoints INTEGER,
    total_duration_minutes INTEGER,
    issues_found INTEGER DEFAULT 0,
    summary TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, REVIEWED
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patrol_schedules_date ON patrol_schedules(scheduled_date);
CREATE INDEX idx_patrol_assignments_user ON patrol_assignments(user_id);
CREATE INDEX idx_patrol_assignments_status ON patrol_assignments(status);
CREATE INDEX idx_patrol_logs_assignment ON patrol_logs(assignment_id);
```

### 📁 Files to Create

**Backend:**
```
□ app/models/patrol.py
□ app/schemas/patrol.py
□ app/api/v1/endpoints/patrol_routes.py
□ app/api/v1/endpoints/patrol_schedules.py
□ app/api/v1/endpoints/patrol_assignments.py
□ app/api/v1/endpoints/patrol_execution.py
□ app/api/v1/endpoints/patrol_reports.py
□ app/services/patrol_service.py
□ alembic/versions/xxx_create_patrol_tables.py
```

**Frontend:**
```
□ src/pages/supervisor/Patrol/
  ├── Schedule/
  │   ├── index.tsx
  │   ├── CalendarView.tsx
  │   └── ScheduleForm.tsx
  ├── Assignment/
  │   ├── index.tsx
  │   ├── AssignmentBoard.tsx
  │   └── AssignmentForm.tsx
  ├── SecurityPatrol/
  │   ├── index.tsx
  │   ├── ActivePatrol.tsx
  │   └── CheckpointScan.tsx
  ├── JointPatrol/
  │   ├── index.tsx
  │   └── JointPatrolForm.tsx
  └── Report/
      ├── index.tsx
      ├── ReportDetail.tsx
      └── PatrolAnalytics.tsx

□ src/services/patrolService.ts
□ src/types/patrol.ts
```

### 🔗 API Endpoints

```
# Routes
GET    /api/v1/patrol/routes                     - List routes
POST   /api/v1/patrol/routes                     - Create route
GET    /api/v1/patrol/routes/{id}                - Get route detail
PUT    /api/v1/patrol/routes/{id}                - Update route
DELETE /api/v1/patrol/routes/{id}                - Delete route

# Checkpoints
GET    /api/v1/patrol/routes/{id}/checkpoints    - List checkpoints
POST   /api/v1/patrol/routes/{id}/checkpoints    - Add checkpoint
PUT    /api/v1/patrol/checkpoints/{id}           - Update checkpoint
DELETE /api/v1/patrol/checkpoints/{id}           - Delete checkpoint

# Schedules
GET    /api/v1/patrol/schedules                  - List schedules
POST   /api/v1/patrol/schedules                  - Create schedule
GET    /api/v1/patrol/schedules/{id}             - Get schedule
PUT    /api/v1/patrol/schedules/{id}             - Update schedule
DELETE /api/v1/patrol/schedules/{id}             - Delete schedule

# Assignments
GET    /api/v1/patrol/assignments                - List assignments
POST   /api/v1/patrol/assignments                - Create assignment
GET    /api/v1/patrol/assignments/{id}           - Get assignment
PUT    /api/v1/patrol/assignments/{id}           - Update assignment
POST   /api/v1/patrol/assignments/{id}/start     - Start patrol
POST   /api/v1/patrol/assignments/{id}/complete  - Complete patrol

# Execution
POST   /api/v1/patrol/scan-checkpoint            - Scan checkpoint
GET    /api/v1/patrol/active                     - Get active patrol

# Reports
GET    /api/v1/patrol/reports                    - List reports
GET    /api/v1/patrol/reports/{id}               - Get report detail
POST   /api/v1/patrol/reports/{id}/review        - Review report
GET    /api/v1/patrol/analytics                  - Get analytics
```

### ✅ Acceptance Criteria
- [ ] Schedule can be created with calendar UI
- [ ] Personnel can be assigned to patrols
- [ ] QR scan at checkpoints works
- [ ] GPS validation at checkpoints
- [ ] Real-time progress tracking
- [ ] Patrol reports generated automatically
- [ ] Analytics show completion rates

---

## 📁 Phase 5: Incident Management System

### 🎯 Objective
Sistem manajemen insiden lengkap dengan berbagai jenis laporan: LK/LP, BAP, STPLK, Findings.

### 📋 Features to Implement

#### 5.1 LK dan LP (Laporan Kejadian & Laporan Polisi)
```
□ Form Fields:
  - Incident Type (Kejadian/Polisi)
  - Report Number (auto-generate)
  - Date & Time of Incident
  - Location (site + specific location)
  - Description
  - Parties Involved
    - Name
    - Role (Victim/Witness/Suspect)
    - Contact
    - Statement
  - Evidence
    - Photos
    - Documents
    - CCTV Reference
  - Actions Taken
  - Follow-up Required
  - Status

□ List View:
  - Table with filters
  - Status tracking
  - Export options
```

#### 5.2 BAP (Berita Acara Pemeriksaan)
```
□ Form Fields:
  - BAP Number
  - Related Incident (link to LK/LP)
  - Examiner Info
  - Date & Location
  - Person Examined
    - Name
    - Position
    - ID Number
  - Questions & Answers (dynamic)
  - Findings
  - Conclusions
  - Signatures (digital)
  - Witnesses

□ PDF Export:
  - Official BAP format
  - Digital signatures
  - Watermark
```

#### 5.3 NO STPLK (Surat Tanda Penerimaan Laporan Kehilangan)
```
□ Form Fields:
  - STPLK Number
  - Reporter Info
  - Lost Item Details
    - Item Type
    - Description
    - Estimated Value
    - When/Where Lost
  - Supporting Documents
  - Status

□ Certificate Generation:
  - Official format
  - Unique number
  - QR code for verification
```

#### 5.4 Findings Report
```
□ Form Fields:
  - Finding Type (Safety/Security/Compliance/Other)
  - Location
  - Description
  - Risk Level (Low/Medium/High/Critical)
  - Photos
  - Recommended Actions
  - Assigned To
  - Due Date
  - Status

□ Tracking:
  - Status workflow
  - Follow-up reminders
  - Completion tracking
```

#### 5.5 Incident Recap
```
□ Dashboard View:
  - Total incidents by type
  - Incidents by status
  - Trend chart (daily/weekly/monthly)
  - Top locations
  - Resolution time

□ Summary Report:
  - Periodic summary (daily/weekly/monthly)
  - Comparisons
  - Export options
```

### 🗃️ Database Schema

```sql
-- Enhance existing reports table or create new
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    
    -- Classification
    incident_type VARCHAR(50) NOT NULL, -- LK, LP, BAP, STPLK, FINDING
    report_number VARCHAR(50) UNIQUE NOT NULL,
    related_incident_id UUID REFERENCES incidents(id),
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    incident_datetime TIMESTAMP NOT NULL,
    location_detail VARCHAR(255),
    
    -- Risk Assessment
    severity VARCHAR(20), -- LOW, MEDIUM, HIGH, CRITICAL
    risk_level VARCHAR(20),
    
    -- Status
    status VARCHAR(30) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    resolution TEXT,
    resolved_at TIMESTAMP,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    
    -- Meta
    reported_by UUID NOT NULL REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Parties involved in incidents
CREATE TABLE incident_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- VICTIM, WITNESS, SUSPECT, REPORTER
    id_number VARCHAR(50),
    contact VARCHAR(100),
    address TEXT,
    statement TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Evidence/Attachments
CREATE TABLE incident_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL, -- PHOTO, DOCUMENT, VIDEO, CCTV
    file_url VARCHAR(500) NOT NULL,
    description TEXT,
    captured_at TIMESTAMP,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- BAP specific - Q&A records
CREATE TABLE incident_bap_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- STPLK specific - Lost items
CREATE TABLE incident_lost_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    estimated_value DECIMAL(15, 2),
    lost_datetime TIMESTAMP,
    lost_location VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Actions/Follow-ups
CREATE TABLE incident_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- IMMEDIATE, FOLLOW_UP, PREVENTIVE
    description TEXT NOT NULL,
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_site ON incidents(site_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_datetime ON incidents(incident_datetime);
```

### 📁 Files to Create

**Backend:**
```
□ app/models/incident.py
□ app/schemas/incident.py
□ app/api/v1/endpoints/incidents.py
□ app/api/v1/endpoints/incident_lk.py
□ app/api/v1/endpoints/incident_bap.py
□ app/api/v1/endpoints/incident_stplk.py
□ app/api/v1/endpoints/incident_findings.py
□ app/services/incident_service.py
□ app/services/pdf_generator.py (for BAP, STPLK)
□ alembic/versions/xxx_create_incident_tables.py
```

**Frontend:**
```
□ src/pages/supervisor/Incident/
  ├── LKLP/
  │   ├── index.tsx
  │   ├── LKLPForm.tsx
  │   └── LKLPDetail.tsx
  ├── BAP/
  │   ├── index.tsx
  │   ├── BAPForm.tsx
  │   └── BAPDetail.tsx
  ├── STPLK/
  │   ├── index.tsx
  │   ├── STPLKForm.tsx
  │   └── STPLKDetail.tsx
  ├── Findings/
  │   ├── index.tsx
  │   ├── FindingsForm.tsx
  │   └── FindingsDetail.tsx
  └── Recap/
      ├── index.tsx
      └── IncidentDashboard.tsx

□ src/services/incidentService.ts
□ src/types/incident.ts
```

### ✅ Acceptance Criteria
- [ ] All incident types can be created
- [ ] Parties and evidence can be attached
- [ ] Status workflow works correctly
- [ ] BAP PDF generation works
- [ ] STPLK certificate generation works
- [ ] Incident recap shows accurate statistics

---

## 📁 Phase 6: Compliance & Auditor

### 🎯 Objective
Sistem audit kepatuhan untuk memastikan semua prosedur dijalankan dengan benar.

### 📋 Features to Implement

#### 6.1 Compliance Checklist
```
□ Checklist Categories:
  - Safety Compliance
  - Security Procedures
  - Equipment Check
  - Documentation
  - Personnel Compliance

□ Checklist Items:
  - Item description
  - Compliance criteria
  - Evidence required
  - Frequency (Daily/Weekly/Monthly)
  - Responsible role

□ Compliance Tracking:
  - Due dates
  - Completion status
  - Non-compliance flags
```

#### 6.2 Audit Schedule
```
□ Audit Planning:
  - Audit type
  - Scheduled date
  - Auditor assignment
  - Scope/Areas to audit
  - Checklist selection

□ Calendar View:
  - Upcoming audits
  - Overdue audits
  - Completed audits
```

#### 6.3 Audit Execution
```
□ Audit Form:
  - Checklist items
  - Compliance status per item
  - Evidence attachment
  - Notes/Comments
  - Non-compliance details
  - Corrective actions

□ Audit Report:
  - Summary score
  - Findings list
  - Recommendations
  - Follow-up items
```

#### 6.4 Compliance Dashboard
```
□ Metrics:
  - Overall compliance score
  - Compliance by category
  - Trend over time
  - Sites ranking
  - Open non-compliance items
```

### 🗃️ Database Schema

```sql
-- Compliance checklists
CREATE TABLE compliance_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    frequency VARCHAR(20) DEFAULT 'MONTHLY',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance checklist items
CREATE TABLE compliance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES compliance_checklists(id),
    item_text VARCHAR(500) NOT NULL,
    criteria TEXT,
    evidence_required BOOLEAN DEFAULT FALSE,
    weight INTEGER DEFAULT 1,
    sequence_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit schedules
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    checklist_id UUID NOT NULL REFERENCES compliance_checklists(id),
    audit_type VARCHAR(50) NOT NULL,
    scheduled_date DATE NOT NULL,
    auditor_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    overall_score DECIMAL(5, 2),
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit results
CREATE TABLE audit_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES compliance_items(id),
    is_compliant BOOLEAN,
    score INTEGER,
    evidence_url VARCHAR(500),
    notes TEXT,
    non_compliance_detail TEXT,
    corrective_action TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audits_site ON audits(site_id);
CREATE INDEX idx_audits_date ON audits(scheduled_date);
CREATE INDEX idx_audits_status ON audits(status);
```

### 📁 Files to Create

**Backend:**
```
□ app/models/compliance.py
□ app/schemas/compliance.py
□ app/api/v1/endpoints/compliance.py
□ app/api/v1/endpoints/audits.py
□ app/services/compliance_service.py
□ alembic/versions/xxx_create_compliance_tables.py
```

**Frontend:**
```
□ src/pages/supervisor/Compliance/
  ├── index.tsx
  ├── ChecklistManagement.tsx
  ├── AuditSchedule.tsx
  ├── AuditExecution.tsx
  ├── AuditReport.tsx
  └── ComplianceDashboard.tsx

□ src/services/complianceService.ts
□ src/types/compliance.ts
```

### ✅ Acceptance Criteria
- [ ] Compliance checklists can be created and managed
- [ ] Audits can be scheduled
- [ ] Auditors can execute audits with evidence
- [ ] Compliance scores calculated correctly
- [ ] Dashboard shows accurate metrics

---

## 📁 Phase 7: Training Management

### 🎯 Objective
Sistem manajemen pelatihan untuk tracking training plan dan peserta.

### 📋 Features to Implement

#### 7.1 Training Plan
```
□ Training Definition:
  - Training name
  - Category (Safety/Security/Skill/Compliance)
  - Description
  - Duration
  - Instructor
  - Max participants
  - Prerequisites
  - Materials

□ Training Schedule:
  - Date & Time
  - Location/Venue
  - Mode (Online/Offline/Hybrid)
  - Status (Planned/Ongoing/Completed/Cancelled)

□ Calendar View:
  - Monthly training calendar
  - Filter by category, site
```

#### 7.2 Training Participant
```
□ Enrollment:
  - Select training
  - Register participants
  - Bulk enrollment
  - Waitlist management

□ Attendance:
  - Check-in participants
  - Track attendance
  - Certificate generation

□ Assessment:
  - Pre/Post test (optional)
  - Score tracking
  - Pass/Fail status
```

#### 7.3 Training Reports
```
□ Metrics:
  - Training completed
  - Participants trained
  - Pass rate
  - Training hours

□ Individual Records:
  - Training history per person
  - Certificates earned
  - Upcoming training
```

### 🗃️ Database Schema

```sql
-- Training definitions
CREATE TABLE trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    duration_hours DECIMAL(5, 2),
    instructor VARCHAR(255),
    max_participants INTEGER,
    prerequisites TEXT,
    materials_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Training sessions/schedules
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id UUID NOT NULL REFERENCES trainings(id),
    site_id UUID REFERENCES sites(id),
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    location VARCHAR(255),
    mode VARCHAR(20) DEFAULT 'OFFLINE',
    status VARCHAR(20) DEFAULT 'PLANNED',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Training participants
CREATE TABLE training_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    enrollment_status VARCHAR(20) DEFAULT 'ENROLLED',
    attended BOOLEAN DEFAULT FALSE,
    check_in_at TIMESTAMP,
    pre_test_score DECIMAL(5, 2),
    post_test_score DECIMAL(5, 2),
    passed BOOLEAN,
    certificate_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(session_id, user_id)
);

-- Indexes
CREATE INDEX idx_training_sessions_date ON training_sessions(scheduled_date);
CREATE INDEX idx_training_participants_user ON training_participants(user_id);
```

### 📁 Files to Create

**Backend:**
```
□ app/models/training.py
□ app/schemas/training.py
□ app/api/v1/endpoints/trainings.py
□ app/api/v1/endpoints/training_sessions.py
□ app/api/v1/endpoints/training_participants.py
□ app/services/training_service.py
□ app/services/certificate_generator.py
□ alembic/versions/xxx_create_training_tables.py
```

**Frontend:**
```
□ src/pages/supervisor/Training/
  ├── Plan/
  │   ├── index.tsx
  │   ├── TrainingForm.tsx
  │   └── TrainingCalendar.tsx
  └── Participant/
      ├── index.tsx
      ├── EnrollmentForm.tsx
      ├── AttendanceSheet.tsx
      └── TrainingHistory.tsx

□ src/services/trainingService.ts
□ src/types/training.ts
```

### ✅ Acceptance Criteria
- [ ] Training plans can be created
- [ ] Sessions can be scheduled
- [ ] Participants can be enrolled
- [ ] Attendance tracking works
- [ ] Certificates can be generated
- [ ] Training history accessible

---

## 📁 Phase 8: KPI Dashboard & Analytics

### 🎯 Objective
Dashboard KPI untuk monitoring performa patrol, report, CCTV, dan training.

### 📋 Features to Implement

#### 8.1 KPI Patrol
```
□ Metrics:
  - Patrol completion rate
  - On-time patrol rate
  - Checkpoint coverage
  - Average patrol duration
  - Missed checkpoints trend

□ Visualizations:
  - Line chart (trend)
  - Bar chart (by guard)
  - Heatmap (by time)
  - Comparison (target vs actual)
```

#### 8.2 KPI Report
```
□ Metrics:
  - Total reports submitted
  - Reports by type
  - Average resolution time
  - Open vs closed ratio
  - Quality score

□ Visualizations:
  - Pie chart (by type)
  - Bar chart (by site)
  - Trend line
  - SLA compliance
```

#### 8.3 KPI CCTV
```
□ Metrics:
  - CCTV uptime
  - Incidents captured
  - Coverage areas
  - Maintenance status
  - Storage usage

□ Visualizations:
  - Status grid
  - Uptime chart
  - Alert timeline
```

#### 8.4 KPI Training
```
□ Metrics:
  - Training completion rate
  - Pass rate
  - Training hours per person
  - Certification status
  - Overdue trainings

□ Visualizations:
  - Progress bars
  - Completion chart
  - Category breakdown
```

### 🗃️ Database Changes
```sql
-- KPI targets table
CREATE TABLE kpi_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    target_value DECIMAL(10, 2) NOT NULL,
    period_type VARCHAR(20) DEFAULT 'MONTHLY',
    site_id UUID REFERENCES sites(id),
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- KPI snapshots for historical data
CREATE TABLE kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10, 2) NOT NULL,
    site_id UUID REFERENCES sites(id),
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 📁 Files to Create

**Backend:**
```
□ app/models/kpi.py
□ app/schemas/kpi.py
□ app/api/v1/endpoints/kpi.py
□ app/services/kpi_service.py
□ app/services/analytics_service.py
□ alembic/versions/xxx_create_kpi_tables.py
```

**Frontend:**
```
□ src/pages/supervisor/KPI/
  ├── index.tsx (overview)
  ├── PatrolKPI.tsx
  ├── ReportKPI.tsx
  ├── CCTVKPI.tsx
  ├── TrainingKPI.tsx
  └── components/
      ├── KPICard.tsx
      ├── KPIChart.tsx
      ├── KPITable.tsx
      └── KPIFilter.tsx

□ src/services/kpiService.ts
□ src/types/kpi.ts
```

### ✅ Acceptance Criteria
- [ ] All KPI dashboards display accurate data
- [ ] Charts render correctly
- [ ] Filters work across all KPIs
- [ ] Data refreshes appropriately
- [ ] Export functionality works

---

## 📁 Phase 9: Master Data Management

### 🎯 Objective
Manajemen data master: Worker, Business Unit, Department, Guard Points, Job Position, Asset, CCTV Zone.

### 📋 Features to Implement

#### 9.1 Worker Data
```
□ Worker Profile:
  - Personal info
  - Employment info
  - Division assignment
  - Site assignment
  - Role/Position
  - Contact details
  - Emergency contact
  - Documents (ID, certificates)
  - Photo

□ List View:
  - Searchable table
  - Filter by site, division, status
  - Bulk actions
  - Export
```

#### 9.2 Business Unit
```
□ Fields:
  - Unit name
  - Code
  - Parent unit (hierarchy)
  - Description
  - Manager
  - Status

□ Hierarchy View:
  - Tree structure
  - Expandable/collapsible
```

#### 9.3 Department
```
□ Fields:
  - Department name
  - Code
  - Business unit
  - Description
  - Head of department
  - Status
```

#### 9.4 Patrol and Guard Points
```
□ Guard Point:
  - Name
  - Location
  - GPS coordinates
  - QR code
  - Photo
  - Associated route
  - Instructions

□ Map View:
  - All points on map
  - Route visualization
  - Point details popup
```

#### 9.5 Job Position
```
□ Fields:
  - Position name
  - Code
  - Level/Grade
  - Department
  - Description
  - Requirements
  - Status
```

#### 9.6 Asset Management
```
□ Asset:
  - Asset name
  - Category
  - Asset code/tag
  - Location/Site
  - Assigned to
  - Status (Active/Maintenance/Retired)
  - Purchase info
  - Maintenance schedule

□ Asset Category:
  - Category name
  - Description
  - Depreciation rules
```

#### 9.7 CCTV Zone
```
□ Fields:
  - Zone name
  - Site
  - Camera count
  - Coverage area
  - Recording status
  - Storage info
  - Maintenance status
```

### 🗃️ Database Schema

```sql
-- Business units
CREATE TABLE business_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    parent_id UUID REFERENCES business_units(id),
    description TEXT,
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    business_unit_id UUID REFERENCES business_units(id),
    description TEXT,
    head_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Job positions
CREATE TABLE job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    level INTEGER,
    department_id UUID REFERENCES departments(id),
    description TEXT,
    requirements TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Asset categories
CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    depreciation_years INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES asset_categories(id),
    asset_code VARCHAR(100) UNIQUE,
    site_id UUID REFERENCES sites(id),
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    purchase_date DATE,
    purchase_price DECIMAL(15, 2),
    warranty_until DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- CCTV zones
CREATE TABLE cctv_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    site_id UUID NOT NULL REFERENCES sites(id),
    camera_count INTEGER DEFAULT 0,
    coverage_description TEXT,
    recording_status VARCHAR(20) DEFAULT 'ACTIVE',
    storage_days INTEGER DEFAULT 30,
    last_maintenance DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_business_units_parent ON business_units(parent_id);
CREATE INDEX idx_departments_unit ON departments(business_unit_id);
CREATE INDEX idx_assets_site ON assets(site_id);
CREATE INDEX idx_cctv_zones_site ON cctv_zones(site_id);
```

### 📁 Files to Create

**Backend:**
```
□ app/models/master_data.py
□ app/schemas/master_data.py
□ app/api/v1/endpoints/business_units.py
□ app/api/v1/endpoints/departments.py
□ app/api/v1/endpoints/job_positions.py
□ app/api/v1/endpoints/assets.py
□ app/api/v1/endpoints/cctv_zones.py
□ app/services/master_data_service.py
□ alembic/versions/xxx_create_master_data_tables.py
```

**Frontend:**
```
□ src/pages/supervisor/MasterData/
  ├── Worker/
  ├── BusinessUnit/
  ├── Department/
  ├── GuardPoints/
  ├── JobPosition/
  ├── Asset/
  └── CCTVZone/

□ src/services/masterDataService.ts
□ src/types/masterData.ts
```

### ✅ Acceptance Criteria
- [ ] All master data CRUD operations work
- [ ] Hierarchies display correctly
- [ ] Guard points show on map
- [ ] Asset tracking works
- [ ] Data export functionality works

---

## 📁 Phase 10: Administrator & Settings

### 🎯 Objective
Pengaturan administrator: User Management, User Access, Incident User Access, Translation.

### 📋 Features to Implement

#### 10.1 User Management (Enhance Existing)
```
□ Enhancements:
  - Bulk user import (CSV)
  - User deactivation workflow
  - Password reset by admin
  - Last login tracking
  - Activity log per user
```

#### 10.2 User Access (Role Permissions)
```
□ Permission Matrix:
  - Module-based permissions
  - CRUD operations per module
  - Custom role creation
  - Role assignment to users

□ UI:
  - Matrix view (roles x permissions)
  - Checkbox toggle
  - Bulk assign/remove
```

#### 10.3 Incident User Access
```
□ Special Permissions:
  - Who can view incidents
  - Who can edit incidents
  - Who can approve/close
  - Department-based access
  - Site-based access
```

#### 10.4 Translation (i18n)
```
□ Language Management:
  - Supported languages
  - Translation keys
  - Translations per language
  - Missing translation detection

□ UI:
  - Translation editor
  - Import/Export translations
  - Preview translations
```

### 🗃️ Database Schema

```sql
-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, READ, UPDATE, DELETE, APPROVE
    description TEXT,
    UNIQUE(module, action)
);

-- Role permissions
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- User activity logs
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Translations
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(10) NOT NULL,
    translation_key VARCHAR(255) NOT NULL,
    translation_value TEXT NOT NULL,
    module VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(language_code, translation_key)
);

-- Indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_user_activity_user ON user_activity_logs(user_id);
CREATE INDEX idx_translations_lang ON translations(language_code);
```

### 📁 Files to Create

**Backend:**
```
□ app/models/admin.py
□ app/schemas/admin.py
□ app/api/v1/endpoints/permissions.py
□ app/api/v1/endpoints/translations.py
□ app/api/v1/endpoints/activity_logs.py
□ app/services/permission_service.py
□ app/services/translation_service.py
□ alembic/versions/xxx_create_admin_tables.py
```

**Frontend:**
```
□ src/pages/supervisor/Admin/
  ├── UserManagement/ (enhance)
  ├── UserAccess/
  │   ├── index.tsx
  │   ├── PermissionMatrix.tsx
  │   └── RoleEditor.tsx
  ├── IncidentAccess/
  └── Translation/
      ├── index.tsx
      ├── TranslationEditor.tsx
      └── LanguageManager.tsx

□ src/services/adminService.ts
□ src/types/admin.ts
□ src/i18n/ (enhance)
```

### ✅ Acceptance Criteria
- [ ] Permission matrix works correctly
- [ ] Custom roles can be created
- [ ] Permissions affect actual access
- [ ] Activity logs captured
- [ ] Translations can be edited
- [ ] Language switching works

---

## 📁 Phase 11: Information Data & Notifications

### 🎯 Objective
Document Control, CCTV Status monitoring, dan sistem notifikasi.

### 📋 Features to Implement

#### 11.1 Document Control
```
□ Document Types:
  - SOP
  - Policies
  - Guidelines
  - Forms/Templates
  - Certifications

□ Features:
  - Document upload
  - Version control
  - Approval workflow
  - Access control
  - Document search
  - Download tracking
```

#### 11.2 CCTV Status
```
□ Monitoring:
  - Camera status (Online/Offline)
  - Recording status
  - Storage status
  - Alert notifications

□ Dashboard:
  - Grid view of cameras
  - Status indicators
  - Quick actions
  - Maintenance log
```

#### 11.3 Notification System (Enhance)
```
□ Notification Types:
  - System alerts
  - Task reminders
  - Approval requests
  - Incident alerts
  - Training reminders

□ Channels:
  - In-app notifications
  - Email notifications
  - Push notifications (future)

□ Preferences:
  - User notification settings
  - Quiet hours
  - Channel preferences
```

### 🗃️ Database Schema

```sql
-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'DRAFT',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    effective_date DATE,
    expiry_date DATE,
    access_level VARCHAR(20) DEFAULT 'ALL',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Document versions
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    version VARCHAR(20) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    change_notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- CCTV cameras
CREATE TABLE cctv_cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES cctv_zones(id),
    camera_name VARCHAR(255) NOT NULL,
    camera_ip VARCHAR(45),
    location_description VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ONLINE',
    last_online_at TIMESTAMP,
    recording_status VARCHAR(20) DEFAULT 'RECORDING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- CCTV maintenance logs
CREATE TABLE cctv_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES cctv_cameras(id),
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT NOW(),
    next_maintenance_date DATE
);

-- Notifications (enhance if exists)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL,
    in_app BOOLEAN DEFAULT TRUE,
    email BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    UNIQUE(user_id, notification_type)
);

-- Indexes
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_cctv_cameras_zone ON cctv_cameras(zone_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
```

### 📁 Files to Create

**Backend:**
```
□ app/models/documents.py
□ app/models/cctv.py
□ app/models/notifications.py
□ app/schemas/documents.py
□ app/schemas/cctv.py
□ app/schemas/notifications.py
□ app/api/v1/endpoints/documents.py
□ app/api/v1/endpoints/cctv.py
□ app/api/v1/endpoints/notifications.py
□ app/services/document_service.py
□ app/services/cctv_service.py
□ app/services/notification_service.py
□ alembic/versions/xxx_create_info_tables.py
```

**Frontend:**
```
□ src/pages/supervisor/Information/
  ├── Documents/
  │   ├── index.tsx
  │   ├── DocumentUpload.tsx
  │   └── DocumentViewer.tsx
  ├── CCTVStatus/
  │   ├── index.tsx
  │   ├── CameraGrid.tsx
  │   └── MaintenanceLog.tsx
  └── Notifications/
      ├── NotificationCenter.tsx
      └── NotificationPreferences.tsx

□ src/services/documentService.ts
□ src/services/cctvService.ts
□ src/services/notificationService.ts
```

### ✅ Acceptance Criteria
- [ ] Documents can be uploaded and versioned
- [ ] Document approval workflow works
- [ ] CCTV status monitoring works
- [ ] Notifications delivered correctly
- [ ] User preferences respected

---

## 📁 Phase 12: Final Polish & Integration

### 🎯 Objective
Finishing touches, testing, dan integrasi keseluruhan sistem.

### 📋 Tasks

#### 12.1 UI/UX Polish
```
□ Consistent styling across all pages
□ Loading states for all actions
□ Error handling and messages
□ Empty states design
□ Responsive design check
□ Accessibility improvements
□ Animation and transitions
```

#### 12.2 Performance Optimization
```
□ API response optimization
□ Database query optimization
□ Frontend bundle optimization
□ Image optimization
□ Caching implementation
□ Lazy loading
```

#### 12.3 Testing
```
□ Unit tests for critical functions
□ Integration tests for APIs
□ End-to-end tests for key flows
□ Load testing
□ Security testing
```

#### 12.4 Documentation
```
□ API documentation (Swagger)
□ User manual
□ Admin guide
□ Deployment guide
□ Developer documentation
```

#### 12.5 Deployment Preparation
```
□ Environment configuration
□ Database migration scripts
□ Backup procedures
□ Monitoring setup
□ Logging setup
□ CI/CD pipeline
```

### ✅ Final Checklist
- [ ] All features implemented and tested
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Deployment successful

---

## 📊 Implementation Timeline

```
Week 1-2:   Phase 1 (Dashboard) + Phase 2 (DAR)
Week 3:     Phase 3 (Visitors)
Week 4-5:   Phase 4 (Patrol Management)
Week 6-7:   Phase 5 (Incident Management)
Week 8:     Phase 6 (Compliance)
Week 9:     Phase 7 (Training)
Week 10-11: Phase 8 (KPI) + Phase 9 (Master Data)
Week 12:    Phase 10 (Admin)
Week 13:    Phase 11 (Information & Notifications)
Week 14:    Phase 12 (Polish & Integration)
```

---

## 🚀 Getting Started

### Prerequisites
- Verolux backend running (FastAPI)
- Verolux frontend running (React)
- Database migrations up to date
- Understanding of existing codebase

### For Each Phase
1. Read the phase documentation
2. Create database migrations
3. Implement backend APIs
4. Implement frontend pages
5. Write tests
6. Update documentation
7. Code review
8. Deploy and verify

---

## 📝 Notes

- Phases can be adjusted based on business priority
- Some phases can run in parallel with separate teams
- Always maintain backward compatibility
- Follow existing code conventions
- Document API changes

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Author:** AI Assistant based on SRM Reference
