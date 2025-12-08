#!/usr/bin/env python3
"""
Setup SQLite database with mock data for quick testing
This creates a SQLite database file in the backend directory
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine
from app.models.base import Base
from app.models.user import User
from app.models.company import Company
from app.models.site import Site
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
    ShiftSchedule,
    ShiftExchange,
    DailyActivityReport,
    PatrolRoute,
    PatrolCheckpoint,
    PatrolCheckpointScan,
    PostOrder,
    PostOrderAcknowledgment,
    GuardLocation,
    IdleAlert,
    DispatchTicket,
    DispatchStatus,
    PanicAlert,
)

def create_mock_data():
    """Create all mock data"""
    print("Creating SQLite database with mock data...")
    
    # Create SQLite engine
    db_path = Path(__file__).parent.parent / "verolux_test.db"
    engine = create_engine(f"sqlite:///{db_path}", echo=False)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    
    # Create session
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        # 1. Company
        company = db.query(Company).filter(Company.id == 1).first()
        if not company:
            company = Company(id=1, name="PT Verolux Security", code="VEROLUX")
            db.add(company)
            db.commit()
            print("✅ Created company")
        
        # 2. Sites
        sites_data = [
            {"id": 1, "name": "Gedung Perkantoran A", "address": "Jl. Sudirman No. 1"},
            {"id": 2, "name": "Mall Central", "address": "Jl. Thamrin No. 10"},
        ]
        for site_data in sites_data:
            site = db.query(Site).filter(Site.id == site_data["id"]).first()
            if not site:
                site = Site(**site_data, company_id=1)
                db.add(site)
                print(f"✅ Created site: {site_data['name']}")
        db.commit()
        
        # 3. Users
        users_data = [
            {"id": 1, "username": "security", "role": "guard", "site_id": 1},
            {"id": 2, "username": "guard1", "role": "guard", "site_id": 1},
            {"id": 3, "username": "guard2", "role": "guard", "site_id": 1},
            {"id": 4, "username": "supervisor", "role": "supervisor", "site_id": 1},
        ]
        for user_data in users_data:
            user = db.query(User).filter(User.id == user_data["id"]).first()
            if not user:
                user = User(
                    id=user_data["id"],
                    username=user_data["username"],
                    hashed_password="dummy",
                    division="security",
                    role=user_data["role"],
                    company_id=1,
                    site_id=user_data.get("site_id"),
                )
                db.add(user)
                print(f"✅ Created user: {user_data['username']}")
        db.commit()
        
        # 4. Checklist Template
        template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == 1).first()
        if not template:
            template = ChecklistTemplate(
                id=1,
                company_id=1,
                site_id=1,
                name="Security Guard - Site A - Morning Shift",
                role="guard",
                shift_type="MORNING",
                is_active=True,
            )
            db.add(template)
            db.flush()
            
            # Add items
            items_data = [
                {"order": 1, "title": "Periksa kunci pintu utama", "description": "Pastikan semua pintu utama terkunci", "required": True, "evidence_type": "photo"},
                {"order": 2, "title": "Patroli area parkir", "description": "Lakukan patroli menyeluruh", "required": True, "evidence_type": "patrol_log"},
                {"order": 3, "title": "Periksa sistem alarm", "description": "Test sistem alarm", "required": True, "evidence_type": "note"},
                {"order": 4, "title": "Periksa CCTV", "description": "Pastikan semua kamera berfungsi", "required": True, "evidence_type": "photo"},
            ]
            
            for item_data in items_data:
                item = ChecklistTemplateItem(
                    template_id=template.id,
                    **item_data
                )
                db.add(item)
            
            db.commit()
            print("✅ Created checklist template with 4 items")
        
        # 5. Today's Attendance & Checklist
        today = date.today()
        attendance = db.query(SecurityAttendance).filter(
            SecurityAttendance.user_id == 1,
            SecurityAttendance.shift_date == today
        ).first()
        
        if not attendance:
            attendance = SecurityAttendance(
                company_id=1,
                site_id=1,
                user_id=1,
                shift_date=today,
                check_in_time=datetime.now().replace(hour=6, minute=0, second=0, microsecond=0),
                check_in_location="Pintu Utama",
            )
            db.add(attendance)
            db.flush()
            print("✅ Created today's attendance")
            
            # Create checklist
            checklist = Checklist(
                company_id=1,
                site_id=1,
                user_id=1,
                attendance_id=attendance.id,
                template_id=1,
                shift_date=today,
                shift_type="MORNING",
                status=ChecklistStatus.OPEN,
            )
            db.add(checklist)
            db.flush()
            
            # Copy items from template
            template_items = db.query(ChecklistTemplateItem).filter(
                ChecklistTemplateItem.template_id == 1
            ).all()
            
            for t_item in template_items:
                item = ChecklistItem(
                    checklist_id=checklist.id,
                    template_item_id=t_item.id,
                    order=t_item.order,
                    title=t_item.title,
                    description=t_item.description,
                    required=t_item.required,
                    evidence_type=t_item.evidence_type,
                    status=ChecklistItemStatus.PENDING,
                )
                db.add(item)
            
            db.commit()
            print("✅ Created today's checklist with items")
        
        # 6. Create sample dispatch ticket
        from app.divisions.security.models import DispatchTicket, DispatchStatus
        ticket = db.query(DispatchTicket).filter(DispatchTicket.id == 1).first()
        if not ticket:
            ticket = DispatchTicket(
                company_id=1,
                site_id=1,
                ticket_number="DISP-2025-12-03-001",
                caller_name="John Doe",
                caller_phone="081234567890",
                incident_type="suspicious_activity",
                priority="high",
                description="Suspicious person near main gate",
                location="Main Gate",
                latitude="-6.2088",
                longitude="106.8456",
                status=DispatchStatus.NEW,
                created_by_user_id=4,  # supervisor
            )
            db.add(ticket)
            db.commit()
            print("✅ Created sample dispatch ticket")
        
        # 7. Create sample passdown note
        from app.divisions.security.models import ShiftHandover
        handover = db.query(ShiftHandover).filter(ShiftHandover.id == 1).first()
        if not handover:
            handover = ShiftHandover(
                company_id=1,
                site_id=1,
                shift_date=today,
                from_shift_type="MORNING",
                to_shift_type="DAY",
                from_user_id=1,
                category="maintenance",
                title="Gate 3 lock broken",
                description="Gate 3 lock is broken, waiting for maintenance team. Use Gate 1 instead.",
                priority="high",
                status="pending",
            )
            db.add(handover)
            db.commit()
            print("✅ Created sample passdown note")
        
        # 8. Create Security Reports (Laporan)
        reports_data = [
            {
                "report_type": "daily",
                "title": "Laporan Harian - Shift Pagi",
                "description": "Semua aktivitas berjalan normal. Tidak ada kejadian yang perlu dilaporkan.",
                "severity": "low",
                "location_text": "Pintu Utama",
                "status": "closed",
                "user_id": 1,
            },
            {
                "report_type": "incident",
                "title": "Insiden: Orang Asing Mencurigakan",
                "description": "Orang asing terlihat mengintai di area parkir selama 30 menit. Sudah didekati dan ditanyai. Mengaku menunggu teman.",
                "severity": "medium",
                "location_text": "Area Parkir",
                "status": "open",
                "user_id": 1,
            },
            {
                "report_type": "finding",
                "title": "Temuan: Lampu Parkir Mati",
                "description": "Lampu parkir di area belakang gedung mati. Perlu perbaikan segera.",
                "severity": "medium",
                "location_text": "Area Parkir Belakang",
                "status": "open",
                "user_id": 2,
            },
            {
                "report_type": "daily",
                "title": "Laporan Harian - Shift Siang",
                "description": "Patroli rutin dilakukan. Semua area aman. CCTV berfungsi normal.",
                "severity": "low",
                "location_text": "Seluruh Area",
                "status": "closed",
                "user_id": 2,
            },
            {
                "report_type": "incident",
                "title": "Insiden: Kendaraan Parkir Tidak Sah",
                "description": "Kendaraan dengan plat nomor B 1234 XYZ parkir di area terlarang. Sudah diberi peringatan dan dipindahkan.",
                "severity": "low",
                "location_text": "Area Parkir VIP",
                "status": "closed",
                "user_id": 3,
            },
        ]
        
        for i, report_data in enumerate(reports_data, start=1):
            existing = db.query(SecurityReport).filter(SecurityReport.id == i).first()
            if not existing:
                report_date = today - timedelta(days=len(reports_data) - i)
                report = SecurityReport(
                    id=i,
                    company_id=1,
                    site_id=1,
                    **report_data
                )
                # Set created_at to the report date
                report.created_at = datetime.combine(report_date, datetime.min.time())
                db.add(report)
        db.commit()
        print(f"✅ Created {len(reports_data)} security reports")
        
        # 9. Create Shift Schedules
        shift_types = ["MORNING", "DAY", "NIGHT"]
        shift_times = {
            "MORNING": ("06:00", "14:00"),
            "DAY": ("14:00", "22:00"),
            "NIGHT": ("22:00", "06:00"),
        }
        
        # Create shifts for the next 2 weeks
        shifts_created = 0
        for day_offset in range(14):
            shift_date = today + timedelta(days=day_offset)
            for shift_idx, shift_type in enumerate(shift_types):
                user_id = (day_offset + shift_idx) % 3 + 1  # Rotate between users 1, 2, 3
                start_time, end_time = shift_times[shift_type]
                
                existing = db.query(ShiftSchedule).filter(
                    ShiftSchedule.shift_date == shift_date,
                    ShiftSchedule.shift_type == shift_type,
                    ShiftSchedule.site_id == 1,
                ).first()
                
                if not existing:
                    status = "confirmed" if day_offset < 3 else "assigned"
                    shift = ShiftSchedule(
                        company_id=1,
                        site_id=1,
                        user_id=user_id,
                        shift_date=shift_date,
                        shift_type=shift_type,
                        start_time=start_time,
                        end_time=end_time,
                        status=status,
                        confirmed_at=datetime.now() - timedelta(days=day_offset) if status == "confirmed" else None,
                        confirmed_by_user_id=user_id if status == "confirmed" else None,
                    )
                    db.add(shift)
                    shifts_created += 1
        
        db.commit()
        print(f"✅ Created {shifts_created} shift schedules")
        
        # 10. Create Shift Exchanges
        # Get some shifts to exchange
        shifts = db.query(ShiftSchedule).filter(
            ShiftSchedule.shift_date >= today,
            ShiftSchedule.shift_date <= today + timedelta(days=7),
        ).limit(6).all()
        
        if len(shifts) >= 2:
            # Open request (pending)
            exchange1 = ShiftExchange(
                company_id=1,
                site_id=1,
                from_user_id=shifts[0].user_id,
                from_shift_id=shifts[0].id,
                status="pending",
                requires_approval=True,
                approval_status=None,
                request_message="Saya perlu menukar shift karena ada keperluan mendesak. Ada yang bisa gantikan?",
            )
            db.add(exchange1)
            
            if len(shifts) >= 4:
                # Accepted by guard, pending supervisor approval
                exchange2 = ShiftExchange(
                    company_id=1,
                    site_id=1,
                    from_user_id=shifts[2].user_id,
                    to_user_id=shifts[3].user_id,
                    from_shift_id=shifts[2].id,
                    to_shift_id=shifts[3].id,
                    status="pending_approval",
                    requires_approval=True,
                    approval_status="pending",
                    request_message="Bisa tukar shift?",
                    response_message="Oke, setuju!",
                    responded_at=datetime.now() - timedelta(hours=2),
                )
                db.add(exchange2)
            
            if len(shifts) >= 6:
                # Approved and applied
                exchange3 = ShiftExchange(
                    company_id=1,
                    site_id=1,
                    from_user_id=shifts[4].user_id,
                    to_user_id=shifts[5].user_id,
                    from_shift_id=shifts[4].id,
                    to_shift_id=shifts[5].id,
                    status="completed",
                    requires_approval=True,
                    approval_status="approved",
                    approved_by_user_id=4,  # supervisor
                    approved_at=datetime.now() - timedelta(hours=1),
                    request_message="Tukar shift untuk liburan",
                    response_message="Setuju",
                    responded_at=datetime.now() - timedelta(hours=3),
                    applied_at=datetime.now() - timedelta(hours=1),
                )
                db.add(exchange3)
            
            db.commit()
            print("✅ Created shift exchange requests with approval workflow")
        
        # 11. Create Daily Activity Reports (DAR)
        dar_data = [
            {
                "shift_date": today - timedelta(days=1),
                "shift_type": "MORNING",
                "notes": "Laporan Aktivitas Harian - Shift Pagi\n\n1. Check-in: 06:00 WIB\n2. Patroli: 06:30-08:00 WIB\n3. Inspeksi: 08:00-10:00 WIB\n4. Checkpoint scans: 4/4 completed\n5. Tidak ada insiden\n6. Check-out: 14:00 WIB",
                "status": "final",
                "generated_by_user_id": 1,
            },
            {
                "shift_date": today - timedelta(days=1),
                "shift_type": "DAY",
                "notes": "Laporan Aktivitas Harian - Shift Siang\n\n1. Check-in: 14:00 WIB\n2. Patroli: 14:30-16:00 WIB\n3. Insiden: Orang mencurigakan di area parkir (sudah ditangani)\n4. Checkpoint scans: 4/4 completed\n5. Check-out: 22:00 WIB",
                "status": "final",
                "generated_by_user_id": 2,
            },
        ]
        
        for i, dar_info in enumerate(dar_data, start=1):
            existing = db.query(DailyActivityReport).filter(DailyActivityReport.id == i).first()
            if not existing:
                report_date = dar_info["shift_date"]
                dar = DailyActivityReport(
                    id=i,
                    company_id=1,
                    site_id=1,
                    report_number=f"DAR-{report_date.strftime('%Y%m%d')}-{dar_info['shift_type'][0]}",
                    **dar_info
                )
                db.add(dar)
        
        db.commit()
        print(f"✅ Created {len(dar_data)} daily activity reports")
        
        # 12. Create Patrol Logs
        patrol_logs_data = [
            {
                "start_time": datetime.now().replace(hour=6, minute=30) - timedelta(days=1),
                "end_time": datetime.now().replace(hour=8, minute=0) - timedelta(days=1),
                "area_text": "Area Parkir & Pintu Utama",
                "notes": "Patroli rutin pagi. Semua area aman.",
                "user_id": 1,
            },
            {
                "start_time": datetime.now().replace(hour=14, minute=30) - timedelta(days=1),
                "end_time": datetime.now().replace(hour=16, minute=0) - timedelta(days=1),
                "area_text": "Area Parkir & Gedung Utama",
                "notes": "Patroli siang. Menemukan orang mencurigakan, sudah ditangani.",
                "user_id": 2,
            },
            {
                "start_time": datetime.now().replace(hour=22, minute=0) - timedelta(days=1),
                "end_time": datetime.now().replace(hour=23, minute=30) - timedelta(days=1),
                "area_text": "Seluruh Area",
                "notes": "Patroli malam. Semua area terkunci dengan baik.",
                "user_id": 3,
            },
        ]
        
        for i, patrol_data in enumerate(patrol_logs_data, start=1):
            existing = db.query(SecurityPatrolLog).filter(SecurityPatrolLog.id == i).first()
            if not existing:
                patrol = SecurityPatrolLog(
                    id=i,
                    company_id=1,
                    site_id=1,
                    **patrol_data
                )
                db.add(patrol)
        
        db.commit()
        print(f"✅ Created {len(patrol_logs_data)} patrol logs")
        
        # 13. Create Patrol Routes & Checkpoints
        route1 = db.query(PatrolRoute).filter(PatrolRoute.id == 1).first()
        if not route1:
            route1 = PatrolRoute(
                id=1,
                company_id=1,
                site_id=1,
                name="Patrol Route - Gedung Utama",
                description="Rute patroli utama untuk gedung perkantoran",
                is_active=True,
            )
            db.add(route1)
            db.flush()
            
            # Create checkpoints
            checkpoints_data = [
                {
                    "order": 1,
                    "name": "Pintu Utama",
                    "description": "Checkpoint di pintu utama gedung",
                    "location": "Lobby Utama",
                    "latitude": "-6.2088",
                    "longitude": "106.8456",
                    "nfc_code": "NFC-001-MAIN-GATE",
                    "qr_code": "QR-001-MAIN-GATE",
                    "required": True,
                    "time_window_start": "06:00",
                    "time_window_end": "22:00",
                },
                {
                    "order": 2,
                    "name": "Area Parkir",
                    "description": "Checkpoint di area parkir",
                    "location": "Parkir Bawah Tanah",
                    "latitude": "-6.2090",
                    "longitude": "106.8458",
                    "nfc_code": "NFC-002-PARKING",
                    "qr_code": "QR-002-PARKING",
                    "required": True,
                    "time_window_start": "08:00",
                    "time_window_end": "20:00",
                },
                {
                    "order": 3,
                    "name": "Pintu Belakang",
                    "description": "Checkpoint di pintu belakang",
                    "location": "Pintu Belakang Gedung",
                    "latitude": "-6.2085",
                    "longitude": "106.8454",
                    "nfc_code": "NFC-003-BACK-GATE",
                    "qr_code": "QR-003-BACK-GATE",
                    "required": True,
                    "time_window_start": "06:00",
                    "time_window_end": "22:00",
                },
                {
                    "order": 4,
                    "name": "Lantai 5",
                    "description": "Checkpoint di lantai 5",
                    "location": "Lantai 5 - Ruang Server",
                    "latitude": "-6.2088",
                    "longitude": "106.8456",
                    "nfc_code": "NFC-004-FLOOR-5",
                    "qr_code": "QR-004-FLOOR-5",
                    "required": False,
                },
            ]
            
            for cp_data in checkpoints_data:
                checkpoint = PatrolCheckpoint(
                    route_id=route1.id,
                    **cp_data
                )
                db.add(checkpoint)
            
            db.commit()
            print("✅ Created patrol route with 4 checkpoints")
        
        # 14. Create Patrol Checkpoint Scans
        scans_data = [
            {
                "user_id": 1,
                "route_id": 1,
                "checkpoint_id": 1,
                "scan_time": datetime.now().replace(hour=6, minute=30) - timedelta(days=1),
                "scan_method": "NFC",
                "scan_code": "NFC-001-MAIN-GATE",
                "latitude": "-6.2088",
                "longitude": "106.8456",
                "is_valid": True,
                "is_missed": False,
            },
            {
                "user_id": 1,
                "route_id": 1,
                "checkpoint_id": 2,
                "scan_time": datetime.now().replace(hour=7, minute=0) - timedelta(days=1),
                "scan_method": "QR",
                "scan_code": "QR-002-PARKING",
                "latitude": "-6.2090",
                "longitude": "106.8458",
                "is_valid": True,
                "is_missed": False,
            },
            {
                "user_id": 1,
                "route_id": 1,
                "checkpoint_id": 3,
                "scan_time": datetime.now().replace(hour=7, minute=30) - timedelta(days=1),
                "scan_method": "NFC",
                "scan_code": "NFC-003-BACK-GATE",
                "latitude": "-6.2085",
                "longitude": "106.8454",
                "is_valid": True,
                "is_missed": False,
            },
        ]
        
        for i, scan_data in enumerate(scans_data, start=1):
            existing = db.query(PatrolCheckpointScan).filter(PatrolCheckpointScan.id == i).first()
            if not existing:
                scan = PatrolCheckpointScan(
                    id=i,
                    company_id=1,
                    site_id=1,
                    **scan_data
                )
                db.add(scan)
        
        db.commit()
        print(f"✅ Created {len(scans_data)} checkpoint scans")
        
        # 15. Create Post Orders
        post_orders_data = [
            {
                "title": "Prosedur Keamanan - Pintu Utama",
                "content": "1. Pastikan pintu utama selalu terkunci setelah jam 22:00\n2. Verifikasi identitas semua pengunjung\n3. Catat semua kendaraan masuk dan keluar\n4. Laporkan segera jika ada kejadian mencurigakan",
                "category": "procedure",
                "priority": "high",
                "is_active": True,
                "effective_date": today - timedelta(days=30),
                "expires_date": None,
                "created_by_user_id": 4,  # supervisor
            },
            {
                "title": "Kebijakan Emergency Response",
                "content": "Dalam keadaan darurat:\n1. Tekan panic button segera\n2. Hubungi supervisor\n3. Evakuasi area jika diperlukan\n4. Dokumentasikan kejadian",
                "category": "emergency",
                "priority": "critical",
                "is_active": True,
                "effective_date": today - timedelta(days=15),
                "expires_date": None,
                "created_by_user_id": 4,
            },
            {
                "title": "Update: Sistem CCTV Baru",
                "content": "Sistem CCTV baru telah diinstal. Pastikan semua kamera berfungsi dengan baik setiap shift.",
                "category": "maintenance",
                "priority": "normal",
                "is_active": True,
                "effective_date": today - timedelta(days=5),
                "expires_date": today + timedelta(days=30),
                "created_by_user_id": 4,
            },
        ]
        
        for i, po_data in enumerate(post_orders_data, start=1):
            existing = db.query(PostOrder).filter(PostOrder.id == i).first()
            if not existing:
                po = PostOrder(
                    id=i,
                    company_id=1,
                    site_id=1,
                    **po_data
                )
                db.add(po)
        
        db.commit()
        print(f"✅ Created {len(post_orders_data)} post orders")
        
        # 16. Create Post Order Acknowledgments
        # User 1 and 2 acknowledge post order 1
        for user_id in [1, 2]:
            existing = db.query(PostOrderAcknowledgment).filter(
                PostOrderAcknowledgment.post_order_id == 1,
                PostOrderAcknowledgment.user_id == user_id,
            ).first()
            if not existing:
                ack = PostOrderAcknowledgment(
                    post_order_id=1,
                    user_id=user_id,
                    acknowledged_at=datetime.now() - timedelta(days=user_id),
                )
                db.add(ack)
        
        db.commit()
        print("✅ Created post order acknowledgments")
        
        # 17. Create GPS Locations
        locations_data = [
            {
                "user_id": 1,
                "latitude": "-6.2088",
                "longitude": "106.8456",
                "accuracy": "10",
                "timestamp": datetime.now() - timedelta(minutes=5),
                "is_active": True,
            },
            {
                "user_id": 2,
                "latitude": "-6.2090",
                "longitude": "106.8458",
                "accuracy": "15",
                "timestamp": datetime.now() - timedelta(minutes=3),
                "is_active": True,
            },
            {
                "user_id": 1,
                "latitude": "-6.2085",
                "longitude": "106.8454",
                "accuracy": "12",
                "timestamp": datetime.now() - timedelta(minutes=30),
                "is_active": False,  # Old location
            },
        ]
        
        for i, loc_data in enumerate(locations_data, start=1):
            existing = db.query(GuardLocation).filter(GuardLocation.id == i).first()
            if not existing:
                loc = GuardLocation(
                    id=i,
                    company_id=1,
                    site_id=1,
                    **loc_data
                )
                db.add(loc)
        
        db.commit()
        print(f"✅ Created {len(locations_data)} GPS locations")
        
        # 18. Create Idle Alerts
        idle_alerts_data = [
            {
                "user_id": 3,
                "alert_type": "idle",
                "idle_duration_minutes": 45,
                "last_activity_time": datetime.now() - timedelta(minutes=45),
                "latitude": "-6.2088",
                "longitude": "106.8456",
                "status": "active",
            },
            {
                "user_id": 2,
                "alert_type": "inactive",
                "idle_duration_minutes": 30,
                "last_activity_time": datetime.now() - timedelta(minutes=30),
                "latitude": "-6.2090",
                "longitude": "106.8458",
                "status": "acknowledged",
                "acknowledged_by_user_id": 4,
                "acknowledged_at": datetime.now() - timedelta(minutes=5),
            },
        ]
        
        for i, alert_data in enumerate(idle_alerts_data, start=1):
            existing = db.query(IdleAlert).filter(IdleAlert.id == i).first()
            if not existing:
                alert = IdleAlert(
                    id=i,
                    company_id=1,
                    site_id=1,
                    **alert_data
                )
                db.add(alert)
        
        db.commit()
        print(f"✅ Created {len(idle_alerts_data)} idle alerts")
        
        # 19. Create Dispatch Tickets
        dispatch_tickets_data = [
            {
                "ticket_number": "DISP-2025-12-03-001",
                "caller_name": "John Doe",
                "caller_phone": "081234567890",
                "incident_type": "suspicious_activity",
                "priority": "high",
                "description": "Orang mencurigakan terlihat di area parkir",
                "location": "Area Parkir Bawah Tanah",
                "latitude": "-6.2090",
                "longitude": "106.8458",
                "status": DispatchStatus.ASSIGNED,
                "assigned_to_user_id": 1,
                "assigned_at": datetime.now() - timedelta(hours=1),
                "created_by_user_id": 4,
            },
            {
                "ticket_number": "DISP-2025-12-03-002",
                "caller_name": "Jane Smith",
                "caller_phone": "081987654321",
                "incident_type": "noise_complaint",
                "priority": "medium",
                "description": "Kebisingan dari lantai 3",
                "location": "Lantai 3",
                "latitude": "-6.2088",
                "longitude": "106.8456",
                "status": DispatchStatus.ONSCENE,
                "assigned_to_user_id": 2,
                "assigned_at": datetime.now() - timedelta(hours=2),
                "onscene_at": datetime.now() - timedelta(minutes=30),
                "created_by_user_id": 4,
            },
            {
                "ticket_number": "DISP-2025-12-02-003",
                "caller_name": "Bob Wilson",
                "caller_phone": "081111222333",
                "incident_type": "maintenance_request",
                "priority": "low",
                "description": "Lampu di koridor mati",
                "location": "Koridor Lantai 2",
                "latitude": "-6.2088",
                "longitude": "106.8456",
                "status": DispatchStatus.CLOSED,
                "assigned_to_user_id": 1,
                "assigned_at": datetime.now() - timedelta(days=1, hours=2),
                "onscene_at": datetime.now() - timedelta(days=1, hours=1),
                "closed_at": datetime.now() - timedelta(days=1),
                "created_by_user_id": 4,
            },
        ]
        
        for i, ticket_data in enumerate(dispatch_tickets_data, start=1):
            existing = db.query(DispatchTicket).filter(DispatchTicket.id == i).first()
            if not existing:
                ticket = DispatchTicket(
                    id=i,
                    company_id=1,
                    site_id=1,
                    **ticket_data
                )
                db.add(ticket)
        
        db.commit()
        print(f"✅ Created {len(dispatch_tickets_data)} dispatch tickets")
        
        # 20. Create Panic Alerts
        panic_alerts_data = [
            {
                "user_id": 1,
                "alert_type": "panic",
                "latitude": "-6.2088",
                "longitude": "106.8456",
                "location_text": "Pintu Utama - Gedung A",
                "message": "Butuh bantuan segera!",
                "status": "active",
            },
            {
                "user_id": 2,
                "alert_type": "panic",
                "latitude": "-6.2090",
                "longitude": "106.8458",
                "location_text": "Area Parkir",
                "message": None,
                "status": "resolved",
                "resolved_at": datetime.now() - timedelta(hours=1),
                "acknowledged_by_user_id": 4,
                "acknowledged_at": datetime.now() - timedelta(hours=1, minutes=30),
                "resolution_notes": "False alarm, sudah ditangani",
            },
        ]
        
        for i, alert_data in enumerate(panic_alerts_data, start=1):
            existing = db.query(PanicAlert).filter(PanicAlert.id == i).first()
            if not existing:
                alert = PanicAlert(
                    id=i,
                    company_id=1,
                    site_id=1,
                    **alert_data
                )
                db.add(alert)
        
        db.commit()
        print(f"✅ Created {len(panic_alerts_data)} panic alerts")
        
        print("\n✅ Mock data setup completed!")
        print(f"\nDatabase file: {Path(__file__).parent.parent}/verolux_test.db")
        print("\nTo use this database, update backend/app/core/config.py:")
        print('  SQLALCHEMY_DATABASE_URI: str = "sqlite:///./verolux_test.db"')
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_mock_data()

