# Quick Start: Setup ngrok untuk Arch Linux

## 🚀 Cara Cepat (3 Langkah)

### Langkah 1: Download ngrok Linux Binary

```bash
cd /mnt/c/Users/DELL\ GAMING/Downloads/kerja/Reporting-System
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
chmod +x ngrok
rm ngrok-v3-stable-linux-amd64.tgz
```

### Langkah 2: Setup Authtoken

```bash
./ngrok config add-authtoken YOUR_TOKEN
```

**Dapatkan authtoken dari:**
- https://dashboard.ngrok.com/get-started/your-authtoken
- Atau daftar dulu di: https://dashboard.ngrok.com/signup

### Langkah 3: Test

```bash
./ngrok version
```

Jika berhasil, akan menampilkan versi ngrok.

## 🎯 Menggunakan ngrok dengan Sistem

### Opsi A: Otomatis dengan start.sh

```bash
./start.sh --ngrok
```

Script akan otomatis:
- ✅ Deteksi ngrok di project root
- ✅ Start tunnel untuk frontend
- ✅ Tampilkan URL publik

### Opsi B: Manual (di terminal terpisah)

```bash
# Setelah sistem running dengan ./start.sh
./ngrok http 5173
```

Buka http://localhost:4040 untuk melihat web interface dan URL publik.

## 🔧 Alternatif: Install via AUR

Jika ingin install ke system (bukan di project root):

```bash
# Install yay (jika belum ada)
cd /tmp
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si

# Install ngrok
yay -S ngrok-bin

# Setup authtoken
ngrok config add-authtoken YOUR_TOKEN

# Gunakan (tanpa ./)
ngrok http 5173
```

## ❌ Troubleshooting

### Error: "cannot execute binary file"
- **Penyebab:** File ngrok adalah Windows binary
- **Solusi:** Download Linux binary (lihat Langkah 1 di atas)

### Error: "command not found"
- **Penyebab:** ngrok tidak di PATH atau tidak di project root
- **Solusi:** Pastikan file `ngrok` ada di project root dan executable (`chmod +x ngrok`)

### Error: "authtoken required"
- **Penyebab:** Belum setup authtoken
- **Solusi:** Jalankan `./ngrok config add-authtoken YOUR_TOKEN`

## 📝 Catatan

- File `ngrok` Windows binary akan diganti dengan Linux binary setelah download
- Authtoken hanya perlu di-setup sekali
- URL ngrok akan berbeda setiap kali start (kecuali pakai plan berbayar)

