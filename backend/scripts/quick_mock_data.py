#!/usr/bin/env python3
"""
Quick mock data creation via API calls
Use this if database is not accessible but backend is running
"""

import requests
import json
from datetime import date, datetime

API_BASE = "http://localhost:8000/api"

def login():
    """Login and get token"""
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"username": "security", "password": ""}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        print(f"Login failed: {response.text}")
        return None

def create_template(token, template_data):
    """Create checklist template"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(
        f"{API_BASE}/security/admin/checklist-templates",
        headers=headers,
        json=template_data
    )
    if response.status_code == 200:
        print(f"✅ Created template: {template_data['name']}")
        return response.json()
    else:
        print(f"❌ Failed to create template: {response.text}")
        return None

def main():
    print("Creating mock data via API...")
    
    # Login
    token = login()
    if not token:
        print("❌ Cannot login. Make sure backend is running and user exists.")
        return
    
    print("✅ Logged in successfully")
    
    # Create templates
    templates = [
        {
            "name": "Security Guard - Site A - Morning Shift",
            "site_id": 1,
            "role": "guard",
            "shift_type": "MORNING",
            "items": [
                {
                    "title": "Periksa kunci pintu utama",
                    "description": "Pastikan semua pintu utama terkunci dengan benar",
                    "required": True,
                    "evidence_type": "photo",
                    "order": 1
                },
                {
                    "title": "Patroli area parkir",
                    "description": "Lakukan patroli menyeluruh di area parkir",
                    "required": True,
                    "evidence_type": "patrol_log",
                    "order": 2
                },
                {
                    "title": "Periksa sistem alarm",
                    "description": "Test sistem alarm dan pastikan berfungsi",
                    "required": True,
                    "evidence_type": "note",
                    "order": 3
                },
                {
                    "title": "Periksa CCTV",
                    "description": "Pastikan semua kamera CCTV berfungsi",
                    "required": True,
                    "evidence_type": "photo",
                    "order": 4
                },
            ]
        }
    ]
    
    for template in templates:
        create_template(token, template)
    
    print("\n✅ Mock data creation completed!")
    print("\nNote: This creates templates only. Checklists will be auto-created on check-in.")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

