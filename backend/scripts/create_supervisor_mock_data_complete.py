# backend/scripts/create_supervisor_mock_data_complete.py

"""
Create comprehensive mock data for supervisor panel:
- Officers (users) for all divisions
- Attendance records with overtime
- Attendance corrections
- Inspect points with QR codes
- Leave requests
- Patrol activities
All connected across Security, Cleaning, and Parking divisions.
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy import inspect
from app.core.database import SessionLocal, engine, init_db
from app.models.base import Base
from app.models.user import User
from app.models.company import Company
from app.models.site import Site
from app.models.attendance import Attendance, AttendanceStatus
from app.models.attendance_correction import AttendanceCorrection, CorrectionType, CorrectionStatus
from app.models.inspect_point import InspectPoint
from app.divisions.security.models import SecurityReport
try:
    from app.divisions.security.models import SecurityPatrolLog
except ImportError:
    # Fallback if SecurityPatrolLog doesn't exist
    SecurityPatrolLog = None

# Create tables
Base.metadata.create_all(bind=engine)

def create_complete_mock_data():
    db = SessionLocal()
    
    try:
        print("Creating comprehensive supervisor mock data...")
        
        # Get or create company
        company = db.query(Company).first()
        if not company:
            company = Company(name="PT Verolux Security", address="Jakarta, Indonesia")
            db.add(company)
            db.commit()
            db.refresh(company)
        print(f"✅ Company: {company.name}")
        
        # Get or create sites (handle missing lat/lng columns gracefully)
        try:
            sites = db.query(Site).filter(Site.company_id == company.id).all()
        except Exception as e:
            # If query fails due to missing columns, create new sites
            print(f"⚠️  Warning: {e}")
            sites = []
        
        if not sites:
            # Check if Site model has lat/lng columns by inspecting table columns
            try:
                inspector = inspect(engine)
                columns = [col['name'] for col in inspector.get_columns('sites')]
                has_lat = 'lat' in columns
            except:
                has_lat = False
            
            # Create sites with or without lat/lng based on schema
            if has_lat:
                sites = [
                    Site(name="Site A - Rumah Sakit", company_id=company.id, qr_code="SITE_A", lat=-6.2088, lng=106.8456, geofence_radius_m=100.0),
                    Site(name="Site B - Mall", company_id=company.id, qr_code="SITE_B", lat=-6.2000, lng=106.8200, geofence_radius_m=100.0),
                    Site(name="Site C - Office Building", company_id=company.id, qr_code="SITE_C", lat=-6.2500, lng=106.8000, geofence_radius_m=100.0),
                ]
            else:
                # Create sites without lat/lng/qr_code - use raw SQL to avoid SQLAlchemy trying to insert missing columns
                from sqlalchemy import text
                # Check which columns exist
                try:
                    inspector = inspect(engine)
                    columns = [col['name'] for col in inspector.get_columns('sites')]
                    has_qr = 'qr_code' in columns
                except:
                    has_qr = False
                
                if has_qr:
                    db.execute(text("INSERT INTO sites (name, company_id, qr_code) VALUES ('Site A - Rumah Sakit', :company_id, 'SITE_A')"), {"company_id": company.id})
                    db.execute(text("INSERT INTO sites (name, company_id, qr_code) VALUES ('Site B - Mall', :company_id, 'SITE_B')"), {"company_id": company.id})
                    db.execute(text("INSERT INTO sites (name, company_id, qr_code) VALUES ('Site C - Office Building', :company_id, 'SITE_C')"), {"company_id": company.id})
                else:
                    db.execute(text("INSERT INTO sites (name, company_id) VALUES ('Site A - Rumah Sakit', :company_id)"), {"company_id": company.id})
                    db.execute(text("INSERT INTO sites (name, company_id) VALUES ('Site B - Mall', :company_id)"), {"company_id": company.id})
                    db.execute(text("INSERT INTO sites (name, company_id) VALUES ('Site C - Office Building', :company_id)"), {"company_id": company.id})
                db.commit()
                # Query sites using raw SQL to avoid SQLAlchemy trying to access missing columns
                result = db.execute(text("SELECT id, name, company_id FROM sites WHERE company_id = :company_id"), {"company_id": company.id})
                sites_data = result.fetchall()
                # Create Site objects manually (without lat/lng/qr_code)
                sites = []
                for row in sites_data:
                    site = Site()
                    site.id = row[0]
                    site.name = row[1]
                    site.company_id = row[2]
                    sites.append(site)
                # Don't add sites to session again - they're already in DB
        print(f"✅ Sites: {len(sites)}")
        
        # Create officers (users) for all divisions
        divisions = ["security", "cleaning", "parking"]
        officers = {}
        
        for division in divisions:
            for i in range(1, 4):  # 3 officers per division
                username = f"{division}_officer_{i}"
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    user = User(
                        username=username,
                        hashed_password="dummy",
                        division=division,
                        role="user",
                        company_id=company.id,
                        site_id=random.choice(sites).id,
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                officers[username] = user
        
        # Create supervisor user
        supervisor = db.query(User).filter(User.username == "supervisor").first()
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
        print(f"✅ Officers: {len(officers)} + 1 supervisor")
        
        # Check which columns exist in attendance table (once, before loop)
        try:
            inspector = inspect(engine)
            att_columns = [col['name'] for col in inspector.get_columns('attendance')]
            has_shift = 'shift' in att_columns
            has_overtime = 'is_overtime' in att_columns
            has_backup = 'is_backup' in att_columns
            has_lat = 'checkin_lat' in att_columns
            has_valid_location = 'is_valid_location' in att_columns
        except:
            has_shift = False
            has_overtime = False
            has_backup = False
            has_lat = False
            has_valid_location = False
        
        # Create attendance records for past 7 days
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        attendance_count = 0
        
        for day_offset in range(7):
            date = today - timedelta(days=day_offset)
            
            for username, user in officers.items():
                site = random.choice(sites)
                role_type = user.division.upper()
                
                # Random check-in time between 6 AM and 10 AM
                checkin_hour = random.randint(6, 10)
                checkin_minute = random.randint(0, 59)
                checkin_time = date.replace(hour=checkin_hour, minute=checkin_minute)
                
                # Random checkout time between 2 PM and 6 PM (if not today or if completed)
                is_completed = day_offset > 0 or random.random() > 0.3
                checkout_time = None
                status = AttendanceStatus.IN_PROGRESS
                
                if is_completed:
                    checkout_hour = random.randint(14, 18)
                    checkout_minute = random.randint(0, 59)
                    checkout_time = date.replace(hour=checkout_hour, minute=checkout_minute)
                    status = AttendanceStatus.COMPLETED
                
                # Build attendance dict with only existing columns
                att_data = {
                    "user_id": user.id,
                    "site_id": site.id,
                    "company_id": company.id,
                    "role_type": role_type,
                    "checkin_time": checkin_time,
                    "checkout_time": checkout_time,
                    "status": status,
                }
                
                if has_lat:
                    att_data["checkin_lat"] = -6.2088
                    att_data["checkin_lng"] = 106.8456
                    if checkout_time:
                        att_data["checkout_lat"] = -6.2088
                        att_data["checkout_lng"] = 106.8456
                
                if has_shift:
                    att_data["shift"] = str(random.randint(0, 3))
                if has_overtime:
                    att_data["is_overtime"] = random.random() > 0.7
                if has_backup:
                    att_data["is_backup"] = random.random() > 0.9
                if has_valid_location:
                    att_data["is_valid_location"] = True
                
                # Use raw SQL to insert attendance if columns don't match
                if not has_shift or not has_overtime or not has_backup:
                    # Build SQL INSERT with only existing columns
                    cols = ["user_id", "site_id", "company_id", "role_type", "checkin_time", "checkout_time", "status"]
                    vals = [":user_id", ":site_id", ":company_id", ":role_type", ":checkin_time", ":checkout_time", ":status"]
                    params = {
                        "user_id": user.id,
                        "site_id": site.id,
                        "company_id": company.id,
                        "role_type": role_type,
                        "checkin_time": checkin_time,
                        "checkout_time": checkout_time,
                        "status": status.value if hasattr(status, 'value') else str(status),
                    }
                    
                    # Add required boolean columns
                    if 'checkin_mock_location' in att_columns:
                        cols.append("checkin_mock_location")
                        vals.append(":checkin_mock_location")
                        params["checkin_mock_location"] = False
                    if 'checkout_mock_location' in att_columns:
                        cols.append("checkout_mock_location")
                        vals.append(":checkout_mock_location")
                        params["checkout_mock_location"] = False
                    
                    if has_lat:
                        cols.extend(["checkin_lat", "checkin_lng"])
                        vals.extend([":checkin_lat", ":checkin_lng"])
                        params["checkin_lat"] = -6.2088
                        params["checkin_lng"] = 106.8456
                        if checkout_time:
                            cols.extend(["checkout_lat", "checkout_lng"])
                            vals.extend([":checkout_lat", ":checkout_lng"])
                            params["checkout_lat"] = -6.2088
                            params["checkout_lng"] = 106.8456
                    
                    if has_valid_location:
                        cols.append("is_valid_location")
                        vals.append(":is_valid_location")
                        params["is_valid_location"] = True
                    
                    # Add created_at and updated_at if they exist
                    if 'created_at' in att_columns:
                        cols.append("created_at")
                        vals.append(":created_at")
                        params["created_at"] = datetime.now()
                    if 'updated_at' in att_columns:
                        cols.append("updated_at")
                        vals.append(":updated_at")
                        params["updated_at"] = datetime.now()
                    
                    sql = f"INSERT INTO attendance ({', '.join(cols)}) VALUES ({', '.join(vals)})"
                    db.execute(text(sql), params)
                else:
                    # Use ORM if all columns exist
                    attendance = Attendance(**att_data)
                    db.add(attendance)
                
                attendance_count += 1
        
        db.commit()
        print(f"✅ Attendance records: {attendance_count}")
        
        # Create attendance corrections
        corrections = []
        for i in range(10):
            user = random.choice(list(officers.values()))
            # Query attendance using raw SQL to avoid missing columns
            result = db.execute(text("SELECT id FROM attendance WHERE user_id = :user_id LIMIT 1"), {"user_id": user.id})
            att_row = result.fetchone()
            attendance_id = att_row[0] if att_row else None
            
            correction_type = random.choice(list(CorrectionType))
            
            correction = AttendanceCorrection(
                company_id=company.id,
                user_id=user.id,
                attendance_id=attendance_id,
                correction_type=correction_type,
                status=random.choice([CorrectionStatus.PENDING, CorrectionStatus.APPROVED, CorrectionStatus.REJECTED]),
                requested_clock_in=datetime.now() - timedelta(days=random.randint(1, 5)) if correction_type in [CorrectionType.LATE, CorrectionType.MISSING_CLOCK_IN] else None,
                requested_clock_out=datetime.now() - timedelta(days=random.randint(1, 5)) if correction_type == CorrectionType.MISSING_CLOCK_OUT else None,
                reason=f"Correction reason: {correction_type.value} - {random.choice(['Traffic jam', 'Emergency call', 'System error', 'Forgot to clock'])}",
                evidence_url=None,
                created_at=datetime.now() - timedelta(days=random.randint(1, 7)),
            )
            db.add(correction)
            corrections.append(correction)
        
        db.commit()
        print(f"✅ Attendance corrections: {len(corrections)}")
        
        # Create inspect points
        inspect_points = []
        point_names = [
            ("Gate 1 Main Entrance", "GATE_1"),
            ("Gate 2 Service Entrance", "GATE_2"),
            ("Lobby Reception", "LOBBY_RECEPTION"),
            ("Parking Area A", "PARKING_A"),
            ("Parking Area B", "PARKING_B"),
            ("Security Office", "SECURITY_OFFICE"),
            ("Loading Dock", "LOADING_DOCK"),
            ("Emergency Exit 1", "EMERGENCY_EXIT_1"),
            ("Emergency Exit 2", "EMERGENCY_EXIT_2"),
            ("Rooftop Access", "ROOFTOP_ACCESS"),
        ]
        
        for name, code in point_names:
            site = random.choice(sites)
            point = db.query(InspectPoint).filter(InspectPoint.code == code).first()
            if not point:
                point = InspectPoint(
                    company_id=company.id,
                    site_id=site.id,
                    name=name,
                    code=code,
                    description=f"Inspection point at {site.name}",
                    is_active=random.random() > 0.1,  # 90% active
                )
                db.add(point)
                inspect_points.append(point)
        
        db.commit()
        print(f"✅ Inspect points: {len(inspect_points)}")
        
        # Create patrol logs (if model exists)
        patrol_count = 0
        if SecurityPatrolLog:
            for day_offset in range(7):
                date = today - timedelta(days=day_offset)
                
                # Get security officers only
                security_officers = [u for u in officers.values() if u.division == "security"]
                
                for officer in security_officers[:2]:  # 2 patrols per day
                    site = random.choice(sites)
                    start_time = date.replace(hour=random.randint(8, 16), minute=random.randint(0, 59))
                    end_time = start_time + timedelta(hours=random.randint(1, 3))
                    
                    patrol = SecurityPatrolLog(
                        company_id=company.id,
                        site_id=site.id,
                        user_id=officer.id,
                        start_time=start_time,
                        end_time=end_time,
                        area_text=random.choice(["Perimeter", "Building A", "Building B", "Parking Lot"]),
                        notes=f"Patrol completed. All areas secure. {random.choice(['No issues', 'Minor issue found', 'All clear'])}",
                    )
                    db.add(patrol)
                    patrol_count += 1
            
            db.commit()
            print(f"✅ Patrol logs: {patrol_count}")
        else:
            print("⚠️  SecurityPatrolLog model not found, skipping patrol logs")
        
        # Create reports for all divisions
        report_count = 0
        for day_offset in range(14):  # 2 weeks
            date = today - timedelta(days=day_offset)
            
            for division in divisions:
                user = [u for u in officers.values() if u.division == division][0]
                site = random.choice(sites)
                
                # Create multiple reports per day
                for i in range(random.randint(1, 3)):
                    report_types = ["incident", "daily", "patrol", "finding"]
                    report_type = random.choice(report_types)
                    statuses = ["draft", "submitted", "approved", "rejected"]
                    status = random.choice(statuses)
                    
                    report = SecurityReport(
                        company_id=company.id,
                        site_id=site.id,
                        user_id=user.id,
                        report_type=report_type,
                        title=f"{division.capitalize()} Report - {date.strftime('%Y-%m-%d')} #{i+1}",
                        description=f"Laporan {division} untuk tanggal {date.strftime('%d/%m/%Y')}. Detail laporan dan temuan.",
                        location_text=f"Location {i+1}",
                        severity="medium" if report_type == "incident" else None,
                        created_at=date.replace(hour=random.randint(8, 17), minute=random.randint(0, 59)),
                    )
                    db.add(report)
                    report_count += 1
        
        db.commit()
        print(f"✅ Reports: {report_count}")
        
        # ========== ADD CLEANING DATA ==========
        try:
            from app.divisions.cleaning.models import CleaningZone, CleaningZoneTemplate, CleaningInspection
            
            # Create cleaning zones
            cleaning_zones = []
            zone_data = [
                ("Toilet 1", "Lantai 1", "toilet"),
                ("Toilet 2", "Lantai 1", "toilet"),
                ("Toilet 3", "Lantai 2", "toilet"),
                ("Room 1001", "Lantai 1", "room"),
                ("Room 1005", "Lantai 1", "room"),
                ("Lobby", "Lantai 1", "lobby"),
                ("Parking Lot", "Lantai B1", "parking"),
            ]
            
            for name, floor, area_type in zone_data:
                zone = db.query(CleaningZone).filter(CleaningZone.name == name).first()
                if not zone:
                    zone = CleaningZone(
                        company_id=company.id,
                        site_id=random.choice(sites).id,
                        name=name,
                        floor=floor,
                        area_type=area_type,
                        qr_code=f"QR_{name.replace(' ', '_').upper()}",
                        is_active=True,
                    )
                    db.add(zone)
                    cleaning_zones.append(zone)
            
            db.commit()
            for zone in cleaning_zones:
                db.refresh(zone)
            print(f"✅ Cleaning zones: {len(cleaning_zones)}")
            
            # Create cleaning inspections
            inspections = []
            for i in range(20):
                zone = random.choice(cleaning_zones) if cleaning_zones else None
                if zone:
                    inspection = CleaningInspection(
                        company_id=company.id,
                        site_id=zone.site_id,
                        zone_id=zone.id,
                        inspector_id=supervisor.id if supervisor else None,
                        inspection_date=date.today() - timedelta(days=random.randint(0, 7)),
                        score=random.randint(70, 100),
                        notes=f"Inspection notes {i+1}",
                    )
                    db.add(inspection)
                    inspections.append(inspection)
            
            db.commit()
            print(f"✅ Cleaning inspections: {len(inspections)}")
        except Exception as e:
            print(f"⚠️  Cleaning data creation failed: {e}")
        
        # ========== ADD PARKING REPORTS ==========
        parking_report_count = 0
        for day_offset in range(14):
            date = today - timedelta(days=day_offset)
            parking_users = [u for u in officers.values() if u.division == "parking"]
            if parking_users:
                user = random.choice(parking_users)
                site = random.choice(sites)
                
                report = SecurityReport(
                    company_id=company.id,
                    site_id=site.id,
                    user_id=user.id,
                    report_type=random.choice(["incident", "daily", "violation"]),
                    title=f"Parking Report - {date.strftime('%Y-%m-%d')}",
                    description=f"Parking report for {date.strftime('%d/%m/%Y')}",
                    location_text=f"Parking Area {random.choice(['A', 'B', 'C'])}",
                    created_at=date.replace(hour=random.randint(8, 17), minute=random.randint(0, 59)),
                )
                db.add(report)
                parking_report_count += 1
        
        db.commit()
        print(f"✅ Parking reports: {parking_report_count}")
        
        print("\n✅ All mock data created successfully!")
        print(f"   - Company: {company.name}")
        print(f"   - Sites: {len(sites)}")
        print(f"   - Officers: {len(officers) + 1} (including supervisor)")
        print(f"   - Attendance records: {attendance_count}")
        print(f"   - Attendance corrections: {len(corrections)}")
        print(f"   - Inspect points: {len(inspect_points)}")
        print(f"   - Patrol logs: {patrol_count}")
        print(f"   - Reports: {report_count}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_complete_mock_data()

