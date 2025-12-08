# Verolux Management System - Comprehensive System Summary

## Executive Summary

The Verolux Management System is a unified workforce management and operational reporting platform designed for three service divisions: Security, Cleaning, and Driver/Transport. Rather than building three separate applications, the system implements a single shared platform where division is simply a configuration field. This architecture ensures that core functionality—attendance, checklists, reports, announcements, and shifts—is implemented once and reused across all divisions, dramatically reducing maintenance overhead and ensuring consistency.

The platform provides real-time workforce tracking, operational reporting, and compliance management through a mobile-first interface for field personnel and a comprehensive web dashboard for supervisors. Built on a monolithic FastAPI backend with a React frontend, the system emphasizes shared primitives over division-specific implementations.

## System Architecture Philosophy

### Core Principle: One Platform, Three Divisions

**Critical Design Decision:** The system is NOT three separate products (Security app, Cleaning app, Driver app). Instead, it is one unified platform where:

- **Division is a field**, not a separate codebase
- **Core modules are shared** across all divisions
- **Division-specific features** are minimal extensions (extra fields, context types, templates)
- **90% of backend code is shared**; divisions differ only in configuration and presentation

**Why This Matters:**
- Fix a bug in attendance → fix it once, not three times
- Change checklist flow → refactor once, not three times
- Add anti-fraud → implement once, not three times
- Maintenance burden is 3x less than separate implementations

### Three Divisions Supported

1. **Security Division**: Guards, patrol routes, security incidents, visitor logs
2. **Cleaning Division**: Cleaning zones, zone-based checklists, cleaning reports
3. **Driver/Transport Division**: Vehicle management, trips, pre/post-trip checklists

**Note:** Parking is not included as a separate division. Parking functionality, if needed, can be handled through the Security or Cleaning divisions as appropriate.

## Technical Architecture

### Technology Stack

**Backend:**
- Framework: FastAPI (Python 3.10+)
- Database: PostgreSQL (SQLite for development)
- ORM: SQLAlchemy 2.x
- Authentication: JWT (JSON Web Tokens)
- API Style: RESTful JSON APIs
- Migrations: Alembic

**Frontend:**
- Framework: React 18 with Vite
- Language: TypeScript
- Styling: Custom CSS with theme system (Tailwind CSS for supervisor panel)
- State Management: Zustand
- Routing: React Router DOM v6
- Build Tool: Vite

**Infrastructure:**
- Architecture: Monolithic (one FastAPI app, one database)
- Development: Local development servers
- Deployment: Docker-ready architecture
- Reverse Proxy: Nginx configuration available
- HTTPS: Self-signed certificates for mobile camera access

### Backend Architecture: Single Application

**Decision:** One FastAPI application with routers, NOT microservices or separate ports per division.

**Router Structure:**
- `/auth` - Authentication and user management
- `/attendance` - Shared attendance engine (all divisions)
- `/checklists` - Shared checklist engine (all divisions)
- `/reports` - Shared reporting engine (all divisions)
- `/announcements` - Shared announcement system
- `/shifts` - Shared shift management
- `/security` - Thin wrappers for security-specific features (if needed)
- `/cleaning` - Thin wrappers for cleaning-specific features (if needed)
- `/driver` - Thin wrappers for driver-specific features (if needed)

**Database:** One PostgreSQL database with clear division and type fields in models.

**Rationale:** Splitting into microservices now would double development and operations overhead for zero real benefit. The system can move to microservices later if scaling or complexity demands it.

## Core Shared Platform Modules

### 1. Attendance Module (Shared Across All Divisions)

**Single Attendance Table:**
- Columns: `user_id`, `site_id`, `division`, `check_in_at`, `check_out_at`, `method`, `gps_lat`, `gps_lng`, `photo_url`, `status`, `is_overtime`, `is_backup`, etc.
- Division is stored as a field (SECURITY, CLEANING, DRIVER)
- All validation logic is identical regardless of division

**Features:**
- QR code-based attendance scanning
- GPS coordinate capture and validation (100-meter radius from site)
- Photo evidence requirement (direct camera capture, not gallery)
- Location validation against site geofence
- Real-time attendance status tracking
- Late arrival detection with grace period
- Offline mode with timestamp preservation
- Anti-fraud measures (GPS validation, mock location detection)

