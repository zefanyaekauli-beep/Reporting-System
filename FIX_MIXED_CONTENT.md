# Fix Mixed Content Warning

## Problem
Frontend is on HTTPS but trying to access backend on HTTP, causing browser to block the request.

## Solution
Use Vite proxy to forward `/api/*` requests to backend, so browser sees everything as HTTPS.

## Manual Fix Steps

### 1. Edit `frontend/web/vite.config.ts`

Find the `server` section and add `proxy` config:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    ...(hasCerts && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    }),
    // ADD THIS:
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

### 2. Edit `frontend/web/src/api/client.ts`

Find the `getApiBaseURL` function and change it to:

```typescript
const getApiBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Use relative path - Vite proxy handles it
  return "/api";
};
```

### 3. Restart Frontend

```bash
./stop.sh
./start.sh
```

Or manually:
```bash
lsof -ti:5173 | xargs kill -9
cd frontend/web && npm run dev
```

### 4. Hard Refresh Browser

- Mac: Cmd + Shift + R
- Windows: Ctrl + Shift + R

## How It Works

- Frontend (HTTPS) → `/api/*` → Vite Proxy → Backend (HTTP localhost:8000)
- Browser sees all requests as HTTPS (no mixed content)
- Proxy forwards requests to backend transparently

## Verification

After restart, check browser console - mixed content warning should be gone!

