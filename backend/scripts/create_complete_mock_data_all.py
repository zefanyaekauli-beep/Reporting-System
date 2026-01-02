#!/usr/bin/env python3
"""
Create COMPLETE mock data for ALL functions:
- Security (attendance, reports, patrols, checklists, shifts)
- Cleaning (attendance, reports, zones, inspections, checklists, shifts)
- Parking (attendance, reports, sessions, checklists, shifts)
- Supervisor (all pages: officers, attendance, corrections, overtime, outstation, leave, approval, patrol, inspect points, reports, sites)
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, date
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from app.core.database import SessionLocal, engine, init_db
from app.models.base import Base
from app.models.user import User
from app.core.security import get_password_hash
from app.models.company import Company
from app.models.site import Site
from app.models.attendance import Attendance, AttendanceStatus
from app.models.attendance_correction import AttendanceCorrection, CorrectionType, CorrectionStatus
from app.models.inspect_point import InspectPoint
from app.models.leave_request import LeaveRequest, RequestStatus, RequestType

# Security models
from app.divisions.security.models import (
    SecurityReport, SecurityPatrolLog, ChecklistTemplate, ChecklistTemplateItem,
    Checklist, ChecklistItem, ChecklistStatus, ChecklistItemStatus
)

# Cleaning models
try:
    from app.divisions.cleaning.models import (
        CleaningZone, CleaningZoneTemplate, CleaningInspection
    )
    CLEANING_AVAILABLE = True
except ImportError:
    CLEANING_AVAILABLE = False
    print("⚠️  Cleaning models not available")

# Parking models - Parking uses SecurityReport model
PARKING_AVAILABLE = True
PARKING_USES_SECURITY_REPORT = True

# Create tables
Base.metadata.create_all(bind=engine)

def create_complete_mock_data():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("Creating COMPLETE mock data for ALL functions")
        print("=" * 60)
        
        # ========== 1. COMPANY & SITES ==========
        company = db.query(Company).first()
        if not company:
            company = Company(name="PT Verolux Security", address="Jakarta, Indonesia")
            db.add(company)
            db.commit()
            db.refresh(company)
        print(f"✅ Company: {company.name}")
        
        # Create sites
        sites = db.query(Site).filter(Site.company_id == company.id).all()
        if not sites:
            sites = [
                Site(name="Rumah Sakit Umum", company_id=company.id, qr_code="SITE_RS"),
                Site(name="Mall Central", company_id=company.id, qr_code="SITE_MALL"),
                Site(name="Gedung Perkantoran", company_id=company.id, qr_code="SITE_OFFICE"),
            ]
            for site in sites:
                db.add(site)
            db.commit()
            for site in sites:
                db.refresh(site)
        print(f"✅ Sites: {len(sites)}")
        
        # ========== 2. USERS (Officers) ==========
        users_by_division = {
            "security": [],
            "cleaning": [],
            "parking": [],
            "driver": [],
        }
        
        # Default password for all mock users
        DEFAULT_PASSWORD = "password123"
        
        # Security users
        for i in range(1, 6):
            username = f"security{i}"
            user = db.query(User).filter(User.username == username).first()
            if not user:
                user = User(
                    username=username,
                    hashed_password=get_password_hash(DEFAULT_PASSWORD),
                    division="security",
                    role="guard",
                    company_id=company.id,
                    site_id=random.choice(sites).id,
                )
                db.add(user)
            elif user.hashed_password == "dummy" or len(user.hashed_password) < 20:
                # Fix existing user with invalid password
                user.hashed_password = get_password_hash(DEFAULT_PASSWORD)
            users_by_division["security"].append(user)
        
        # Cleaning users
        for i in range(1, 5):
            username = f"cleaning{i}"
            user = db.query(User).filter(User.username == username).first()
            if not user:
                user = User(
                    username=username,
                    hashed_password=get_password_hash(DEFAULT_PASSWORD),
                    division="cleaning",
                    role="CLEANER",
                    company_id=company.id,
                    site_id=random.choice(sites).id,
                )
                db.add(user)
            elif user.hashed_password == "dummy" or len(user.hashed_password) < 20:
                # Fix existing user with invalid password
                user.hashed_password = get_password_hash(DEFAULT_PASSWORD)
            users_by_division["cleaning"].append(user)
        
        # Parking users
        for i in range(1, 4):
            username = f"parking{i}"
            user = db.query(User).filter(User.username == username).first()
            if not user:
                user = User(
                    username=username,
                    hashed_password=get_password_hash(DEFAULT_PASSWORD),
                    division="parking",
                    role="user",
                    company_id=company.id,
                    site_id=random.choice(sites).id,
                )
                db.add(user)
            elif user.hashed_password == "dummy" or len(user.hashed_password) < 20:
                # Fix existing user with invalid password
                user.hashed_password = get_password_hash(DEFAULT_PASSWORD)
            users_by_division["parking"].append(user)
        
        # Supervisor
        supervisor = db.query(User).filter(User.username == "supervisor").first()
        if not supervisor:
            supervisor = User(
                username="supervisor",
                hashed_password=get_password_hash(DEFAULT_PASSWORD),
                division="security",
                role="supervisor",
                company_id=company.id,
            )
            db.add(supervisor)
        elif supervisor.hashed_password == "dummy" or len(supervisor.hashed_password) < 20:
            # Fix existing supervisor with invalid password
            supervisor.hashed_password = get_password_hash(DEFAULT_PASSWORD)
        
        db.commit()
        for user_list in users_by_division.values():
            for user in user_list:
                db.refresh(user)
        if supervisor:
            db.refresh(supervisor)
        
        print(f"✅ Users: {sum(len(u) for u in users_by_division.values())} officers + 1 supervisor")
        
        # ========== 3. ATTENDANCE (All divisions) ==========
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        attendance_count = 0
        
        role_type_map = {
            "security": "SECURITY",
            "cleaning": "CLEANING",
            "parking": "PARKING",
            "driver": "DRIVER",
        }
        
        for division, users in users_by_division.items():
            for day_offset in range(14):  # 2 weeks
                date = today - timedelta(days=day_offset)
                
                for user in users:
                    site = random.choice(sites)
                    role_type = role_type_map.get(division, "SECURITY")
                    
                    # Check-in
                    checkin_hour = random.randint(6, 10)
                    checkin_minute = random.randint(0, 59)
                    checkin_time = date.replace(hour=checkin_hour, minute=checkin_minute)
                    
                    # Check-out (90% completed)
                    is_completed = day_offset > 0 or random.random() > 0.1
                    checkout_time = None
                    status = AttendanceStatus.IN_PROGRESS
                    
                    if is_completed:
                        checkout_hour = random.randint(14, 18)
                        checkout_minute = random.randint(0, 59)
                        checkout_time = date.replace(hour=checkout_hour, minute=checkout_minute)
                        status = AttendanceStatus.COMPLETED
                    
                    attendance = Attendance(
                        user_id=user.id,
                        site_id=site.id,
                        company_id=company.id,
                        role_type=role_type,
                        checkin_time=checkin_time,
                        checkout_time=checkout_time,
                        status=status,
                        shift=str(random.randint(0, 3)),
                        is_overtime=random.random() > 0.8,
                        is_backup=random.random() > 0.9,
                        checkin_lat=-6.2088,
                        checkin_lng=106.8456,
                        checkout_lat=-6.2088 if checkout_time else None,
                        checkout_lng=106.8456 if checkout_time else None,
                        is_valid_location=True,
                    )
                    db.add(attendance)
                    attendance_count += 1
        
        db.commit()
        print(f"✅ Attendance records: {attendance_count}")
        
        # ========== 4. ATTENDANCE CORRECTIONS ==========
        corrections = []
        for i in range(20):
            user = random.choice([u for users in users_by_division.values() for u in users])
            att = db.query(Attendance).filter(Attendance.user_id == user.id).first()
            
            correction = AttendanceCorrection(
                company_id=company.id,
                user_id=user.id,
                attendance_id=att.id if att else None,
                correction_type=random.choice(list(CorrectionType)),
                status=random.choice(list(CorrectionStatus)),
                requested_clock_in=datetime.now() - timedelta(days=random.randint(1, 5)) if random.random() > 0.5 else None,
                requested_clock_out=datetime.now() - timedelta(days=random.randint(1, 5)) if random.random() > 0.5 else None,
                reason=f"Correction: {random.choice(['Traffic jam', 'Emergency', 'System error', 'Forgot'])}",
                created_at=datetime.now() - timedelta(days=random.randint(1, 14)),
            )
            db.add(correction)
            corrections.append(correction)
        
        db.commit()
        print(f"✅ Attendance corrections: {len(corrections)}")
        
        # ========== 5. LEAVE REQUESTS ==========
        leave_requests = []
        for i in range(15):
            user = random.choice([u for users in users_by_division.values() for u in users])
            
            leave = LeaveRequest(
                company_id=company.id,
                user_id=user.id,
                request_type=random.choice(list(RequestType)),
                start_date=date.today() + timedelta(days=random.randint(1, 30)),
                end_date=date.today() + timedelta(days=random.randint(31, 60)),
                reason=f"Leave reason: {random.choice(['Sick', 'Family', 'Personal', 'Holiday'])}",
                status=random.choice(list(RequestStatus)),
                created_at=datetime.now() - timedelta(days=random.randint(1, 7)),
            )
            db.add(leave)
            leave_requests.append(leave)
        
        db.commit()
        print(f"✅ Leave requests: {len(leave_requests)}")
        
        # ========== 6. INSPECT POINTS ==========
        inspect_points = []
        point_data = [
            ("Gate 1", "GATE_1"),
            ("Gate 2", "GATE_2"),
            ("Lobby", "LOBBY"),
            ("Parking A", "PARKING_A"),
            ("Parking B", "PARKING_B"),
            ("Security Office", "SECURITY_OFFICE"),
            ("Loading Dock", "LOADING_DOCK"),
            ("Emergency Exit 1", "EMERGENCY_1"),
            ("Emergency Exit 2", "EMERGENCY_2"),
            ("Rooftop", "ROOFTOP"),
        ]
        
        for name, code in point_data:
            point = db.query(InspectPoint).filter(InspectPoint.code == code).first()
            if not point:
                point = InspectPoint(
                    company_id=company.id,
                    site_id=random.choice(sites).id,
                    name=name,
                    code=code,
                    description=f"Inspect point: {name}",
                    is_active=True,
                )
                db.add(point)
                inspect_points.append(point)
        
        db.commit()
        print(f"✅ Inspect points: {len(inspect_points)}")
        
        # ========== 7. SECURITY REPORTS ==========
        security_reports = []
        for i in range(30):
            user = random.choice(users_by_division["security"])
            site = random.choice(sites)
            
            report = SecurityReport(
                company_id=company.id,
                site_id=site.id,
                user_id=user.id,
                division="SECURITY",
                report_type=random.choice(["incident", "daily", "patrol"]),
                title=f"Report {i+1}: {random.choice(['Incident', 'Daily Activity', 'Patrol'])}",
                description=f"Description for report {i+1}",
                location_text=f"Location {i+1}",
                created_at=datetime.now() - timedelta(days=random.randint(0, 14)),
            )
            db.add(report)
            security_reports.append(report)
        
        db.commit()
        print(f"✅ Security reports: {len(security_reports)}")
        
        # ========== 8. SECURITY PATROLS ==========
        patrols = []
        for i in range(25):
            user = random.choice(users_by_division["security"])
            site = random.choice(sites)
            
            start_time = datetime.now() - timedelta(days=random.randint(0, 14), hours=random.randint(0, 8))
            end_time = start_time + timedelta(minutes=random.randint(30, 120))
            
            patrol = SecurityPatrolLog(
                company_id=company.id,
                site_id=site.id,
                user_id=user.id,
                start_time=start_time,
                end_time=end_time,
                area_text=f"Route {random.randint(1, 5)}",
                notes=f"Patrol notes {i+1}",
            )
            db.add(patrol)
            patrols.append(patrol)
        
        db.commit()
        print(f"✅ Security patrols: {len(patrols)}")
        
        # ========== 9. CLEANING DATA ==========
        if CLEANING_AVAILABLE:
            # Cleaning zones
            cleaning_zones = []
            zone_names = [
                ("Toilet 1", "Lantai 1", "toilet"),
                ("Toilet 2", "Lantai 1", "toilet"),
                ("Toilet 3", "Lantai 2", "toilet"),
                ("Room 1001", "Lantai 1", "room"),
                ("Room 1005", "Lantai 1", "room"),
                ("Lobby", "Lantai 1", "lobby"),
                ("Parking Lot", "Lantai B1", "parking"),
            ]
            
            for name, floor, area_type in zone_names:
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
            
            # Cleaning reports (using SecurityReport model)
            cleaning_reports = []
            for i in range(20):
                user = random.choice(users_by_division["cleaning"])
                site = random.choice(sites)
                zone = random.choice(cleaning_zones) if cleaning_zones else None
                
                report = SecurityReport(
                    company_id=company.id,
                    site_id=site.id,
                    user_id=user.id,
                    division="CLEANING",
                    report_type=random.choice(["incident", "daily", "inspection"]),
                    title=f"Cleaning Report {i+1}",
                    description=f"Cleaning report description {i+1} - Zone: {zone.name if zone else 'N/A'}",
                    location_text=f"Zone: {zone.name if zone else 'General'}" if zone else None,
                    zone_id=zone.id if zone else None,
                    created_at=datetime.now() - timedelta(days=random.randint(0, 14)),
                )
                db.add(report)
                cleaning_reports.append(report)
            
            db.commit()
            print(f"✅ Cleaning reports: {len(cleaning_reports)}")
            
            # Cleaning inspections
            inspections = []
            for i in range(15):
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
        
        # ========== 10. PARKING DATA ==========
        if PARKING_AVAILABLE:
            # Parking reports (using SecurityReport model with role_type or division marker)
            parking_reports = []
            for i in range(15):
                user = random.choice(users_by_division["parking"])
                site = random.choice(sites)
                
                # Use SecurityReport but mark as parking
                report = SecurityReport(
                    company_id=company.id,
                    site_id=site.id,
                    user_id=user.id,
                    division="PARKING",
                    report_type=random.choice(["incident", "daily", "violation"]),
                    title=f"Parking Report {i+1}",
                    description=f"Parking report description {i+1}",
                    location_text=f"Parking Area {random.choice(['A', 'B', 'C'])}",
                    created_at=datetime.now() - timedelta(days=random.randint(0, 14)),
                )
                db.add(report)
                parking_reports.append(report)
            
            db.commit()
            print(f"✅ Parking reports: {len(parking_reports)}")
        
        # ========== 11. CHECKLISTS (Security) ==========
        # Create checklist templates
        template = db.query(ChecklistTemplate).filter(ChecklistTemplate.name == "Daily Security Checklist").first()
        if not template:
            template = ChecklistTemplate(
                company_id=company.id,
                site_id=sites[0].id,
                name="Daily Security Checklist",
                role="guard",
                shift_type="MORNING",
            )
            db.add(template)
            db.commit()
            db.refresh(template)
            
            # Add items
            items_data = [
                ("Check perimeter", "Inspect all gates and fences", True),
                ("Check CCTV", "Verify all cameras working", True),
                ("Check fire extinguishers", "Verify all extinguishers in place", False),
                ("Check visitor log", "Review visitor entries", True),
            ]
            
            for idx, (title, desc, required) in enumerate(items_data):
                item = ChecklistTemplateItem(
                    template_id=template.id,
                    title=title,
                    description=desc,
                    required=required,
                    order=idx + 1,
                )
                db.add(item)
            
            db.commit()
            print(f"✅ Checklist template created")
        
        # Create checklist instances
        checklists = []
        for i in range(20):
            user = random.choice(users_by_division["security"])
            site = random.choice(sites)
            
            checklist = Checklist(
                company_id=company.id,
                site_id=site.id,
                user_id=user.id,
                template_id=template.id,
                shift_date=date.today() - timedelta(days=random.randint(0, 7)),
                status=random.choice(list(ChecklistStatus)),
                created_at=datetime.now() - timedelta(days=random.randint(0, 7)),
            )
            db.add(checklist)
            checklists.append(checklist)
        
        db.commit()
        for checklist in checklists:
            db.refresh(checklist)
        
        # Add checklist items
        for checklist in checklists:
            template_items = db.query(ChecklistTemplateItem).filter(ChecklistTemplateItem.template_id == template.id).all()
            for template_item in template_items:
                item = ChecklistItem(
                    checklist_id=checklist.id,
                    template_item_id=template_item.id,
                    title=template_item.title,
                    description=template_item.description,
                    required=template_item.required,
                    status=random.choice(list(ChecklistItemStatus)),
                    order=template_item.order,
                )
                db.add(item)
        
        db.commit()
        print(f"✅ Checklists: {len(checklists)}")
        
        print("\n" + "=" * 60)
        print("✅ COMPLETE mock data created successfully!")
        print("=" * 60)
        print(f"   - {len(sites)} Sites")
        print(f"   - {sum(len(u) for u in users_by_division.values())} Officers")
        print(f"   - {attendance_count} Attendance records")
        print(f"   - {len(corrections)} Attendance corrections")
        print(f"   - {len(leave_requests)} Leave requests")
        print(f"   - {len(inspect_points)} Inspect points")
        print(f"   - {len(security_reports)} Security reports")
        print(f"   - {len(patrols)} Security patrols")
        if CLEANING_AVAILABLE:
            print(f"   - {len(cleaning_zones)} Cleaning zones")
            print(f"   - {len(cleaning_reports)} Cleaning reports")
            print(f"   - {len(inspections)} Cleaning inspections")
        if PARKING_AVAILABLE:
            print(f"   - {len(parking_reports)} Parking reports")
        print(f"   - {len(checklists)} Checklists")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_complete_mock_data()

