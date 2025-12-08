-- Mock Data for Verolux Management System
-- Run this SQL file after creating tables via Alembic migrations

-- 1. Insert Company
INSERT INTO companies (id, name, address, created_at, updated_at)
VALUES (1, 'PT Verolux Security', 'Jakarta, Indonesia', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Sites
INSERT INTO sites (id, name, address, company_id, created_at, updated_at)
VALUES
    (1, 'Gedung Perkantoran A', 'Jl. Sudirman No. 1', 1, NOW(), NOW()),
    (2, 'Mall Central', 'Jl. Thamrin No. 10', 1, NOW(), NOW()),
    (3, 'Pabrik Industri B', 'Jl. Industri Raya No. 5', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Users
INSERT INTO users (id, username, hashed_password, division, role, company_id, site_id, created_at, updated_at)
VALUES
    (1, 'security', 'dummy', 'security', 'guard', 1, 1, NOW(), NOW()),
    (2, 'guard1', 'dummy', 'security', 'guard', 1, 1, NOW(), NOW()),
    (3, 'guard2', 'dummy', 'security', 'guard', 1, 2, NOW(), NOW()),
    (4, 'supervisor1', 'dummy', 'security', 'supervisor', 1, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Checklist Templates
INSERT INTO checklist_templates (id, company_id, site_id, name, role, shift_type, is_active, created_at, updated_at)
VALUES
    (1, 1, 1, 'Security Guard - Site A - Morning Shift', 'guard', 'MORNING', true, NOW(), NOW()),
    (2, 1, 1, 'Security Guard - Site A - Night Shift', 'guard', 'NIGHT', true, NOW(), NOW()),
    (3, 1, NULL, 'Security Guard - Global Template', 'guard', NULL, true, NOW(), NOW()),
    (4, 1, 1, 'Supervisor - Site A - All Shifts', 'supervisor', NULL, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Checklist Template Items
-- Template 1: Morning Shift
INSERT INTO checklist_template_items (id, template_id, "order", title, description, required, evidence_type, created_at)
VALUES
    (1, 1, 1, 'Periksa kunci pintu utama', 'Pastikan semua pintu utama terkunci dengan benar', true, 'photo', NOW()),
    (2, 1, 2, 'Patroli area parkir', 'Lakukan patroli menyeluruh di area parkir', true, 'patrol_log', NOW()),
    (3, 1, 3, 'Periksa sistem alarm', 'Test sistem alarm dan pastikan berfungsi', true, 'note', NOW()),
    (4, 1, 4, 'Periksa CCTV', 'Pastikan semua kamera CCTV berfungsi', true, 'photo', NOW()),
    (5, 1, 5, 'Periksa area gudang', 'Lakukan pemeriksaan area gudang', false, 'note', NOW())
ON CONFLICT (id) DO NOTHING;

-- Template 2: Night Shift
INSERT INTO checklist_template_items (id, template_id, "order", title, description, required, evidence_type, created_at)
VALUES
    (6, 2, 1, 'Periksa kunci pintu utama', 'Pastikan semua pintu utama terkunci dengan benar', true, 'photo', NOW()),
    (7, 2, 2, 'Patroli area parkir', 'Lakukan patroli menyeluruh di area parkir', true, 'patrol_log', NOW()),
    (8, 2, 3, 'Periksa sistem alarm', 'Test sistem alarm dan pastikan berfungsi', true, 'note', NOW()),
    (9, 2, 4, 'Periksa area gelap', 'Pastikan tidak ada area gelap yang mencurigakan', true, 'photo', NOW()),
    (10, 2, 5, 'Periksa generator darurat', 'Pastikan generator darurat siap digunakan', false, 'note', NOW())
ON CONFLICT (id) DO NOTHING;

-- Template 3: Global Template
INSERT INTO checklist_template_items (id, template_id, "order", title, description, required, evidence_type, created_at)
VALUES
    (11, 3, 1, 'Periksa kunci pintu utama', 'Pastikan semua pintu utama terkunci dengan benar', true, 'photo', NOW()),
    (12, 3, 2, 'Patroli area umum', 'Lakukan patroli menyeluruh di area umum', true, 'patrol_log', NOW())
ON CONFLICT (id) DO NOTHING;

-- Template 4: Supervisor Template
INSERT INTO checklist_template_items (id, template_id, "order", title, description, required, evidence_type, created_at)
VALUES
    (13, 4, 1, 'Review laporan harian', 'Review semua laporan dari guard', true, 'note', NOW()),
    (14, 4, 2, 'Inspeksi area kritis', 'Lakukan inspeksi pada area-area kritis', true, 'photo', NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Sample Attendance Records (Today)
INSERT INTO security_attendance (id, company_id, site_id, user_id, shift_date, check_in_time, check_out_time, check_in_location, created_at, updated_at)
VALUES
    (1, 1, 1, 1, CURRENT_DATE, CURRENT_DATE + TIME '06:00:00', NULL, 'Pintu Utama', NOW(), NOW()),
    (2, 1, 1, 2, CURRENT_DATE, CURRENT_DATE + TIME '14:00:00', NULL, 'Pintu Utama', NOW(), NOW()),
    (3, 1, 2, 3, CURRENT_DATE, CURRENT_DATE + TIME '06:00:00', NULL, 'Pintu Utama', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Sample Attendance Records (Yesterday - Completed)
INSERT INTO security_attendance (id, company_id, site_id, user_id, shift_date, check_in_time, check_out_time, check_in_location, check_out_location, created_at, updated_at)
VALUES
    (4, 1, 1, 1, CURRENT_DATE - INTERVAL '1 day', (CURRENT_DATE - INTERVAL '1 day') + TIME '06:00:00', (CURRENT_DATE - INTERVAL '1 day') + TIME '14:00:00', 'Pintu Utama', 'Pintu Utama', NOW(), NOW()),
    (5, 1, 1, 2, CURRENT_DATE - INTERVAL '1 day', (CURRENT_DATE - INTERVAL '1 day') + TIME '14:00:00', (CURRENT_DATE - INTERVAL '1 day') + TIME '22:00:00', 'Pintu Utama', 'Pintu Utama', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Checklists for Today's Attendance
-- Checklist for attendance 1 (user 1, today, morning shift)
INSERT INTO checklists (id, company_id, site_id, user_id, attendance_id, template_id, shift_date, shift_type, status, created_at, updated_at)
VALUES
    (1, 1, 1, 1, 1, 1, CURRENT_DATE, 'MORNING', 'OPEN', NOW(), NOW()),
    (2, 1, 1, 2, 2, 1, CURRENT_DATE, 'DAY', 'OPEN', NOW(), NOW()),
    (3, 1, 2, 3, 3, 3, CURRENT_DATE, 'MORNING', 'OPEN', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Checklist Items for Checklist 1 (Morning Shift - All PENDING)
INSERT INTO checklist_items (id, checklist_id, template_item_id, "order", title, description, required, evidence_type, status, created_at, updated_at)
VALUES
    (1, 1, 1, 1, 'Periksa kunci pintu utama', 'Pastikan semua pintu utama terkunci dengan benar', true, 'photo', 'PENDING', NOW(), NOW()),
    (2, 1, 2, 2, 'Patroli area parkir', 'Lakukan patroli menyeluruh di area parkir', true, 'patrol_log', 'PENDING', NOW(), NOW()),
    (3, 1, 3, 3, 'Periksa sistem alarm', 'Test sistem alarm dan pastikan berfungsi', true, 'note', 'PENDING', NOW(), NOW()),
    (4, 1, 4, 4, 'Periksa CCTV', 'Pastikan semua kamera CCTV berfungsi', true, 'photo', 'PENDING', NOW(), NOW()),
    (5, 1, 5, 5, 'Periksa area gudang', 'Lakukan pemeriksaan area gudang', false, 'note', 'PENDING', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Checklist Items for Checklist 2 (Day Shift - All PENDING)
INSERT INTO checklist_items (id, checklist_id, template_item_id, "order", title, description, required, evidence_type, status, created_at, updated_at)
VALUES
    (6, 2, 1, 1, 'Periksa kunci pintu utama', 'Pastikan semua pintu utama terkunci dengan benar', true, 'photo', 'PENDING', NOW(), NOW()),
    (7, 2, 2, 2, 'Patroli area parkir', 'Lakukan patroli menyeluruh di area parkir', true, 'patrol_log', 'PENDING', NOW(), NOW()),
    (8, 2, 3, 3, 'Periksa sistem alarm', 'Test sistem alarm dan pastikan berfungsi', true, 'note', 'PENDING', NOW(), NOW()),
    (9, 2, 4, 4, 'Periksa CCTV', 'Pastikan semua kamera CCTV berfungsi', true, 'photo', 'PENDING', NOW(), NOW()),
    (10, 2, 5, 5, 'Periksa area gudang', 'Lakukan pemeriksaan area gudang', false, 'note', 'PENDING', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Checklist Items for Checklist 3 (Global Template - All PENDING)
INSERT INTO checklist_items (id, checklist_id, template_item_id, "order", title, description, required, evidence_type, status, created_at, updated_at)
VALUES
    (11, 3, 11, 1, 'Periksa kunci pintu utama', 'Pastikan semua pintu utama terkunci dengan benar', true, 'photo', 'PENDING', NOW(), NOW()),
    (12, 3, 12, 2, 'Patroli area umum', 'Lakukan patroli menyeluruh di area umum', true, 'patrol_log', 'PENDING', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Checklists for Yesterday's Attendance (with some completed items)
INSERT INTO checklists (id, company_id, site_id, user_id, attendance_id, template_id, shift_date, shift_type, status, completed_at, created_at, updated_at)
VALUES
    (4, 1, 1, 1, 4, 1, CURRENT_DATE - INTERVAL '1 day', 'MORNING', 'INCOMPLETE', NULL, NOW(), NOW()),
    (5, 1, 1, 2, 5, 1, CURRENT_DATE - INTERVAL '1 day', 'DAY', 'COMPLETED', (CURRENT_DATE - INTERVAL '1 day') + TIME '22:00:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Checklist Items for Checklist 4 (Yesterday - INCOMPLETE: 3/4 required completed)
INSERT INTO checklist_items (id, checklist_id, template_item_id, "order", title, description, required, evidence_type, status, completed_at, created_at, updated_at)
VALUES
    (13, 4, 1, 1, 'Periksa kunci pintu utama', 'Pastikan semua pintu utama terkunci dengan benar', true, 'photo', 'COMPLETED', (CURRENT_DATE - INTERVAL '1 day') + TIME '06:30:00', NOW(), NOW()),
    (14, 4, 2, 2, 'Patroli area parkir', 'Lakukan patroli menyeluruh di area parkir', true, 'patrol_log', 'COMPLETED', (CURRENT_DATE - INTERVAL '1 day') + TIME '07:00:00', NOW(), NOW()),
    (15, 4, 3, 3, 'Periksa sistem alarm', 'Test sistem alarm dan pastikan berfungsi', true, 'note', 'COMPLETED', (CURRENT_DATE - INTERVAL '1 day') + TIME '08:00:00', NOW(), NOW()),
    (16, 4, 4, 4, 'Periksa CCTV', 'Pastikan semua kamera CCTV berfungsi', true, 'photo', 'PENDING', NULL, NOW(), NOW()),
    (17, 4, 5, 5, 'Periksa area gudang', 'Lakukan pemeriksaan area gudang', false, 'note', 'PENDING', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Checklist Items for Checklist 5 (Yesterday - COMPLETED: all required completed)
INSERT INTO checklist_items (id, checklist_id, template_item_id, "order", title, description, required, evidence_type, status, completed_at, created_at, updated_at)
VALUES
    (18, 5, 1, 1, 'Periksa kunci pintu utama', 'Pastikan semua pintu utama terkunci dengan benar', true, 'photo', 'COMPLETED', (CURRENT_DATE - INTERVAL '1 day') + TIME '14:30:00', NOW(), NOW()),
    (19, 5, 2, 2, 'Patroli area parkir', 'Lakukan patroli menyeluruh di area parkir', true, 'patrol_log', 'COMPLETED', (CURRENT_DATE - INTERVAL '1 day') + TIME '15:00:00', NOW(), NOW()),
    (20, 5, 3, 3, 'Periksa sistem alarm', 'Test sistem alarm dan pastikan berfungsi', true, 'note', 'COMPLETED', (CURRENT_DATE - INTERVAL '1 day') + TIME '16:00:00', NOW(), NOW()),
    (21, 5, 4, 4, 'Periksa CCTV', 'Pastikan semua kamera CCTV berfungsi', true, 'photo', 'COMPLETED', (CURRENT_DATE - INTERVAL '1 day') + TIME '17:00:00', NOW(), NOW()),
    (22, 5, 5, 5, 'Periksa area gudang', 'Lakukan pemeriksaan area gudang', false, 'note', 'COMPLETED', (CURRENT_DATE - INTERVAL '1 day') + TIME '18:00:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Reset sequences to avoid conflicts
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));
SELECT setval('sites_id_seq', (SELECT MAX(id) FROM sites));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('checklist_templates_id_seq', (SELECT MAX(id) FROM checklist_templates));
SELECT setval('checklist_template_items_id_seq', (SELECT MAX(id) FROM checklist_template_items));
SELECT setval('security_attendance_id_seq', (SELECT MAX(id) FROM security_attendance));
SELECT setval('checklists_id_seq', (SELECT MAX(id) FROM checklists));
SELECT setval('checklist_items_id_seq', (SELECT MAX(id) FROM checklist_items));

