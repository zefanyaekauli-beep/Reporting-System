# Quick Start ngrok - Bahasa Indonesia

## Setup Cepat (5 Menit)

### Langkah 1: Download ngrok
1. Buka: https://ngrok.com/download
2. Download `ngrok.exe` untuk Windows
3. Simpan di folder project: `C:\Users\DELL GAMING\Downloads\kerja\Reporting-System\ngrok.exe`

### Langkah 2: Daftar & Dapatkan Token
1. Daftar gratis: https://dashboard.ngrok.com/signup
2. Ambil token: https://dashboard.ngrok.com/get-started/your-authtoken
3. Copy token Anda

### Langkah 3: Setup Token
Buka Command Prompt atau PowerShell di folder project, lalu jalankan:
```bash
ngrok.exe config add-authtoken PASTE_TOKEN_DISINI
```

Ganti `PASTE_TOKEN_DISINI` dengan token yang Anda copy.

### Langkah 4: Selesai!
Sekarang Anda bisa jalankan:
```bash
start.bat --ngrok
```

URL publik akan muncul otomatis!

## Cara Pakai

### Otomatis (Paling Mudah)
```bash
start.bat --ngrok
```

### Manual
1. Start sistem: `start.bat`
2. Buka terminal baru
3. Jalankan: `ngrok.exe http 5173`
4. Buka: http://localhost:4040 untuk lihat URL

## Akses dari Mana Saja

Setelah ngrok jalan, Anda dapat:
- ✅ Share URL ke teman untuk testing
- ✅ Akses dari mobile tanpa WiFi yang sama
- ✅ Testing dari internet publik

URL akan terlihat seperti: `https://abc123.ngrok-free.app`

## Troubleshooting Cepat

**Error: ngrok tidak ditemukan**
→ Pastikan `ngrok.exe` ada di folder project

**Error: authtoken required**
→ Jalankan: `ngrok.exe config add-authtoken YOUR_TOKEN`

**URL tidak bisa dibuka**
→ Pastikan `start.bat` sudah jalan (backend & frontend running)

## Bantuan Lebih Lanjut

Lihat panduan lengkap: `docs/NGROK_SETUP_GUIDE.md`