**Usage:**
- Security guards check in/out at security posts
- Cleaning staff check in/out at cleaning sites
- Drivers check in/out at vehicle depots
- Same engine, same validation, different division field

### 2. Checklist System (Shared Engine, Division-Specific Templates)

**Shared Tables:**
- `checklist_templates` - Template definitions
- `checklist_items` - Task definitions within templates
- `checklist_instances` - Actual checklist runs
- `checklist_item_results` - Individual task completions

**Division Differentiation:**
- Field: `division` (SECURITY, CLEANING, DRIVER)
- Field: `context_type` (SECURITY_PATROL, CLEANING_ZONE, DRIVER_PRE_TRIP, DRIVER_POST_TRIP, etc.)
- Same engine, different templates and contexts

**Features:**
- Configurable task templates per role, site, shift type, and division
- Multiple answer types: Boolean, Choice, Score, Text
- Photo requirements for specific tasks
- KPI-based tracking
- Automatic checklist creation based on context
- Status tracking: Pending, Completed, Not Applicable, Failed
- Evidence attachment (photos, GPS, notes)

**Division-Specific Usage:**
- **Security**: Patrol checklists tied to routes and checkpoints
- **Cleaning**: Zone-based checklists (Toilet A, Lobby, Corridor) triggered by QR scan
- **Driver**: Pre-trip and post-trip vehicle inspection checklists

### 3. Reporting System (Shared Engine, Type-Based Differentiation)

**Single Reports Table:**
- Columns: `type` (INCIDENT, DAR, CLEANING_ISSUE, VEHICLE_INCIDENT, etc.), `division` (SECURITY, CLEANING, DRIVER), `title`, `description`, `site_id`, `user_id`, `status`, etc.
- `report_attachments` table for evidence (photos, documents)

**Features:**
- Type-based report categorization
- Division filtering
- Evidence attachment
- Status workflow (Open, In Review, Closed)
- Supervisor review and approval
- PDF export functionality
- Cross-division report viewing for supervisors

**Division-Specific Report Types:**
- **Security**: Security incidents, Daily Activity Reports (DAR), visitor logs
- **Cleaning**: Cleaning issues, daily cleaning summaries, quality inspection reports
- **Driver**: Vehicle incidents, trip reports, maintenance issues

### 4. Announcement System (Fully Shared)

**Tables:**
- `announcements` - Announcement definitions
- `announcement_targets` - Per-user targeting
- `announcement_reads` - Read/acknowledge tracking

**Targeting:**
- `target_type`: ALL, DIVISION, SITE, USER
- Division field allows filtering to specific divisions
- Same system for all divisions

**Features:**
- Supervisor-only creation
- Priority levels (Info, Warning, Critical)
- Flexible targeting (all personnel, specific divisions, sites, or users)
- Optional acknowledgment requirement
- Validity period setting
- Read/unread status tracking
- Dashboard card display for all personnel

### 5. Shift Management (Shared Engine)

**Tables:**
- `shifts` - Shift definitions
- `shift_assignments` - User-to-shift assignments
- `shift_exchanges` - Exchange requests and approvals

**Division Differentiation:**
- Fields: `division`, `role`
- Same engine, filtered by division

**Features:**
- Calendar-based shift view
- Shift assignment to personnel
- Shift types (Morning, Afternoon, Night)
- Open shift management
- Shift exchange system with tier-based approval
- Shift confirmation by field staff
- Color-coded shift status

### 6. Sites and Zones (Shared Infrastructure)

**Tables:**
- `sites` - Site definitions (shared)
- `zones` - Zone definitions with division field

**Zone Table:**
- `division`: SECURITY (patrol area), CLEANING (cleaning zone), DRIVER (route stop/depot)
- Same table, different usage per division

**Features:**
- Site management with GPS coordinates and geofence
- QR code generation per site
- Zone definition per division
- Zone-to-checklist template linking

## User Roles and Access Control

### Role Model

**Roles:**
- `FIELD` - Field personnel (guards, cleaners, drivers)
- `SUPERVISOR` - Supervisory personnel
- `ADMIN` - System administrators

