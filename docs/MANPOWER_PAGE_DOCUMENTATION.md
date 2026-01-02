# Dokumentasi Halaman Manpower

## 📋 Tujuan dan Fungsi

### **Tujuan Utama:**
Halaman **Manpower per Area** adalah tool untuk supervisor untuk **memantau distribusi dan ketersediaan tenaga kerja (manpower) per area/zone** dalam sistem. Halaman ini membantu supervisor menjawab pertanyaan:

1. **"Berapa banyak personel yang dijadwalkan di area ini?"** (Scheduled Manpower)
2. **"Berapa banyak personel yang benar-benar aktif bekerja?"** (Active Manpower)
3. **"Apakah ada area yang kekurangan personel?"** (Gap Analysis)
4. **"Bagaimana distribusi personel per divisi?"** (Division Overview)

### **Use Cases:**

#### 1. **Resource Planning**
- Supervisor dapat melihat apakah ada area yang kekurangan personel
- Membantu dalam penjadwalan shift dan alokasi personel
- Identifikasi area yang membutuhkan tambahan personel

#### 2. **Real-time Monitoring**
- Melihat personel yang sedang aktif bekerja (check-in) vs yang dijadwalkan
- Deteksi early warning jika ada personel yang tidak check-in sesuai jadwal
- Monitoring distribusi personel per area secara real-time

#### 3. **Compliance & Reporting**
- Verifikasi apakah semua area ter-cover sesuai jadwal
- Data untuk laporan ke management tentang ketersediaan personel
- Tracking attendance compliance per area

#### 4. **Operational Efficiency**
- Optimasi alokasi personel berdasarkan kebutuhan area
- Identifikasi area yang over-staffed atau under-staffed
- Data untuk decision making dalam shift management

---

## 🎨 Frontend (React/TypeScript)

### **File Location:**
```
frontend/web/src/modules/supervisor/pages/ManpowerPage.tsx
```

### **Komponen Utama:**

#### 1. **State Management**
```typescript
- data: ManpowerData[]          // Data manpower per area
- sites: Site[]                 // List sites untuk filter
- loading: boolean              // Loading state
- errorMsg: string              // Error message
- selectedSiteId: number | null // Filter by site
- selectedDivision: string      // Filter by division (SECURITY, CLEANING, DRIVER)
- dateFilter: string            // Filter by date
```

#### 2. **UI Components**

**Header Section:**
- Title: "Manpower per Area"
- Description: "View manpower count per area/zone with active and scheduled personnel"

**Filter Section:**
- **Site Filter**: Dropdown untuk memilih site (All Sites / Specific Site)
- **Division Filter**: Dropdown untuk memilih division (All Divisions / SECURITY / CLEANING / DRIVER)
- **Date Filter**: Date picker untuk memilih tanggal yang ingin dilihat

**Data Table:**
- **Columns:**
  - Area: Nama area/zone
  - Type: Tipe area (ZONE untuk cleaning zone, SITE untuk site level)
  - Division: Divisi (SECURITY, CLEANING, DRIVER, atau null untuk site level)
  - Scheduled: Jumlah personel yang dijadwalkan
  - Active: Jumlah personel yang aktif (sudah check-in)
  - Total: Total manpower (sama dengan scheduled)

#### 3. **Features**

**Color Coding:**
- Division badges dengan warna berbeda:
  - SECURITY: Primary color (blue)
  - CLEANING: Success color (green)
  - DRIVER: Warning color (orange)

**Responsive Design:**
- Table dengan alternating row colors untuk readability
- Responsive layout yang menyesuaikan dengan screen size

**Error Handling:**
- Menampilkan error message jika API call gagal
- Loading state saat fetch data

---

## 🔧 Backend (FastAPI/Python)

### **File Location:**
```
backend/app/api/supervisor_routes.py
```

### **API Endpoint:**

#### **GET `/api/supervisor/manpower`**

**Query Parameters:**
- `site_id` (optional): Filter by site ID
- `division` (optional): Filter by division (SECURITY, CLEANING, DRIVER)
- `date_filter` (optional): Filter by date (default: today)

**Response Model:**
```python
List[dict] dengan struktur:
{
    "area_id": int,
    "area_name": str,
    "area_type": "ZONE" | "SITE",
    "total_manpower": int,
    "active_manpower": int,
    "scheduled_manpower": int,
    "division": str | None
}
```

**Authentication:**
- Requires: `require_supervisor` dependency
- User harus memiliki role SUPERVISOR atau ADMIN

### **Business Logic:**

#### 1. **Cleaning Zones (Division: CLEANING)**
```python
# Untuk setiap cleaning zone:
- Hitung active_attendance: 
  - Attendance dengan status IN_PROGRESS
  - role_type = "CLEANING"
  - site_id = zone.site_id
  - checkin_time pada tanggal filter_date

- Hitung scheduled_shifts:
  - Shift dengan status ASSIGNED
  - division = "CLEANING"
  - site_id = zone.site_id
  - shift_date pada tanggal filter_date
```

