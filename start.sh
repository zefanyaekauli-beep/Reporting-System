#!/bin/bash

# Verolux Management System - Start Script
# This script starts both backend and frontend servers

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${GREEN}🚀 Starting Verolux Management System...${NC}"
echo ""

# Get IP address
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
if [ -z "$IP" ]; then
    IP="192.168.0.160"  # Default fallback
fi

# Check if ngrok should be started
USE_NGROK=false
if [ "$1" == "--ngrok" ] || [ "$1" == "-n" ]; then
    USE_NGROK=true
fi

# Stop existing processes
echo -e "${YELLOW}🛑 Stopping existing processes...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
pkill -f "ngrok http" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Processes stopped${NC}"
echo ""

# Start Backend
echo -e "${YELLOW}🔧 Starting Backend...${NC}"
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create virtual environment${NC}"
        echo "Make sure Python 3 is installed: python3 --version"
        cd ..
        exit 1
    fi
    echo -e "${YELLOW}📥 Installing dependencies...${NC}"
    source venv/bin/activate
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        cd ..
        exit 1
    fi
    echo -e "${GREEN}✅ Virtual environment created and dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Virtual environment found${NC}"
    source venv/bin/activate
fi

# Check if venv Python exists
if [ ! -f "venv/bin/python" ]; then
    echo -e "${RED}❌ Virtual environment Python not found${NC}"
    echo "Recreate venv: rm -rf venv && python3 -m venv venv"
    cd ..
    exit 1
fi

# Start backend with activated venv
echo -e "${YELLOW}🚀 Starting backend server...${NC}"
venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/verolux_backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# Check if backend started
if lsof -ti:8000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo "Check logs: tail -f /tmp/verolux_backend.log"
    exit 1
fi

# Start Frontend
echo -e "${YELLOW}🎨 Starting Frontend...${NC}"
cd frontend/web

# Clear Vite cache to avoid module resolution issues
echo -e "${YELLOW}🧹 Clearing Vite cache...${NC}"
rm -rf node_modules/.vite .vite 2>/dev/null || true
echo -e "${GREEN}✅ Cache cleared${NC}"
echo ""

# Verify fixes are in place
echo -e "${YELLOW}🔍 Verifying configuration...${NC}"

# Check client.ts
if ! grep -q 'return "/api"' src/api/client.ts 2>/dev/null; then
    echo -e "${RED}⚠️  WARNING: client.ts may not have the fix applied!${NC}"
    echo "   Expected: return \"/api\";"
else
    echo -e "${GREEN}   [OK] client.ts uses relative /api path${NC}"
fi

# Check vite.config.ts proxy
if ! grep -q "proxy:" vite.config.ts 2>/dev/null; then
    echo -e "${RED}⚠️  WARNING: vite.config.ts may not have proxy configured!${NC}"
else
    echo -e "${GREEN}   [OK] vite.config.ts has proxy configured${NC}"
fi

# Check .env file for hardcoded IP
if [ -f .env ]; then
    if grep -q "VITE_API_BASE_URL.*http://" .env 2>/dev/null || grep -q "VITE_API_BASE_URL.*192\.168" .env 2>/dev/null; then
        echo -e "${RED}⚠️  WARNING: .env contains hardcoded IP address!${NC}"
        echo "   This will cause CORS errors. Remove VITE_API_BASE_URL from .env"
        echo "   or set it to: VITE_API_BASE_URL=/api"
    else
        echo -e "${GREEN}   [OK] .env file is OK (no hardcoded IP)${NC}"
    fi
else
    echo -e "${GREEN}   [OK] No .env file (using default relative /api path)${NC}"
fi
echo ""

# Start frontend using npx vite directly (more reliable than npm run dev)
npx vite --host 0.0.0.0 --port 5173 > /tmp/verolux_frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..
sleep 5

# Check if frontend started
if lsof -ti:5173 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    echo "Check logs: tail -f /tmp/verolux_frontend.log"
    exit 1
fi

# Wait a bit more for services to be ready
sleep 2

