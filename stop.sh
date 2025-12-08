#!/bin/bash

# Verolux Management System - Stop Script
# This script stops both backend and frontend servers

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping Verolux Management System...${NC}"
echo ""

# Stop Backend
if lsof -ti:8000 >/dev/null 2>&1; then
    echo -e "${YELLOW}Stopping Backend (port 8000)...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✅ Backend stopped${NC}"
else
    echo -e "${YELLOW}Backend not running${NC}"
fi

# Stop Frontend
if lsof -ti:5173 >/dev/null 2>&1; then
    echo -e "${YELLOW}Stopping Frontend (port 5173)...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✅ Frontend stopped${NC}"
else
    echo -e "${YELLOW}Frontend not running${NC}"
fi

# Stop ngrok
if pgrep -f "ngrok http" > /dev/null; then
    echo -e "${YELLOW}Stopping ngrok tunnels...${NC}"
    pkill -f "ngrok http" 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✅ ngrok stopped${NC}"
else
    echo -e "${YELLOW}ngrok not running${NC}"
fi

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""

