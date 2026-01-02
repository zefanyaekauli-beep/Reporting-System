#!/bin/bash
# Clear Python cache files

echo "Clearing Python cache..."

# Find and remove all __pycache__ directories
find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null

# Find and remove all .pyc files
find . -type f -name "*.pyc" -delete 2>/dev/null

# Find and remove all .pyo files
find . -type f -name "*.pyo" -delete 2>/dev/null

echo "✅ Python cache cleared!"

