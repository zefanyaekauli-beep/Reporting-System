#!/bin/bash

# Setup script for Arch Linux
# Installs required dependencies for Verolux Management System

# Don't exit on error - we want to handle errors gracefully
set +e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐧 Setting up Verolux Management System for Arch Linux${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Some packages require root access${NC}"
    echo "   Run with sudo for system-wide installation"
    echo ""
fi

# Check for required commands
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"

# Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found${NC}"
    echo "   Install: sudo pacman -S python"
    exit 1
else
    echo -e "${GREEN}   [OK] Python 3: $(python3 --version)${NC}"
fi

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found${NC}"
    echo "   Install: sudo pacman -S nodejs npm"
    read -p "   Install Node.js now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}   Refreshing package database...${NC}"
        sudo pacman -Sy
        
        echo -e "${YELLOW}   Installing Node.js and npm...${NC}"
        if sudo pacman -S --noconfirm nodejs npm; then
            echo -e "${GREEN}   [OK] Node.js installed successfully${NC}"
        else
            echo -e "${RED}   ❌ Installation failed (mirror sync issue)${NC}"
            echo ""
            echo "   Try these solutions:"
            echo "   1. Update package database: sudo pacman -Sy"
            echo "   2. Update mirror list: sudo pacman-mirrors -g (if using Manjaro)"
            echo "   3. Or install manually:"
            echo "      sudo pacman -Syu  # Full system update"
            echo "      sudo pacman -S nodejs npm"
            echo ""
            read -p "   Retry installation? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}   Retrying with full sync...${NC}"
                sudo pacman -Syu --noconfirm
                sudo pacman -S --noconfirm nodejs npm
            fi
        fi
    fi
else
    echo -e "${GREEN}   [OK] Node.js: $(node --version)${NC}"
fi

# lsof (for port checking)
if ! command -v lsof &> /dev/null; then
    echo -e "${YELLOW}⚠️  lsof not found${NC}"
    echo "   Install: sudo pacman -S lsof"
    read -p "   Install lsof now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if ! sudo pacman -S --noconfirm lsof; then
            echo -e "${YELLOW}   Retrying with sync...${NC}"
            sudo pacman -Sy
            sudo pacman -S --noconfirm lsof
        fi
    fi
else
    echo -e "${GREEN}   [OK] lsof installed${NC}"
fi

# ip command (usually pre-installed, but check)
if ! command -v ip &> /dev/null; then
    echo -e "${YELLOW}⚠️  ip command not found${NC}"
    echo "   Install: sudo pacman -S iproute2"
    read -p "   Install iproute2 now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if ! sudo pacman -S --noconfirm iproute2; then
            echo -e "${YELLOW}   Retrying with sync...${NC}"
            sudo pacman -Sy
            sudo pacman -S --noconfirm iproute2
        fi
    fi
else
    echo -e "${GREEN}   [OK] ip command available${NC}"
fi

# curl (usually pre-installed)
if ! command -v curl &> /dev/null; then
    echo -e "${YELLOW}⚠️  curl not found${NC}"
    echo "   Install: sudo pacman -S curl"
    read -p "   Install curl now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if ! sudo pacman -S --noconfirm curl; then
            echo -e "${YELLOW}   Retrying with sync...${NC}"
            sudo pacman -Sy
            sudo pacman -S --noconfirm curl
        fi
    fi
else
    echo -e "${GREEN}   [OK] curl installed${NC}"
fi

echo ""
echo -e "${GREEN}✅ Dependencies check complete!${NC}"
echo ""

# Final check for Node.js (critical dependency)
if ! command -v node &> /dev/null; then
    echo -e "${RED}⚠️  Node.js is still not installed${NC}"
    echo ""
    echo "Manual installation steps:"
    echo "  1. Update package database:"
    echo "     sudo pacman -Sy"
    echo ""
    echo "  2. If still failing, try full system update:"
    echo "     sudo pacman -Syu"
    echo ""
    echo "  3. Then install Node.js:"
    echo "     sudo pacman -S nodejs npm"
    echo ""
    echo "  4. Or use alternative method (nvm):"
    echo "     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "     nvm install node"
    echo ""
    exit 1
fi

echo "Next steps:"
echo "  1. cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
echo "  2. cd ../frontend/web && npm install"
echo "  3. Run: ./start.sh"
echo ""

