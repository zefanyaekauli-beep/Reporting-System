# Fix: Link Tidak Bisa Dibuka di HP

## 🔍 Masalah

Link `https://172.22.227.17:5173` tidak bisa dibuka di mobile browser karena:
- ❌ Self-signed certificate ditolak oleh mobile browser
- ❌ Mobile browser tidak bisa accept certificate warning dengan mudah
- ❌ Beberapa mobile browser memblokir self-signed certificate secara default

## 🎯 Solusi Terbaik: Gunakan ngrok (Sudah Running!)

**ngrok sudah running dan memberikan URL HTTPS yang valid!**

### Cara Cepat Dapatkan URL ngrok:

```bash
# Jalankan script ini
chmod +x scripts/get_ngrok_url.sh
./scripts/get_ngrok_url.sh
```

Atau manual:
```bash
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1
```

### URL ngrok Anda (dari log sebelumnya):
```
https://crummier-purposely-harriette.ngrok-free.dev
```

### Buka di HP:
1. Buka browser di HP (Chrome, Safari, dll)
2. Ketik URL ngrok di atas
3. ✅ **Akan langsung bisa!** (HTTPS valid, tidak ada certificate warning)

### Keuntungan ngrok:
- ✅ HTTPS valid (tidak ada certificate warning)
- ✅ Bisa diakses dari mana saja (tidak perlu satu WiFi)
- ✅ Tidak perlu setup certificate
- ✅ Langsung bekerja

---

## 🔧 Solusi Alternatif: Fix HTTPS untuk IP Address

Jika ingin tetap pakai IP address langsung:

### 1. Update Certificate untuk Include IP Address

```bash
# Dapatkan IP address
IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1)
echo "IP Address: $IP"

# Generate certificate baru dengan IP address
cd frontend/web/certs
openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout key.pem \
    -out cert.pem \
    -days 365 \
    -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Verolux/CN=$IP" \
    -addext "subjectAltName=IP:$IP,DNS:localhost,DNS:127.0.0.1"
```

### 2. Restart Frontend

```bash
./stop.sh
./start.sh
```

### 3. Akses dari HP

- Buka: `https://172.22.227.17:5173`
- Browser akan menampilkan warning "Not Secure"
- Klik "Advanced" → "Proceed to 172.22.227.17 (unsafe)"
- ✅ Akan bisa diakses

---

## 🚀 Solusi Paling Mudah: Gunakan HTTP (Tanpa HTTPS)

Jika HTTPS bermasalah, gunakan HTTP untuk development:

### 1. Hapus Certificate (Sementara)

```bash
# Backup certificate
mv frontend/web/certs frontend/web/certs.backup

# Restart frontend (akan pakai HTTP)
./stop.sh
./start.sh
```

### 2. Akses dari HP

- Buka: `http://172.22.227.17:5173` (tanpa 's')
- ✅ Akan langsung bisa

**Catatan:** HTTP tidak akan bisa akses kamera di mobile (browser security). Gunakan ngrok untuk kamera.

---

## 📋 Checklist Troubleshooting

- [ ] HP dan komputer di WiFi yang sama?
- [ ] Firewall tidak block port 5173?
- [ ] IP address benar? (cek dengan `ip addr show`)
- [ ] Frontend running? (cek dengan `curl http://localhost:5173`)
- [ ] Certificate include IP address?

---

## ✅ Rekomendasi

**Gunakan ngrok** - sudah running dan memberikan URL HTTPS yang valid:
```
https://crummier-purposely-harriette.ngrok-free.dev
```

Ini adalah solusi terbaik karena:
1. ✅ HTTPS valid (tidak ada warning)
2. ✅ Bisa diakses dari mana saja
3. ✅ Tidak perlu setup certificate
4. ✅ Langsung bekerja