**Supervisor Scope Model:**
Supervisors are NOT a fourth division. They are a role that sits on top of divisions with scope:

- **Division Supervisor**: Only sees one division (e.g., Security Supervisor)
- **Site Supervisor**: Sees all divisions in one site
- **Area/Company Supervisor**: Sees multiple sites and all divisions

**Database Model:**
- `users.role`: FIELD, SUPERVISOR, ADMIN
- `users.scope_type`: DIVISION, SITE, COMPANY (nullable)
- `users.scope_id`: division_code, site_id, or company_id (depending on scope_type)

**Access Control:**
- Field users see only their own data and assigned tasks
- Supervisors see data based on their scope (division, site, or company)
- Admins see all data across all divisions and sites

## Division-Specific Features (v1 Scope)

### Security Division - v1 Features

**Must-Have (v1):**
- **Attendance**: QR + GPS + photo, basic anti-fraud (radius check + mock-location flag)
- **Patrol**: Simple patrol routes (list of checkpoints tied to zones), QR scan at each checkpoint, patrol log (time, user, site, checkpoint)
- **Incidents**: Incident report (type, description, site, photos, GPS), status workflow (Open, In Review, Closed)
- **Daily Activity Report (DAR)**: Free-text or structured summary per shift
- **Supervisor View**: View attendance today, view patrol completion (missed checkpoints), view incident list with filters

**Planned for v1.5+:**
- Panic button + dispatch tickets
- Advanced patrol SLA (must scan point X within Y minutes)
- Client portal read-only view
- Advanced anti-fake GPS (speed/jump pattern analysis)

### Cleaning Division - v1 Features

**Must-Have (v1):**
- **Attendance**: Same engine as security
- **Zones**: Define cleaning zones per site (Toilet A, Lobby, Corridor, etc.), each zone linked to site + geo or QR
- **Cleaning Checklists**: Zone-based templates (Toilet, Lobby, etc.), triggered on QR scan in that zone, evidence (photo, notes)
- **Cleaning Reports**: Automatically generated "daily cleaning summary" per site
- **Supervisor View**: Dashboard with zone completion % per site, list of zones not cleaned / incomplete checklist

**Planned for v1.5+:**
- Quality inspection by supervisors with score
- SLA-based tracking (e.g., Toilet must be cleaned every 2h)
- Trend charts and KPI scoring per cleaner

### Driver/Transport Division - v1 Features

**Must-Have (v1):**
- **Attendance**: Same engine
- **Vehicles**: Vehicles table (plate, type, site, status), link driver ↔ vehicle
- **Trips**: Simple trip log (start: select vehicle + site + destination, capture GPS and time; end: close trip, distance/time computed roughly)
- **Checklists**: Pre-trip checklist (vehicle safety), post-trip checklist (damage, issues)
- **Incidents**: Vehicle incident report (breakdown, accident, near-miss)

**Planned for v1.5+:**
- Route with multiple planned stops
- Live GPS tracking + route playback
- Maintenance scheduling integration

## Supervisor System

### Supervisor Core Jobs (Across All Divisions)

Supervisors solve five fundamental problems before they go home:

1. **Who is present and actually working?** - Attendance, late, no-show, early checkout
2. **Are the critical tasks done?** - Patrols, cleaning zones, pre/post trip checks
3. **Any incidents or problems?** - Security incident, cleaning complaint, vehicle issue
4. **Anything to approve or decide?** - Attendance correction, shift change, leave, etc.
5. **What do I need to tell my team?** - Announcements / instructions

The supervisor UI mirrors exactly these five functions, not 20 separate menus.

### Supervisor v1 Feature Set

#### 1. Supervisor Home Dashboard (Cross-Division)

**One page, top of the menu. Widgets:**

**Filters at top:**
- Date: default today
- Site selector
- Optional: division filter (All / Security / Cleaning / Driver)

**Section 1 – Attendance Snapshot:**
Per division:
- Security: On duty / Expected / Late / No-show
- Cleaning: On duty / Expected / No-show
- Driver: On duty / Trips active / Trips completed

These numbers come from one attendance + shifts engine, filtered by division.