# Verify services
echo ""
echo -e "${YELLOW}🔍 Verifying services...${NC}"
BACKEND_OK=$(curl -s --max-time 2 http://localhost:8000/health 2>/dev/null | grep -q "ok" && echo "✅" || echo "❌")

# Check frontend (HTTP or HTTPS)
FRONTEND_PROTO_CHECK="http"
if [ -f "frontend/web/certs/cert.pem" ] && [ -f "frontend/web/certs/key.pem" ]; then
    FRONTEND_PROTO_CHECK="https"
fi
FRONTEND_OK=$(curl -s -k --max-time 2 ${FRONTEND_PROTO_CHECK}://localhost:5173 2>/dev/null | grep -q "html\|<!DOCTYPE" && echo "✅" || echo "❌")

echo "   Backend:  $BACKEND_OK"
echo "   Frontend: $FRONTEND_OK"
echo ""

# Wait for frontend to be fully ready before starting ngrok
if [ "$FRONTEND_OK" = "❌" ]; then
    echo -e "${YELLOW}⏳ Waiting for frontend to be ready...${NC}"
    for i in {1..10}; do
        sleep 1
        FRONTEND_OK=$(curl -s -k --max-time 2 ${FRONTEND_PROTO_CHECK}://localhost:5173 2>/dev/null | grep -q "html\|<!DOCTYPE" && echo "✅" || echo "❌")
        if [ "$FRONTEND_OK" = "✅" ]; then
            echo -e "${GREEN}✅ Frontend is ready!${NC}"
            break
        fi
    done
fi

# Start ngrok if requested
NGROK_URL=""
if [ "$USE_NGROK" = true ]; then
    echo ""
    echo -e "${YELLOW}🌐 Starting ngrok tunnel...${NC}"
    
    # Check if ngrok is installed (either in PATH or in project directory)
    NGROK_CMD=""
    if command -v ngrok &> /dev/null; then
        NGROK_CMD="ngrok"
    elif [ -f "$SCRIPT_DIR/ngrok" ]; then
        NGROK_CMD="$SCRIPT_DIR/ngrok"
    fi
    
    if [ -z "$NGROK_CMD" ]; then
        echo -e "${RED}❌ ngrok is not installed${NC}"
        echo "   Install ngrok: https://ngrok.com/download"
        echo "   Or run: brew install ngrok/ngrok/ngrok (if Homebrew is installed)"
        echo ""
        USE_NGROK=false
    else
        # Kill existing ngrok processes and free port 4040
        pkill -f "ngrok http" 2>/dev/null || true
        lsof -ti:4040 | xargs kill -9 2>/dev/null || true
        sleep 3
        
        # Start ngrok tunnel for frontend (which proxies to backend)
        echo -e "${YELLOW}   Starting tunnel for frontend (port 5173)...${NC}"
        
        # Check if frontend is using HTTPS
        FRONTEND_PROTO="http"
        if [ -f "frontend/web/certs/cert.pem" ] && [ -f "frontend/web/certs/key.pem" ]; then
            FRONTEND_PROTO="https"
            echo -e "${YELLOW}   Frontend is using HTTPS, configuring ngrok accordingly...${NC}"
        fi
        
        # Use --log=stdout to see errors, and redirect to log file
        # If HTTPS, ngrok needs to connect to https://localhost:5173
        if [ "$FRONTEND_PROTO" = "https" ]; then
            $NGROK_CMD http https://localhost:5173 --log=stdout > /tmp/ngrok_frontend.log 2>&1 &
        else
            $NGROK_CMD http 5173 --log=stdout > /tmp/ngrok_frontend.log 2>&1 &
        fi
        NGROK_PID=$!
        sleep 8  # Give ngrok more time to start
        
        # Try to get ngrok URL from API
        for i in {1..10}; do
            NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
            if [ -n "$NGROK_URL" ]; then
                break
            fi
            sleep 1
        done
        
        if [ -n "$NGROK_URL" ]; then
            echo -e "${GREEN}✅ ngrok tunnel started!${NC}"
            echo $NGROK_PID > /tmp/ngrok_frontend.pid
        else
            echo -e "${YELLOW}⚠️  ngrok started but URL not available yet${NC}"
            echo "   Check ngrok web interface: http://localhost:4040"
        fi
        echo ""
    fi
fi

# Display access URLs
echo -e "${GREEN}✅ System Started Successfully!${NC}"
echo ""
echo "🌐 Access URLs:"
echo "   Backend:  http://$IP:8000"
echo "   Frontend: http://$IP:5173"
if [ -n "$NGROK_URL" ]; then
    echo -e "   ${GREEN}Public (ngrok): $NGROK_URL${NC}"
fi
echo ""
# Check if frontend is using HTTPS
FRONTEND_PROTO="http"
if [ -f "frontend/web/certs/cert.pem" ] && [ -f "frontend/web/certs/key.pem" ]; then
    FRONTEND_PROTO="https"
fi

echo "💻 From Computer:"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: $FRONTEND_PROTO://localhost:5173"
if [ "$FRONTEND_PROTO" = "https" ]; then
    echo "   ⚠️  Accept security warning (self-signed certificate)"
fi
echo ""
echo "📱 From Mobile (same network):"
echo "   1. Open: $FRONTEND_PROTO://$IP:5173"
if [ "$FRONTEND_PROTO" = "https" ]; then
    echo "   2. Accept security warning (Advanced → Proceed)"
    echo "   3. Login: username='supervisor', password=(empty)"
else
    echo "   2. Login: username='supervisor', password=(empty)"
fi
echo "   Or try: security, cleaning, parking"
echo ""
if [ -n "$NGROK_URL" ]; then
    echo "🌐 From Anywhere (via ngrok):"
    echo "   1. Open: $NGROK_URL"
    echo "   2. Login: username='supervisor', password=(empty)"
    echo ""
    echo "   ngrok Web Interface: http://localhost:4040"
    echo ""
fi
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/verolux_backend.log"
echo "   Frontend: tail -f /tmp/verolux_frontend.log"
if [ -n "$NGROK_URL" ]; then
    echo "   ngrok:    tail -f /tmp/ngrok_frontend.log"
fi
echo ""
echo "🛑 To stop: ./stop.sh or kill processes on ports 8000 and 5173"
if [ -n "$NGROK_URL" ]; then
    echo "   (ngrok will also be stopped)"
fi
echo ""
echo "💡 Tip: Run with --ngrok flag to start ngrok tunnel: ./start.sh --ngrok"
echo ""

