# Verifikasi Sistem Watermark

## Status Implementasi

✅ **SEMUA FOTO SUDAH MENGGUNAKAN WATERMARK SEBELUM DISIMPAN**

### Fungsi yang Sudah Diupdate

1. ✅ **Attendance Photos** (`backend/app/services/file_storage.py`)
   - `save_attendance_photo()` - Async function dengan watermark
   - Digunakan di:
     - `/api/attendance/checkin`
     - `/api/attendance/checkout`
     - `/api/attendance/clock-in`
     - `/api/attendance/scan-qr`
     - `/security/attendance/check-in`
     - `/security/attendance/check-out`

2. ✅ **Evidence Files** (`backend/app/services/evidence_storage.py`)
   - `save_evidence_file()` - Async function dengan watermark
   - `save_multiple_evidence_files()` - Async function dengan watermark
   - Digunakan di:
     - `/security/reports` (evidence files)
     - `/cleaning/reports` (evidence files)
     - `/parking/reports` (evidence files)
     - `/security/patrols` (main photo)
     - `/visitors` (photo & ID card)
     - Security report model (`save_uploaded_file()`)

3. ✅ **Document Uploads** (`backend/app/api/document_routes.py`)
   - Watermark diterapkan jika file adalah gambar (image/*)

## Cara Verifikasi

### 1. Test dengan Script

```bash
cd backend
python scripts/test_watermark.py
```

Script ini akan:
- Membuat test image
- Menerapkan watermark
- Menyimpan hasil ke `test_watermark_output.jpg`
- Verifikasi bahwa watermark berhasil diterapkan

### 2. Test dengan Upload Foto

1. **Attendance Check-in:**
   - Login sebagai security/cleaning user
   - Check-in dengan foto
   - Cek file di `uploads/attendance_photos/`
   - Foto harus memiliki:
     - Logo di tengah
     - Text watermark di pojok kanan bawah

2. **Report dengan Evidence:**
   - Buat report dengan foto evidence
   - Cek file di `uploads/evidence/` atau `media/security_reports/`
   - Foto harus memiliki watermark

### 3. Cek Logs

Backend logs akan menampilkan:
```
INFO - Saving attendance photo: checkin_20251217_123456_abc123.jpg, size: 123456 bytes
INFO - Watermark info - location: GPS: -6.200000, 106.816666, site: Site A, user: john_doe
INFO - Applying watermark to photo...
INFO - Starting watermark process - Image size: 123456 bytes
INFO - Image opened - Size: (800, 600), Mode: RGB
INFO - Logo loaded - Size: (200, 200), Mode: RGBA
INFO - Logo resized to: 160x160
INFO - Watermark composited onto image
INFO - Watermark completed - Original: 123456 bytes, Watermarked: 125678 bytes
INFO - Watermark applied successfully. Original size: 123456, Watermarked size: 125678
INFO - Photo saved to: uploads/attendance_photos/checkin_20251217_123456_abc123.jpg
```

### 4. Verifikasi File

Buka file foto yang disimpan dan pastikan:
- ✅ Logo perusahaan terlihat di tengah foto
- ✅ Text watermark terlihat di pojok kanan bawah dengan:
  - © Nama Perusahaan
  - Site: [Nama Site]
  - Lokasi: [GPS atau Alamat]
  - User: [Nama User]
  - Waktu: [YYYY-MM-DD HH:MM:SS]
  - Info tambahan (Role, Report Type, dll)

## Troubleshooting

### Watermark Tidak Muncul

1. **Cek Logo:**
   - Pastikan logo ada di `backend/assets/logo.png`
   - Atau set `COMPANY_LOGO_PATH` environment variable

2. **Cek Logs:**
   - Lihat backend logs untuk error messages
   - Jika watermark gagal, foto asli tetap disimpan (tidak ada error)

3. **Cek File Size:**
   - File dengan watermark biasanya sedikit lebih besar
   - Jika size sama, kemungkinan watermark gagal

### Error di Logs

Jika ada error:
- `Logo not found` - Tambahkan logo atau set environment variable
- `PIL/Pillow error` - Pastikan Pillow terinstall: `pip install Pillow`
- `Permission denied` - Cek permission folder uploads

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

1. Tambahkan logo ke `backend/assets/logo.png`
   - Format: PNG dengan transparansi (RGBA)
   - Ukuran: 200x200px atau lebih besar
   - Background: Transparan

2. Atau set custom path via environment variable

## Catatan Penting

- **Watermark diterapkan SEBELUM file disimpan** - File di folder uploads sudah dengan watermark
- **Tidak ada file original** - Hanya file dengan watermark yang disimpan
- **Error handling** - Jika watermark gagal, foto asli tetap disimpan (dengan log error)
- **Performance** - Watermark processing menambah sedikit waktu, tapi tidak signifikan
- **Format support** - JPEG dan PNG

## Testing Checklist

- [ ] Test attendance check-in dengan foto
- [ ] Test attendance check-out dengan foto
- [ ] Test report dengan evidence files
- [ ] Test visitor photo upload
- [ ] Test patrol photo upload
- [ ] Verifikasi logo muncul di tengah foto
- [ ] Verifikasi text watermark muncul di pojok kanan bawah
- [ ] Cek logs untuk memastikan tidak ada error
- [ ] Verifikasi file size sedikit lebih besar setelah watermark
