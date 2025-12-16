# Checklist System Documentation

## Overview
Sistem checklist adalah modul terpadu yang digunakan oleh semua divisi (SECURITY, CLEANING, DRIVER, PARKING) untuk mengelola tugas-tugas harian yang harus diselesaikan oleh personel lapangan.

## Struktur Database

### 1. `checklist_templates` (Template Checklist)
**Fungsi:** Menyimpan template checklist yang dapat digunakan berulang kali untuk membuat checklist instance.

**Struktur:**
- `id` - Primary key
- `company_id` - ID perusahaan (multi-tenant)
- `site_id` - ID site (nullable, null = template global untuk semua site)
- `division` - Divisi: 'SECURITY', 'CLEANING', 'DRIVER', 'PARKING'
- `name` - Nama template (contoh: "Security Patrol Morning", "Cleaning Zone A")
- `role` - Role yang menggunakan template ini (nullable)
- `shift_type` - Tipe shift: "MORNING", "NIGHT", "DAY" (nullable = semua shift)
- `is_active` - Status aktif/tidak aktif
- `created_at`, `updated_at` - Timestamps

**Penggunaan:**
- Template dibuat oleh admin/supervisor
- Template dapat digunakan untuk membuat banyak checklist instance
- Template dapat diaktifkan/dinonaktifkan tanpa menghapus data historis

**Contoh:**
- Template "Security Patrol Route 1" untuk patrol security
- Template "Cleaning Zone Toilet" untuk cleaning zone tertentu
- Template "Driver Pre-Trip Inspection" untuk inspeksi kendaraan

---

### 2. `checklist_template_items` (Item dalam Template)
**Fungsi:** Menyimpan item-item/tugas-tugas yang ada dalam sebuah template checklist.

**Struktur:**
- `id` - Primary key
- `template_id` - Foreign key ke `checklist_templates.id`
- `order` - Urutan item dalam template
- `title` - Judul item/tugas
- `description` - Deskripsi detail (nullable)
- `required` - Apakah item wajib diselesaikan
- `evidence_type` - Tipe bukti: "none", "photo", "note", "patrol_log", "asset_scan"
- `auto_complete_rule` - JSON untuk logika auto-complete (nullable)
- `kpi_key` - Key untuk KPI tracking (nullable, untuk cleaning)
- `answer_type` - Tipe jawaban: 'BOOLEAN', 'CHOICE', 'SCORE', 'TEXT' (nullable)
- `photo_required` - Apakah foto wajib (untuk cleaning)
- `created_at` - Timestamp

**Penggunaan:**
- Setiap template memiliki beberapa item
- Item-item ini akan di-copy ke `checklist_items` ketika checklist instance dibuat
- Item dapat memiliki aturan khusus (required, evidence type, dll)

**Contoh:**
- Item "Check all doors locked" dengan evidence_type="photo"
- Item "Clean toilet floor" dengan kpi_key="TOILET_CLEAN"
- Item "Check tire pressure" dengan answer_type="SCORE"

---

### 3. `checklists` (Instance Checklist)
**Fungsi:** Menyimpan instance checklist yang dibuat dari template untuk personel tertentu pada tanggal/shift tertentu.

**Struktur:**
- `id` - Primary key
- `company_id` - ID perusahaan
- `site_id` - ID site
- `user_id` - ID user yang bertanggung jawab
- `attendance_id` - Foreign key ke attendance (nullable)
- `template_id` - Foreign key ke `checklist_templates.id` (nullable)
- `division` - Divisi: 'SECURITY', 'CLEANING', 'DRIVER', 'PARKING'
- `shift_date` - Tanggal shift
- `shift_type` - Tipe shift (nullable)
- `status` - Status: OPEN, COMPLETED, INCOMPLETE
- `completed_at` - Waktu selesai (nullable)
- `notes` - Catatan tambahan (nullable)
- `context_type` - Tipe konteks: "SECURITY_PATROL", "CLEANING_ZONE", "DRIVER_PRE_TRIP", "DRIVER_POST_TRIP"
- `context_id` - ID konteks (zone_id, trip_id, dll)
- `created_at`, `updated_at` - Timestamps

**Penggunaan:**
- Checklist instance dibuat ketika:
  - Personel check-in (auto-create dari template)
  - Personel scan QR code di zone/point tertentu
  - Supervisor assign manual
- Setiap instance memiliki item-item yang di-copy dari template
- Status berubah dari OPEN → COMPLETED/INCOMPLETE

**Contoh:**
- Checklist untuk Security Guard A pada tanggal 2024-01-15 shift Morning
- Checklist untuk Cleaning Zone Toilet A pada tanggal 2024-01-15
- Checklist untuk Driver Pre-Trip untuk Trip #123

---

### 4. `checklist_items` (Item dalam Checklist Instance)
**Fungsi:** Menyimpan item-item/tugas-tugas dalam sebuah checklist instance yang sedang dikerjakan.