**Section 2 – Task/Checklist Completion:**
- Security: % patrol routes completed, # missed checkpoints
- Cleaning: % cleaning zones completed, # zones overdue
- Driver: % pre-trip checklists done, % post-trip checklists done

All sourced from shared `checklist_instances` table with `context_type`:
- SECURITY_PATROL
- CLEANING_ZONE
- DRIVER_PRE_TRIP
- DRIVER_POST_TRIP

**Section 3 – Open Issues:**
Consolidated list of latest N items from reports:
- Security incidents
- Cleaning issues
- Vehicle incidents

Columns: time, division, type, site, status, assignee.

**Section 4 – Announcements:**
- Quick list of active announcements supervisor created (status: active/expired)
- Latest 1–2 announcements pinned at top so they see what staff sees

#### 2. Attendance Console (Single Core, 3 Divisions)

**One screen with filters, not 3 different pages.**

**Filters:**
- Date range
- Site
- Division: All / Security / Cleaning / Driver
- Status: On-duty / Late / No-show / Completed / Early checkout

**Table columns:**
- Officer name
- Division
- Site
- Check-in time
- Check-out time
- GPS valid? (Yes/No)
- Photo evidence? (Yes/No)
- Status
- Actions (open details, approve correction)

**Supervisor actions:**
- Open attendance detail: Map preview (GPS point vs site geofence), check-in photo, raw timestamps, device info
- Approve / reject attendance correction requests (v1.5 if not v1)

No need to split per division – just filter.

#### 3. Task / Checklist Console

**One console for Security, Cleaning, Driver.**

**Filters:**
- Date
- Site
- Division
- Context: Patrol / Cleaning / Pre-trip / Post-trip
- Status: Not started / In progress / Completed / Failed / N/A

**Table:**
- Template name (e.g., "Night Patrol Route A", "Toilet A – Morning Cleaning", "Truck #23 – Pre-trip")
- Division
- Site / Zone / Vehicle
- Assigned user
- Start time / Completed time
- Completion %
- Evidence available? (Yes/No)

**Supervisor actions:**
- Open detail → see all tasks, answers, photos
- Mark as reviewed / flag for follow-up

#### 4. Report / Incident Console

**One central place for all reports.**

**Filters:**
- Date range
- Division
- Type: SECURITY_INCIDENT, SECURITY_DAR, CLEANING_INCIDENT, VEHICLE_INCIDENT
- Status: Open / In Review / Closed
- Site

**Table:**
- Time
- Division
- Type
- Title / short description
- Site
- Reporter
- Status
- Actions

**Supervisor actions:**
- Open → view details, photos, GPS
- Change status
- Add internal notes
- Export PDF (v1 for DAR & incident if needed, but keep it simple)

#### 5. Announcements Management

**Supervisor-only page.**

**Features:**
- Filter: active / expired, division, site
- List: Title, Priority, Target, Validity period, Read count / ack count

**Create announcement form:**
- Title
- Body
- Priority
- Target type: All personnel, Division(s), Site(s), Specific users (v1.5)
- Valid from / to
- Require acknowledgment? (checkbox)

**Staff side (field users):**
- Dashboard card with "New announcement (X)"
- List with badge: unread/read
- Modal when opening

#### 6. Shifts (v1 Minimal, Not Full HR System)

**For v1, keep it simple.**

**Supervisor Shift Page:**
- Calendar view per site + division
- See: Which guard/cleaner/driver is scheduled, unassigned shifts (if any)
- Ability: Assign user to shift (drag & drop or simple form), mark shift as "open" (vacant)

**Optional v1.5:**
- Shift exchange: Field staff creates request, supervisor sees "Requests" tab, approve / reject, on approval assignment is swapped automatically

**Note:** Don't need full-blown GuardsPro logic in v1. Just enough to make operations not broken.

#### 7. Officers Management

**Simple officer list and profile management:**
- View officer list with division, site, status
- Officer profiles
- Assignment management
- Basic activity monitoring

### Supervisor UI Architecture

**Frontend Structure:**
- **Field App**: Mobile-first, very few pages (Dashboard, Attendance, Tasks, Reports, Announcements)
- **Supervisor App**: Web-first (desktop), responsive, sidebar menu