#### 2. **Site Level (All Divisions)**
```python
# Untuk setiap site (jika division filter kosong):
- Hitung active_attendance:
  - Attendance dengan status IN_PROGRESS
  - site_id = site.id
  - checkin_time pada tanggal filter_date
  - (semua divisi)

- Hitung scheduled_shifts:
  - Shift dengan status ASSIGNED
  - site_id = site.id
  - shift_date pada tanggal filter_date
  - (semua divisi)
```

### **Data Aggregation:**

**Active Manpower:**
- Diambil dari tabel `attendance` dengan filter:
  - `status = IN_PROGRESS`
  - `checkin_time` pada tanggal yang dipilih
  - Filtered by `site_id` dan `role_type` (division)

**Scheduled Manpower:**
- Diambil dari tabel `shifts` dengan filter:
  - `status = ASSIGNED`
  - `shift_date` pada tanggal yang dipilih
  - Filtered by `site_id` dan `division`

**Total Manpower:**
- Sama dengan `scheduled_manpower` (total yang dijadwalkan)

---

## 🗄️ Database Schema

### **Tabel yang Digunakan:**

#### 1. **`attendance` Table**
**Purpose:** Menyimpan data check-in/check-out personel

**Columns yang digunakan:**
```sql
- id: Primary key
- company_id: Filter by company
- site_id: Filter by site
- user_id: User yang check-in
- role_type: Division (SECURITY, CLEANING, DRIVER)
- checkin_time: Waktu check-in (untuk filter tanggal)
- status: Status attendance (IN_PROGRESS = aktif)
```

**Query untuk Active Manpower:**
```sql
SELECT COUNT(*) 
FROM attendance 
WHERE company_id = ?
  AND site_id = ?
  AND role_type = ?
  AND status = 'IN_PROGRESS'
  AND DATE(checkin_time) = ?
```

#### 2. **`shifts` Table**
**Purpose:** Menyimpan jadwal shift personel

**Columns yang digunakan:**
```sql
- id: Primary key
- company_id: Filter by company
- site_id: Filter by site
- division: Division (SECURITY, CLEANING, DRIVER)
- shift_date: Tanggal shift (untuk filter)
- status: Status shift (ASSIGNED = terjadwal)
- user_id: User yang di-assign (nullable jika OPEN)
```

**Query untuk Scheduled Manpower:**
```sql
SELECT COUNT(*) 
FROM shifts 
WHERE company_id = ?
  AND site_id = ?
  AND division = ?
  AND DATE(shift_date) = ?
  AND status = 'ASSIGNED'
```

#### 3. **`cleaning_zones` Table**
**Purpose:** Menyimpan definisi cleaning zones

**Columns yang digunakan:**
```sql
- id: Primary key
- company_id: Filter by company
- site_id: Link ke site
- name: Nama zone
- division: Division (CLEANING)
- is_active: Status aktif
```

**Query untuk Cleaning Zones:**
```sql
SELECT * 
FROM cleaning_zones 
WHERE company_id = ?
  AND site_id = ? (optional)
  AND division = 'CLEANING'
  AND is_active = true
```

#### 4. **`sites` Table**
**Purpose:** Menyimpan definisi sites

**Columns yang digunakan:**
```sql
- id: Primary key
- company_id: Filter by company
- name: Nama site
```

**Query untuk Sites:**
```sql
SELECT * 
FROM sites 
WHERE company_id = ?
  AND id = ? (optional)
```

### **Relationship Diagram:**

```
sites (1) ──< (many) cleaning_zones
sites (1) ──< (many) shifts
sites (1) ──< (many) attendance

shifts (many) ──> (1) users
attendance (many) ──> (1) users
```

---

## 📊 Data Flow

### **Flow Diagram:**

```
1. User membuka halaman Manpower
   ↓
2. Frontend memanggil getManpower() dengan filters
   ↓
3. API endpoint: GET /api/supervisor/manpower
   ↓
4. Backend query database:
   - Query cleaning_zones (jika division = CLEANING)
   - Query sites (jika division = ALL atau kosong)
   ↓
5. Untuk setiap area:
   - Count active_attendance dari tabel attendance
   - Count scheduled_shifts dari tabel shifts
   ↓
6. Backend return JSON array dengan data per area
   ↓
7. Frontend render data dalam table
```

### **Example Response:**

```json
[
  {
    "area_id": 1,
    "area_name": "Lobby Area",
    "area_type": "ZONE",
    "total_manpower": 3,
    "active_manpower": 2,
    "scheduled_manpower": 3,
    "division": "CLEANING"
  },
  {
    "area_id": 5,
    "area_name": "Main Building",
    "area_type": "SITE",
    "total_manpower": 15,
    "active_manpower": 12,
    "scheduled_manpower": 15,
    "division": null
  }
]
```

