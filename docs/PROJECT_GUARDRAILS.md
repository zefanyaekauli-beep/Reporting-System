# Verolux Management System – Project Guardrails & Context

**Project:** Verolux Management System – multi-division reporting & attendance (Security, Cleaning, Parking). FastAPI monolith + PostgreSQL backend; React + Vite + TS mobile-first frontend (MobileLayout + BottomNav), color theme aligned with Verolux CCTV. No AI and no CCTV in this phase. Keep architecture monolithic and multi-tenant via company_id. DB config via env, infra-agnostic (cloud or VPS). Use backend/app/divisions/... and frontend/web/src/modules/... structure consistently.

---

## 1. Project Context

**Project name:** Verolux Management System

**Goal:** Operational reporting and workforce management system for three divisions:
- Security
- Cleaning
- Parking

**Main capabilities:**
- Daily incident / work reports with photo evidence
- Area / equipment checklists
- Patrol logging (security)
- Parking sessions (entry/exit, duration, fee) – no computer vision
- Multi-tenant (multiple companies, multiple sites)

**Important:** This project is separate from Verolux CCTV / Video Analytics. No YOLO, no camera ingestion, no bounding boxes here. That's a different product.

---

## 2. Current Scope & Phase

**Current phase:**
- Backend: FastAPI monolith with modular structure per division
- Frontend: React + Vite + TypeScript, mobile-first layout:
  - Header bar
  - Bottom navigation (Home / Reports / Task / Profile)

**AI / LLM:** Not part of this phase. No AI features should be implemented by default. AI will be treated as a future add-on.

**Divisions:**
- **Security:** Security incident reports, patrol logs
- **Cleaning:** Area checklists, cleaning/hygiene findings reports
- **Parking:** Vehicle entry/exit logging, duration + fee calculation

---

## 3. Tech Stack & Required Structure

### Backend
- Python 3.10+
- FastAPI
- SQLAlchemy + Alembic
- PostgreSQL (Cloud SQL or self-hosted Postgres on VPS)

**Directory structure:**
```
backend/app/
  core/        # config, db setup, security basics
  models/      # SQLAlchemy models
  schemas/     # Pydantic DTOs
  services/    # business logic
  api/         # routers & dependencies
  divisions/
    security/
    cleaning/
    parking/
```

### Frontend Web
- React
- Vite
- TypeScript
- Zustand (for auth & global state)

**Directory structure:**
```
frontend/web/src/
  api/
    client.ts
    authApi.ts
  stores/
    authStore.ts
  modules/
    shared/
      components/
        LoginPage.tsx
        MobileLayout.tsx
        BottomNav.tsx
    security/
      pages/
        SecurityDashboardPage.tsx
    cleaning/
      pages/
        CleaningDashboardPage.tsx
    parking/
      pages/
        ParkingDashboardPage.tsx
  routes/
    AppRoutes.tsx
```

### Infra
- Initial target: 1 server (VM or VPS) running:
  - App (FastAPI backend + built React frontend)
  - Postgres (either managed or local container)
- Code must be infra-neutral:
  - DB connection via environment variables
  - No hard-coded Cloud SQL specifics in app logic

---

## 4. AI & CCTV Guardrails

**For this phase:**
- ❌ No AI (LLM, embeddings, semantic search) implementation
- ❌ No computer vision, no CCTV integration

**Cursor must NOT:**
- Add OpenAI / LLM calls unless explicitly instructed
- Design or implement:
  - auto-categorization via LLM
  - automatic summaries
  - semantic search
  - "AI assistant" features
- Integrate:
  - RTSP
  - YOLO or any detection model
  - video streaming or overlay logic

AI is considered a future phase add-on, not part of the current baseline product.

---

## 5. Architecture & Infra Guardrails

- **Monolith only (for now)**
  - Single FastAPI application
  - Single PostgreSQL database (multi-tenant via company_id)
  - No microservices

- **Multi-tenant is simple and explicit**
  - Every main table must include `company_id` (and `site_id` where relevant)
  - Every query that returns user data must filter by `company_id` based on the authenticated user

- **Deployment flexibility (cloud or VPS)**
  - DB config must come from `SQLALCHEMY_DATABASE_URI` in environment
  - Do not hard-code hostnames or use provider-specific features inside business logic

- **No heavy infrastructure components**
  - No Kafka or heavy message brokers
  - No Elasticsearch or external search engines for phase 1
  - No event-sourcing or CQRS unless explicitly requested

---

## 6. UI/UX Guardrails – Mobile-First

The primary users are field staff on phones.

**Requirements:**
- Every page must be usable on 360–414px width
- Avoid wide tables that require horizontal scroll
- Use vertical cards / lists
- Inputs must be full-width and tap-friendly

**Base layout:**
- Use `MobileLayout` + `BottomNav` for all division pages

**Header:**
- Left: "Verolux" text/logo
- Center: page title

**Main content:**
- Scrollable vertical list of cards, forms, etc.

**Bottom nav:**
- For security: `/security/dashboard`, `/security/list`, `/security/patrol`, `/profile`
- For cleaning: `/cleaning/dashboard`, `/cleaning/list` or `/cleaning/checklists`, `/profile`
- For parking: `/parking/dashboard`, `/parking/sessions`, `/profile`

