#!/bin/bash

# Fix Mixed Content Issue - HTTPS Frontend accessing HTTP Backend
# This script adds Vite proxy and updates API client

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🔧 Fixing Mixed Content Issue..."
echo ""

# Check if files exist
VITE_CONFIG="frontend/web/vite.config.ts"
CLIENT_TS="frontend/web/src/api/client.ts"

if [ ! -f "$VITE_CONFIG" ]; then
    echo "❌ Error: $VITE_CONFIG not found"
    exit 1
fi

if [ ! -f "$CLIENT_TS" ]; then
    echo "❌ Error: $CLIENT_TS not found"
    exit 1
fi

# Backup files
echo "📦 Creating backups..."
cp "$VITE_CONFIG" "$VITE_CONFIG.bak"
cp "$CLIENT_TS" "$CLIENT_TS.bak"
echo "✅ Backups created"
echo ""

# Fix vite.config.ts - Add proxy
echo "🔧 Updating vite.config.ts..."
if ! grep -q "proxy:" "$VITE_CONFIG"; then
    # Add proxy config before the closing brace of server
    sed -i '' '/strictPort: false,/a\
    // Proxy API requests to backend to avoid mixed content issues\
    proxy: {\
      '\''/api'\'': {\
        target: '\''http://localhost:8000'\'',\
        changeOrigin: true,\
        secure: false,\
      },\
    },
' "$VITE_CONFIG"
    echo "✅ Proxy added to vite.config.ts"
else
    echo "⚠️  Proxy already exists in vite.config.ts"
fi

# Fix client.ts - Use relative path
echo "🔧 Updating client.ts..."
# Replace the getApiBaseURL function to return "/api"
if grep -q "return.*http://" "$CLIENT_TS"; then
    # Create a temporary file with the fix
    cat > /tmp/client_fix.js << 'EOF'
const fs = require('fs');
const content = fs.readFileSync(process.argv[1], 'utf8');

// Replace getApiBaseURL function
const newContent = content.replace(
  /const getApiBaseURL = \(\) => \{[\s\S]*?\};/,
  `const getApiBaseURL = () => {
  // If explicitly set via env var, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Use relative path - Vite proxy will forward /api/* to backend
  // This avoids mixed content issues (HTTPS frontend -> HTTP backend)
  return "/api";
};`
);

fs.writeFileSync(process.argv[1], newContent);
EOF
    
    node /tmp/client_fix.js "$CLIENT_TS"
    rm /tmp/client_fix.js
    echo "✅ API client updated to use relative path"
else
    echo "⚠️  API client may already be using relative path"
fi

echo ""
echo "✅ Fix applied!"
echo ""
echo "🔄 Please restart frontend:"
echo "   ./stop.sh"
echo "   ./start.sh"
echo ""
echo "💡 Or manually restart:"
echo "   lsof -ti:5173 | xargs kill -9"
echo "   cd frontend/web && npm run dev"
echo ""

