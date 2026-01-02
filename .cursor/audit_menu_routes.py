#!/usr/bin/env python3
"""
Menu and Routes Audit Script
Identifies missing pages, broken routes, and navigation errors
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple

# Base paths
BASE_DIR = Path(__file__).parent.parent
FRONTEND_DIR = BASE_DIR / "frontend" / "web" / "src"
SUPERVISOR_PAGES = FRONTEND_DIR / "modules" / "supervisor" / "pages"
ROUTES_FILE = FRONTEND_DIR / "routes" / "AppRoutes.tsx"
LAYOUT_FILE = FRONTEND_DIR / "modules" / "supervisor" / "layout" / "SupervisorLayout.tsx"

def extract_menu_items() -> List[Dict]:
    """Extract all menu items from SupervisorLayout.tsx"""
    menu_items = []
    
    if not LAYOUT_FILE.exists():
        return menu_items
    
    content = LAYOUT_FILE.read_text(encoding='utf-8')
    
    # Find menuGroups array
    pattern = r'to:\s*"([^"]+)"'
    matches = re.findall(pattern, content)
    
    for match in matches:
        if match.startswith('/supervisor'):
            menu_items.append({
                'path': match,
                'type': 'menu_item'
            })
    
    return menu_items

def extract_routes() -> List[Dict]:
    """Extract all routes from AppRoutes.tsx"""
    routes = []
    
    if not ROUTES_FILE.exists():
        return routes
    
    content = ROUTES_FILE.read_text(encoding='utf-8')
    
    # Find Route path= patterns - look for <Route path= specifically
    # Routes are nested under /supervisor, so paths are relative
    pattern = r'<Route\s+path=["\']([^"\']+)["\']'
    matches = re.findall(pattern, content)
    
    for match in matches:
        # Skip routes that are not supervisor routes
        if match.startswith('/security') or match.startswith('/cleaning') or match.startswith('/driver') or match.startswith('/parking'):
            continue
        
        # Normalize path - add /supervisor prefix if not present
        if match.startswith('/supervisor'):
            routes.append({
                'path': match,
                'type': 'route'
            })
        elif match.startswith('supervisor'):
            routes.append({
                'path': f'/{match}',
                'type': 'route'
            })
        elif not match.startswith('/') and match not in ['/', 'login']:
            # Nested route under /supervisor
            routes.append({
                'path': f'/supervisor/{match}',
                'type': 'route'
            })
    
    return routes

def extract_navigate_calls() -> List[Dict]:
    """Extract all navigate() calls from pages"""
    navigate_calls = []
    
    if not SUPERVISOR_PAGES.exists():
        return navigate_calls
    
    for file_path in SUPERVISOR_PAGES.rglob('*.tsx'):
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # Find navigate() calls
            patterns = [
                r'navigate\(["\']([^"\']+)["\']\)',
                r'navigate\(`([^`]+)`\)',
                r'to:\s*["\']([^"\']+)["\']',
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    if match.startswith('/supervisor') or match.startswith('supervisor'):
                        navigate_calls.append({
                            'path': match if match.startswith('/') else f'/{match}',
                            'file': str(file_path.relative_to(BASE_DIR)),
                            'type': 'navigate_call'
                        })
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    
    return navigate_calls

def find_page_files() -> Set[str]:
    """Find all page component files"""
    page_files = set()
    
    if not SUPERVISOR_PAGES.exists():
        return page_files
    
    for file_path in SUPERVISOR_PAGES.rglob('*.tsx'):
        rel_path = str(file_path.relative_to(SUPERVISOR_PAGES))
        # Remove index.tsx, keep directory structure
        if rel_path.endswith('index.tsx'):
            page_files.add(rel_path.replace('/index.tsx', '').replace('index.tsx', ''))
        else:
            page_files.add(rel_path.replace('.tsx', ''))
    
    return page_files

def normalize_path(path: str) -> str:
    """Normalize path for comparison"""
    # Remove query params
    path = path.split('?')[0]
    # Remove trailing slash
    path = path.rstrip('/')
    # Ensure starts with /supervisor
    if not path.startswith('/supervisor'):
        if path.startswith('supervisor'):
            path = '/' + path
        else:
            return path
    return path

def audit():
    """Main audit function"""
    import sys
    import io
    # Fix encoding for Windows
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    print("Starting Menu and Routes Audit...")
    print("=" * 80)
    
    # Extract data
    print("\n1. Extracting menu items...")
    menu_items = extract_menu_items()
    menu_paths = {normalize_path(item['path']) for item in menu_items}
    print(f"   Found {len(menu_paths)} menu items")
    
    print("\n2. Extracting routes...")
    routes = extract_routes()
    route_paths = {normalize_path(route['path']) for route in routes}
    print(f"   Found {len(route_paths)} routes")
    
    print("\n3. Extracting navigate calls...")
    navigate_calls = extract_navigate_calls()
    navigate_paths = {normalize_path(call['path']) for call in navigate_calls}
    print(f"   Found {len(navigate_paths)} unique navigate paths")
    
    print("\n4. Finding page files...")
    page_files = find_page_files()
    print(f"   Found {len(page_files)} page files/directories")
    
    # Analysis
    print("\n" + "=" * 80)
    print("📊 ANALYSIS RESULTS")
    print("=" * 80)
    
    # 1. Menu items without routes
    print("\n[ERROR] MENU ITEMS WITHOUT ROUTES:")
    menu_without_routes = menu_paths - route_paths
    if menu_without_routes:
        for path in sorted(menu_without_routes):
            print(f"   - {path}")
    else:
        print("   [OK] All menu items have routes")
    
    # 2. Routes without pages (check if component exists)
    print("\n[ERROR] ROUTES THAT MAY BE MISSING PAGES:")
    routes_without_pages = []
    for route in routes:
        path = normalize_path(route['path'])
        # Check if this is a dynamic route
        if ':' in path:
            base_path = path.split('/:')[0]
        else:
            base_path = path
        
        # Try to find corresponding page
        # This is a simplified check - actual component names may vary
        found = False
        for page_file in page_files:
            if base_path.replace('/supervisor/', '').replace('/', '-') in page_file.lower():
                found = True
                break
        
        if not found and path not in ['/supervisor', '/supervisor/dashboard']:
            routes_without_pages.append(path)
    
    if routes_without_pages:
        for path in sorted(set(routes_without_pages)):
            print(f"   - {path}")
    else:
        print("   [OK] All routes appear to have pages")
    
    # 3. Navigate calls to non-existent routes
    print("\n[ERROR] NAVIGATE CALLS TO NON-EXISTENT ROUTES:")
    navigate_to_missing = navigate_paths - route_paths
    if navigate_to_missing:
        for path in sorted(navigate_to_missing):
            # Find which files use this path
            files = [call['file'] for call in navigate_calls if normalize_path(call['path']) == path]
            unique_files = list(set(files))
            print(f"   - {path}")
            for file in unique_files[:3]:  # Show max 3 files
                print(f"     -> {file}")
    else:
        print("   [OK] All navigate calls point to existing routes")
    
    # 4. Missing form/detail pages (based on navigate calls)
    print("\n[ERROR] MISSING FORM/DETAIL PAGES (from navigate calls):")
    form_detail_patterns = [
        r'/new$',
        r'/:id$',
        r'/:id/edit$',
        r'/:id/assign$',
    ]
    
    missing_forms = set()
    for path in navigate_paths:
        for pattern in form_detail_patterns:
            if re.search(pattern, path):
                base_path = re.sub(pattern, '', path)
                # Check if route exists
                if base_path not in route_paths and f"{base_path}/:id" not in route_paths:
                    missing_forms.add(path)
    
    if missing_forms:
        for path in sorted(missing_forms):
            print(f"   - {path}")
    else:
        print("   [OK] All form/detail pages appear to exist")
    
    # Summary
    print("\n" + "=" * 80)
    print("📋 SUMMARY")
    print("=" * 80)
    print(f"Total Menu Items: {len(menu_paths)}")
    print(f"Total Routes: {len(route_paths)}")
    print(f"Total Navigate Calls: {len(navigate_paths)}")
    print(f"Total Page Files: {len(page_files)}")
    print(f"\nIssues Found:")
    print(f"  - Menu items without routes: {len(menu_without_routes)}")
    print(f"  - Routes possibly missing pages: {len(routes_without_pages)}")
    print(f"  - Navigate calls to missing routes: {len(navigate_to_missing)}")
    print(f"  - Missing form/detail pages: {len(missing_forms)}")
    
    # Generate report
    report = {
        'menu_items': list(menu_paths),
        'routes': list(route_paths),
        'navigate_calls': list(navigate_paths),
        'issues': {
            'menu_without_routes': list(menu_without_routes),
            'routes_without_pages': list(routes_without_pages),
            'navigate_to_missing': list(navigate_to_missing),
            'missing_forms': list(missing_forms),
        },
        'navigate_calls_detail': navigate_calls
    }
    
    report_file = BASE_DIR / ".cursor" / "menu_routes_audit_report.json"
    report_file.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"\n[INFO] Detailed report saved to: {report_file}")
    
    return report

if __name__ == "__main__":
    audit()