**Components:**
- Use cards for list items (reports, checklists, parking sessions)
- Use badges for: severity, status, type
- Make buttons big enough for thumbs (full-width where it makes sense)

**Design & colors (aligned with Verolux CCTV):**
- Primary: Verolux blue/navy for headers and primary buttons
- Background: lighter (light grey / white) for mobile readability in outdoor environments
- Example mapping:
  - Header background: dark navy
  - Primary button: primary blue
  - Severity: Low (green), Medium (amber), High (red)
  - Status: Open (blue), In-progress (purple/amber), Closed (grey/green)

**Typography (mobile):**
- Page title: 18–20px, bold
- Section title: 14–16px, medium
- Body text: 13–14px
- Labels: 12–13px, muted

---

## 7. Division Scopes – What Cursor Is Allowed to Build

### 7.1. Security
**Backend:**
- Models: `SecurityReport`, `SecurityPatrol`
- Endpoints (initial):
  - `POST /api/security/reports`
  - `GET /api/security/reports`
  - `GET /api/security/reports/{id}`

**Frontend:**
- `SecurityDashboardPage` (already exists)
- Additional pages Cursor may implement:
  - `SecurityReportsListPage` (list + filters)
  - `SecurityReportFormPage` (create/edit)
  - `SecurityReportDetailPage`
- All should use `MobileLayout` + `BottomNav`

### 7.2. Cleaning
**Backend:**
- Models: `CleaningChecklist`, `CleaningReport`
- Endpoints (initial): create/list checklists, create/list cleaning reports

**Frontend:**
- `CleaningDashboardPage` (already exists)
- Additional pages Cursor may implement:
  - `CleaningChecklistFormPage`
  - `CleaningChecklistHistoryPage`
  - `CleaningReportsListPage`

### 7.3. Parking
**Backend:**
- Model: `ParkingSession` (one record per vehicle visit)
- Endpoints (initial):
  - `POST /api/parking/entry`
  - `POST /api/parking/exit`
  - `GET /api/parking/sessions`

**Frontend:**
- `ParkingDashboardPage` (already exists)
- Additional pages Cursor may implement:
  - `ParkingEntryPage`
  - `ParkingExitPage`
  - `ParkingSessionsListPage`

---

## 8. How Cursor Must Work When Generating Code

For every feature or change, Cursor must:

1. **Summarize the task in 1–2 sentences.**
   - Example: "Implement mobile-first security reports list page and connect it to GET /api/security/reports."

2. **Explicitly list files it will touch.**
   - Example:
     - `backend/app/divisions/security/models.py`
     - `backend/app/divisions/security/routes.py`
     - `frontend/web/src/modules/security/pages/SecurityReportsListPage.tsx`

3. **Follow existing patterns.**
   - Use the same model/service/router layering as existing modules
   - Use `MobileLayout` for any new mobile page
   - Keep naming consistent (`SecurityReport`, `CleaningChecklist`, `ParkingSession`)

4. **Add small TODOs where something is left incomplete.**
   - `# TODO: add filters by site_id`
   - `// TODO: wire this button to actual navigation`

---

## 9. Hard "Do Not" Rules for Cursor

Cursor must NOT:

- ❌ Merge this project with any Verolux CCTV / analytics codebase
- ❌ Introduce: YOLO, RTSP, video streaming, DeepSORT or any tracking pipeline
- ❌ Add AI/LLM logic by default (OpenAI, HuggingFace, etc.)
- ❌ Add: speech-to-text, face recognition, emotion detection, unless explicitly instructed
- ❌ Change the tech stack (e.g., switch to Laravel, NestJS, Next.js) unless explicitly requested
- ❌ Introduce microservices, event sourcing, or heavy distributed architecture in this phase

---

## 10. Multi-Tenant Requirements

**Every model must include:**
- `company_id: Integer` (required, foreign key to companies table)
- `site_id: Integer` (optional, foreign key to sites table, where applicable)

**Every query must filter by:**
- `company_id` based on the authenticated user's company
- `site_id` when the user is assigned to a specific site

**User model must include:**
- `company_id: Integer` (required)
- `site_id: Integer` (optional, nullable)

---

## 11. Database Configuration

**Environment variables required:**
- `SQLALCHEMY_DATABASE_URI`: Full PostgreSQL connection string
  - Example: `postgresql://user:password@localhost:5432/verolux_db`
  - Or: `postgresql://user:password@/verolux_db?host=/cloudsql/project:region:instance` (Cloud SQL)

**No hard-coded:**
- Database hostnames
- Provider-specific connection logic in business code
- Cloud-specific features unless abstracted

---

## Quick Reference Header

When starting any task, reference this header:

```
Project: Verolux Management System – multi-division reporting & attendance (Security, Cleaning, Parking). FastAPI monolith + PostgreSQL backend; React + Vite + TS mobile-first frontend (MobileLayout + BottomNav), color theme aligned with Verolux CCTV. No AI and no CCTV in this phase. Keep architecture monolithic and multi-tenant via company_id. DB config via env, infra-agnostic (cloud or VPS). Use backend/app/divisions/... and frontend/web/src/modules/... structure consistently.
```

