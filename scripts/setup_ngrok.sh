#!/bin/bash

# Setup ngrok for Verolux Management System
# This script helps set up ngrok tunnels for frontend and backend

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}ðŸŒ Setting up ngrok for Verolux Management System${NC}"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}âš ï¸  ngrok is not installed${NC}"
    echo ""
    echo "Installation options:"
    
    # Detect OS
    if [ -f /etc/arch-release ]; then
        echo "1. Arch Linux (AUR): yay -S ngrok-bin (or use AUR helper)"
        echo "2. Download from: https://ngrok.com/download"
        echo "3. Or use: npm install -g ngrok"
        echo ""
        read -p "Do you want to install ngrok from AUR? (requires yay) (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if command -v yay &> /dev/null; then
                yay -S ngrok-bin
            elif command -v paru &> /dev/null; then
                paru -S ngrok-bin
            else
                echo -e "${YELLOW}âš ï¸  yay or paru not found${NC}"
                echo "   Install yay: https://github.com/Jguer/yay"
                echo "   Or download ngrok manually from: https://ngrok.com/download"
                exit 1
            fi
        else
            echo -e "${YELLOW}Download ngrok manually from: https://ngrok.com/download${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "1. macOS (Homebrew): brew install ngrok/ngrok/ngrok"
        echo "2. Download from: https://ngrok.com/download"
        echo "3. Or use: npm install -g ngrok"
        echo ""
        read -p "Do you want to install ngrok via Homebrew? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            brew install ngrok/ngrok/ngrok
        else
            echo -e "${RED}Please install ngrok manually and run this script again${NC}"
            exit 1
        fi
    else
        echo "1. Download from: https://ngrok.com/download"
        echo "2. Or use: npm install -g ngrok"
        echo ""
        echo -e "${YELLOW}Please install ngrok manually and run this script again${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}âœ… ngrok is installed${NC}"
echo ""

# Check if ngrok is authenticated
if ! ngrok config check &> /dev/null; then
    echo -e "${YELLOW}âš ï¸  ngrok is not authenticated${NC}"
    echo ""
    echo "To authenticate ngrok:"
    echo "1. Sign up at https://dashboard.ngrok.com/signup"
    echo "2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "3. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    read -p "Do you have an ngrok authtoken? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your ngrok authtoken: " authtoken
        ngrok config add-authtoken "$authtoken"
    else
        echo -e "${YELLOW}You can still use ngrok without authentication (limited features)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}âœ… ngrok setup complete!${NC}"
echo ""
echo "To start ngrok tunnels, run:"
echo "  ./start_ngrok.sh"
echo ""
echo "Or manually:"
echo "  Terminal 1: ngrok http 5173  # Frontend"
echo "  Terminal 2: ngrok http 8000  # Backend"

