# Mock Data Setup Guide

This guide explains how to populate the Verolux Management System with mock data for testing.

## Option 1: Using SQL File (Recommended)

1. **Ensure database is running and migrations are applied:**
   ```bash
   cd backend
   alembic upgrade head
   ```

2. **Run the SQL file:**
   ```bash
   psql -U your_user -d verolux_db -f scripts/mock_data.sql
   ```
   
   Or if using connection string:
   ```bash
   PGPASSWORD=your_password psql -h localhost -U your_user -d verolux_db -f scripts/mock_data.sql
   ```

## Option 2: Using Python Script

1. **Ensure database is running:**
   ```bash
   # Start PostgreSQL
   # On macOS with Homebrew:
   brew services start postgresql
   
   # Or check if running:
   pg_isready
   ```

2. **Run the Python script:**
   ```bash
   cd backend
   python3 scripts/create_mock_data.py
   ```

## What Gets Created

### Companies
- **PT Verolux Security** (ID: 1)

### Sites
- **Gedung Perkantoran A** (ID: 1, Site A)
- **Mall Central** (ID: 2, Site B)
- **Pabrik Industri B** (ID: 3, Site C)

### Users
- **security** (ID: 1, guard, Site A) - Main test user
- **guard1** (ID: 2, guard, Site A)
- **guard2** (ID: 3, guard, Site B)
- **supervisor1** (ID: 4, supervisor, Site A)

### Checklist Templates
1. **Security Guard - Site A - Morning Shift** (5 items)
   - Periksa kunci pintu utama (required, photo)
   - Patroli area parkir (required, patrol_log)
   - Periksa sistem alarm (required, note)
   - Periksa CCTV (required, photo)
   - Periksa area gudang (optional, note)

2. **Security Guard - Site A - Night Shift** (5 items)
   - Similar to morning but with "Periksa area gelap" instead of CCTV

3. **Security Guard - Global Template** (2 items)
   - Basic tasks for any site/shift

4. **Supervisor - Site A - All Shifts** (2 items)
   - Review laporan harian
   - Inspeksi area kritis

### Sample Data

#### Today's Attendance & Checklists
- **User 1** (security): Check-in at 06:00, Morning shift, Checklist OPEN (all items PENDING)
- **User 2** (guard1): Check-in at 14:00, Day shift, Checklist OPEN (all items PENDING)
- **User 3** (guard2): Check-in at 06:00, Morning shift, Checklist OPEN (using global template)

#### Yesterday's Attendance & Checklists
- **User 1**: Check-in 06:00, Check-out 14:00, Checklist INCOMPLETE (3/4 required completed)
- **User 2**: Check-in 14:00, Check-out 22:00, Checklist COMPLETED (all required completed)

## Testing the System

### 1. Login
- Username: `security`
- Password: (empty)

### 2. Check Today's Checklist
- Navigate to `/security/checklist`
- Should see checklist with 5 items (all PENDING)
- Try marking items as completed

### 3. Supervisor Dashboard
- Navigate to `/security/checklist/supervisor`
- Should see 3 checklists for today
- Filter by date, site, or status

### 4. Check-in Flow
- When user checks in, checklist is auto-created from template
- Checklist status starts as OPEN
- Items can be marked as COMPLETED, NOT_APPLICABLE, or FAILED

### 5. Check-out Flow
- When user checks out, checklist status is finalized:
  - COMPLETED if all required items done
  - INCOMPLETE if some required items missing

## Notes

- All passwords are set to "dummy" (not hashed) for testing
- Timestamps use CURRENT_DATE for today's data
- Yesterday's data uses `CURRENT_DATE - INTERVAL '1 day'`
- The SQL file uses `ON CONFLICT DO NOTHING` to avoid errors on re-run
- Sequence IDs are reset at the end to prevent conflicts

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running: `pg_isready`
- Check connection string in `.env` file
- Verify database exists: `psql -l | grep verolux`

### Foreign Key Errors
- Make sure migrations are applied: `alembic upgrade head`
- Run SQL in order (companies → sites → users → templates → items → attendance → checklists)

### Duplicate Key Errors
- The SQL uses `ON CONFLICT DO NOTHING` to handle duplicates
- If you need fresh data, truncate tables first:
  ```sql
  TRUNCATE checklist_items, checklists, security_attendance, 
          checklist_template_items, checklist_templates, 
          users, sites, companies CASCADE;
  ```

