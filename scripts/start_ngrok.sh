#!/bin/bash

# Start ngrok tunnels for Verolux Management System
# This script starts ngrok tunnels for both frontend and backend

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}ðŸš€ Starting ngrok tunnels...${NC}"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}âŒ ngrok is not installed${NC}"
    echo "Run: ./setup_ngrok.sh"
    exit 1
fi

# Check if services are running
if ! lsof -ti:8000 >/dev/null 2>&1; then
    echo -e "${YELLOW}âš ï¸  Backend is not running on port 8000${NC}"
    echo "Start the system first with: ./start.sh"
    exit 1
fi

if ! lsof -ti:5173 >/dev/null 2>&1; then
    echo -e "${YELLOW}âš ï¸  Frontend is not running on port 5173${NC}"
    echo "Start the system first with: ./start.sh"
    exit 1
fi

# Kill existing ngrok processes
echo -e "${YELLOW}ðŸ›‘ Stopping existing ngrok tunnels...${NC}"
pkill -f "ngrok http" || true
sleep 2

# Start frontend tunnel (main tunnel - this is what users will access)
echo -e "${YELLOW}ðŸŒ Starting frontend tunnel (port 5173)...${NC}"
echo -e "${YELLOW}   This will expose your frontend to the internet${NC}"
echo ""
ngrok http 5173 > /tmp/ngrok_frontend.log 2>&1 &
FRONTEND_NGROK_PID=$!
sleep 5

# Get ngrok URL
echo ""
echo -e "${GREEN}âœ… ngrok tunnel started!${NC}"
echo ""
echo "ðŸ“‹ Tunnel Information:"
echo ""

# Try to get URL from ngrok API
FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -n "$FRONTEND_URL" ]; then
    echo -e "   ðŸŒ Public URL: ${GREEN}$FRONTEND_URL${NC}"
    echo ""
    echo "ðŸ“± To access from another device:"
    echo "   1. Open browser on your device"
    echo "   2. Go to: $FRONTEND_URL"
    echo "   3. Accept security warning (self-signed certificate)"
    echo "   4. Login with: username='security', password=(empty)"
else
    echo -e "   ${YELLOW}Check ngrok web interface: http://localhost:4040${NC}"
    echo "   The public URL will be shown there"
fi

echo ""
echo "ðŸŒ ngrok Web Interface:"
echo "   http://localhost:4040"
echo ""
echo "ðŸ’¡ Note:"
echo "   - The frontend (Vite) will proxy /api requests to localhost:8000"
echo "   - This means you only need ONE ngrok tunnel (frontend)"
echo "   - The backend is accessed through the frontend proxy"
echo ""
echo "ðŸ›‘ To stop: ./stop_ngrok.sh or pkill -f 'ngrok http'"
echo ""

# Save PID
echo $FRONTEND_NGROK_PID > /tmp/ngrok_frontend.pid

