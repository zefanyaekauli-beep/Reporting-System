#!/bin/bash
# Shell script to clear Vite cache
# Run this if you encounter Vite dependency optimization errors

echo "Clearing Vite cache..."

# Remove Vite cache directories
rm -rf node_modules/.vite .vite 2>/dev/null

# Remove any temp dependency directories
find node_modules/.vite -type d -name "deps_temp_*" -exec rm -rf {} + 2>/dev/null

echo "✅ Vite cache cleared! Restart the dev server."

