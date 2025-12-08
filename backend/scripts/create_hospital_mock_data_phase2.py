#!/usr/bin/env python3
"""
Create mock data for hospital system - Phase 2: Security, Driver, Attendance, etc.
Run: python3 scripts/create_hospital_mock_data_phase2.py
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
from app.models.attendance import Attendance, AttendanceStatus
from app.divisions.security.models import (
    SecurityAttendance,
    SecurityReport,
    SecurityPatrolLog,
    ChecklistTemplate,
    ChecklistTemplateItem,
    Checklist,
    ChecklistItem,
    ChecklistStatus,
    ChecklistItemStatus,
    DispatchTicket,
    DispatchStatus,
    PanicAlert,
    DailyActivityReport,
    ShiftHandover,
    PatrolRoute,
    PatrolCheckpoint,
    PatrolCheckpointScan,
    PostOrder,
    PostOrderAcknowledgment,
    ShiftSchedule,
    GuardLocation,
    IdleAlert,
    ShiftExchange,
)
from app.divisions.driver.models import (
    Vehicle,
    VehicleStatus,
    DriverTrip,
    TripStatus,
    DriverTripStop,
    DriverTripEvent,
    TripEventType,
)
from app.divisions.cleaning.models import CleaningZone, CleaningZoneTemplate

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def create_users_and_attendance(db: Session, company_id: int, site_id: int):
    """Create users and attendance records."""
    
    print("Creating users and attendance...")
    
    # Create users for different roles
    users_data = [
        {"username": "security1", "division": "security", "role": "GUARD", "name": "Budi Santoso"},
        {"username": "security2", "division": "security", "role": "GUARD", "name": "Ahmad Rizki"},
        {"username": "supervisor1", "division": "security", "role": "SUPERVISOR", "name": "Siti Nurhaliza"},
        {"username": "cleaning1", "division": "cleaning", "role": "CLEANER", "name": "Maya Sari"},
        {"username": "cleaning2", "division": "cleaning", "role": "CLEANER", "name": "Dewi Lestari"},
        {"username": "driver1", "division": "driver", "role": "DRIVER", "name": "Joko Widodo"},
        {"username": "driver2", "division": "driver", "role": "DRIVER", "name": "Bambang Sutrisno"},
        {"username": "admin1", "division": "security", "role": "ADMIN", "name": "Admin System"},
    ]
    
    created_users = {}
    for user_data in users_data:
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        if not existing:
            user = User(
                username=user_data["username"],
                hashed_password="dummy_hash",
                division=user_data["division"],
                role=user_data["role"],
                company_id=company_id,
                site_id=site_id,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            created_users[user_data["username"]] = user
        else:
            created_users[user_data["username"]] = existing
    
    # Create attendance records for the last 7 days
    today = date.today()
    for day_offset in range(7):
        shift_date = today - timedelta(days=day_offset)
        
        # Security attendance
        for guard_username in ["security1", "security2"]:
            if guard_username in created_users:
                guard = created_users[guard_username]
                # Check if attendance exists
                existing = db.query(SecurityAttendance).filter(
                    SecurityAttendance.user_id == guard.id,
                    SecurityAttendance.shift_date == shift_date
                ).first()
                
                if not existing:
                    check_in_time = datetime.combine(shift_date, datetime.min.time().replace(hour=7))
                    check_out_time = datetime.combine(shift_date, datetime.min.time().replace(hour=19))
                    
                    attendance = SecurityAttendance(
                        company_id=company_id,
                        site_id=site_id,
                        user_id=guard.id,
                        shift_date=shift_date,
                        check_in_time=check_in_time,
                        check_out_time=check_out_time if day_offset < 3 else None,  # Some not checked out
                        check_in_location="Gerbang Utama",
                        check_out_location="Gerbang Utama" if day_offset < 3 else None,
                    )
                    db.add(attendance)
        
        # Unified Attendance (for all roles)
        for cleaner_username in ["cleaning1", "cleaning2"]:
            if cleaner_username in created_users:
                cleaner = created_users[cleaner_username]
                existing = db.query(Attendance).filter(
                    Attendance.user_id == cleaner.id,
                    Attendance.checkin_time >= datetime.combine(shift_date, datetime.min.time()),
                    Attendance.checkin_time < datetime.combine(shift_date + timedelta(days=1), datetime.min.time())
                ).first()
                
                if not existing:
                    checkin_time = datetime.combine(shift_date, datetime.min.time().replace(hour=6))
                    checkout_time = datetime.combine(shift_date, datetime.min.time().replace(hour=14))
                    
                    attendance = Attendance(
                        user_id=cleaner.id,
                        company_id=company_id,
                        site_id=site_id,
                        role_type="CLEANING",
                        checkin_time=checkin_time,
                        checkout_time=checkout_time if day_offset < 5 else None,
                        checkin_lat=-6.2088,
                        checkin_lng=106.8456,
                        checkout_lat=-6.2088 if day_offset < 5 else None,
                        checkout_lng=106.8456 if day_offset < 5 else None,
                        status=AttendanceStatus.COMPLETED if day_offset < 5 else AttendanceStatus.IN_PROGRESS,
                        is_valid_location=True,
                    )
                    db.add(attendance)
    
    db.commit()
    print(f"✓ Created users and attendance records")
    return created_users

def create_security_reports(db: Session, company_id: int, site_id: int, users: dict):
    """Create security reports."""
    
    print("Creating security reports...")
    
    # Add missing columns if they don't exist
    from sqlalchemy import inspect
    inspector = inspect(db.bind)
    columns = [col['name'] for col in inspector.get_columns('security_reports')]
    
    if 'zone_id' not in columns:
        print("Adding context columns to security_reports...")
        try:
            db.execute(text("ALTER TABLE security_reports ADD COLUMN zone_id INTEGER"))
            db.execute(text("ALTER TABLE security_reports ADD COLUMN vehicle_id INTEGER"))
            db.execute(text("ALTER TABLE security_reports ADD COLUMN trip_id INTEGER"))
            db.execute(text("ALTER TABLE security_reports ADD COLUMN checklist_id INTEGER"))
            db.commit()
            print("✓ Context columns added")
        except Exception as e:
            print(f"Warning: Could not add context columns: {e}")
            db.rollback()
    
    today = date.today()
    reports_data = [
        {
            "user": "security1",
            "report_type": "incident",
            "title": "Kendaraan mencurigakan di area parkir",
            "description": "Mobil hitam tanpa plat nomor terparkir di area parkir selama 2 jam",
            "severity": "medium",
            "location_text": "Area Parkir Blok A",
            "days_ago": 1,
        },
        {
            "user": "security2",
            "report_type": "daily",
            "title": "Laporan Harian Shift Malam",
            "description": "Semua area aman, tidak ada insiden",
            "severity": "low",
            "location_text": "Seluruh Area",
            "days_ago": 0,
        },
        {
            "user": "security1",
            "report_type": "finding",
            "title": "Lampu penerangan mati di koridor lantai 2",
            "description": "3 lampu penerangan di koridor lantai 2 tidak menyala",
            "severity": "medium",
            "location_text": "Koridor Lantai 2",
            "days_ago": 2,
        },
        {
            "user": "security2",
            "report_type": "incident",
            "title": "Pasien tersesat di lantai 3",
            "description": "Pasien lansia tersesat, dibantu kembali ke ruangannya",
            "severity": "low",
            "location_text": "Lantai 3",
            "days_ago": 3,
        },
    ]
    
    dummy_user_id = 1
    created_count = 0
    
    for report_data in reports_data:
        if report_data["user"] in users:
            user = users[report_data["user"]]
            created_at = datetime.combine(today - timedelta(days=report_data["days_ago"]), datetime.min.time().replace(hour=10))
            
            report = SecurityReport(
                company_id=company_id,
                site_id=site_id,
                user_id=user.id,
                report_type=report_data["report_type"],
                title=report_data["title"],
                description=report_data["description"],
                severity=report_data["severity"],
                location_text=report_data["location_text"],
                status="open" if report_data["days_ago"] < 2 else "closed",
            )
            db.add(report)
            created_count += 1
        
        # Also create for dummy user (user_id=1)
        created_at = datetime.combine(today - timedelta(days=report_data["days_ago"]), datetime.min.time().replace(hour=10))
        report = SecurityReport(
            company_id=company_id,
            site_id=site_id,
            user_id=dummy_user_id,
            report_type=report_data["report_type"],
            title=report_data["title"] + " (User 1)",
            description=report_data["description"],
            severity=report_data["severity"],
            location_text=report_data["location_text"],
            status="open" if report_data["days_ago"] < 2 else "closed",
        )
        db.add(report)
        created_count += 1
    
    db.commit()
    print(f"✓ Created {created_count} security reports (including user_id=1)")

def create_patrol_logs(db: Session, company_id: int, site_id: int, users: dict):
    """Create patrol logs."""
    
    print("Creating patrol logs...")
    
    today = date.today()
    patrols_data = [
        {
            "user": "security1",
            "area": "Gerbang Utama → Lantai 1 → Lantai 2",
            "notes": "Semua area aman, tidak ada temuan",
            "days_ago": 0,
            "hour": 14,
        },
        {
            "user": "security2",
            "area": "Area Parkir → Lobby → Koridor",
            "notes": "Area parkir penuh, perlu penambahan rambu",
            "days_ago": 1,
            "hour": 20,
        },
    ]
    
    dummy_user_id = 1
    for patrol_data in patrols_data:
        if patrol_data["user"] in users:
            user = users[patrol_data["user"]]
            start_time = datetime.combine(today - timedelta(days=patrol_data["days_ago"]), datetime.min.time().replace(hour=patrol_data["hour"]))
            end_time = start_time + timedelta(minutes=45)
            
            patrol = SecurityPatrolLog(
                company_id=company_id,
                site_id=site_id,
                user_id=user.id,
                start_time=start_time,
                end_time=end_time,
                area_text=patrol_data["area"],
                notes=patrol_data["notes"],
            )
            db.add(patrol)
        
        # Also create for dummy user (user_id=1)
        start_time = datetime.combine(today - timedelta(days=patrol_data["days_ago"]), datetime.min.time().replace(hour=patrol_data["hour"]))
        end_time = start_time + timedelta(minutes=45)
        patrol = SecurityPatrolLog(
            company_id=company_id,
            site_id=site_id,
            user_id=dummy_user_id,
            start_time=start_time,
            end_time=end_time,
            area_text=patrol_data["area"],
            notes=patrol_data["notes"],
        )
        db.add(patrol)
    
    db.commit()
    print(f"✓ Created {len(patrols_data) * 2} patrol logs (including user_id=1)")

def create_dispatch_tickets(db: Session, company_id: int, site_id: int, users: dict):
    """Create dispatch tickets."""
    
    print("Creating dispatch tickets...")
    
    today = date.today()
    tickets_data = [
        {
            "caller_name": "Dr. Sari",
            "caller_phone": "081234567890",
            "incident_type": "Medical Emergency",
            "priority": "high",
            "description": "Pasien jatuh di lantai 2, butuh bantuan",
            "location": "Lantai 2, Ruang 2001",
            "assigned_to": "security1",
            "status": DispatchStatus.CLOSED,
            "days_ago": 1,
        },
        {
            "caller_name": "Nurse Maya",
            "caller_phone": "081234567891",
            "incident_type": "Disturbance",
            "priority": "medium",
            "description": "Pengunjung membuat keributan di lobby",
            "location": "Lobby Utama",
            "assigned_to": "security2",
            "status": DispatchStatus.ONSCENE,
            "days_ago": 0,
        },
    ]
    
    for idx, ticket_data in enumerate(tickets_data):
        assigned_user = users.get(ticket_data["assigned_to"])
        ticket_date = today - timedelta(days=ticket_data["days_ago"])
        created_at = datetime.combine(ticket_date, datetime.min.time().replace(hour=15))
        
        # Check if ticket already exists
        ticket_number = f"TKT-{ticket_date.strftime('%Y%m%d')}-{idx + 1}"
        existing = db.query(DispatchTicket).filter(DispatchTicket.ticket_number == ticket_number).first()
        if existing:
            continue
        
        ticket = DispatchTicket(
            company_id=company_id,
            site_id=site_id,
            ticket_number=ticket_number,
            caller_name=ticket_data["caller_name"],
            caller_phone=ticket_data["caller_phone"],
            incident_type=ticket_data["incident_type"],
            priority=ticket_data["priority"],
            description=ticket_data["description"],
            location=ticket_data["location"],
            status=ticket_data["status"],
            assigned_to_user_id=assigned_user.id if assigned_user else None,
            assigned_at=created_at if assigned_user else None,
        )
        db.add(ticket)
    
    db.commit()
    print(f"✓ Created {len(tickets_data)} dispatch tickets")

def create_vehicles_and_trips(db: Session, company_id: int, site_id: int, users: dict):
    """Create vehicles and driver trips."""
    
    print("Creating vehicles and trips...")
    
    from app.divisions.driver.models import VehicleType
    
    vehicles_data = [
        {"plate": "B 1234 RS", "make": "Toyota", "model": "Avanza", "year": 2020, "type": VehicleType.CAR, "capacity": 7},
        {"plate": "B 5678 RS", "make": "Suzuki", "model": "Ertiga", "year": 2021, "type": VehicleType.CAR, "capacity": 7},
        {"plate": "B 9012 RS", "make": "Daihatsu", "model": "Gran Max", "year": 2019, "type": VehicleType.TRUCK, "capacity": 1000},
    ]
    
    created_vehicles = {}
    for vehicle_data in vehicles_data:
        existing = db.query(Vehicle).filter(Vehicle.plate_number == vehicle_data["plate"]).first()
        if not existing:
            vehicle = Vehicle(
                company_id=company_id,
                site_id=site_id,
                plate_number=vehicle_data["plate"],
                make=vehicle_data["make"],
                model=vehicle_data["model"],
                year=vehicle_data["year"],
                vehicle_type=vehicle_data["type"],
                capacity=vehicle_data["capacity"],
                status=VehicleStatus.ACTIVE,
            )
            db.add(vehicle)
            db.commit()
            db.refresh(vehicle)
            created_vehicles[vehicle_data["plate"]] = vehicle
        else:
            created_vehicles[vehicle_data["plate"]] = existing
    
    # Create trips
    today = date.today()
    trips_data = [
        {
            "driver": "driver1",
            "vehicle_plate": "B 1234 RS",
            "planned_start": datetime.combine(today, datetime.min.time().replace(hour=8)),
            "planned_end": datetime.combine(today, datetime.min.time().replace(hour=12)),
            "status": TripStatus.COMPLETED,
            "stops": [
                {"name": "Rumah Sakit A", "sequence": 1},
                {"name": "Rumah Sakit B", "sequence": 2},
            ],
        },
        {
            "driver": "driver2",
            "vehicle_plate": "B 5678 RS",
            "planned_start": datetime.combine(today, datetime.min.time().replace(hour=13)),
            "planned_end": datetime.combine(today, datetime.min.time().replace(hour=17)),
            "status": TripStatus.IN_PROGRESS,
            "stops": [
                {"name": "Klinik C", "sequence": 1},
            ],
        },
    ]
    
    for trip_data in trips_data:
        if trip_data["driver"] in users and trip_data["vehicle_plate"] in created_vehicles:
            driver = users[trip_data["driver"]]
            vehicle = created_vehicles[trip_data["vehicle_plate"]]
            
            trip = DriverTrip(
                company_id=company_id,
                site_id=site_id,
                driver_id=driver.id,
                vehicle_id=vehicle.id,
                trip_date=trip_data["planned_start"].date(),
                planned_start_time=trip_data["planned_start"].time(),
                planned_end_time=trip_data["planned_end"].time(),
                actual_start_time=trip_data["planned_start"] + timedelta(minutes=5) if trip_data["status"] != TripStatus.PLANNED else None,
                status=trip_data["status"],
            )
            db.add(trip)
            db.flush()
            
            # Add stops
            for stop_data in trip_data["stops"]:
                arrival_datetime = trip_data["planned_start"] + timedelta(hours=stop_data["sequence"])
                stop = DriverTripStop(
                    trip_id=trip.id,
                    sequence=stop_data["sequence"],
                    name=stop_data["name"],
                    planned_arrival_time=arrival_datetime.time(),  # Convert to Time object
                )
                db.add(stop)
    
    db.commit()
    print(f"✓ Created {len(vehicles_data)} vehicles and {len(trips_data)} trips")

def create_shift_schedules(db: Session, company_id: int, site_id: int, users: dict):
    """Create shift schedules."""
    
    print("Creating shift schedules...")
    
    today = date.today()
    schedules_data = []
    
    # Create schedules for next 7 days
    for day_offset in range(7):
        shift_date = today + timedelta(days=day_offset)
        
        # Security shifts
        for guard_username in ["security1", "security2"]:
            if guard_username in users:
                guard = users[guard_username]
                shift_type = "MORNING" if day_offset % 2 == 0 else "NIGHT"
                start_time = "07:00" if shift_type == "MORNING" else "19:00"
                end_time = "19:00" if shift_type == "MORNING" else "07:00"
                
                schedule = ShiftSchedule(
                    company_id=company_id,
                    site_id=site_id,
                    user_id=guard.id,
                    shift_date=shift_date,
                    shift_type=shift_type,
                    start_time=start_time,
                    end_time=end_time,
                    status="ASSIGNED",
                    confirmed_at=datetime.now() if day_offset < 2 else None,
                )
                db.add(schedule)
                schedules_data.append(schedule)
    
    db.commit()
    print(f"✓ Created {len(schedules_data)} shift schedules")

def main():
    db = SessionLocal()
    try:
        # Get company and site
        company = db.query(Company).first()
        if not company:
            print("❌ Company not found. Please run Phase 1 first.")
            return
        
        site_result = db.execute(text("SELECT id FROM sites LIMIT 1"))
        site_row = site_result.fetchone()
        if not site_row:
            print("❌ Site not found. Please run Phase 1 first.")
            return
        
        site_id = site_row[0]
        company_id = company.id
        
        print(f"\n🏥 Phase 2: Creating mock data for Hospital System")
        print(f"   Company: {company.name} (ID: {company_id})")
        print(f"   Site ID: {site_id}\n")
        
        # Create all mock data
        users = create_users_and_attendance(db, company_id, site_id)
        create_security_reports(db, company_id, site_id, users)
        create_patrol_logs(db, company_id, site_id, users)
        create_dispatch_tickets(db, company_id, site_id, users)
        create_vehicles_and_trips(db, company_id, site_id, users)
        create_shift_schedules(db, company_id, site_id, users)
        
        print("\n🎉 Phase 2 Complete: Mock data created!")
        print("\n   Created:")
        print("   - 8 Users (Security, Cleaning, Driver, Admin)")
        print("   - Attendance records (last 7 days)")
        print("   - Security Reports (4 reports)")
        print("   - Patrol Logs (2 logs)")
        print("   - Dispatch Tickets (2 tickets)")
        print("   - Vehicles (3 vehicles)")
        print("   - Driver Trips (2 trips)")
        print("   - Shift Schedules (14 schedules)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()

