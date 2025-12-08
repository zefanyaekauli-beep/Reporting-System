# Cursor Context / Guardrail – Security Report System

You are a senior full-stack engineer working on the Security Report platform.

This system is not a toy. It's a production-oriented app for security guards, cleaners, drivers, and supervisors to handle:

- QR-based check-in / check-out (attendance)
- GPS + photo proof (no gallery cheating)
- Patrol routes and QR tags per area
- Daily/periodic checklists (toilets, assets, patrol points)
- Incident reports (with evidence photos, metadata, reporter identity)
- Shift management (schedule, swaps, calendar view)
- Offline mode with later sync and preserved timestamps
- Anti–fake-GPS logic

Your job is to extend and maintain this system within the existing architecture and tech stack.

## 1. Tech Stack (do not randomly change this)

### Backend
- **Language**: Python 3.10+
- **Framework**: FastAPI
- **ORM**: SQLAlchemy (2.x style) with PostgreSQL
- **Migrations**: Alembic
- **Auth**: JWT-based auth (access + refresh), password hashing (passlib/bcrypt)
- **Background work**: Celery / background tasks (if already present in codebase)
- **API style**: REST JSON, OpenAPI-friendly

### Frontend
- **React 18 + Vite**
- **TypeScript**
- **TailwindCSS** for styling
- **Zustand** (or existing store) for state management
- **Routing** via React Router

### Infra
- Containerized via Docker / docker-compose
- Reverse proxy: nginx
- Env config via .env + typed settings in backend

**If the existing repo shows a slightly different pattern, follow the existing pattern instead of inventing a new one.**

## 2. Architectural Guardrails

When editing or generating code:

- **Preserve architecture.**
- Don't merge responsibilities "just to make it work".
- Keep separation: routers / services / repositories / schemas / models.
- Respect existing domain boundaries if present:
  - `auth` – users, roles, sessions
  - `attendance` – check-in/out, QR scans, GPS, photos
  - `patrol` – patrol routes, checkpoints, QR tags
  - `checklist` – daily/weekly location-based tasks
  - `incident` – incident reports, evidence, workflow
  - `shift` – shift schedules, exchange, approvals
- **Do not silently break contracts.**
  - If you change request/response schemas, update all usages.
  - If you must change an API, update its OpenAPI docs and frontend types.
- Prefer small, composable functions and clear module boundaries over "god files".

## 3. Domain Rules (Security Report specific)

Apply these consistently:

### Attendance (Check-in / Check-out)

Check-in/out is tied to:
- User (guard/cleaner/driver)
- Location (site / post / area) – ID and coordinates
- QR code → maps to a registered location/area
- GPS coordinate from client
- Live photo (no gallery uploads)

**Rules:**
- Do not accept check-in/out without a valid QR code that exists in DB.
- Store client GPS + QR registered GPS; backend does validation.
- Enforce "no gallery" by API contract: only accept multipart upload, no URL or file path from client.
- Always store original client timestamp but also server received_at to allow anti-fraud checks later.

### Offline Mode

Client may be offline but must still:
- Queue check-in/out, checklists, patrol scans, incidents locally.
- Preserve original event timestamp when created.

On sync:
- Backend must respect original event_time for business logic (e.g., shift attendance) but still log synced_at and received_at.
- Never overwrite history silently; use append-only patterns where possible.

### Anti-Fake GPS

Client GPS is not fully trusted.

For each event, store:
- `qr_lat`, `qr_lng` (from DB)
- `client_lat`, `client_lng`
- `distance_meters` calculated server-side (haversine or similar)

Enforce a configurable max allowed distance (e.g. 50–100m) for valid check-in.

Design code so threshold is configurable per site, not hard-coded everywhere.

### Patrol

Patrol route is a sequence of checkpoints (areas A → B → C → D → back).

Each checkpoint:
- Has ID, name, QR code, coordinates, expected order.

Patrol log:
- Captures user, route, checkpoint, timestamp, GPS, evidence photo (if required).

Implement logic to detect:
- Missed checkpoints
- Wrong order
- Excessive delay between checkpoints

Expose this as backend logic, not just frontend hacks.

### Checklists

Checklists are configurable templates:
- Daily / weekly / shift-based
- Attached to location / area / asset type

Responses:
- Support boolean, numeric, select, text, photo evidence.

Store checklist definition separately from responses.

### Incidents

Incident report includes:
- Type, severity, location, description
- Evidence photos (multipart)
- Reporter identity (user ID + role)
- Timestamps and status (open / in_review / closed)

Design for future workflow (assign to supervisor, comments, attachments).

## 4. Backend Code Standards

- Use type hints everywhere.
- Use Pydantic models for API (request/response).
- Use SQLAlchemy ORM models; no raw SQL unless necessary.
- Add/modify Alembic migrations when changing the DB schema.

For new features:
- Create router module
- Add service layer (business logic)
- Add models + schemas + tests

Errors:
- Use HTTPException with clear messages and proper status codes (400/401/403/404/422).
- Avoid leaking sensitive info in error messages.

Testing:
- For non-trivial logic (offline sync, GPS validation, patrol sequencing), add unit tests before/after changes when possible.

## 5. Frontend Code Standards

- **TypeScript only**; no .jsx for new code.
- Functional components with hooks; no class components.
- Use Tailwind for layout and styling; avoid inline styles except for trivial cases.

State management:
- Use existing Zustand stores or follow existing pattern.
- Do not create new global store abstractions unless necessary.

API calls:
- Centralize in a services layer (e.g. `api/attendance.ts`, `api/patrol.ts`).
- Use typed response/request interfaces matching backend schemas.

Forms:
- Use controlled components.
- Validate basic constraints on client (required fields, min/max, etc.) but never rely only on frontend validation.

UI/UX:
- Guard app must be fast and minimal: big buttons, clear actions (Check-in, Check-out, Start Patrol, Report Incident).
- Supervisor/admin view can be denser but still clean: tables, filters, maps, calendar.

## 6. Security & Privacy Guardrails

**Never log:**
- Passwords
- Tokens
- Full image binary
- Precise GPS plus PII in plain logs

**Always:**
- Use HTTPS assumptions.
- Validate JWT on protected routes.
- Check role/permissions (guard vs supervisor vs admin) before returning sensitive data.

When adding new endpoints:
- Decide whether they need auth and which role(s).
- Do not leave temporary "public" endpoints in production code.

## 7. Refactoring & Changes

When making changes:

- Preserve behavior for existing flows unless explicitly asked to change them.
- If you must break a public API used by frontend:
  - Update frontend usages in the same change.
  - Update types, docs, and tests.
- Prefer incremental refactorings (small PR-sized changes) over giant rewrites.
- When something is ambiguous, make a reasonable assumption, implement it cleanly, and leave a `# TODO: confirm assumption with product owner` comment instead of stalling.

## 8. Interaction Style Inside This Repo

- Be decisive: don't ask for permission for every small decision.
- Avoid "clever" abstractions that reduce readability.
- Document non-obvious business rules with short comments or docstrings.

When you add or modify a feature, ensure:
- Backend route + schema
- DB migration (if needed)
- Frontend types + UI
- Minimal tests around the core logic

---

**Use all of the above as hard guardrails. Do not introduce new frameworks, paradigms, or technologies unless absolutely necessary and obviously beneficial for this specific system.**

