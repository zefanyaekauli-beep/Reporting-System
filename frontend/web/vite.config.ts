import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Check if certificates exist
const certPath = path.resolve(__dirname, 'certs/cert.pem')
const keyPath = path.resolve(__dirname, 'certs/key.pem')
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath)

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["recharts"],  // Include recharts in optimization
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow access from network (mobile devices)
    strictPort: false,
    // Allow localhost and network access
    allowedHosts: [
      'localhost',
      '127.0.0.1',
    ],
    // Enable HTTPS if certificates exist (for local development)
    ...(hasCerts && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    }),
    // Proxy API requests to backend - uses relative /api paths
    // This avoids mixed content issues (HTTPS frontend -> HTTP backend)
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