**Supervisor Menu Structure:**
1. Dashboard
2. Attendance
3. Tasks & Checklists
4. Reports & Incidents
5. Announcements
6. Shifts
7. Officers

**Important:** All supervisor pages use the same backend modules:
- `/attendance`
- `/checklists`
- `/reports`
- `/announcements`
- `/shifts`
- `/users`

Permissions and filters change based on role & scope, not separate endpoints.

## Product Scope

### Version 1.0 (Current MVP)

**Included:**
- Shared attendance system (QR + GPS + photo) for all divisions
- Shared checklist system with division-specific templates
- Shared reporting system with type-based differentiation
- Shared announcement system
- Basic shift management
- Supervisor dashboard with cross-division overview
- Division-specific features:
  - Security: Patrol routes, incidents, DAR
  - Cleaning: Zone-based cleaning, cleaning reports
  - Driver: Vehicle management, trips, pre/post-trip checklists

### Version 1.5 (Planned)

**Planned Features:**
- Panic button + dispatch tickets (Security)
- Advanced patrol SLA tracking (Security)
- Quality inspection scoring (Cleaning)
- SLA-based cleaning tracking (Cleaning)
- Route with multiple stops (Driver)
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
- Complex shift exchange with multi-level approvals
- Maintenance scheduling integration (Driver)
- Trend charts and KPI scoring
- Mobile native applications
- Enhanced offline capabilities
- Integration with external systems

## Data Management

### Database Structure

**Core Shared Tables:**
- `users` - User accounts with role and scope
- `companies` - Multi-tenant company definitions
- `sites` - Site definitions with GPS and geofence
- `zones` - Zone definitions with division field
- `attendance` - Single attendance table for all divisions
- `checklist_templates` - Shared checklist template definitions
- `checklist_instances` - Shared checklist execution records
- `reports` - Single reports table with type and division fields
- `announcements` - Shared announcement system
- `shifts` - Shared shift management
- `shift_assignments` - Shift-to-user assignments

**Division-Specific Extensions:**
- Security: `patrol_routes`, `patrol_logs`, `visitor_logs`
- Cleaning: `cleaning_zones` (uses shared `zones` table)
- Driver: `vehicles`, `driver_trips`, `trip_stops`

**Multi-Tenancy:**
- Company-level data isolation
- Site-level filtering
- User access based on company, site, and scope assignments

### Data Integrity

- Foreign key constraints
- Cascade delete where appropriate
- Data validation at API level
- Audit trails for critical operations
- Timestamp tracking for all records
- Division field ensures proper data segregation

## Security and Compliance

### Security Features

- JWT-based authentication
- Password hashing (bcrypt)
- Role-based access control with scope model
- API endpoint protection
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (ORM)
- XSS protection

### Compliance Features

- Audit logging
- Evidence preservation (photos, GPS)
- Timestamp tracking
- Non-repudiation through digital signatures
- Data retention policies
- Privacy considerations
- Multi-tenant data isolation

## Error Handling and Reliability

### Error Management

- Structured exception handling
- Custom error types (NotFound, Validation, Database)
- User-friendly error messages
- Comprehensive logging
- Error recovery mechanisms
- Defensive programming practices
- Paginated responses with proper extraction

### Reliability Features

- Offline mode support
- Data synchronization
- Retry logic for transient failures
- Graceful degradation
- Health check endpoints
- System monitoring capabilities

## Performance Considerations

### Optimization Strategies

- Database query optimization (eager loading, pagination)
- API response pagination
- Lazy loading for charts
- Efficient state management
- Minimal re-renders
- Asset optimization
- Shared code reduces maintenance overhead

### Scalability

- Modular architecture for easy scaling
- Database indexing on division and type fields
- Efficient data queries with proper filtering
- Caching strategies (where applicable)
- Load balancing ready
- Single codebase reduces deployment complexity

## Deployment and Operations

### Development Environment

- Local development servers
- Hot reload for frontend
- Database migrations (Alembic)
- Mock data generation scripts
- Development tools and scripts

### Production Readiness

- Docker configuration
- Environment variable management
- Database migration system
- Logging infrastructure
- Health check endpoints
- Error monitoring
- Single application deployment (not microservices)

