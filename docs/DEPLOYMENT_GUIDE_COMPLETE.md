# Verolux Management System - Complete Deployment Guide

Panduan lengkap untuk deployment sistem di berbagai environment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Production Deployment](#production-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Security Checklist](#security-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Software Requirements

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 12+** (production) atau **SQLite** (development)
- **Nginx** (optional, untuk reverse proxy)
- **Git**

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB

**Recommended:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD

---

## Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd Reporting-System
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=sqlite:///./verolux_test.db
SECRET_KEY=your-secret-key-here-change-in-production
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
EOF

# Run migrations
alembic upgrade head

# Create admin user
python scripts/create_admin_user.py

# Run server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend/web

# Install dependencies
npm install

# Create .env file (optional)
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000/api
EOF

# Run development server
npm run dev
```

### 4. Start Both Services

**Using start script:**
```bash
# Linux/Mac
bash start.sh

# Windows
start.bat
```

**Manual:**
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend/web
npm run dev
```

---

## Production Deployment

### Option 1: Single Server Deployment

#### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3.10 python3.10-venv python3-pip -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y
```

#### Step 2: Database Setup

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE verolux_db;
CREATE USER verolux_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE verolux_db TO verolux_user;
\q
```

#### Step 3: Backend Deployment

```bash
# Clone repository
cd /opt
sudo git clone <repository-url> verolux-system
sudo chown -R $USER:$USER verolux-system
cd verolux-system/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://verolux_user:secure_password@localhost/verolux_db
SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
ENVIRONMENT=production
CORS_ORIGINS=https://your-domain.com
EOF

# Run migrations
alembic upgrade head

# Create admin user
python scripts/create_admin_user.py

# Create systemd service
sudo cat > /etc/systemd/system/verolux-backend.service << EOF
[Unit]
Description=Verolux Backend API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/verolux-system/backend
Environment="PATH=/opt/verolux-system/backend/venv/bin"
ExecStart=/opt/verolux-system/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable verolux-backend
sudo systemctl start verolux-backend
```

#### Step 4: Frontend Deployment

```bash
cd /opt/verolux-system/frontend/web

# Install dependencies
npm install

# Build for production
npm run build

# The build output is in dist/ directory
```

#### Step 5: Nginx Configuration

```nginx
# /etc/nginx/sites-available/verolux
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Frontend
    root /opt/verolux-system/frontend/web/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/verolux /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 6: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## Database Setup

### SQLite (Development)

```bash
# Database file akan dibuat otomatis
# Location: backend/verolux_test.db

# Run migrations
cd backend
alembic upgrade head

# Create initial data
python scripts/create_admin_user.py
python scripts/create_default_permissions.py
```

### PostgreSQL (Production)

```bash
# Create database
createdb verolux_db

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost/verolux_db

# Run migrations
alembic upgrade head

# Create initial data
python scripts/create_admin_user.py
python scripts/create_default_permissions.py
```

### Database Backup

```bash
# PostgreSQL
pg_dump -U verolux_user verolux_db > backup_$(date +%Y%m%d).sql

# SQLite
cp verolux_test.db backup_$(date +%Y%m%d).db
```

### Database Restore

```bash
# PostgreSQL
psql -U verolux_user verolux_db < backup_20250115.sql

# SQLite
cp backup_20250115.db verolux_test.db
```

---

## Environment Configuration

### Backend Environment Variables

```bash
# .env file
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-secret-key-minimum-32-characters
ENVIRONMENT=production
CORS_ORIGINS=https://your-domain.com
LOG_LEVEL=INFO
```

### Frontend Environment Variables

```bash
# .env file
VITE_API_BASE_URL=https://your-domain.com/api
```

---

## Security Checklist

### ✅ Backend Security

- [ ] Change default SECRET_KEY
- [ ] Use strong database passwords
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable request logging
- [ ] Regular security updates
- [ ] Database backups
- [ ] Firewall configuration

### ✅ Frontend Security

- [ ] HTTPS only
- [ ] Secure token storage
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Content Security Policy
- [ ] Secure headers

### ✅ Database Security

- [ ] Strong passwords
- [ ] Limited user permissions
- [ ] Regular backups
- [ ] Encrypted connections
- [ ] Access logging

---

## Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Detailed health
curl http://localhost:8000/health/detailed
```

### Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Systemd logs
sudo journalctl -u verolux-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Updates

```bash
# Backend update
cd backend
git pull
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart verolux-backend

# Frontend update
cd frontend/web
git pull
npm install
npm run build
sudo systemctl reload nginx
```

---

## Troubleshooting

### Backend tidak start

```bash
# Check logs
sudo journalctl -u verolux-backend -n 50

# Check port
sudo netstat -tulpn | grep 8000

# Test manually
cd backend
source venv/bin/activate
uvicorn app.main:app --port 8000
```

### Database connection error

```bash
# Test connection
psql -U verolux_user -d verolux_db

# Check DATABASE_URL
cat backend/.env | grep DATABASE_URL
```

### Frontend build error

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

---

## Performance Optimization

### Backend

- Use connection pooling
- Enable query caching
- Optimize database queries
- Use CDN for static files

### Frontend

- Enable compression (gzip)
- Minify assets
- Lazy load components
- Optimize images

### Database

- Create indexes
- Regular VACUUM (PostgreSQL)
- Query optimization
- Connection pooling

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15

