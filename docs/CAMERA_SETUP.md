# Setup Kamera untuk Mobile - Verolux Management System

## ⚠️ Masalah: Kamera Tidak Bisa Dibuka di Mobile

Kebanyakan browser mobile **memerlukan HTTPS** untuk akses kamera karena alasan keamanan.

## 🔧 Solusi untuk Development

### Opsi 1: Gunakan Browser yang Lebih Permisif (Paling Mudah)

**Chrome Android** biasanya lebih permisif untuk development:
- Buka `chrome://flags`
- Cari "Insecure origins treated as secure"
- Tambahkan IP address Anda (misal: `http://192.168.0.160:5173`)
- Restart browser

**Catatan:** Ini hanya untuk development, tidak untuk production!

---

### Opsi 2: Setup HTTPS dengan mkcert (Recommended)

#### Install mkcert
```bash
# Mac
brew install mkcert

# Linux
# Download dari: https://github.com/FiloSottile/mkcert/releases

# Windows
# Download dari: https://github.com/FiloSottile/mkcert/releases
```

#### Setup Local CA
```bash
mkcert -install
```

#### Generate Certificate untuk IP Address
```bash
# Ganti dengan IP address Anda
mkcert 192.168.0.160 localhost 127.0.0.1
```

Ini akan membuat 2 file:
- `192.168.0.160+2.pem` (certificate)
- `192.168.0.160+2-key.pem` (private key)

#### Update Vite Config untuk HTTPS

Buat file `frontend/web/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../192.168.0.160+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../192.168.0.160+2.pem')),
    },
  },
})
```

**Catatan:** Ganti path certificate sesuai lokasi file Anda.

#### Restart Frontend
```bash
cd frontend/web
npm run dev
```

Sekarang akses: `https://192.168.0.160:5173` (dengan HTTPS!)

---

### Opsi 3: Gunakan ngrok (Quick Test)

#### Install ngrok
```bash
# Download dari: https://ngrok.com/download
# Atau
brew install ngrok  # Mac
```

#### Start ngrok Tunnel
```bash
# Setelah frontend running di port 5173
ngrok http 5173
```

Ngrok akan memberikan URL HTTPS seperti: `https://abc123.ngrok.io`

#### Akses dari Mobile
Buka URL ngrok di mobile browser. Kamera akan bekerja karena sudah HTTPS!

**Catatan:** URL ngrok berubah setiap restart (kecuali pakai plan berbayar).

---

### Opsi 4: Test di Localhost (Jika Memungkinkan)

Jika mobile dan komputer adalah device yang sama (misal: emulator), gunakan:
```
http://localhost:5173
```

Atau jika mobile bisa akses komputer via USB debugging:
- Android: Chrome DevTools remote debugging
- iOS: Safari Web Inspector

---

## 🧪 Testing Checklist

- [ ] Kamera bisa dibuka
- [ ] QR code bisa di-scan
- [ ] GPS location bisa diambil
- [ ] Foto bisa diambil
- [ ] Data terkirim ke backend

---

## 📱 Browser Compatibility

| Browser | HTTP (IP) | HTTPS | Localhost |
|---------|----------|-------|-----------|
| Chrome Android | ❌ | ✅ | ✅ |
| Safari iOS | ❌ | ✅ | ✅ |
| Firefox Mobile | ❌ | ✅ | ✅ |
| Edge Mobile | ❌ | ✅ | ✅ |

**Kesimpulan:** Gunakan HTTPS untuk production, atau setup HTTPS untuk development.

---

## 🚀 Quick Start (Recommended)

1. Install mkcert: `brew install mkcert`
2. Setup CA: `mkcert -install`
3. Generate cert: `mkcert 192.168.0.160 localhost`
4. Update vite.config.ts (lihat Opsi 2)
5. Restart frontend
6. Akses `https://192.168.0.160:5173` dari mobile

**Selamat! Kamera sekarang akan bekerja! 📷**

