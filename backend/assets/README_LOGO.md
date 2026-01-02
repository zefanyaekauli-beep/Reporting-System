# Logo Perusahaan

## Instruksi Setup Logo

1. **Tambahkan logo perusahaan** ke folder `backend/assets/logo.png`
   - Format: PNG dengan transparansi (RGBA)
   - Ukuran disarankan: 200x200px atau lebih besar (akan di-resize otomatis)
   - Background transparan untuk hasil terbaik

2. **Atau set environment variable:**
   ```bash
   export COMPANY_LOGO_PATH="path/to/your/logo.png"
   ```

3. **Konfigurasi tambahan (opsional):**
   ```bash
   export COMPANY_NAME="Nama Perusahaan Anda"
   export WATERMARK_OPACITY="0.7"  # 0.0 - 1.0 (default: 0.7)
   ```

## Catatan

- Jika logo tidak ditemukan, sistem akan membuat placeholder logo dengan teks "VMS"
- Logo akan otomatis di-resize dan ditempatkan di tengah foto (seperti Shutterstock)
- Opacity dapat disesuaikan untuk tidak terlalu mengganggu foto asli
