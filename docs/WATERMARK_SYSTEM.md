# Sistem Watermark untuk Foto

## Overview

Sistem watermark otomatis menambahkan informasi ke semua foto yang disimpan ke database. Watermark mencakup:
- **Logo perusahaan** (di tengah foto, seperti Shutterstock)
- **Lokasi** (GPS coordinates atau alamat)
- **Waktu** (timestamp saat foto diambil)
- **Nama user** (yang mengambil foto)
- **Nama site** (lokasi site)
- **Info tambahan** (role, report type, dll)

## Komponen Sistem

### 1. WatermarkService (`backend/app/services/watermark_service.py`)

Service utama untuk menambahkan watermark ke foto.

**Fitur:**
- Logo perusahaan di tengah foto (20% dari lebar foto)
- Text watermark di pojok kanan bawah
- Opacity yang dapat dikonfigurasi
- Fallback ke placeholder logo jika logo tidak ditemukan

**Methods:**
- `add_watermark()`: Menambahkan watermark ke image bytes
- `add_watermark_to_file()`: Menambahkan watermark ke file dan menyimpan

### 2. File Storage Service (`backend/app/services/file_storage.py`)

Service untuk menyimpan attendance photos dengan watermark.

**Updated:**
- `save_attendance_photo()`: Sekarang menerima parameter untuk watermark (location, site_name, user_name, dll)

### 3. Evidence Storage Service (`backend/app/services/evidence_storage.py`)

Service untuk menyimpan evidence files (foto laporan) dengan watermark.

**Functions:**
- `save_evidence_file()`: Menyimpan single evidence file dengan watermark
- `save_multiple_evidence_files()`: Menyimpan multiple files dengan watermark

## Fungsi yang Sudah Diupdate

### Attendance Photos
1. ✅ `backend/app/api/attendance_routes.py`
   - `/attendance/checkin` - Check-in photo
   - `/attendance/checkout` - Check-out photo
   - `/attendance/clock-in` - Clock-in evidence
   - `/attendance/scan-qr` - QR scan photo

2. ✅ `backend/app/divisions/security/routes.py`
   - `/security/attendance/check-in` - Security check-in
   - `/security/attendance/check-out` - Security check-out

### Evidence Files (Reports)
3. ✅ `backend/app/divisions/security/routes.py`
   - `/security/reports` - Security report evidence files

4. ✅ `backend/app/divisions/cleaning/routes.py`
   - `/cleaning/reports` - Cleaning report evidence files

5. ✅ `backend/app/divisions/parking/routes.py`
   - `/parking/reports` - Parking report evidence files

6. ✅ `backend/app/models/security_report.py`
   - `save_uploaded_file()` - Generic evidence file saver

### Patrol Photos
7. ✅ `backend/app/divisions/security/routes.py`
   - `/security/patrols` - Patrol main photo

### Visitor Photos
8. ✅ `backend/app/api/visitor_routes.py`
   - `/visitors` - Visitor photo dan ID card photo

## Konfigurasi

### Environment Variables

```bash
# Path ke logo perusahaan
export COMPANY_LOGO_PATH="backend/assets/logo.png"

# Nama perusahaan
export COMPANY_NAME="Verolux Management System"

# Opacity watermark (0.0 - 1.0)
export WATERMARK_OPACITY="0.7"
```

### Setup Logo

1. **Tambahkan logo** ke `backend/assets/logo.png`
   - Format: PNG dengan transparansi (RGBA)
   - Ukuran: 200x200px atau lebih besar
   - Background: Transparan

2. **Atau set path custom:**
   ```bash
   export COMPANY_LOGO_PATH="/path/to/your/logo.png"
   ```

## Format Watermark

### Logo
- **Posisi**: Tengah foto
- **Ukuran**: 20% dari lebar foto (maintain aspect ratio)
- **Opacity**: Dapat dikonfigurasi (default: 0.7)

### Text Watermark (Pojok Kanan Bawah)
- **Informasi yang ditampilkan:**
  - © Nama Perusahaan
  - Site: [Nama Site]
  - Lokasi: [GPS atau Alamat]
  - User: [Nama User]
  - Waktu: [YYYY-MM-DD HH:MM:SS]
  - Info tambahan (Role, Report Type, dll)

- **Styling:**
  - Background hitam semi-transparan untuk readability
  - Text putih
  - Font size: 1.5% dari lebar foto (min 12px)

## Error Handling

- Jika watermark gagal, foto asli tetap disimpan
- Error di-log untuk debugging
- Fallback ke placeholder logo jika logo tidak ditemukan

## Testing

Untuk test watermark:
1. Upload foto melalui attendance check-in
2. Upload foto melalui report creation
3. Cek file yang disimpan di `uploads/` directory
4. Verifikasi watermark muncul di foto

## Catatan Penting

- **Performance**: Watermark processing menambah sedikit waktu processing, tapi tidak signifikan
- **Storage**: File yang disimpan sudah dengan watermark (tidak ada file original terpisah)
- **Format**: Mendukung JPEG dan PNG
- **Quality**: JPEG quality diset ke 95 untuk menjaga kualitas
