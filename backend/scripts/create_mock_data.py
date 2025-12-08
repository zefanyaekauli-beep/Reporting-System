#!/usr/bin/env python3
"""
Script to create mock data for Verolux Management System
Run: python3 scripts/create_mock_data.py
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, init_db
from app.models.user import User
from app.models.company import Company
from app.models.site import Site
from app.divisions.security.models import (
    SecurityAttendance,
    ChecklistTemplate,
    ChecklistTemplateItem,
    Checklist,
    ChecklistItem,
    ChecklistStatus,
    ChecklistItemStatus,
)


def create_mock_data(db: Session):
    """Create mock data for testing"""
    
    print("Creating mock data...")
    
    # 1. Create Company
    company = db.query(Company).filter(Company.id == 1).first()
    if not company:
        company = Company(
            id=1,
            name="PT Verolux Security",
            address="Jakarta, Indonesia",
        )
        db.add(company)
        db.commit()
        print("✓ Created company")
    else:
        print("✓ Company already exists")
    
    # 2. Create Sites
    sites_data = [
        {"id": 1, "name": "Gedung Perkantoran A", "address": "Jl. Sudirman No. 1"},
        {"id": 2, "name": "Mall Central", "address": "Jl. Thamrin No. 10"},
        {"id": 3, "name": "Pabrik Industri B", "address": "Jl. Industri Raya No. 5"},
    ]
    
    for site_data in sites_data:
        site = db.query(Site).filter(Site.id == site_data["id"]).first()
        if not site:
            site = Site(
                id=site_data["id"],
                name=site_data["name"],
                address=site_data["address"],
                company_id=1,
            )
            db.add(site)
            print(f"✓ Created site: {site_data['name']}")
    db.commit()
    
    # 3. Create Users
    users_data = [
        {"id": 1, "username": "security", "role": "guard", "site_id": 1},
        {"id": 2, "username": "guard1", "role": "guard", "site_id": 1},
        {"id": 3, "username": "guard2", "role": "guard", "site_id": 2},
        {"id": 4, "username": "supervisor1", "role": "supervisor", "site_id": 1},
    ]
    
    for user_data in users_data:
        user = db.query(User).filter(User.id == user_data["id"]).first()
        if not user:
            user = User(
                id=user_data["id"],
                username=user_data["username"],
                hashed_password="dummy",  # In production, use proper hashing
                division="security",
                role=user_data["role"],
                company_id=1,
                site_id=user_data.get("site_id"),
            )
            db.add(user)
            print(f"✓ Created user: {user_data['username']}")
    db.commit()
    
    # 4. Create Checklist Templates
    templates_data = [
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
                    "order": 1,
                },
                {
                    "title": "Patroli area parkir",
                    "description": "Lakukan patroli menyeluruh di area parkir",
                    "required": True,
                    "evidence_type": "patrol_log",
                    "order": 2,
                },
                {
                    "title": "Periksa sistem alarm",
                    "description": "Test sistem alarm dan pastikan berfungsi",
                    "required": True,
                    "evidence_type": "note",
                    "order": 3,
                },
                {
                    "title": "Periksa CCTV",
                    "description": "Pastikan semua kamera CCTV berfungsi",
                    "required": True,
                    "evidence_type": "photo",
                    "order": 4,
                },
                {
                    "title": "Periksa area gudang",
                    "description": "Lakukan pemeriksaan area gudang",
                    "required": False,
                    "evidence_type": "note",
                    "order": 5,
                },
            ],
        },
        {
            "name": "Security Guard - Site A - Night Shift",
            "site_id": 1,
            "role": "guard",
            "shift_type": "NIGHT",
            "items": [
                {
                    "title": "Periksa kunci pintu utama",
                    "description": "Pastikan semua pintu utama terkunci dengan benar",
                    "required": True,
                    "evidence_type": "photo",
                    "order": 1,
                },
                {
                    "title": "Patroli area parkir",
                    "description": "Lakukan patroli menyeluruh di area parkir",
                    "required": True,
                    "evidence_type": "patrol_log",
                    "order": 2,
                },
                {
                    "title": "Periksa sistem alarm",
                    "description": "Test sistem alarm dan pastikan berfungsi",
                    "required": True,
                    "evidence_type": "note",
                    "order": 3,
                },
                {
                    "title": "Periksa area gelap",
                    "description": "Pastikan tidak ada area gelap yang mencurigakan",
                    "required": True,
                    "evidence_type": "photo",
                    "order": 4,
                },
                {
                    "title": "Periksa generator darurat",
                    "description": "Pastikan generator darurat siap digunakan",
                    "required": False,
                    "evidence_type": "note",
                    "order": 5,
                },
            ],
        },
        {
            "name": "Security Guard - Global Template",
            "site_id": None,  # Global template
            "role": "guard",
            "shift_type": None,  # All shifts
            "items": [
                {
                    "title": "Periksa kunci pintu utama",
                    "description": "Pastikan semua pintu utama terkunci dengan benar",
                    "required": True,
                    "evidence_type": "photo",
                    "order": 1,
                },
                {
                    "title": "Patroli area umum",
                    "description": "Lakukan patroli menyeluruh di area umum",
                    "required": True,
                    "evidence_type": "patrol_log",
                    "order": 2,
                },
            ],
        },
        {
            "name": "Supervisor - Site A - All Shifts",
            "site_id": 1,
            "role": "supervisor",
            "shift_type": None,
            "items": [
                {
                    "title": "Review laporan harian",
                    "description": "Review semua laporan dari guard",
                    "required": True,
                    "evidence_type": "note",
                    "order": 1,
                },
                {
                    "title": "Inspeksi area kritis",
                    "description": "Lakukan inspeksi pada area-area kritis",
                    "required": True,
                    "evidence_type": "photo",
                    "order": 2,
                },
            ],
        },
    ]
    
    for template_data in templates_data:
        template = (
            db.query(ChecklistTemplate)
            .filter(
                ChecklistTemplate.company_id == 1,
                ChecklistTemplate.name == template_data["name"],
            )
            .first()
        )
        
        if not template:
            template = ChecklistTemplate(
                company_id=1,
                site_id=template_data["site_id"],
                name=template_data["name"],
                role=template_data["role"],
                shift_type=template_data["shift_type"],
                is_active=True,
            )
            db.add(template)
            db.flush()
            
            # Add items
            for item_data in template_data["items"]:
                item = ChecklistTemplateItem(
                    template_id=template.id,
                    order=item_data["order"],
                    title=item_data["title"],
                    description=item_data["description"],
                    required=item_data["required"],
                    evidence_type=item_data["evidence_type"],
                )
                db.add(item)
            
            db.commit()
            print(f"✓ Created template: {template_data['name']}")
        else:
            print(f"✓ Template already exists: {template_data['name']}")
    
    # 5. Create Sample Attendance Records (today and yesterday)
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    attendance_data = [
        {
            "user_id": 1,
            "site_id": 1,
            "shift_date": today,
            "check_in_time": datetime.now().replace(hour=6, minute=0, second=0, microsecond=0),
            "check_out_time": None,  # Still on duty
        },
        {
            "user_id": 2,
            "site_id": 1,
            "shift_date": today,
            "check_in_time": datetime.now().replace(hour=14, minute=0, second=0, microsecond=0),
            "check_out_time": None,
        },
        {
            "user_id": 1,
            "site_id": 1,
            "shift_date": yesterday,
            "check_in_time": datetime.now().replace(hour=6, minute=0, second=0, microsecond=0) - timedelta(days=1),
            "check_out_time": datetime.now().replace(hour=14, minute=0, second=0, microsecond=0) - timedelta(days=1),
        },
    ]
    
    for att_data in attendance_data:
        existing = (
            db.query(SecurityAttendance)
            .filter(
                SecurityAttendance.user_id == att_data["user_id"],
                SecurityAttendance.site_id == att_data["site_id"],
                SecurityAttendance.shift_date == att_data["shift_date"],
            )
            .first()
        )
        
        if not existing:
            attendance = SecurityAttendance(
                company_id=1,
                site_id=att_data["site_id"],
                user_id=att_data["user_id"],
                shift_date=att_data["shift_date"],
                check_in_time=att_data["check_in_time"],
                check_out_time=att_data.get("check_out_time"),
            )
            db.add(attendance)
            db.flush()
            print(f"✓ Created attendance for user {att_data['user_id']} on {att_data['shift_date']}")
            
            # Create checklist for this attendance if check-in exists
            if att_data["check_in_time"]:
                # Determine shift type
                hour = att_data["check_in_time"].hour
                if 6 <= hour < 14:
                    shift_type = "MORNING"
                elif 14 <= hour < 22:
                    shift_type = "DAY"
                else:
                    shift_type = "NIGHT"
                
                # Find template
                template = (
                    db.query(ChecklistTemplate)
                    .filter(
                        ChecklistTemplate.company_id == 1,
                        ChecklistTemplate.site_id == att_data["site_id"],
                        ChecklistTemplate.role == "guard",
                        ChecklistTemplate.is_active == True,
                    )
                    .filter(
                        (ChecklistTemplate.shift_type == shift_type)
                        | (ChecklistTemplate.shift_type.is_(None))
                    )
                    .first()
                )
                
                if template:
                    # Create checklist
                    checklist = Checklist(
                        company_id=1,
                        site_id=att_data["site_id"],
                        user_id=att_data["user_id"],
                        attendance_id=attendance.id,
                        template_id=template.id,
                        shift_date=att_data["shift_date"],
                        shift_type=shift_type,
                        status=ChecklistStatus.OPEN,
                    )
                    db.add(checklist)
                    db.flush()
                    
                    # Copy items from template
                    for template_item in template.items:
                        item = ChecklistItem(
                            checklist_id=checklist.id,
                            template_item_id=template_item.id,
                            order=template_item.order,
                            title=template_item.title,
                            description=template_item.description,
                            required=template_item.required,
                            evidence_type=template_item.evidence_type,
                            status=ChecklistItemStatus.PENDING,
                        )
                        db.add(item)
                    
                    # For yesterday's attendance, mark some items as completed
                    if att_data["shift_date"] == yesterday:
                        items = db.query(ChecklistItem).filter(
                            ChecklistItem.checklist_id == checklist.id
                        ).all()
                        
                        # Mark first 3 required items as completed
                        completed_count = 0
                        for item in items:
                            if item.required and completed_count < 3:
                                item.status = ChecklistItemStatus.COMPLETED
                                item.completed_at = att_data["check_in_time"] + timedelta(hours=2)
                                completed_count += 1
                        
                        # Update checklist status
                        required_items = [i for i in items if i.required]
                        completed_required = [
                            i for i in required_items
                            if i.status in [ChecklistItemStatus.COMPLETED, ChecklistItemStatus.NOT_APPLICABLE]
                        ]
                        
                        if len(completed_required) == len(required_items):
                            checklist.status = ChecklistStatus.COMPLETED
                            checklist.completed_at = att_data.get("check_out_time")
                        else:
                            checklist.status = ChecklistStatus.INCOMPLETE
                    
                    print(f"  ✓ Created checklist for attendance {attendance.id}")
    
    db.commit()
    print("\n✅ Mock data creation completed!")
    print("\nSummary:")
    print(f"  - Companies: 1")
    print(f"  - Sites: {len(sites_data)}")
    print(f"  - Users: {len(users_data)}")
    print(f"  - Templates: {len(templates_data)}")
    print(f"  - Attendance records: {len(attendance_data)}")
    print(f"  - Checklists: Created for each attendance with check-in")


if __name__ == "__main__":
    # Initialize database
    init_db()
    
    # Create session
    db = SessionLocal()
    try:
        create_mock_data(db)
    except Exception as e:
        print(f"\n❌ Error creating mock data: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

