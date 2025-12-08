#!/usr/bin/env python3
"""
Create mock data for shift schedules for calendar view.
Run: python3 scripts/create_shift_mock_data.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.divisions.security.models import ShiftSchedule
from app.models.user import User
from app.models.site import Site
from datetime import date, datetime, timedelta
import random

def create_shift_mock_data():
    db = SessionLocal()
    try:
        # Get users and sites
        users = db.query(User).filter(User.division == "security").all()
        # Query sites with only basic columns to avoid schema issues
        sites = db.query(Site.id, Site.name, Site.company_id).filter(Site.company_id == 1).all()
        
        if not users:
            print("❌ No security users found. Please create users first.")
            return
        
        if not sites:
            print("❌ No sites found. Please create sites first.")
            return
        
        print(f"Found {len(users)} security users and {len(sites)} sites")
        
        # Clear existing shifts (optional - comment out if you want to keep existing)
        # db.query(ShiftSchedule).delete()
        # db.commit()
        
        # Create shifts for the next 30 days
        today = date.today()
        shift_types = ["MORNING", "DAY", "NIGHT"]
        shift_times = {
            "MORNING": ("06:00", "14:00"),
            "DAY": ("14:00", "22:00"),
            "NIGHT": ("22:00", "06:00"),
        }
        
        shifts_created = 0
        
        for day_offset in range(-7, 30):  # Past 7 days + next 30 days
            shift_date = today + timedelta(days=day_offset)
            
            # Skip weekends if needed (optional)
            # if shift_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
            #     continue
            
            for site_row in sites:
                site_id = site_row.id
                for shift_type in shift_types:
                    # Always assign to a user, but some can be "open" status
                    user = random.choice(users)
                    if random.random() < 0.7:
                        status = random.choice(["assigned", "confirmed"])
                    else:
                        status = "open"  # Open shift but still assigned to a user initially
                    
                    # Check if shift already exists
                    existing = db.query(ShiftSchedule).filter(
                        ShiftSchedule.company_id == 1,
                        ShiftSchedule.site_id == site_id,
                        ShiftSchedule.shift_date == shift_date,
                        ShiftSchedule.shift_type == shift_type,
                    ).first()
                    
                    if existing:
                        continue
                    
                    start_time, end_time = shift_times[shift_type]
                    
                    shift = ShiftSchedule(
                        company_id=1,
                        site_id=site_id,
                        user_id=user.id,
                        shift_date=shift_date,
                        shift_type=shift_type,
                        start_time=start_time,
                        end_time=end_time,
                        status=status,
                        confirmed_at=datetime.utcnow() if status == "confirmed" else None,
                    )
                    
                    db.add(shift)
                    shifts_created += 1
        
        db.commit()
        print(f"✅ Created {shifts_created} shift schedules")
        print(f"   Date range: {(today - timedelta(days=7)).strftime('%Y-%m-%d')} to {(today + timedelta(days=30)).strftime('%Y-%m-%d')}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_shift_mock_data()

