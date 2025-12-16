#!/bin/bash

# Quick script to check ngrok status and get URL

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}ðŸ” Checking ngrok status...${NC}"
echo ""

# Check if ngrok process is running
if pgrep -f "ngrok http" > /dev/null; then
    echo -e "${GREEN}âœ… ngrok process is running${NC}"
    pgrep -f "ngrok http" | xargs ps -p
else
    echo -e "${RED}âŒ ngrok process is NOT running${NC}"
    echo ""
    echo "Start ngrok manually:"
    echo "  ./ngrok http 5173"
    echo "  Or: ./ngrok http https://localhost:5173 (if HTTPS)"
    exit 1
fi

echo ""

# Check if port 4040 is accessible
if curl -s --max-time 2 http://localhost:4040 > /dev/null 2>&1; then
    echo -e "${GREEN}âœ… ngrok web interface is accessible${NC}"
    echo ""
    echo "ðŸŒ Access ngrok web interface:"
    echo "   http://localhost:4040"
    echo ""
    
    # Try to get public URL
    echo -e "${YELLOW}ðŸ“‹ Getting public URL...${NC}"
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    
    if [ -n "$NGROK_URL" ]; then
        echo -e "${GREEN}âœ… Public URL: $NGROK_URL${NC}"
    else
        echo -e "${YELLOW}âš ï¸  URL not available yet, check web interface${NC}"
    fi
else
    echo -e "${RED}âŒ ngrok web interface is NOT accessible${NC}"
    echo ""
    echo "Possible issues:"
    echo "  1. ngrok process crashed"
    echo "  2. Port 4040 is blocked"
    echo "  3. ngrok is still starting up"
    echo ""
    echo "Check ngrok log:"
    echo "  tail -f /tmp/ngrok_frontend.log"
    echo ""
    echo "Or start ngrok manually to see errors:"
    echo "  ./ngrok http 5173"
fi

echo ""
echo "ðŸ“‹ Recent ngrok log (last 20 lines):"
tail -n 20 /tmp/ngrok_frontend.log 2>/dev/null || echo "  (log file not found)"

