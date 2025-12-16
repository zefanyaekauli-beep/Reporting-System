# Panduan Setup ngrok untuk Verolux Management System

## Apa itu ngrok?

ngrok adalah tool yang membuat tunnel (terowongan) dari internet ke localhost Anda. Dengan ngrok, Anda bisa mengakses aplikasi yang berjalan di komputer lokal dari mana saja, bahkan dari internet publik.

**Keuntungan menggunakan ngrok:**
- ✅ Akses aplikasi dari mana saja (tidak perlu satu jaringan WiFi)
- ✅ Bagikan aplikasi dengan orang lain untuk testing
- ✅ Testing dari perangkat mobile tanpa harus di jaringan yang sama
- ✅ Mudah digunakan, tidak perlu konfigurasi router/firewall

## Langkah Setup ngrok

### 1. Download dan Install ngrok

**Untuk Windows:**

1. Kunjungi: https://ngrok.com/download
2. Download file `ngrok.exe` untuk Windows
3. Extract `ngrok.exe` ke salah satu lokasi berikut:
   - **Opsi A (Recommended):** Letakkan di folder project root
     ```
     C:\Users\DELL GAMING\Downloads\kerja\Reporting-System\ngrok.exe
     ```
   - **Opsi B:** Tambahkan ke Windows PATH agar bisa dipanggil dari mana saja

### 2. Setup Autentikasi (Penting!)

ngrok memerlukan autentikasi untuk menghindari batasan waktu dan mendapatkan fitur lebih:

1. **Daftar akun gratis:**
   - Kunjungi: https://dashboard.ngrok.com/signup
   - Buat akun (bisa pakai email atau Google/GitHub)

2. **Dapatkan Authtoken:**
   - Setelah login, buka: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy authtoken Anda (contoh: `2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`)

3. **Konfigurasi ngrok:**
   ```bash
   # Jika ngrok.exe di project root:
   ngrok.exe config add-authtoken YOUR_TOKEN
   
   # Atau jika ngrok sudah di PATH:
   ngrok config add-authtoken YOUR_TOKEN
   ```

   Ganti `YOUR_TOKEN` dengan authtoken yang Anda dapatkan.

### 3. Verifikasi Setup

Jalankan script setup otomatis:

```bash
scripts\setup_ngrok.bat
```

Script ini akan:
- ✅ Mengecek apakah ngrok sudah terinstall
- ✅ Mengecek apakah ngrok sudah terautentikasi
- ✅ Membantu setup autentikasi jika belum

## Cara Menggunakan ngrok

### Metode 1: Otomatis dengan start.bat (Recommended)

Jalankan sistem dengan flag `--ngrok`:

```bash
start.bat --ngrok
```

atau

```bash
start.bat -n
```

Script akan:
1. Start backend dan frontend seperti biasa
2. Otomatis start ngrok tunnel
3. Menampilkan public URL yang bisa digunakan

### Metode 2: Manual

1. **Start sistem terlebih dahulu:**
   ```bash
   start.bat
   ```

2. **Di terminal terpisah, start ngrok:**
   ```bash
   ngrok http 5173
   ```
   
   Atau jika ngrok.exe di project root:
   ```bash
   ngrok.exe http 5173
   ```

3. **Dapatkan public URL:**
   - Buka browser: http://localhost:4040
   - Atau lihat di terminal ngrok
   - Copy URL yang muncul (contoh: `https://abc123.ngrok-free.app`)

## Mengakses Aplikasi via ngrok

Setelah ngrok berjalan, Anda akan mendapatkan URL seperti:
```
https://abc123.ngrok-free.app
```

**Cara akses:**
1. Buka URL tersebut di browser atau mobile device
2. Login dengan:
   - Username: `supervisor`
   - Password: (kosong)

**Catatan:**
- URL ngrok akan berbeda setiap kali restart (kecuali pakai plan berbayar)
- URL gratis kadang ada warning page dari ngrok (klik "Visit Site" untuk lanjut)
- Session timeout setelah beberapa jam (untuk akun gratis)

## Troubleshooting

### ngrok tidak terdeteksi

**Masalah:** Script mengatakan ngrok tidak terinstall

**Solusi:**
1. Pastikan `ngrok.exe` ada di project root, atau
2. Tambahkan ngrok ke Windows PATH:
   - Cari "Environment Variables" di Windows
   - Edit "Path" variable
   - Tambahkan folder tempat ngrok.exe berada

### ngrok error: "authtoken required"

**Masalah:** ngrok meminta authtoken

**Solusi:**
```bash
ngrok config add-authtoken YOUR_TOKEN
```

Dapatkan token dari: https://dashboard.ngrok.com/get-started/your-authtoken

### ngrok tunnel tidak bisa diakses

**Masalah:** URL ngrok tidak bisa dibuka

**Solusi:**
1. Pastikan backend dan frontend sudah running
2. Cek ngrok web interface: http://localhost:4040
3. Pastikan tidak ada firewall yang memblokir
4. Coba restart ngrok

### Port 4040 sudah digunakan

**Masalah:** ngrok web interface tidak bisa diakses

**Solusi:**
```bash
# Kill process yang menggunakan port 4040
netstat -ano | findstr :4040
taskkill /PID <PID_NUMBER> /F
```

## Tips

1. **Gunakan ngrok untuk testing mobile:**
   - Share URL ngrok ke perangkat mobile
   - Test aplikasi dari mana saja

2. **Untuk development:**
   - Gunakan ngrok hanya saat perlu testing dari luar
   - Untuk development lokal, gunakan IP lokal saja (lebih cepat)

3. **ngrok Web Interface:**
   - Akses: http://localhost:4040
   - Bisa lihat request/response
   - Berguna untuk debugging

4. **Stop ngrok:**
   - Tutup terminal ngrok, atau
   - Jalankan: `stop.bat` (akan stop semua termasuk ngrok)

## Perbandingan: Local IP vs ngrok

| Fitur | Local IP | ngrok |
|-------|----------|-------|
| Akses dari jaringan sama | ✅ | ✅ |
| Akses dari internet | ❌ | ✅ |
| Setup | Mudah | Perlu install |
| Kecepatan | Cepat | Sedikit lebih lambat |
| Biaya | Gratis | Gratis (dengan limit) |
| URL tetap | ✅ | ❌ (gratis) / ✅ (berbayar) |

## Referensi

- ngrok Documentation: https://ngrok.com/docs
- ngrok Dashboard: https://dashboard.ngrok.com
- ngrok Download: https://ngrok.com/download

