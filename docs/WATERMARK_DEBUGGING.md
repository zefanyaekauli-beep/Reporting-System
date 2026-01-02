# Watermark Debugging Guide

## Masalah: Watermark Tidak Muncul di Foto

Jika watermark tidak muncul di foto yang disimpan, ikuti langkah-langkah debugging berikut:

## 1. Verifikasi Logging

### Cek Log File
```bash
# Windows
type backend\logs\app.log | findstr /i "watermark"

# Linux/Mac
tail -f backend/logs/app.log | grep -i watermark
```

### Cek Console Output
Saat upload foto, pastikan melihat console output backend. Harus ada log seperti:
```
============================================================
APPLYING WATERMARK TO PHOTO
============================================================
File: checkin_20240101_120000_abc123.jpg
Content size: 123456 bytes
...
```

## 2. Verifikasi Watermark Service

### Test Import
```python
from app.services.watermark_service import watermark_service
print(f"Logo path: {watermark_service.logo_path}")
print(f"Company: {watermark_service.company_name}")
```

### Test Watermark Function
```python
from app.services.watermark_service import watermark_service
from PIL import Image
from io import BytesIO
from datetime import datetime, timezone

# Create test image
img = Image.new("RGB", (800, 600), color=(200, 200, 200))
buf = BytesIO()
img.save(buf, format="JPEG")
img_bytes = buf.getvalue()

# Apply watermark
watermarked = watermark_service.add_watermark(
    img_bytes,
    location="GPS: -6.2, 106.8",
    timestamp=datetime.now(timezone.utc),
    user_name="Test User",
    site_name="Test Site"
)

# Save result
with open("test_output.jpg", "wb") as f:
    f.write(watermarked)
```

## 3. Verifikasi File Reading

Pastikan file benar-benar dibaca:
- Cek log: `✓ File content read successfully: X bytes`
- Jika 0 bytes, ada masalah dengan file reading

## 4. Verifikasi Watermark Dipanggil

Cek apakah `watermark_service.add_watermark()` benar-benar dipanggil:
- Cek log: `Calling watermark_service.add_watermark()...`
- Cek log: `watermark_service.add_watermark() returned successfully`

## 5. Verifikasi File Disimpan

Cek apakah file benar-benar disimpan dengan watermark:
- Cek log: `✓ Photo saved successfully to: ...`
- Cek log: `Verified file exists: X bytes on disk`
- Buka file dan periksa apakah ada watermark

## 6. Common Issues

### Issue 1: Logging Level Terlalu Tinggi
**Solusi:** Pastikan logging level di-set ke DEBUG untuk watermark service:
```python
logging.getLogger("app.services.watermark_service").setLevel(logging.DEBUG)
logging.getLogger("app.services.file_storage").setLevel(logging.DEBUG)
```

### Issue 2: File Tidak Dibaca dengan Benar
**Gejala:** File size 0 bytes
**Solusi:** Pastikan menggunakan `await file.read()` untuk async UploadFile

### Issue 3: Watermark Service Tidak Diimport
**Gejala:** `watermark_service is None`
**Solusi:** Pastikan import statement benar:
```python
from app.services.watermark_service import watermark_service
```

### Issue 4: Exception Di-swallow
**Gejala:** Tidak ada error tapi watermark tidak muncul
**Solusi:** Cek exception handler - pastikan error di-log dengan `exc_info=True`

### Issue 5: File Disimpan Sebelum Watermark
**Gejala:** File ada tapi tidak ada watermark
**Solusi:** Pastikan watermark diterapkan SEBELUM file disimpan:
```python
watermarked_content = watermark_service.add_watermark(...)
# Baru kemudian save
with open(path, "wb") as f:
    f.write(watermarked_content)
```

## 7. Testing Checklist

- [ ] Logging level sudah di-set ke DEBUG
- [ ] File berhasil dibaca (size > 0)
- [ ] Watermark service berhasil diimport
- [ ] `add_watermark()` dipanggil
- [ ] `add_watermark()` tidak raise exception
- [ ] File disimpan setelah watermark
- [ ] File yang disimpan memiliki watermark (cek manual)

## 8. Manual Verification

Setelah upload foto:
1. Buka file di `uploads/attendance_photos/`
2. Periksa apakah ada:
   - Logo di tengah (jika logo ada)
   - Text watermark di pojok kanan bawah
   - Info: waktu, lokasi, user, site

## 9. Enable Verbose Logging

Tambahkan di `backend/app/main.py` atau `backend/app/core/logger.py`:
```python
import logging
logging.getLogger("app.services.watermark_service").setLevel(logging.DEBUG)
logging.getLogger("app.services.file_storage").setLevel(logging.DEBUG)
```

## 10. Contact Points

Jika masih tidak berfungsi setelah semua langkah di atas:
1. Cek log file: `backend/logs/app.log`
2. Cek console output saat upload
3. Cek apakah ada exception yang di-swallow
4. Verifikasi file yang disimpan benar-benar memiliki watermark
