# backend/scripts/create_supervisor_mock_data.py

"""
Create mock data for supervisor dashboard that shows data from all 3 divisions:
- Security attendance and reports
- Cleaning attendance and reports  
- Parking attendance and reports
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add parent directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Removed - using app.core.database instead
from app.models.attendance import Attendance, AttendanceStatus
from app.models.user import User
from app.models.site import Site
from app.models.company import Company
from app.divisions.security.models import SecurityReport

# Database setup - use the same as the app
from app.core.database import SessionLocal, engine, init_db
from app.models.base import Base

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def create_mock_data():
    db = SessionLocal()
    
    try:
        # Get or create company
        company = db.query(Company).first()
        if not company:
            company = Company(name="PT Verolux", address="Jakarta")
            db.add(company)
            db.commit()
            db.refresh(company)
        
        # Get or create sites
        sites = db.query(Site).filter(Site.company_id == company.id).all()
        if not sites:
            sites = [
                Site(name="Site A - Rumah Sakit", company_id=company.id, qr_code="SITE_A"),
                Site(name="Site B - Mall", company_id=company.id, qr_code="SITE_B"),
            ]
            for site in sites:
                db.add(site)
            db.commit()
            for site in sites:
                db.refresh(site)
        
        # Get or create users for each division
        users = {}
        for division in ["security", "cleaning", "parking"]:
            user = db.query(User).filter(User.division == division, User.company_id == company.id).first()
            if not user:
                user = User(
                    username=f"{division}_user",
                    hashed_password="dummy",
                    division=division,
                    role="user",
                    company_id=company.id,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            users[division] = user
        
        # Create supervisor user
        supervisor = db.query(User).filter(User.username == "supervisor", User.company_id == company.id).first()
        if not supervisor:
            supervisor = User(
                username="supervisor",
                hashed_password="dummy",
                division="security",
                role="supervisor",
                company_id=company.id,
            )
            db.add(supervisor)
            db.commit()
            db.refresh(supervisor)
        
        print(f"✅ Created/verified users: {[u.username for u in [*users.values(), supervisor]]}")
        
        # Create attendance records for today and past 7 days
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        role_types = ["SECURITY", "CLEANING", "PARKING"]
        
        attendance_count = 0
        for day_offset in range(7):
            date = today - timedelta(days=day_offset)
            
            for role_type in role_types:
                user = users[role_type.lower().replace("security", "security").replace("cleaning", "cleaning").replace("parking", "parking")]
                site = random.choice(sites)
                
                # Create 2-5 attendance records per day per division
                num_records = random.randint(2, 5)
                
                for i in range(num_records):
                    # Random check-in time between 6 AM and 10 AM
                    checkin_hour = random.randint(6, 10)
                    checkin_minute = random.randint(0, 59)
                    checkin_time = date.replace(hour=checkin_hour, minute=checkin_minute)
                    
                    # Random checkout time between 2 PM and 6 PM (if not today or if completed)
                    is_completed = day_offset > 0 or random.random() > 0.3  # 70% completed for past days
                    checkout_time = None
                    status = AttendanceStatus.IN_PROGRESS
                    
                    if is_completed:
                        checkout_hour = random.randint(14, 18)
                        checkout_minute = random.randint(0, 59)
                        checkout_time = date.replace(hour=checkout_hour, minute=checkout_minute)
                        status = AttendanceStatus.COMPLETED
                    
                    # Use default coordinates for Jakarta
                    default_lat = -6.2088
                    default_lng = 106.8456
                    
                    attendance = Attendance(
                        user_id=user.id,
                        site_id=site.id,
                        company_id=company.id,
                        role_type=role_type,
                        checkin_time=checkin_time,
                        checkout_time=checkout_time,
                        checkin_lat=default_lat,
                        checkin_lng=default_lng,
                        checkout_lat=default_lat if checkout_time else None,
                        checkout_lng=default_lng if checkout_time else None,
                        shift=str(random.randint(0, 3)),
                        is_overtime=random.random() > 0.7,  # 30% overtime
                        is_backup=random.random() > 0.9,  # 10% backup
                        status=status,
                        is_valid_location=True,
                    )
                    db.add(attendance)
                    attendance_count += 1
        
        db.commit()
        print(f"✅ Created {attendance_count} attendance records")
        
        # Create reports for all divisions
        report_count = 0
        for day_offset in range(7):
            date = today - timedelta(days=day_offset)
            
            for division in ["security", "cleaning", "parking"]:
                user = users[division]
                site = random.choice(sites)
                
                # Create 1-3 reports per day per division
                num_reports = random.randint(1, 3)
                
                for i in range(num_reports):
                    report_types = ["incident", "daily_report", "patrol_log", "finding"]
                    report_type = random.choice(report_types)
                    statuses = ["draft", "submitted", "approved", "rejected"]
                    status = random.choice(statuses)
                    
                    report = SecurityReport(
                        company_id=company.id,
                        site_id=site.id,
                        user_id=user.id,  # Changed from created_by to user_id
                        report_type=report_type,
                        title=f"{division.capitalize()} Report - {date.strftime('%Y-%m-%d')} #{i+1}",
                        description=f"Laporan {division} untuk tanggal {date.strftime('%d/%m/%Y')}. Detail laporan dan temuan.",
                        severity="medium" if report_type == "incident" else None,
                        status=status,
                        created_at=date.replace(hour=random.randint(8, 17), minute=random.randint(0, 59)),
                    )
                    
                    # For cleaning reports, set zone_id
                    if division == "cleaning":
                        # Try to get a cleaning zone if exists
                        try:
                            from app.divisions.cleaning.models import CleaningZone
                            zone = db.query(CleaningZone).filter(CleaningZone.site_id == site.id).first()
                            if zone:
                                report.zone_id = zone.id
                        except:
                            pass  # Ignore if CleaningZone doesn't exist
                    
                    db.add(report)
                    report_count += 1
        
        db.commit()
        print(f"✅ Created {report_count} reports across all divisions")
        
        print("\n✅ Mock data created successfully!")
        print(f"   - Company: {company.name}")
        print(f"   - Sites: {len(sites)}")
        print(f"   - Users: {len(users) + 1} (including supervisor)")
        print(f"   - Attendance records: {attendance_count}")
        print(f"   - Reports: {report_count}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_mock_data()

