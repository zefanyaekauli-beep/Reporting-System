#!/usr/bin/env python3
"""
Create mock data for cleaning checklists (for demo purposes).
This creates checklist instances for cleaning staff with various statuses.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, init_db
from app.models.base import Base
from app.models.user import User
from app.models.company import Company
from app.models.site import Site
from app.divisions.cleaning.models import CleaningZone, CleaningZoneTemplate
from app.divisions.security.models import (
    ChecklistTemplate,
    ChecklistTemplateItem,
    Checklist,
    ChecklistItem,
    ChecklistStatus,
    ChecklistItemStatus,
)

# Create tables
Base.metadata.create_all(bind=engine)

def create_cleaning_checklist_mock_data():
    db = SessionLocal()
    
    try:
        print("Creating cleaning checklist mock data...")
        
        # Get company and sites
        company = db.query(Company).first()
        if not company:
            print("❌ No company found. Please create company first.")
            return
        
        sites = db.query(Site).filter(Site.company_id == company.id).all()
        if not sites:
            print("❌ No sites found. Please create sites first.")
            return
        
        site = sites[0]
        
        # Get cleaning users
        cleaning_users = db.query(User).filter(
            User.division == "cleaning",
            User.company_id == company.id
        ).all()
        
        if not cleaning_users:
            print("⚠️  No cleaning users found. Creating demo cleaning users...")
            for i in range(1, 4):
                user = User(
                    username=f"cleaning{i}",
                    hashed_password="dummy",
                    division="cleaning",
                    role="CLEANER",
                    company_id=company.id,
                    site_id=site.id,
                )
                db.add(user)
            db.commit()
            cleaning_users = db.query(User).filter(
                User.division == "cleaning",
                User.company_id == company.id
            ).all()
        
        # Get or create cleaning zones
        cleaning_zones = db.query(CleaningZone).filter(
            CleaningZone.company_id == company.id,
            CleaningZone.site_id == site.id
        ).all()
        
        if not cleaning_zones:
            print("⚠️  No cleaning zones found. Creating demo zones...")
            zone_data = [
                ("Toilet 1", "Lantai 1", "toilet"),
                ("Toilet 2", "Lantai 1", "toilet"),
                ("Room 1001", "Lantai 1", "room"),
                ("Lobby", "Lantai 1", "lobby"),
            ]
            
            for name, floor, area_type in zone_data:
                zone = CleaningZone(
                    company_id=company.id,
                    site_id=site.id,
                    name=name,
                    floor=floor,
                    area_type=area_type,
                    qr_code=f"QR_{name.replace(' ', '_').upper()}",
                    is_active=True,
                )
                db.add(zone)
            db.commit()
            cleaning_zones = db.query(CleaningZone).filter(
                CleaningZone.company_id == company.id,
                CleaningZone.site_id == site.id
            ).all()
        
        # Get or create checklist template for cleaning
        template = db.query(ChecklistTemplate).filter(
            ChecklistTemplate.company_id == company.id,
            ChecklistTemplate.site_id == site.id,
            ChecklistTemplate.role == "CLEANER"
        ).first()
        
        if not template:
            print("Creating cleaning checklist template...")
            template = ChecklistTemplate(
                company_id=company.id,
                site_id=site.id,
                name="Template Pembersihan Harian",
                role="CLEANER",
                is_active=True,
            )
            db.add(template)
            db.commit()
            db.refresh(template)
            
            # Add template items
            items_data = [
                ("Bersihkan lantai", "Pastikan lantai bersih dan kering", True),
                ("Bersihkan permukaan", "Bersihkan meja, kursi, dan permukaan lainnya", True),
                ("Periksa stok", "Periksa dan isi ulang stok jika perlu", False),
                ("Buang sampah", "Buang sampah dan ganti kantong sampah", True),
                ("Periksa toilet", "Pastikan toilet bersih dan berfungsi", True),
            ]
            
            for idx, (title, desc, required) in enumerate(items_data, 1):
                item = ChecklistTemplateItem(
                    template_id=template.id,
                    order=idx,
                    title=title,
                    description=desc,
                    required=required,
                    evidence_type="photo" if required else None,
                )
                db.add(item)
            
            db.commit()
            print(f"✅ Created template with {len(items_data)} items")
        
        # Get template items
        template_items = db.query(ChecklistTemplateItem).filter(
            ChecklistTemplateItem.template_id == template.id
        ).order_by(ChecklistTemplateItem.order).all()
        
        # Create checklist instances for the last 7 days
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        checklist_count = 0
        
        for day_offset in range(7):
            date = today - timedelta(days=day_offset)
            
            # Create 2-3 checklists per day
            for user in random.sample(cleaning_users, min(2, len(cleaning_users))):
                # Random status
                status = random.choice([
                    ChecklistStatus.COMPLETED,
                    ChecklistStatus.INCOMPLETE,
                    ChecklistStatus.PENDING,
                ])
                
                checklist = Checklist(
                    company_id=company.id,
                    site_id=site.id,
                    user_id=user.id,
                    template_id=template.id,
                    context_type="CLEANING_ZONE",
                    context_id=random.choice(cleaning_zones).id if cleaning_zones else None,
                    status=status,
                    created_at=date.replace(hour=random.randint(7, 9), minute=random.randint(0, 59)),
                )
                db.add(checklist)
                db.flush()
                
                # Create checklist items
                for template_item in template_items:
                    # Determine item status based on checklist status
                    if status == ChecklistStatus.COMPLETED:
                        item_status = ChecklistItemStatus.COMPLETED
                    elif status == ChecklistStatus.INCOMPLETE:
                        # Some items completed, some not
                        item_status = random.choice([
                            ChecklistItemStatus.COMPLETED,
                            ChecklistItemStatus.PENDING,
                        ]) if random.random() > 0.3 else ChecklistItemStatus.PENDING
                    else:
                        item_status = ChecklistItemStatus.PENDING
                    
                    checklist_item = ChecklistItem(
                        checklist_id=checklist.id,
                        template_item_id=template_item.id,
                        title=template_item.title,
                        description=template_item.description,
                        required=template_item.required,
                        status=item_status,
                        order_index=template_item.order,
                        completed_at=date.replace(
                            hour=random.randint(8, 12),
                            minute=random.randint(0, 59)
                        ) if item_status == ChecklistItemStatus.COMPLETED else None,
                    )
                    db.add(checklist_item)
                
                checklist_count += 1
        
        db.commit()
        print(f"✅ Created {checklist_count} cleaning checklists")
        print(f"   - {len(cleaning_users)} cleaning users")
        print(f"   - {len(cleaning_zones)} cleaning zones")
        print(f"   - {len(template_items)} template items per checklist")
        print("\n✅ Cleaning checklist mock data created successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_cleaning_checklist_mock_data()

