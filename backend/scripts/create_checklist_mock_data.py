#!/usr/bin/env python3
"""
Create checklist mock data for today and recent days.
Run: python3 scripts/create_checklist_mock_data.py
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.user import User
from app.models.company import Company
from app.models.site import Site
from app.divisions.security.models import (
    ChecklistTemplate,
    ChecklistTemplateItem,
    Checklist,
    ChecklistItem,
    ChecklistStatus,
    ChecklistItemStatus,
    SecurityAttendance,
)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def create_checklist_mock_data(db: Session):
    """Create checklist templates and instances for mock users."""
    
    print("Creating checklist mock data...")
    
    # Get company and site
    company = db.query(Company).first()
    if not company:
        print("❌ Company not found. Please create company first.")
        return
    
    site_result = db.execute(text("SELECT id FROM sites LIMIT 1"))
    site_row = site_result.fetchone()
    if not site_row:
        print("❌ Site not found. Please create site first.")
        return
    
    site_id = site_row[0]
    company_id = company.id
    
    # Get users
    users = db.query(User).filter(User.company_id == company_id).all()
    if not users:
        print("❌ No users found. Please create users first.")
        return
    
    # Create checklist template if it doesn't exist
    template = (
        db.query(ChecklistTemplate)
        .filter(
            ChecklistTemplate.company_id == company_id,
            ChecklistTemplate.site_id == site_id,
            ChecklistTemplate.role == "guard",
            ChecklistTemplate.shift_type == "MORNING",
        )
        .first()
    )
    
    if not template:
        template = ChecklistTemplate(
            company_id=company_id,
            site_id=site_id,
            name="Security Guard - Morning Shift",
            role="guard",
            shift_type="MORNING",
            is_active=True,
        )
        db.add(template)
        db.flush()
        
        # Add template items
        items_data = [
            {"order": 1, "title": "Periksa semua pintu masuk", "description": "Pastikan semua pintu masuk terkunci dengan benar", "required": True, "evidence_type": "photo"},
            {"order": 2, "title": "Periksa sistem alarm", "description": "Test sistem alarm dan pastikan berfungsi", "required": True, "evidence_type": "none"},
            {"order": 3, "title": "Periksa CCTV", "description": "Pastikan semua kamera CCTV berfungsi", "required": True, "evidence_type": "photo"},
            {"order": 4, "title": "Periksa area parkir", "description": "Cek area parkir untuk kendaraan mencurigakan", "required": False, "evidence_type": "photo"},
            {"order": 5, "title": "Periksa peralatan keamanan", "description": "Pastikan semua peralatan keamanan tersedia", "required": True, "evidence_type": "none"},
        ]
        
        for item_data in items_data:
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
        db.refresh(template)
        print(f"✓ Created checklist template: {template.name}")
    else:
        print(f"✓ Using existing template: {template.name}")
    
    # Create checklists for today and last 3 days for user_id=1 (dummy user)
    today = date.today()
    target_user_id = 1  # Dummy user from get_current_user
    
    for day_offset in range(4):
        shift_date = today - timedelta(days=day_offset)
        
        # Check if checklist already exists
        existing = (
            db.query(Checklist)
            .filter(
                Checklist.user_id == target_user_id,
                Checklist.shift_date == shift_date,
            )
            .first()
        )
        
        if existing:
            print(f"  ✓ Checklist already exists for {shift_date}")
            continue
        
        # Create checklist
        checklist = Checklist(
            company_id=company_id,
            site_id=site_id,
            user_id=target_user_id,
            template_id=template.id,
            shift_date=shift_date,
            shift_type="MORNING",
            status=ChecklistStatus.OPEN,
        )
        db.add(checklist)
        db.flush()
        
        # Create checklist items from template
        template_items = (
            db.query(ChecklistTemplateItem)
            .filter(ChecklistTemplateItem.template_id == template.id)
            .order_by(ChecklistTemplateItem.order)
            .all()
        )
        
        for template_item in template_items:
            # Mark some items as completed for past days
            item_status = ChecklistItemStatus.PENDING
            completed_at = None
            if day_offset > 0 and template_item.order <= 3:
                item_status = ChecklistItemStatus.COMPLETED
                completed_at = datetime.combine(shift_date, datetime.min.time().replace(hour=8 + template_item.order))
            
            item = ChecklistItem(
                checklist_id=checklist.id,
                template_item_id=template_item.id,
                order=template_item.order,
                title=template_item.title,
                description=template_item.description,
                required=template_item.required,
                evidence_type=template_item.evidence_type,
                status=item_status,
                completed_at=completed_at,
            )
            db.add(item)
        
        # Update checklist status if items are completed
        if day_offset > 0:
            completed_items = [item for item in checklist.items if item.status == ChecklistItemStatus.COMPLETED]
            required_items = [item for item in checklist.items if item.required]
            if len(completed_items) == len(required_items):
                checklist.status = ChecklistStatus.COMPLETED
                checklist.completed_at = datetime.combine(shift_date, datetime.min.time().replace(hour=10))
        
        db.commit()
        print(f"  ✓ Created checklist for {shift_date} (user_id={target_user_id})")
    
    print(f"\n✅ Checklist mock data created!")
    print(f"   - Template: {template.name}")
    print(f"   - Checklists: 4 days (today + 3 past days)")
    print(f"   - User ID: {target_user_id} (dummy user)")

def main():
    db = SessionLocal()
    try:
        create_checklist_mock_data(db)
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()