**Struktur:**
- `id` - Primary key
- `checklist_id` - Foreign key ke `checklists.id`
- `template_item_id` - Foreign key ke `checklist_template_items.id` (nullable)
- `order` - Urutan item
- `title` - Judul item (di-copy dari template)
- `description` - Deskripsi (di-copy dari template)
- `required` - Apakah wajib (di-copy dari template)
- `evidence_type` - Tipe bukti (di-copy dari template)
- `status` - Status: PENDING, COMPLETED, NOT_APPLICABLE, FAILED
- `completed_at` - Waktu selesai (nullable)
- `evidence_id` - ID bukti (path foto, dll) (nullable)
- `note` - Catatan dari personel (nullable)
- `kpi_key` - Key untuk KPI (nullable, untuk cleaning)
- `answer_type` - Tipe jawaban (nullable)
- `answer_bool` - Jawaban boolean (nullable)
- `answer_int` - Jawaban integer/score (nullable)
- `answer_text` - Jawaban text (nullable)
- `photo_id` - ID foto (nullable)
- `gps_lat`, `gps_lng`, `gps_accuracy` - Koordinat GPS (nullable)
- `mock_location` - Flag fake GPS (nullable)
- `created_at`, `updated_at` - Timestamps

**Penggunaan:**
- Item dibuat dari template item ketika checklist instance dibuat
- Personel mengupdate status item menjadi COMPLETED ketika selesai
- Item dapat memiliki bukti (foto, GPS, catatan)
- Item dapat memiliki jawaban KPI (untuk cleaning)

**Contoh:**
- Item "Check door locked" dengan status COMPLETED, evidence_id="photo_123.jpg"
- Item "Clean toilet floor" dengan answer_bool=true, kpi_key="TOILET_CLEAN"
- Item "Check tire pressure" dengan answer_int=35 (PSI)

---

## Relasi Antar Tabel

```
checklist_templates (1) ──< (N) checklist_template_items
     │
     │ (template_id)
     │
     └──> (N) checklists (1) ──< (N) checklist_items
```

**Flow:**
1. Admin membuat `checklist_template` dengan beberapa `checklist_template_items`
2. Sistem atau personel membuat `checklist` instance dari template
3. Sistem membuat `checklist_items` dari `checklist_template_items`
4. Personel mengupdate `checklist_items` saat menyelesaikan tugas
5. Sistem mengupdate status `checklist` berdasarkan completion `checklist_items`

---

## Use Cases

### 1. Security Patrol
- Template: "Security Patrol Route 1"
- Items: "Check Gate A", "Check Gate B", "Check CCTV", dll
- Instance dibuat setiap shift untuk guard tertentu
- Guard menyelesaikan item-item saat patrol

### 2. Cleaning Zone
- Template: "Cleaning Zone Toilet"
- Items: "Clean floor", "Check tissue stock", "Check soap", dll
- Instance dibuat setiap hari untuk zone tertentu
- Cleaner menyelesaikan item dengan foto dan KPI answers

### 3. Driver Pre-Trip
- Template: "Driver Pre-Trip Inspection"
- Items: "Check tire pressure", "Check fuel", "Check lights", dll
- Instance dibuat sebelum setiap trip
- Driver menyelesaikan item dengan foto dan notes

---

## API Endpoints yang Diperlukan

### Template Management (Admin/Supervisor)
- `GET /supervisor/checklist-templates` - List templates
- `POST /supervisor/checklist-templates` - Create template
- `GET /supervisor/checklist-templates/{id}` - Get template detail
- `PUT /supervisor/checklist-templates/{id}` - Update template
- `DELETE /supervisor/checklist-templates/{id}` - Delete template

### Checklist Instance Management
- `GET /supervisor/checklists` - List checklists (sudah ada)
- `GET /supervisor/checklists/{id}` - Get checklist detail
- `POST /supervisor/checklists` - Create checklist manually
- `PUT /supervisor/checklists/{id}` - Update checklist
- `DELETE /supervisor/checklists/{id}` - Delete checklist

### Checklist Item Management
- `GET /supervisor/checklists/{id}/items` - List items
- `PUT /supervisor/checklists/{id}/items/{item_id}` - Update item status
- `POST /supervisor/checklists/{id}/items/{item_id}/complete` - Complete item

---

## File yang Harus Dibuat

1. **API Routes untuk Template Management**
   - `backend/app/api/checklist_template_routes.py` - CRUD operations untuk templates

2. **Service Layer (Opsional tapi Recommended)**
   - `backend/app/services/checklist_service.py` - Business logic untuk checklist operations

3. **Schemas untuk API**
   - Update `backend/app/divisions/security/schemas.py` atau buat shared schemas

---

## Catatan Penting

1. **Unified System:** Semua divisi menggunakan tabel yang sama, dibedakan oleh field `division`
2. **Template Reusability:** Template dapat digunakan untuk membuat banyak instance
3. **Data Integrity:** Item instance di-copy dari template, sehingga perubahan template tidak mempengaruhi instance yang sudah dibuat
4. **KPI Support:** Sistem mendukung KPI tracking untuk cleaning division
5. **Evidence Tracking:** Setiap item dapat memiliki bukti (foto, GPS, catatan)

