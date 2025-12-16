#!/bin/bash

# Setup ngrok for Arch Linux
# This script helps install and configure ngrok

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${GREEN}ðŸŒ Setting up ngrok for Arch Linux${NC}"
echo ""

# Check if ngrok is already installed
if command -v ngrok &> /dev/null; then
    echo -e "${GREEN}âœ… ngrok is already installed${NC}"
    ngrok version
    echo ""
    read -p "Do you want to configure authtoken? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Enter your ngrok authtoken:${NC}"
        read -r AUTHTOKEN
        ngrok config add-authtoken "$AUTHTOKEN"
        echo -e "${GREEN}âœ… Authtoken configured!${NC}"
    fi
    exit 0
fi

# Check if ngrok binary exists in project root
if [ -f "$PROJECT_ROOT/ngrok" ]; then
    echo -e "${YELLOW}ðŸ“¦ Found ngrok binary in project root${NC}"
    echo ""
    read -p "Do you want to use this binary? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Make it executable
        chmod +x "$PROJECT_ROOT/ngrok"
        echo -e "${GREEN}âœ… Made ngrok executable${NC}"
        
        # Test if it works
        if "$PROJECT_ROOT/ngrok" version &>/dev/null; then
            echo -e "${GREEN}âœ… ngrok binary is working!${NC}"
            "$PROJECT_ROOT/ngrok" version
            echo ""
            read -p "Do you want to configure authtoken? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}Enter your ngrok authtoken:${NC}"
                read -r AUTHTOKEN
                "$PROJECT_ROOT/ngrok" config add-authtoken "$AUTHTOKEN"
                echo -e "${GREEN}âœ… Authtoken configured!${NC}"
            fi
            echo ""
            echo -e "${GREEN}âœ… Setup complete!${NC}"
            echo "   You can now use: ./start.sh --ngrok"
            exit 0
        else
            echo -e "${RED}âŒ ngrok binary is not working${NC}"
            echo "   It might be for a different architecture"
        fi
    fi
fi

# Installation options
echo "Installation options:"
echo ""
echo "1. Install from AUR (requires yay or paru)"
echo "2. Download binary from ngrok.com"
echo "3. Install via npm (global)"
echo ""
read -p "Choose option (1/2/3): " -n 1 -r
echo
echo ""

case $REPLY in
    1)
        echo -e "${YELLOW}Installing from AUR...${NC}"
        if command -v yay &> /dev/null; then
            yay -S ngrok-bin
        elif command -v paru &> /dev/null; then
            paru -S ngrok-bin
        else
            echo -e "${RED}âŒ yay or paru not found${NC}"
            echo ""
            echo "Install yay first:"
            echo "  cd /tmp"
            echo "  git clone https://aur.archlinux.org/yay.git"
            echo "  cd yay"
            echo "  makepkg -si"
            echo ""
            echo "Or install paru:"
            echo "  sudo pacman -S paru"
            exit 1
        fi
        ;;
    2)
        echo -e "${YELLOW}Downloading ngrok binary...${NC}"
        cd /tmp
        wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
        tar -xzf ngrok-v3-stable-linux-amd64.tgz
        sudo mv ngrok /usr/local/bin/
        rm ngrok-v3-stable-linux-amd64.tgz
        echo -e "${GREEN}âœ… ngrok installed to /usr/local/bin${NC}"
        ;;
    3)
        echo -e "${YELLOW}Installing via npm...${NC}"
        if ! command -v npm &> /dev/null; then
            echo -e "${RED}âŒ npm not found${NC}"
            echo "   Install Node.js first: sudo pacman -S nodejs npm"
            exit 1
        fi
        sudo npm install -g ngrok
        echo -e "${GREEN}âœ… ngrok installed via npm${NC}"
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

# Verify installation
if command -v ngrok &> /dev/null; then
    echo ""
    echo -e "${GREEN}âœ… ngrok installed successfully!${NC}"
    ngrok version
    echo ""
    read -p "Do you want to configure authtoken now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Enter your ngrok authtoken:${NC}"
        echo "   Get it from: https://dashboard.ngrok.com/get-started/your-authtoken"
        read -r AUTHTOKEN
        ngrok config add-authtoken "$AUTHTOKEN"
        echo -e "${GREEN}âœ… Authtoken configured!${NC}"
    fi
    echo ""
    echo -e "${GREEN}âœ… Setup complete!${NC}"
    echo "   You can now use: ./start.sh --ngrok"
else
    echo -e "${RED}âŒ Installation failed${NC}"
    exit 1
fi

