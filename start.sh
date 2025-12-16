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

# Get IP address (try ip command first, fallback to ifconfig)
IP=""
if command -v ip &> /dev/null; then
    # Modern Linux (Arch, Ubuntu, etc.) - use ip command
    IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1)
elif command -v ifconfig &> /dev/null; then
    # Legacy systems - use ifconfig
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
fi

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

# Create log file and ensure it's writable
touch /tmp/verolux_backend.log
chmod 666 /tmp/verolux_backend.log 2>/dev/null || true

# Verify Python and uvicorn are available
if ! venv/bin/python -c "import uvicorn" 2>/dev/null; then
    echo -e "${RED}❌ uvicorn not found in virtual environment${NC}"
    echo "   Installing uvicorn..."
    venv/bin/pip install uvicorn
fi

# Try to start backend and capture immediate errors
echo "   Python: $(venv/bin/python --version)"
echo "   Working directory: $(pwd)"
echo "   Starting uvicorn..."

# Start backend with better error handling
venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/verolux_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready (polling with multiple checks)
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
BACKEND_READY=false
for i in {1..15}; do
    sleep 1
    # Check multiple ways: lsof, netstat, curl
    if lsof -ti:8000 >/dev/null 2>&1 || \
       (command -v netstat >/dev/null 2>&1 && netstat -tuln 2>/dev/null | grep -q ":8000") || \
       curl -s --max-time 1 http://localhost:8000/health >/dev/null 2>&1; then
        BACKEND_READY=true
        break
    fi
    # Check if process died
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend process died during startup${NC}"
        echo "   Last 30 lines of log:"
        tail -n 30 /tmp/verolux_backend.log 2>/dev/null || echo "   (log file empty or not accessible)"
        exit 1
    fi
done

# Final check
if [ "$BACKEND_READY" = true ]; then
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
elif kill -0 $BACKEND_PID 2>/dev/null; then
    # Process is running but port check failed - might be a false negative
    # Try one more time with curl
    if curl -s --max-time 2 http://localhost:8000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID) - port check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend process is running but port check inconclusive${NC}"
        echo "   Process PID: $BACKEND_PID"
        echo "   Last 10 lines of log:"
        tail -n 10 /tmp/verolux_backend.log 2>/dev/null || echo "   (log file empty)"
        echo "   Continuing anyway - backend might be starting up..."
        # Don't exit - let it continue and see if it works
    fi
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo "   Process PID: $BACKEND_PID"
    echo "   Last 30 lines of log:"
    tail -n 30 /tmp/verolux_backend.log 2>/dev/null || echo "   (log file empty or not accessible)"
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
        # Make sure it's executable
        chmod +x "$SCRIPT_DIR/ngrok" 2>/dev/null || true
        # Store path with proper quoting for paths with spaces
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
        # Note: ngrok v3 syntax for HTTPS is different - use localhost:5173 and let ngrok handle HTTPS
        # For self-signed certs, ngrok might have issues, so we'll try HTTP first if HTTPS fails
        # Properly quote path to handle spaces (e.g., "DELL GAMING")
        if [ "$FRONTEND_PROTO" = "https" ]; then
            # Try HTTPS first, but ngrok v3 might need different approach
            # Some versions need: ngrok http https://localhost:5173 --host-header=rewrite
            # Or simpler: just use port and let frontend handle HTTPS
            echo -e "${YELLOW}   Attempting HTTPS tunnel...${NC}"
            "$NGROK_CMD" http https://localhost:5173 --log=stdout > /tmp/ngrok_frontend.log 2>&1 &
        else
            "$NGROK_CMD" http 5173 --log=stdout > /tmp/ngrok_frontend.log 2>&1 &
        fi
        NGROK_PID=$!
        
        # Wait and verify ngrok started
        echo -e "${YELLOW}   Waiting for ngrok to initialize...${NC}"
        sleep 3
        
        # Check if ngrok process is still running
        if ! kill -0 $NGROK_PID 2>/dev/null; then
            echo -e "${RED}   ❌ ngrok process died immediately${NC}"
            echo "   Last 20 lines of log:"
            tail -n 20 /tmp/ngrok_frontend.log 2>/dev/null || echo "   (log file empty)"
            echo ""
            echo -e "${YELLOW}   Trying alternative: HTTP tunnel (frontend HTTPS might be causing issues)${NC}"
            # Try HTTP instead - ngrok will provide HTTPS on public URL
            "$NGROK_CMD" http 5173 --log=stdout > /tmp/ngrok_frontend.log 2>&1 &
            NGROK_PID=$!
            sleep 5
            if ! kill -0 $NGROK_PID 2>/dev/null; then
                echo -e "${RED}   ❌ ngrok still failed with HTTP tunnel${NC}"
                echo "   Error log:"
                tail -n 30 /tmp/ngrok_frontend.log 2>/dev/null || echo "   (log file empty)"
                echo ""
                echo -e "${YELLOW}   ⚠️  ngrok failed to start. You can start it manually:${NC}"
                echo "      ./ngrok http 5173"
                USE_NGROK=false
            else
                echo -e "${GREEN}   ✅ ngrok started with HTTP tunnel (PID: $NGROK_PID)${NC}"
            fi
        else
            echo -e "${GREEN}   ✅ ngrok process is running (PID: $NGROK_PID)${NC}"
        fi
        
        sleep 3  # Give ngrok more time to start web interface
        
        # Try to get ngrok URL from API (with retries)
        NGROK_URL=""
        for i in {1..15}; do
            # Try multiple methods to get URL
            NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
            if [ -z "$NGROK_URL" ]; then
                # Alternative: try parsing JSON with python if available
                NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else '')" 2>/dev/null || echo "")
            fi
            if [ -n "$NGROK_URL" ]; then
                break
            fi
            sleep 1
        done
        
        if [ -n "$NGROK_URL" ]; then
            echo -e "${GREEN}✅ ngrok tunnel started!${NC}"
            echo -e "${GREEN}   Public URL: $NGROK_URL${NC}"
            echo $NGROK_PID > /tmp/ngrok_frontend.pid
        else
            echo -e "${YELLOW}⚠️  ngrok started but URL not available yet${NC}"
            echo "   Check ngrok web interface: http://localhost:4040"
            echo "   Or check log: tail -f /tmp/ngrok_frontend.log | grep 'started tunnel'"
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