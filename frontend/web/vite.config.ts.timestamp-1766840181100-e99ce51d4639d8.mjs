// vite.config.ts
import { defineConfig } from "file:///mnt/c/Users/DELL%20GAMING/Downloads/kerja/Reporting-System/frontend/web/node_modules/vite/dist/node/index.js";
import react from "file:///mnt/c/Users/DELL%20GAMING/Downloads/kerja/Reporting-System/frontend/web/node_modules/@vitejs/plugin-react/dist/index.js";
import fs from "fs";
import path from "path";
var __vite_injected_original_dirname = "/mnt/c/Users/DELL GAMING/Downloads/kerja/Reporting-System/frontend/web";
var certPath = path.resolve(__vite_injected_original_dirname, "certs/cert.pem");
var keyPath = path.resolve(__vite_injected_original_dirname, "certs/key.pem");
var hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);
var proxyTargets = [
  "http://172.22.227.17:8000",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://0.0.0.0:8000"
];
var currentTargetIndex = 0;
function getCurrentTarget() {
  return proxyTargets[currentTargetIndex];
}
function tryNextTarget() {
  if (currentTargetIndex < proxyTargets.length - 1) {
    currentTargetIndex++;
    console.log(`\u{1F504} Switching to fallback target: ${getCurrentTarget()}`);
    return getCurrentTarget();
  }
  return null;
}
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"]
  },
  optimizeDeps: {
    // Explicitly include React and React-DOM to prevent "Outdated Optimize Dep" errors
    include: [
      "react",
      "react-dom",
      "react/jsx-dev-runtime",
      "react/jsx-runtime",
      "recharts",
      "react-router-dom"
    ],
    force: false,
    // Set to true to force re-optimization (use when cache issues occur)
    // Handle cache errors gracefully
    esbuildOptions: {
      // Ensure temp directories are created properly
      keepNames: true,
      // Handle platform-specific issues
      platform: "browser",
      target: "esnext",
      // Reduce memory usage and improve stability
      logOverride: { "this-is-undefined-in-esm": "silent" },
      // Add error handling
      logLimit: 0
      // Disable log limit to see all errors
    },
    // Exclude problematic packages if needed
    exclude: [],
    // Add cache handling
    holdUntilCrawlEnd: false,
    // Don't wait for crawl to finish
    // Ignore missing files in optimize deps directory
    entries: []
  },
  build: {
    // Improve build reliability
    commonjsOptions: {
      include: [/node_modules/]
    },
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "UNUSED_EXTERNAL_IMPORT") return;
        warn(warning);
      }
    },
    // Reduce chunk size to avoid memory issues
    chunkSizeWarningLimit: 1e3,
    // Improve sourcemap generation
    sourcemap: false
    // Disable in dev for better performance
  },
  // Add error handling for esbuild crashes
  logLevel: "warn",
  // Reduce log noise
  clearScreen: false,
  // Keep logs visible
  server: {
    port: 5173,
    host: "0.0.0.0",
    // Allow access from network (mobile devices)
    strictPort: false,
    // Add middleware to handle outdated optimize dep errors
    middlewareMode: false,
    // Force HMR to reconnect on dependency changes
    hmr: {
      overlay: true
    },
    // Allow localhost and network access (including IP addresses)
    // Note: Vite doesn't support RegExp in allowedHosts, so we allow all hosts by default
    // For production, consider using a more restrictive list
    // Enable HTTPS if certificates exist (for local development)
    ...hasCerts && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
    },
    // Proxy API requests to backend - uses relative /api paths
    // This avoids mixed content issues (HTTPS frontend -> HTTP backend)
    // Tries multiple targets: first tries 172.22.227.17:8000, falls back to localhost:8000 if it fails
    proxy: {
      "/api": {
        target: getCurrentTarget(),
        // Start with first target
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            const target = proxy.options?.target || getCurrentTarget();
            console.log(`\u{1F504} Proxy forwarding ${req.method} ${req.url} to ${target}`);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            const target = proxy.options?.target || getCurrentTarget();
            console.log(`\u2705 Proxy response from ${target}: ${proxyRes.statusCode} for ${req.url}`);
          });
          proxy.on("error", (err, req, res) => {
            const currentTarget = getCurrentTarget();
            console.error(`\u274C Proxy error with ${currentTarget}:`, err.message);
            const nextTarget = tryNextTarget();
            if (nextTarget) {
              console.log(`\u2705 Retrying with fallback target: ${nextTarget}`);
              proxy.options.target = nextTarget;
            } else {
              console.error("\u274C All proxy targets exhausted");
            }
          });
          console.log(`\u2705 Proxy configured with target: ${getCurrentTarget()}`);
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2MvVXNlcnMvREVMTCBHQU1JTkcvRG93bmxvYWRzL2tlcmphL1JlcG9ydGluZy1TeXN0ZW0vZnJvbnRlbmQvd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvbW50L2MvVXNlcnMvREVMTCBHQU1JTkcvRG93bmxvYWRzL2tlcmphL1JlcG9ydGluZy1TeXN0ZW0vZnJvbnRlbmQvd2ViL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9tbnQvYy9Vc2Vycy9ERUxMJTIwR0FNSU5HL0Rvd25sb2Fkcy9rZXJqYS9SZXBvcnRpbmctU3lzdGVtL2Zyb250ZW5kL3dlYi92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuLy8gQ2hlY2sgaWYgY2VydGlmaWNhdGVzIGV4aXN0XHJcbmNvbnN0IGNlcnRQYXRoID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2NlcnRzL2NlcnQucGVtJylcclxuY29uc3Qga2V5UGF0aCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdjZXJ0cy9rZXkucGVtJylcclxuY29uc3QgaGFzQ2VydHMgPSBmcy5leGlzdHNTeW5jKGNlcnRQYXRoKSAmJiBmcy5leGlzdHNTeW5jKGtleVBhdGgpXHJcblxyXG4vLyBBdmFpbGFibGUgcHJveHkgdGFyZ2V0cyAoaW4gcHJpb3JpdHkgb3JkZXIpXHJcbmNvbnN0IHByb3h5VGFyZ2V0cyA9IFtcclxuICAnaHR0cDovLzE3Mi4yMi4yMjcuMTc6ODAwMCcsXHJcbiAgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMCcsXHJcbiAgJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMCcsXHJcbiAgJ2h0dHA6Ly8wLjAuMC4wOjgwMDAnLFxyXG4gIFxyXG5dXHJcblxyXG4vLyBDdXJyZW50IHRhcmdldCBpbmRleCAoc3RhcnRzIHdpdGggMCA9IGZpcnN0IHRhcmdldClcclxubGV0IGN1cnJlbnRUYXJnZXRJbmRleCA9IDBcclxuXHJcbi8vIEZ1bmN0aW9uIHRvIGdldCBjdXJyZW50IHRhcmdldFxyXG5mdW5jdGlvbiBnZXRDdXJyZW50VGFyZ2V0KCk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIHByb3h5VGFyZ2V0c1tjdXJyZW50VGFyZ2V0SW5kZXhdXHJcbn1cclxuXHJcbi8vIEZ1bmN0aW9uIHRvIHRyeSBuZXh0IHRhcmdldFxyXG5mdW5jdGlvbiB0cnlOZXh0VGFyZ2V0KCk6IHN0cmluZyB8IG51bGwge1xyXG4gIGlmIChjdXJyZW50VGFyZ2V0SW5kZXggPCBwcm94eVRhcmdldHMubGVuZ3RoIC0gMSkge1xyXG4gICAgY3VycmVudFRhcmdldEluZGV4KytcclxuICAgIGNvbnNvbGUubG9nKGBcdUQ4M0RcdUREMDQgU3dpdGNoaW5nIHRvIGZhbGxiYWNrIHRhcmdldDogJHtnZXRDdXJyZW50VGFyZ2V0KCl9YClcclxuICAgIHJldHVybiBnZXRDdXJyZW50VGFyZ2V0KClcclxuICB9XHJcbiAgcmV0dXJuIG51bGxcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgLy8gRXhwbGljaXRseSBpbmNsdWRlIFJlYWN0IGFuZCBSZWFjdC1ET00gdG8gcHJldmVudCBcIk91dGRhdGVkIE9wdGltaXplIERlcFwiIGVycm9yc1xyXG4gICAgaW5jbHVkZTogW1xyXG4gICAgICBcInJlYWN0XCIsXHJcbiAgICAgIFwicmVhY3QtZG9tXCIsXHJcbiAgICAgIFwicmVhY3QvanN4LWRldi1ydW50aW1lXCIsXHJcbiAgICAgIFwicmVhY3QvanN4LXJ1bnRpbWVcIixcclxuICAgICAgXCJyZWNoYXJ0c1wiLFxyXG4gICAgICBcInJlYWN0LXJvdXRlci1kb21cIixcclxuICAgIF0sXHJcbiAgICBmb3JjZTogZmFsc2UsICAvLyBTZXQgdG8gdHJ1ZSB0byBmb3JjZSByZS1vcHRpbWl6YXRpb24gKHVzZSB3aGVuIGNhY2hlIGlzc3VlcyBvY2N1cilcclxuICAgIC8vIEhhbmRsZSBjYWNoZSBlcnJvcnMgZ3JhY2VmdWxseVxyXG4gICAgZXNidWlsZE9wdGlvbnM6IHtcclxuICAgICAgLy8gRW5zdXJlIHRlbXAgZGlyZWN0b3JpZXMgYXJlIGNyZWF0ZWQgcHJvcGVybHlcclxuICAgICAga2VlcE5hbWVzOiB0cnVlLFxyXG4gICAgICAvLyBIYW5kbGUgcGxhdGZvcm0tc3BlY2lmaWMgaXNzdWVzXHJcbiAgICAgIHBsYXRmb3JtOiAnYnJvd3NlcicsXHJcbiAgICAgIHRhcmdldDogJ2VzbmV4dCcsXHJcbiAgICAgIC8vIFJlZHVjZSBtZW1vcnkgdXNhZ2UgYW5kIGltcHJvdmUgc3RhYmlsaXR5XHJcbiAgICAgIGxvZ092ZXJyaWRlOiB7ICd0aGlzLWlzLXVuZGVmaW5lZC1pbi1lc20nOiAnc2lsZW50JyB9LFxyXG4gICAgICAvLyBBZGQgZXJyb3IgaGFuZGxpbmdcclxuICAgICAgbG9nTGltaXQ6IDAsIC8vIERpc2FibGUgbG9nIGxpbWl0IHRvIHNlZSBhbGwgZXJyb3JzXHJcbiAgICB9LFxyXG4gICAgLy8gRXhjbHVkZSBwcm9ibGVtYXRpYyBwYWNrYWdlcyBpZiBuZWVkZWRcclxuICAgIGV4Y2x1ZGU6IFtdLFxyXG4gICAgLy8gQWRkIGNhY2hlIGhhbmRsaW5nXHJcbiAgICBob2xkVW50aWxDcmF3bEVuZDogZmFsc2UsIC8vIERvbid0IHdhaXQgZm9yIGNyYXdsIHRvIGZpbmlzaFxyXG4gICAgLy8gSWdub3JlIG1pc3NpbmcgZmlsZXMgaW4gb3B0aW1pemUgZGVwcyBkaXJlY3RvcnlcclxuICAgIGVudHJpZXM6IFtdLFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIC8vIEltcHJvdmUgYnVpbGQgcmVsaWFiaWxpdHlcclxuICAgIGNvbW1vbmpzT3B0aW9uczoge1xyXG4gICAgICBpbmNsdWRlOiBbL25vZGVfbW9kdWxlcy9dLFxyXG4gICAgfSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb253YXJuKHdhcm5pbmcsIHdhcm4pIHtcclxuICAgICAgICAvLyBTdXBwcmVzcyBjZXJ0YWluIHdhcm5pbmdzIHRoYXQgZG9uJ3QgYWZmZWN0IGZ1bmN0aW9uYWxpdHlcclxuICAgICAgICBpZiAod2FybmluZy5jb2RlID09PSAnVU5VU0VEX0VYVEVSTkFMX0lNUE9SVCcpIHJldHVybjtcclxuICAgICAgICB3YXJuKHdhcm5pbmcpO1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIFJlZHVjZSBjaHVuayBzaXplIHRvIGF2b2lkIG1lbW9yeSBpc3N1ZXNcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgIC8vIEltcHJvdmUgc291cmNlbWFwIGdlbmVyYXRpb25cclxuICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIERpc2FibGUgaW4gZGV2IGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcclxuICB9LFxyXG4gIC8vIEFkZCBlcnJvciBoYW5kbGluZyBmb3IgZXNidWlsZCBjcmFzaGVzXHJcbiAgbG9nTGV2ZWw6ICd3YXJuJywgLy8gUmVkdWNlIGxvZyBub2lzZVxyXG4gIGNsZWFyU2NyZWVuOiBmYWxzZSwgLy8gS2VlcCBsb2dzIHZpc2libGVcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgICBob3N0OiAnMC4wLjAuMCcsIC8vIEFsbG93IGFjY2VzcyBmcm9tIG5ldHdvcmsgKG1vYmlsZSBkZXZpY2VzKVxyXG4gICAgc3RyaWN0UG9ydDogZmFsc2UsXHJcbiAgICAvLyBBZGQgbWlkZGxld2FyZSB0byBoYW5kbGUgb3V0ZGF0ZWQgb3B0aW1pemUgZGVwIGVycm9yc1xyXG4gICAgbWlkZGxld2FyZU1vZGU6IGZhbHNlLFxyXG4gICAgLy8gRm9yY2UgSE1SIHRvIHJlY29ubmVjdCBvbiBkZXBlbmRlbmN5IGNoYW5nZXNcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiB0cnVlLFxyXG4gICAgfSxcclxuICAgIC8vIEFsbG93IGxvY2FsaG9zdCBhbmQgbmV0d29yayBhY2Nlc3MgKGluY2x1ZGluZyBJUCBhZGRyZXNzZXMpXHJcbiAgICAvLyBOb3RlOiBWaXRlIGRvZXNuJ3Qgc3VwcG9ydCBSZWdFeHAgaW4gYWxsb3dlZEhvc3RzLCBzbyB3ZSBhbGxvdyBhbGwgaG9zdHMgYnkgZGVmYXVsdFxyXG4gICAgLy8gRm9yIHByb2R1Y3Rpb24sIGNvbnNpZGVyIHVzaW5nIGEgbW9yZSByZXN0cmljdGl2ZSBsaXN0XHJcbiAgICAvLyBFbmFibGUgSFRUUFMgaWYgY2VydGlmaWNhdGVzIGV4aXN0IChmb3IgbG9jYWwgZGV2ZWxvcG1lbnQpXHJcbiAgICAuLi4oaGFzQ2VydHMgJiYge1xyXG4gICAgICBodHRwczoge1xyXG4gICAgICAgIGtleTogZnMucmVhZEZpbGVTeW5jKGtleVBhdGgpLFxyXG4gICAgICAgIGNlcnQ6IGZzLnJlYWRGaWxlU3luYyhjZXJ0UGF0aCksXHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICAgIC8vIFByb3h5IEFQSSByZXF1ZXN0cyB0byBiYWNrZW5kIC0gdXNlcyByZWxhdGl2ZSAvYXBpIHBhdGhzXHJcbiAgICAvLyBUaGlzIGF2b2lkcyBtaXhlZCBjb250ZW50IGlzc3VlcyAoSFRUUFMgZnJvbnRlbmQgLT4gSFRUUCBiYWNrZW5kKVxyXG4gICAgLy8gVHJpZXMgbXVsdGlwbGUgdGFyZ2V0czogZmlyc3QgdHJpZXMgMTcyLjIyLjIyNy4xNzo4MDAwLCBmYWxscyBiYWNrIHRvIGxvY2FsaG9zdDo4MDAwIGlmIGl0IGZhaWxzXHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6IGdldEN1cnJlbnRUYXJnZXQoKSwgLy8gU3RhcnQgd2l0aCBmaXJzdCB0YXJnZXRcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICBjb25maWd1cmU6IChwcm94eSkgPT4ge1xyXG4gICAgICAgICAgLy8gTG9nIHByb3h5IHJlcXVlc3RzXHJcbiAgICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEsIHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IChwcm94eSBhcyBhbnkpLm9wdGlvbnM/LnRhcmdldCB8fCBnZXRDdXJyZW50VGFyZ2V0KClcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFx1RDgzRFx1REQwNCBQcm94eSBmb3J3YXJkaW5nICR7cmVxLm1ldGhvZH0gJHtyZXEudXJsfSB0byAke3RhcmdldH1gKVxyXG4gICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAvLyBMb2cgcHJveHkgcmVzcG9uc2VzXHJcbiAgICAgICAgICBwcm94eS5vbigncHJveHlSZXMnLCAocHJveHlSZXMsIHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IChwcm94eSBhcyBhbnkpLm9wdGlvbnM/LnRhcmdldCB8fCBnZXRDdXJyZW50VGFyZ2V0KClcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFx1MjcwNSBQcm94eSByZXNwb25zZSBmcm9tICR7dGFyZ2V0fTogJHtwcm94eVJlcy5zdGF0dXNDb2RlfSBmb3IgJHtyZXEudXJsfWApXHJcbiAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIC8vIEhhbmRsZSBwcm94eSBlcnJvcnMgYW5kIHRyeSBmYWxsYmFja1xyXG4gICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgcmVxLCByZXMpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudFRhcmdldCA9IGdldEN1cnJlbnRUYXJnZXQoKVxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBcdTI3NEMgUHJveHkgZXJyb3Igd2l0aCAke2N1cnJlbnRUYXJnZXR9OmAsIGVyci5tZXNzYWdlKVxyXG4gICAgICAgICAgICBjb25zdCBuZXh0VGFyZ2V0ID0gdHJ5TmV4dFRhcmdldCgpXHJcbiAgICAgICAgICAgIGlmIChuZXh0VGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYFx1MjcwNSBSZXRyeWluZyB3aXRoIGZhbGxiYWNrIHRhcmdldDogJHtuZXh0VGFyZ2V0fWApXHJcbiAgICAgICAgICAgICAgLy8gVXBkYXRlIHByb3h5IHRhcmdldCBmb3IgbmV4dCByZXF1ZXN0XHJcbiAgICAgICAgICAgICAgOyhwcm94eSBhcyBhbnkpLm9wdGlvbnMudGFyZ2V0ID0gbmV4dFRhcmdldFxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBBbGwgcHJveHkgdGFyZ2V0cyBleGhhdXN0ZWQnKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgIC8vIExvZyBzdWNjZXNzZnVsIHByb3h5IHNldHVwXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhgXHUyNzA1IFByb3h5IGNvbmZpZ3VyZWQgd2l0aCB0YXJnZXQ6ICR7Z2V0Q3VycmVudFRhcmdldCgpfWApXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFzWSxTQUFTLG9CQUFvQjtBQUNuYSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNB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
