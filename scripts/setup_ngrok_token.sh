#!/bin/bash

# Quick setup ngrok authtoken
# Usage: ./scripts/setup_ngrok_token.sh YOUR_TOKEN

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Get token from argument or prompt
if [ -n "$1" ]; then
    TOKEN="$1"
else
    echo -e "${YELLOW}Enter your ngrok authtoken:${NC}"
    read -r TOKEN
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}âŒ Token cannot be empty${NC}"
    exit 1
fi

# Check if ngrok exists
if [ ! -f "ngrok" ]; then
    echo -e "${RED}âŒ ngrok not found in project root${NC}"
    echo "   Run: ./scripts/download_ngrok_linux.sh first"
    exit 1
fi

# Make sure it's executable
chmod +x ngrok

# Configure authtoken
echo -e "${YELLOW}ðŸ” Configuring ngrok authtoken...${NC}"
./ngrok config add-authtoken "$TOKEN"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}âœ… Authtoken configured successfully!${NC}"
    echo ""
    echo -e "${GREEN}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${NC}"
    echo -e "${GREEN}âœ… ngrok is ready to use!${NC}"
    echo ""
    echo "Test ngrok:"
    echo "  ${YELLOW}./ngrok version${NC}"
    echo ""
    echo "Start system with ngrok:"
    echo "  ${YELLOW}./start.sh --ngrok${NC}"
    echo ""
    echo "Or start ngrok manually:"
    echo "  ${YELLOW}./ngrok http 5173${NC}"
    echo -e "${GREEN}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${NC}"
else
    echo -e "${RED}âŒ Failed to configure authtoken${NC}"
    exit 1
fi

