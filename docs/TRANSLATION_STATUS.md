# Status Terjemahan Bahasa Indonesia

## ✅ Selesai Diterjemahkan

### Sistem Terjemahan
- ✅ `frontend/web/src/i18n/translations.ts` - File terjemahan lengkap
- ✅ `frontend/web/src/i18n/useTranslation.ts` - Hook terjemahan

### Komponen Shared
- ✅ `LoginPage.tsx` - Halaman login
- ✅ `BottomNav.tsx` - Navigasi bawah
- ✅ `MobileLayout.tsx` - Layout mobile (tidak perlu terjemahan, hanya title)

### Halaman Security
- ✅ `SecurityDashboardPage.tsx` - Dashboard keamanan
- ✅ `SecurityAttendancePage.tsx` - Absensi
- ✅ `SecurityReportFormPage.tsx` - Form laporan keamanan

### Halaman Cleaning
- ✅ `CleaningDashboardPage.tsx` - Dashboard kebersihan

### Halaman Parking
- ✅ `ParkingDashboardPage.tsx` - Dashboard parkir

## ⏳ Perlu Diterjemahkan

### Halaman Security (Prioritas Tinggi)
- [ ] `SecurityReportsListPage.tsx`
- [ ] `SecurityPatrolFormPage.tsx`
- [ ] `VisitorLogFormPage.tsx`
- [ ] `VisitorLogListPage.tsx`
- [ ] `AssetInspectionFormPage.tsx`
- [ ] `LeaveRequestFormPage.tsx`
- [ ] `LeaveRequestListPage.tsx`

### Halaman Cleaning
- [ ] `CleaningChecklistFormPage.tsx`

### Halaman Parking
- [ ] `ParkingEntryPage.tsx`
- [ ] `ParkingExitPage.tsx`

### Komponen Shared
- [ ] `EvidencePhotoUploader.tsx` - Uploader foto

### Backend (Opsional)
- [ ] Pesan error di `backend/app/divisions/security/routes.py`
- [ ] Pesan error di `backend/app/api/auth_routes.py`

## Cara Menambahkan Terjemahan

1. Import hook terjemahan:
```typescript
import { useTranslation } from "../../../i18n/useTranslation";

// Di dalam component:
const { t } = useTranslation();
```

2. Gunakan fungsi `t()` untuk semua teks:
```typescript
// Sebelum:
<h1>Security Dashboard</h1>

// Sesudah:
<h1>{t("security.dashboard")}</h1>
```

3. Tambahkan key baru ke `translations.ts` jika diperlukan:
```typescript
security: {
  // ... existing keys
  newKey: "Terjemahan Bahasa Indonesia",
}
```

## Catatan

- Semua terjemahan sudah tersedia di `translations.ts`
- Gunakan key yang sudah ada jika memungkinkan
- Untuk teks yang belum ada, tambahkan ke file terjemahan terlebih dahulu
- Format key: `section.subsection.key` (contoh: `security.attendanceTitle`)