---

## 🔍 Key Metrics

### **Metrics yang Ditampilkan:**

1. **Scheduled Manpower**
   - Jumlah personel yang dijadwalkan bekerja di area tersebut
   - Sumber: Tabel `shifts` dengan `status = ASSIGNED`

2. **Active Manpower**
   - Jumlah personel yang benar-benar aktif (sudah check-in)
   - Sumber: Tabel `attendance` dengan `status = IN_PROGRESS`

3. **Total Manpower**
   - Sama dengan Scheduled Manpower
   - Total personel yang seharusnya bekerja

### **Gap Analysis:**

**Formula:**
```
Gap = Scheduled Manpower - Active Manpower
```

**Interpretasi:**
- **Gap = 0**: Semua personel yang dijadwalkan sudah check-in ✅
- **Gap > 0**: Ada personel yang belum check-in ⚠️
- **Gap = Scheduled**: Tidak ada personel yang check-in ❌

---

## 🎯 Use Cases Detail

### **Use Case 1: Daily Manpower Check**
**Scenario:** Supervisor ingin memastikan semua area ter-cover pada hari ini

**Steps:**
1. Buka halaman Manpower
2. Pilih tanggal hari ini
3. Filter by site atau division jika perlu
4. Review table:
   - Cek apakah `active_manpower` = `scheduled_manpower`
   - Identifikasi area dengan gap (scheduled > active)
   - Follow up dengan personel yang belum check-in

### **Use Case 2: Resource Planning**
**Scenario:** Supervisor ingin merencanakan shift untuk besok

**Steps:**
1. Buka halaman Manpower
2. Pilih tanggal besok
3. Review `scheduled_manpower` per area
4. Identifikasi area yang under-staffed atau over-staffed
5. Adjust shift assignments sesuai kebutuhan

### **Use Case 3: Division Overview**
**Scenario:** Supervisor ingin melihat distribusi personel per divisi

**Steps:**
1. Buka halaman Manpower
2. Filter by division (SECURITY, CLEANING, atau DRIVER)
3. Review total manpower per area untuk divisi tersebut
4. Compare dengan divisi lain untuk balance check

---

## 🔐 Permissions

### **Required Permission:**
- Resource: `manpower`
- Action: `read`

### **Role Access:**
- ✅ **SUPERVISOR**: Full access
- ✅ **ADMIN**: Full access
- ❌ **FIELD**: No access (hanya supervisor)

### **Scope Filtering:**
- Supervisor dengan scope DIVISION: Hanya melihat divisi mereka
- Supervisor dengan scope SITE: Hanya melihat site mereka
- Supervisor dengan scope COMPANY: Melihat semua site
- ADMIN: Melihat semua data

---

## 🚀 Future Enhancements (Planned)

### **v1.5 Features:**
1. **Visual Charts**
   - Bar chart untuk comparison per area
   - Pie chart untuk division distribution
   - Trend chart untuk historical data

2. **Alert System**
   - Notifikasi jika gap > threshold
   - Email/SMS alert untuk under-staffed area

3. **Export Functionality**
   - Export to PDF
   - Export to Excel
   - Scheduled reports

4. **Historical Analysis**
   - View past dates
   - Compare with previous periods
   - Average manpower calculation

5. **Real-time Updates**
   - WebSocket untuk live updates
   - Auto-refresh setiap 30 detik

### **v2.0 Features:**
1. **Predictive Analytics**
   - Forecast manpower needs
   - Optimal scheduling suggestions

2. **Advanced Filtering**
   - Filter by shift type
   - Filter by time range
   - Multi-site comparison

3. **Dashboard Widget**
   - Manpower summary card di supervisor dashboard
   - Quick access to under-staffed areas

---

## 📝 Summary

**Halaman Manpower adalah tool penting untuk supervisor untuk:**

1. ✅ **Monitor** distribusi personel per area secara real-time
2. ✅ **Identify** area yang kekurangan atau kelebihan personel
3. ✅ **Plan** alokasi personel untuk shift management
4. ✅ **Track** compliance antara scheduled vs actual attendance
5. ✅ **Report** data manpower untuk management

**Data Sources:**
- `attendance` table → Active manpower (real-time)
- `shifts` table → Scheduled manpower (planned)
- `cleaning_zones` table → Area definitions
- `sites` table → Site definitions

**Key Metrics:**
- Scheduled Manpower: Jumlah yang dijadwalkan
- Active Manpower: Jumlah yang aktif bekerja
- Gap: Selisih antara scheduled dan active

Halaman ini membantu supervisor menjawab pertanyaan kritis: **"Apakah semua area ter-cover dengan personel yang cukup?"**
