# Setup untuk Arch Linux

Panduan lengkap untuk setup Verolux Management System di Arch Linux.

## 📦 Prerequisites

### 1. Install Dependencies

Jalankan script setup otomatis:

```bash
chmod +x scripts/setup_arch_linux.sh
./scripts/setup_arch_linux.sh
```

Atau install manual:

```bash
# Python 3
sudo pacman -S python

# Node.js dan npm
sudo pacman -S nodejs npm

# lsof (untuk port checking)
sudo pacman -S lsof

# iproute2 (untuk ip command - biasanya sudah terinstall)
sudo pacman -S iproute2

# curl (untuk testing - biasanya sudah terinstall)
sudo pacman -S curl
```

## 🐍 Setup Backend

```bash
cd backend

# Buat virtual environment
python3 -m venv venv

# Aktifkan virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 🎨 Setup Frontend

```bash
cd frontend/web

# Install dependencies
npm install
```

## 🚀 Menjalankan Sistem

### Cara 1: Menggunakan Script (Recommended)

```bash
# Start normal
./start.sh

# Start dengan ngrok
./start.sh --ngrok
```

### Cara 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend/web
npm run dev
```

## 🌐 Setup ngrok (Optional)

### Install ngrok

**Opsi 1: Dari AUR (Recommended)**
```bash
# Jika menggunakan yay
yay -S ngrok-bin

# Jika menggunakan paru
paru -S ngrok-bin
```

**Opsi 2: Download Manual (Recommended untuk WSL)**
```bash
# Download dan extract ke project root (mengganti Windows binary)
cd /mnt/c/Users/DELL\ GAMING/Downloads/kerja/Reporting-System
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
chmod +x ngrok
rm ngrok-v3-stable-linux-amd64.tgz

# Atau gunakan script otomatis:
chmod +x scripts/download_ngrok_linux.sh
./scripts/download_ngrok_linux.sh
```

**Opsi 2b: Install ke System PATH**
```bash
# Download dan install ke /usr/local/bin
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
rm ngrok-v3-stable-linux-amd64.tgz
```

### Setup Autentikasi

1. Daftar di: https://dashboard.ngrok.com/signup
2. Ambil authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Konfigurasi:
```bash
ngrok config add-authtoken YOUR_TOKEN
```

### Menggunakan ngrok

```bash
# Otomatis dengan start.sh
./start.sh --ngrok

# Atau manual
ngrok http 5173
```

## 🔧 Troubleshooting

### IP Address Tidak Terdeteksi

Script `start.sh` menggunakan `ip` command yang lebih modern. Jika masih bermasalah:

```bash
# Cek IP address manual
ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1'

# Atau gunakan hostname
hostname -I
```

### Error Package Installation (404/Mirror Issues)

Jika mengalami error saat install package (seperti `libngtcp2` 404 error):

```bash
# 1. Refresh package database
sudo pacman -Sy

# 2. Jika masih error, update full system
sudo pacman -Syu

# 3. Install package lagi
sudo pacman -S nodejs npm

# 4. Atau update mirror list (jika menggunakan Manjaro)
sudo pacman-mirrors -g
```

**Alternatif: Install Node.js via nvm**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js
nvm install node
nvm use node
```

### Port Sudah Digunakan

```bash
# Cek process yang menggunakan port
lsof -i :8000
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Python Virtual Environment Error

```bash
# Hapus venv lama dan buat ulang
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate

# Update pip dan setuptools (penting untuk Python 3.13)
pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r requirements.txt
```

### Python 3.13 Compatibility Issues

Jika menggunakan Python 3.13, beberapa dependencies perlu versi lebih baru:

**Error yang mungkin terjadi:**
- `psycopg2-binary` build error
- `pydantic-core` build error  
- `Pillow` build error

**Solusi:**

```bash
# 1. Install build dependencies
sudo pacman -S gcc python-devel postgresql-libs libjpeg-turbo libpng freetype2

# 2. Install Rust (untuk pydantic-core)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 3. Update pip dan install
cd backend
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

**Alternatif: Gunakan Python 3.12**

Jika masih bermasalah, pertimbangkan menggunakan Python 3.12 yang lebih stabil:

```bash
# Install Python 3.12
sudo pacman -S python312

# Buat venv dengan Python 3.12
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Lihat `docs/PYTHON_313_COMPATIBILITY.md` untuk detail lebih lanjut.

### Node Modules Error

```bash
# Hapus node_modules dan install ulang
cd frontend/web
rm -rf node_modules package-lock.json
npm install
```

### Permission Denied

```bash
# Berikan permission execute pada script
chmod +x start.sh
chmod +x stop.sh
chmod +x scripts/*.sh
```

## 📋 Perbedaan dengan Distribusi Lain

### Arch Linux Specific

1. **Package Manager:** `pacman` (bukan apt/yum)
2. **AUR:** Gunakan `yay` atau `paru` untuk AUR packages
3. **Systemd:** Service management menggunakan systemd
4. **Modern Tools:** Biasanya menggunakan `ip` bukan `ifconfig`

### Keuntungan Arch Linux

- ✅ Rolling release (selalu up-to-date)
- ✅ AUR (Akses ke banyak packages)
- ✅ Minimal dan cepat
- ✅ Dokumentasi lengkap (Arch Wiki)

## 🔗 Referensi

- [Arch Linux Wiki](https://wiki.archlinux.org/)
- [AUR - ngrok-bin](https://aur.archlinux.org/packages/ngrok-bin)
- [Python Virtual Environments](https://wiki.archlinux.org/title/Python#Virtual_environments)

