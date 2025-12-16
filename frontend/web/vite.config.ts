import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Check if certificates exist
const certPath = path.resolve(__dirname, 'certs/cert.pem')
const keyPath = path.resolve(__dirname, 'certs/key.pem')
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath)

// Available proxy targets (in priority order)
const proxyTargets = [
  'http://172.22.227.17:8000',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://0.0.0.0:8000',
  
]

// Current target index (starts with 0 = first target)
let currentTargetIndex = 0

// Function to get current target
function getCurrentTarget(): string {
  return proxyTargets[currentTargetIndex]
}

// Function to try next target
function tryNextTarget(): string | null {
  if (currentTargetIndex < proxyTargets.length - 1) {
    currentTargetIndex++
    console.log(`🔄 Switching to fallback target: ${getCurrentTarget()}`)
    return getCurrentTarget()
  }
  return null
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // Explicitly include React and React-DOM to prevent "Outdated Optimize Dep" errors
    include: [
      "react",
      "react-dom",
      "react/jsx-dev-runtime",
      "react/jsx-runtime",
      "recharts",
      "react-router-dom",
    ],
    force: false,  // Set to true to force re-optimization (use when cache issues occur)
    // Handle cache errors gracefully
    esbuildOptions: {
      // Ensure temp directories are created properly
      keepNames: true,
      // Handle platform-specific issues
      platform: 'browser',
      target: 'esnext',
      // Reduce memory usage and improve stability
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      // Add error handling
      logLimit: 0, // Disable log limit to see all errors
    },
    // Exclude problematic packages if needed
    exclude: [],
    // Add cache handling
    holdUntilCrawlEnd: false, // Don't wait for crawl to finish
    // Ignore missing files in optimize deps directory
    entries: [],
  },
  build: {
    // Improve build reliability
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings that don't affect functionality
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      },
    },
    // Reduce chunk size to avoid memory issues
    chunkSizeWarningLimit: 1000,
    // Improve sourcemap generation
    sourcemap: false, // Disable in dev for better performance
  },
  // Add error handling for esbuild crashes
  logLevel: 'warn', // Reduce log noise
  clearScreen: false, // Keep logs visible
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow access from network (mobile devices)
    strictPort: false,
    // Add middleware to handle outdated optimize dep errors
    middlewareMode: false,
    // Force HMR to reconnect on dependency changes
    hmr: {
      overlay: true,
    },
    // Allow localhost and network access (including IP addresses)
    // Note: Vite doesn't support RegExp in allowedHosts, so we allow all hosts by default
    // For production, consider using a more restrictive list
    // Enable HTTPS if certificates exist (for local development)
    ...(hasCerts && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    }),
    // Proxy API requests to backend - uses relative /api paths
    // This avoids mixed content issues (HTTPS frontend -> HTTP backend)
    // Tries multiple targets: first tries 172.22.227.17:8000, falls back to localhost:8000 if it fails
    proxy: {
      '/api': {
        target: getCurrentTarget(), // Start with first target
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          // Log proxy requests
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const target = (proxy as any).options?.target || getCurrentTarget()
            console.log(`🔄 Proxy forwarding ${req.method} ${req.url} to ${target}`)
          })

          // Log proxy responses
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const target = (proxy as any).options?.target || getCurrentTarget()
            console.log(`✅ Proxy response from ${target}: ${proxyRes.statusCode} for ${req.url}`)
          })

          // Handle proxy errors and try fallback
          proxy.on('error', (err, req, res) => {
            const currentTarget = getCurrentTarget()
            console.error(`❌ Proxy error with ${currentTarget}:`, err.message)
            const nextTarget = tryNextTarget()
            if (nextTarget) {
              console.log(`✅ Retrying with fallback target: ${nextTarget}`)
              // Update proxy target for next request
              ;(proxy as any).options.target = nextTarget
            } else {
              console.error('❌ All proxy targets exhausted')
            }
          })

          // Log successful proxy setup
          console.log(`✅ Proxy configured with target: ${getCurrentTarget()}`)
        },
      },
    },
  },
})
