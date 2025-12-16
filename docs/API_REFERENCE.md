# Verolux Management System - API Reference

Dokumentasi lengkap semua API endpoints.

---

## Base URL

- **Development:** `http://localhost:8000/api`
- **Production:** Configure via environment variables

---

## Authentication

### POST `/api/auth/login`

Login user dan mendapatkan JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "string",
    "role": "string",
    "division": "string",
    "company_id": 1
  }
}
```

### GET `/api/auth/me`

Get current user information dengan permissions.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "username": "string",
  "role": "string",
  "division": "string",
  "company_id": 1,
  "permissions": [
    {
      "id": 1,
      "resource": "string",
      "action": "string"
    }
  ]
}
```

---

## Attendance

### POST `/api/attendance/checkin`

Check-in attendance dengan QR code, GPS, dan photo.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `site_id`: integer (required)
- `qr_code`: string (required)
- `photo`: file (required)
- `latitude`: float (optional)
- `longitude`: float (optional)
- `accuracy`: float (optional)

**Response 201:**
```json
{
  "id": 1,
  "user_id": 1,
  "site_id": 1,
  "checkin_time": "2025-01-15T08:00:00Z",
  "status": "checked_in"
}
```

### POST `/api/attendance/checkout`

Check-out attendance.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "attendance_id": 1,
  "photo": "file" // optional
}
```

---

## Security Division

### Passdown Notes

#### GET `/api/security/passdown/notes`

List passdown notes (filtered by division).

**Query Parameters:**
- `site_id`: integer (optional)
- `shift_date`: date (optional, YYYY-MM-DD)
- `status`: string (optional, pending/acknowledged/resolved)

**Response 200:**
```json
[
  {
    "id": 1,
    "site_id": 1,
    "shift_date": "2025-01-15",
    "from_user_id": 1,
    "title": "string",
    "description": "string",
    "priority": "normal",
    "status": "pending"
  }
]
```

**Note:** Security users hanya melihat notes dari divisi security. Cleaning users hanya melihat notes dari divisi cleaning. Supervisor/Admin melihat semua notes.

#### POST `/api/security/passdown/notes`

Create passdown note.

**Request Body:**
```json
{
  "site_id": 1,
  "shift_date": "2025-01-15",
  "to_shift_type": "DAY",
  "category": "incident",
  "title": "string",
  "description": "string",
  "priority": "normal"
}
```

#### POST `/api/security/passdown/notes/{note_id}/acknowledge`

Acknowledge a passdown note.

**Note:** User hanya bisa acknowledge notes dari divisi yang sama (kecuali supervisor/admin).

### Patrol

#### GET `/api/security/patrols`

List patrol logs.

**Query Parameters:**
- `site_id`: integer (optional)
- `date_from`: date (optional)
- `date_to`: date (optional)

#### GET `/api/security/patrols/{id}/gps-track`

Get GPS track for a patrol.

**Response 200:**
```json
[
  {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "recorded_at": "2025-01-15T08:00:00Z"
  }
]
```

### Reports

#### GET `/api/security/reports`

List security reports.

**Query Parameters:**
- `site_id`: integer (optional)
- `report_type`: string (optional)
- `status`: string (optional)
- `date_from`: date (optional)
- `date_to`: date (optional)

#### POST `/api/security/reports`

Create security report.

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `report_type`: string (required)
- `site_id`: integer (required)
- `title`: string (required)
- `description`: string (optional)
- `evidence_files`: file[] (optional)

---

## Cleaning Division

### Tasks/Checklists

#### GET `/api/cleaning/tasks`

List cleaning tasks/checklists.

#### GET `/api/cleaning/tasks/{id}/detail`

Get detailed task information.

**Response 200:**
```json
{
  "id": 1,
  "template_name": "string",
  "zone_name": "string",
  "items": [
    {
      "id": 1,
      "title": "string",
      "status": "completed",
      "evidence": []
    }
  ]
}
```

### Reports

#### GET `/api/cleaning/reports`

List cleaning reports.

#### POST `/api/cleaning/reports`

Create cleaning report.

---

## Supervisor Endpoints

### Dashboard

#### GET `/api/supervisor/overview`

Get dashboard overview dengan KPIs.

**Response 200:**
```json
{
  "total_attendance": 100,
  "total_reports": 50,
  "total_checklists": 200,
  "attendance_by_division": {
    "security": 40,
    "cleaning": 35,
    "driver": 15,
    "parking": 10
  }
}
```

#### GET `/api/supervisor/manpower`

Get manpower per area.

**Query Parameters:**
- `date_filter`: date (optional, YYYY-MM-DD)

**Response 200:**
```json
[
  {
    "area": "Site A",
    "division": "SECURITY",
    "count": 5
  }
]
```

### Sites Management

#### GET `/api/supervisor/sites`

List all sites.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Site A",
    "address": "string",
    "lat": -6.2088,
    "lng": 106.8456,
    "geofence_radius_m": 100.0
  }
]
```

