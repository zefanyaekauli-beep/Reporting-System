#!/bin/bash

# Stop ngrok tunnels

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping ngrok tunnels...${NC}"

pkill -f "ngrok http" || true

if [ -f /tmp/ngrok_frontend.pid ]; then
    kill $(cat /tmp/ngrok_frontend.pid) 2>/dev/null || true
    rm /tmp/ngrok_frontend.pid
fi

if [ -f /tmp/ngrok_backend.pid ]; then
    kill $(cat /tmp/ngrok_backend.pid) 2>/dev/null || true
    rm /tmp/ngrok_backend.pid
fi

echo -e "${GREEN}✅ ngrok tunnels stopped${NC}"

