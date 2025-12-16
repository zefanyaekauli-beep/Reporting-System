#!/bin/bash

# Quick HTTPS Setup untuk Development
# Script ini akan membuat self-signed certificate untuk development

echo "ðŸ” Setup HTTPS untuk Development..."
echo ""

# Get local IP address
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
if [ -z "$IP" ]; then
    IP="192.168.0.160"  # Default fallback
fi

echo "ðŸ“ IP Address: $IP"
echo ""

# Create certs directory
mkdir -p frontend/web/certs
cd frontend/web/certs

# Generate self-signed certificate
echo "ðŸ“ Generating self-signed certificate..."
openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout key.pem \
    -out cert.pem \
    -days 365 \
    -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Verolux/CN=$IP" \
    -addext "subjectAltName=IP:$IP,DNS:localhost,DNS:127.0.0.1"

echo ""
echo "âœ… Certificate created!"
echo "   - cert.pem"
echo "   - key.pem"
echo ""
echo "ðŸ“‹ Next steps:"
echo "   1. Update vite.config.ts untuk menggunakan certificate ini"
echo "   2. Restart frontend"
echo "   3. Akses https://$IP:5173 dari mobile"
echo ""
echo "âš ï¸  Browser akan menampilkan warning 'Not Secure' - klik 'Advanced' â†’ 'Proceed'"
echo "   Ini normal untuk self-signed certificate di development!"

