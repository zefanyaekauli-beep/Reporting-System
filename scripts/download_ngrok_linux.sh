#!/bin/bash

# Download ngrok Linux binary for Arch Linux x86_64
# Usage: ./scripts/download_ngrok_linux.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${GREEN}📥 Downloading ngrok Linux binary for Arch Linux...${NC}"
echo ""

# Check architecture
ARCH=$(uname -m)
echo -e "${BLUE}Detected architecture: $ARCH${NC}"

if [ "$ARCH" != "x86_64" ]; then
    echo -e "${RED}❌ Unsupported architecture: $ARCH${NC}"
    echo "   This script only supports x86_64"
    echo "   Please download manually from: https://ngrok.com/download"
    exit 1
fi

# Change to project root
cd "$PROJECT_ROOT"
echo -e "${BLUE}Working directory: $(pwd)${NC}"
echo ""

# Backup Windows binary if exists
if [ -f "ngrok" ]; then
    echo -e "${YELLOW}⚠️  Found existing ngrok file${NC}"
    if file ngrok | grep -q "Windows\|PE32\|MS Windows"; then
        echo -e "${YELLOW}   Detected Windows binary, backing up...${NC}"
        mv ngrok ngrok.windows.backup
        echo -e "${GREEN}   ✅ Backed up to ngrok.windows.backup${NC}"
    fi
fi

# Download ngrok Linux binary
echo -e "${YELLOW}📥 Downloading ngrok for Linux x86_64...${NC}"
wget -O ngrok_linux.tgz https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz

# Extract
echo -e "${YELLOW}📦 Extracting...${NC}"
tar -xzf ngrok_linux.tgz

# Remove downloaded archive
rm ngrok_linux.tgz

# Make executable
chmod +x ngrok

# Test
echo -e "${YELLOW}🧪 Testing ngrok...${NC}"
if ./ngrok version &>/dev/null; then
    echo -e "${GREEN}✅ ngrok Linux binary downloaded and ready!${NC}"
    echo ""
    ./ngrok version
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo ""
    echo "1. Get your authtoken from:"
    echo "   ${BLUE}https://dashboard.ngrok.com/get-started/your-authtoken${NC}"
    echo ""
    echo "2. Configure authtoken:"
    echo "   ${BLUE}./ngrok config add-authtoken YOUR_TOKEN${NC}"
    echo ""
    echo "3. Test ngrok:"
    echo "   ${BLUE}./ngrok version${NC}"
    echo ""
    echo "4. Start system with ngrok:"
    echo "   ${BLUE}./start.sh --ngrok${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${RED}❌ ngrok binary is not working${NC}"
    echo "   Please check if the download was successful"
    exit 1
fi

