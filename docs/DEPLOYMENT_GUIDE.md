# Verolux Management System - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

## 📦 Backend Deployment

### 1. Setup Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Database
Create `.env` file:
```env
SQLALCHEMY_DATABASE_URI=postgresql://user:password@localhost:5432/verolux_db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=["http://localhost:5173","https://yourdomain.com"]
```

### 3. Run Migrations
```bash
# Generate migration (if needed)
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 4. Create Media Directories
```bash
mkdir -p media/security_attendance
mkdir -p media/security_patrol
mkdir -p media/security_reports
```

### 5. Start Server
```bash
# Development
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production (with gunicorn)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 🎨 Frontend Deployment

### 1. Install Dependencies
```bash
cd frontend/web
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Development Server
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
# Output in dist/
```

### 5. Serve Production Build
```bash
# Using serve
npx serve -s dist -l 3000

# Or using nginx/apache
# Point to dist/ directory
```

---

## 🐳 Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

---

## 🔒 Security Checklist

- [ ] Change `SECRET_KEY` in production
- [ ] Restrict `CORS_ORIGINS` to specific domains
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS
- [ ] Setup proper file storage (S3/GCS) instead of local
- [ ] Implement proper authentication (JWT)
- [ ] Add rate limiting
- [ ] Setup database backups
- [ ] Enable logging & monitoring

---

## 📊 Database Setup

### PostgreSQL Setup
```sql
CREATE DATABASE verolux_db;
CREATE USER verolux_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE verolux_db TO verolux_user;
```

### Run Migrations
```bash
cd backend
alembic upgrade head
```

---

## 🔧 Troubleshooting

### Backend Issues
- **Database connection error:** Check PostgreSQL is running and credentials are correct
- **Migration errors:** Check if models are imported in `main.py`
- **File upload errors:** Check media directories exist and have write permissions

### Frontend Issues
- **API connection error:** Check `VITE_API_BASE_URL` in `.env`
- **CORS errors:** Add frontend URL to `CORS_ORIGINS` in backend
- **Build errors:** Clear `node_modules` and reinstall

---

## 📈 Production Recommendations

1. **File Storage:** Use S3/GCS instead of local storage
2. **Database:** Use connection pooling
3. **Caching:** Add Redis for session/cache
4. **Monitoring:** Add logging (Sentry, etc.)
5. **CDN:** Serve static files via CDN
6. **Load Balancing:** Use nginx as reverse proxy

---

**Last Updated:** December 2024