## System Workflows

### Typical User Workflows

**Field Personnel (Security Guard) Daily Workflow:**
1. Login to mobile application
2. View dashboard with today's assignments
3. Check in using QR code, GPS, and photo
4. View checklist for today
5. Complete patrol routes and scan checkpoints
6. Submit incident reports as needed
7. Complete checklist items throughout shift
8. View announcements
9. Check out at end of shift

**Field Personnel (Cleaner) Daily Workflow:**
1. Login to cleaning dashboard
2. Check in at assigned site
3. View cleaning zones and tasks
4. Scan QR codes at cleaning zones
5. Complete zone-specific checklists
6. Submit cleaning reports
7. View announcements
8. Check out at end of shift

**Field Personnel (Driver) Daily Workflow:**
1. Login to driver dashboard
2. Check in at vehicle depot
3. Complete pre-trip checklist
4. Start trip (select vehicle, destination)
5. Complete trip and post-trip checklist
6. Submit vehicle incident reports if needed
7. View announcements
8. Check out at end of shift

**Supervisor Daily Workflow:**
1. Login to supervisor dashboard
2. Review overview metrics and KPIs across all divisions
3. Check attendance status (filter by division/site as needed)
4. Review task/completion status (patrols, cleaning zones, trips)
5. Review and approve requests (leave, corrections, exchanges)
6. Monitor incidents and reports
7. Create announcements as needed
8. Manage shifts and assignments
9. Generate reports for clients

## System Benefits

### For Field Personnel

- Simplified task management through unified interface
- Clear visibility of assignments
- Easy reporting and documentation
- Mobile-friendly interface
- Offline capability
- Consistent experience across divisions

### For Supervisors

- Real-time visibility into operations across all divisions
- Comprehensive dashboards and analytics
- Efficient approval workflows
- Centralized management in one interface
- Data-driven decision making
- Single console for all divisions (not separate apps)

### For Organizations

- Improved accountability through shared tracking
- Compliance tracking across all divisions
- Operational efficiency through unified platform
- Data-driven insights
- Scalable solution with shared codebase
- Cost reduction through automation and reduced maintenance
- Single system to learn and operate (not three separate apps)

## Architecture Benefits

### Maintenance Efficiency

- **Fix once, apply everywhere**: Bug fixes in shared modules benefit all divisions
- **Feature additions**: New features in shared modules automatically available to all divisions
- **Consistency**: Same validation, same logic, same behavior across divisions
- **Reduced complexity**: One codebase to maintain, not three

### Development Speed

- **Faster feature development**: Build once, configure for divisions
- **Easier testing**: Test shared modules once, not per division
- **Simpler deployment**: One application, one database, one deployment process

### Business Value

- **Lower total cost of ownership**: Less code to maintain
- **Faster time to market**: New divisions can be added with minimal code
- **Consistent user experience**: Same patterns across all divisions
- **Easier training**: One system to learn, not three

## Future Enhancements

### Planned Features

- Real-time WebSocket updates
- Advanced analytics and reporting
- Mobile native applications
- Enhanced offline capabilities
- Integration with external systems
- Advanced scheduling algorithms
- Predictive analytics
- Client self-service portal enhancements

### Technical Improvements

- Performance optimization
- Enhanced security features
- Advanced caching strategies
- Cloud deployment options
- Enhanced monitoring and alerting
- Microservices migration (only if scaling demands it)

## Conclusion

The Verolux Management System represents a unified platform approach to managing workforce operations across Security, Cleaning, and Driver divisions. By implementing shared core modules (attendance, checklists, reports, announcements, shifts) and using division as a configuration field rather than separate implementations, the system achieves significant maintenance efficiency while providing comprehensive functionality.

The platform successfully bridges the gap between field operations and management oversight, providing the tools necessary for efficient workforce management, compliance tracking, and operational excellence. The supervisor system, designed around five core jobs, provides a focused and efficient management interface that works across all divisions.

Through its unified architecture, the system enables organizations to maintain high standards of service delivery while optimizing operational efficiency and reducing total cost of ownership. The single-platform approach ensures that improvements and fixes benefit all divisions equally, making the system both powerful and maintainable.
