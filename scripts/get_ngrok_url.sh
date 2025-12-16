#!/bin/bash

# Quick script to get ngrok public URL

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Getting ngrok public URL...${NC}"
echo ""

# Check if ngrok is running
if ! curl -s --max-time 2 http://localhost:4040 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  ngrok web interface is not accessible${NC}"
    echo "   Make sure ngrok is running: ./start.sh --ngrok"
    exit 1
fi

# Get URL from API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -z "$NGROK_URL" ]; then
    # Try alternative method
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else '')" 2>/dev/null || echo "")
fi

if [ -n "$NGROK_URL" ]; then
    echo -e "${GREEN}✅ ngrok Public URL:${NC}"
    echo ""
    echo -e "${GREEN}$NGROK_URL${NC}"
    echo ""
    echo "📱 Buka URL ini di HP browser Anda!"
    echo ""
    echo "💡 Tips:"
    echo "   - URL ini bisa diakses dari mana saja (tidak perlu satu WiFi)"
    echo "   - HTTPS valid (tidak ada certificate warning)"
    echo "   - Langsung bekerja tanpa setup tambahan"
else
    echo -e "${YELLOW}⚠️  URL not available yet${NC}"
    echo "   Check ngrok web interface: http://localhost:4040"
    echo "   Or check log: tail -f /tmp/ngrok_frontend.log | grep 'started tunnel'"
fi

