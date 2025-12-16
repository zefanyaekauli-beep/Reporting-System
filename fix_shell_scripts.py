#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix line endings for shell scripts (CRLF -> LF)
This script converts Windows line endings to Unix line endings for .sh files
"""

import os
import glob

def fix_line_endings(filepath):
    """Convert CRLF to LF in a file."""
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
        
        # Convert CRLF (\r\n) to LF (\n)
        content = content.replace(b'\r\n', b'\n')
        # Also handle standalone \r (old Mac format)
        content = content.replace(b'\r', b'\n')
        
        with open(filepath, 'wb') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    # Get script directory (where this script is located)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if not script_dir:
        script_dir = os.getcwd()
    
    # Find all .sh files
    shell_scripts = []
    
    # Check root directory (where script is)
    shell_scripts.extend(glob.glob(os.path.join(script_dir, "*.sh")))
    
    # Check scripts directory
    scripts_dir = os.path.join(script_dir, "scripts")
    if os.path.exists(scripts_dir):
        shell_scripts.extend(glob.glob(os.path.join(scripts_dir, "*.sh")))
    
    if not shell_scripts:
        print("No shell scripts found.")
        return
    
    print("=" * 60)
    print("Fixing line endings for shell scripts")
    print("=" * 60)
    print()
    
    fixed_count = 0
    for script in shell_scripts:
        print(f"Processing: {script}")
        if fix_line_endings(script):
            print(f"  [OK] Fixed {script}")
            fixed_count += 1
        else:
            print(f"  [ERROR] Failed to fix {script}")
        print()
    
    print("=" * 60)
    print(f"Fixed {fixed_count} out of {len(shell_scripts)} scripts")
    print("=" * 60)
    print()
    print("Note: To make scripts executable in WSL/Linux, run:")
    print("  wsl chmod +x stop.sh start.sh")
    print("  or")
    print("  chmod +x stop.sh start.sh  (from within WSL)")

if __name__ == "__main__":
    main()