#### POST `/api/supervisor/sites`

Create new site.

**Request Body:**
```json
{
  "name": "string",
  "address": "string",
  "lat": -6.2088,
  "lng": 106.8456,
  "geofence_radius_m": 100.0
}
```

#### PATCH `/api/supervisor/sites/{id}`

Update site.

**Request Body:**
```json
{
  "name": "string",
  "address": "string",
  "lat": -6.2088,
  "lng": 106.8456,
  "geofence_radius_m": 100.0
}
```

#### DELETE `/api/supervisor/sites/{id}`

Delete site.

---

## Admin Endpoints

### RBAC Management

#### GET `/api/admin/roles`

List all roles.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "admin",
    "display_name": "Administrator",
    "description": "string"
  }
]
```

#### GET `/api/admin/permissions`

List all permissions.

**Response 200:**
```json
[
  {
    "id": 1,
    "resource": "attendance",
    "action": "read",
    "description": "string"
  }
]
```

#### GET `/api/admin/roles/{id}/permissions`

Get permissions for a role.

**Response 200:**
```json
[
  {
    "id": 1,
    "resource": "attendance",
    "action": "read"
  }
]
```

#### POST `/api/admin/roles/{id}/permissions`

Update role permissions.

**Request Body:**
```json
{
  "permission_ids": [1, 2, 3]
}
```

#### GET `/api/admin/users`

List all users.

**Query Parameters:**
- `role`: string (optional)
- `is_active`: boolean (optional)

**Response 200:**
```json
[
  {
    "id": 1,
    "username": "string",
    "role": "string",
    "role_id": 1,
    "division": "security",
    "is_active": true
  }
]
```

#### PATCH `/api/admin/users/{id}`

Update user details.

**Request Body:**
```json
{
  "role_id": 2,
  "division": "cleaning",
  "is_active": true
}
```

---

## Master Data

### GET `/api/master-data`

List master data.

**Query Parameters:**
- `category`: string (optional, e.g., ZONE_TYPE, INCIDENT_TYPE)
- `division`: string (optional)
- `is_active`: boolean (optional)

**Response 200:**
```json
[
  {
    "id": 1,
    "category": "ZONE_TYPE",
    "code": "ZONE_A",
    "name": "Zone A",
    "description": "string",
    "division": "SECURITY",
    "is_active": true,
    "sort_order": 0
  }
]
```

### GET `/api/master-data/{category}`

Get master data by category.

**Example:** `GET /api/master-data/ZONE_TYPE`

### POST `/api/master-data`

Create master data.

**Request Body:**
```json
{
  "category": "ZONE_TYPE",
  "code": "ZONE_A",
  "name": "Zone A",
  "description": "string",
  "division": "SECURITY",
  "sort_order": 0,
  "is_active": true
}
```

### PUT `/api/master-data/{id}`

Update master data.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "string",
  "is_active": true
}
```

### DELETE `/api/master-data/{id}`

Delete master data.

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Error message",
  "error_code": "BAD_REQUEST"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated",
  "error_code": "UNAUTHORIZED"
}
```

### 403 Forbidden
```json
{
  "detail": "Permission denied",
  "error_code": "FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found",
  "error_code": "NOT_FOUND"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "field"],
      "msg": "Field required",
      "type": "value_error.missing"
    }
  ],
  "error_code": "VALIDATION_ERROR"
}
```

### 500 Internal Server Error
```json
{
  "detail": "An internal error occurred. Please try again later.",
  "error_code": "INTERNAL_ERROR"
}
```

---

## Authentication

Semua endpoints (kecuali `/api/auth/login`) memerlukan JWT token di header:

```
Authorization: Bearer <token>
```

---

## Rate Limiting

Currently tidak ada rate limiting. Recommended untuk production:
- 100 requests/minute per user
- 1000 requests/hour per IP

---

## Pagination

Endpoints yang mendukung pagination menggunakan query parameters:
- `page`: integer (default: 1)
- `limit`: integer (default: 20)

**Response format:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15

