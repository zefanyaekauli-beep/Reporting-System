# Python 3.13 Compatibility Guide

## Issue: Pillow Installation Error

Jika Anda menggunakan Python 3.13 dan mengalami error saat install Pillow:

```
KeyError: '__version__'
error: subprocess-exited-with-error
```

Ini terjadi karena Pillow 10.1.0 tidak kompatibel dengan Python 3.13.

## ✅ Solusi

### 1. Update Pillow Version

File `requirements.txt` sudah diupdate untuk menggunakan Pillow >= 10.2.0 yang kompatibel dengan Python 3.13.

### 2. Install dengan Langkah Berikut

```bash
cd backend

# Hapus venv lama (jika ada)
rm -rf venv

# Buat venv baru
python3 -m venv venv

# Aktifkan venv
source venv/bin/activate

# Update pip dan setuptools terlebih dahulu
pip install --upgrade pip setuptools wheel

# Install dependencies (beberapa package perlu build dari source)
pip install -r requirements.txt
```

**Catatan:** 
- Beberapa package seperti `psycopg2-binary` dan `pydantic-core` mungkin perlu waktu lebih lama untuk build karena perlu compile dari source untuk Python 3.13.
- SQLAlchemy 2.0.23 tidak kompatibel dengan Python 3.13, perlu versi >=2.0.36.

### 3. Jika Masih Error

Jika masih mengalami masalah, install dependencies secara terpisah:

```bash
# Install build dependencies (Arch Linux)
sudo pacman -S gcc python-devel postgresql-libs libjpeg-turbo libpng freetype2

# Install Rust (untuk pydantic-core)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Kemudian install via pip
pip install --upgrade pip setuptools wheel
pip install Pillow>=11.0.0
pip install psycopg2-binary>=2.9.10
pip install pydantic>=2.9.0
pip install -r requirements.txt
```

**Alternatif: Gunakan psycopg (psycopg3)**
Jika `psycopg2-binary` masih bermasalah, pertimbangkan menggunakan `psycopg` (psycopg3) yang lebih modern dan fully support Python 3.13:

```bash
# Ganti psycopg2-binary dengan psycopg di requirements.txt
# psycopg>=3.1.0
```

## 🔍 Versi Python yang Didukung

- **Python 3.10+**: ✅ Fully supported
- **Python 3.11**: ✅ Fully supported  
- **Python 3.12**: ✅ Fully supported
- **Python 3.13**: ✅ Supported (dengan Pillow >= 10.2.0)

## 📝 Dependencies yang Diupdate

- `Pillow`: 10.1.0 → >=11.0.0 (untuk Python 3.13 compatibility)
- `psycopg2-binary`: 2.9.9 → >=2.9.10 (untuk Python 3.13 compatibility)
- `pydantic`: 2.5.0 → >=2.9.0 (untuk Python 3.13 compatibility)
- `pydantic-settings`: 2.1.0 → >=2.5.0 (untuk Python 3.13 compatibility)
- `sqlalchemy`: 2.0.23 → >=2.0.36 (untuk Python 3.13 compatibility)
- `alembic`: 1.12.1 → >=1.13.0 (untuk Python 3.13 compatibility)

## ⚠️ Catatan

Jika Anda menggunakan Python 3.13, pastikan:
1. Semua build tools terinstall
2. pip, setuptools, dan wheel ter-update
3. System dependencies untuk Pillow terinstall (jpeg, png, freetype)

## 🔧 SQLite Migration Issues

Jika menggunakan SQLite dan mengalami error `ALTER TABLE ... ALTER COLUMN`:

**Penyebab:** SQLite tidak mendukung `ALTER COLUMN` syntax langsung.

**Solusi:** File `alembic/env.py` sudah dikonfigurasi dengan `render_as_batch=True` yang akan otomatis menggunakan batch operations untuk SQLite.

**Jika masih error:**
1. Pastikan `alembic/env.py` memiliki `render_as_batch=True`
2. Hapus database lama dan buat ulang:
   ```bash
   rm backend/verolux_test.db  # atau nama database SQLite Anda
   alembic upgrade head
   ```
3. Atau gunakan PostgreSQL untuk production (lebih robust)

## 🔗 Referensi

- [Pillow Python 3.13 Support](https://pillow.readthedocs.io/en/stable/installation.html)
- [Python 3.13 Release Notes](https://docs.python.org/3.13/whatsnew/3.13.html)

