# Panduan Akses Mobile - Verolux Management System

## 📱 Cara Mengakses dari Mobile Device

### Opsi 1: Development Server (Paling Mudah)

#### Langkah 1: Jalankan Backend
```bash
cd backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Langkah 2: Jalankan Frontend
```bash
cd frontend/web
npm run dev
```

Frontend akan berjalan di: `http://localhost:5173`

#### Langkah 3: Cari IP Address Komputer Anda

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Atau
ipconfig getifaddr en0
```

**Windows:**
```bash
ipconfig
# Cari "IPv4 Address" (bukan 127.0.0.1)
```

**Contoh IP:** `192.168.1.100` atau `10.0.0.5`

#### Langkah 4: Akses dari Mobile Device

1. **Pastikan mobile device dan komputer di network WiFi yang sama**

2. **Buka browser di mobile** (Chrome, Safari, dll)

3. **Akses frontend:**
   ```
   http://YOUR_IP:5173
   ```
   Contoh: `http://192.168.1.100:5173`

4. **Backend API harus bisa diakses:**
   ```
   http://YOUR_IP:8000
   ```
   Contoh: `http://192.168.1.100:8000`

#### Langkah 5: Update API Base URL (Jika Perlu)

Jika mobile tidak bisa connect ke backend, update `frontend/web/src/api/client.ts`:

```typescript
const api = axios.create({
  baseURL: "http://YOUR_IP:8000/api", // Ganti dengan IP komputer Anda
});
```

Atau buat file `.env` di `frontend/web/`:
```env
VITE_API_BASE_URL=http://YOUR_IP:8000/api
```

---

### Opsi 2: Browser Dev Tools (Tanpa Device Fisik)

#### Chrome DevTools
1. Buka aplikasi di browser desktop
2. Tekan `F12` atau `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Klik icon **Toggle device toolbar** (Ctrl+Shift+M)
4. Pilih device preset:
   - iPhone 12/13/14 Pro
   - Samsung Galaxy S20
   - Atau custom size: 375x812 (iPhone standard)

#### Firefox Responsive Design Mode
1. Tekan `F12`
2. Klik icon **Responsive Design Mode** (Ctrl+Shift+M)
3. Pilih device atau set custom size

#### Safari (Mac Only)
1. Enable Developer menu: Preferences → Advanced → "Show Develop menu"
2. Develop → Enter Responsive Design Mode

---

### Opsi 3: Production Build (Untuk Testing Serius)

#### Build untuk Production
```bash
cd frontend/web
npm run build
```

#### Serve dengan Local Server
```bash
# Install serve globally (sekali saja)
npm install -g serve

# Serve build folder
serve -s dist -l 3000
```

Akses dari mobile: `http://YOUR_IP:3000`

---

### Troubleshooting

#### ❌ Mobile tidak bisa akses frontend
- ✅ Pastikan firewall tidak block port 5173
- ✅ Pastikan mobile dan komputer di WiFi yang sama
- ✅ Coba akses IP address di browser desktop dulu untuk test

#### ❌ API calls gagal dari mobile
- ✅ Update `VITE_API_BASE_URL` di `.env` dengan IP komputer
- ✅ Pastikan backend berjalan dengan `--host 0.0.0.0`
- ✅ Check CORS settings di backend (sudah allow semua origins)

#### ❌ CORS Error
Backend sudah dikonfigurasi untuk allow semua origins. Jika masih error, check:
```python
# backend/app/core/config.py
CORS_ORIGINS: List[str] = ["*"]  # Should allow all
```

---

### Quick Test Checklist

- [ ] Backend running di `http://localhost:8000`
- [ ] Frontend running di `http://localhost:5173`
- [ ] Dapatkan IP address komputer
- [ ] Mobile device di WiFi yang sama
- [ ] Akses `http://YOUR_IP:5173` dari mobile browser
- [ ] Test login dengan username: `security`, password: (kosong)
- [ ] Test semua fitur Security

---

### Tips untuk Development

1. **Gunakan QR Code Generator:**
   - Buka `http://YOUR_IP:5173` di browser desktop
   - Generate QR code (banyak tools online)
   - Scan dengan mobile untuk quick access

2. **Bookmark di Mobile:**
   - Setelah berhasil akses, bookmark URL
   - Tambahkan ke home screen (Add to Home Screen)

3. **Hot Reload:**
   - Perubahan code akan auto-reload di mobile juga
   - Refresh manual jika perlu

---

**Selamat Testing! 🚀**


