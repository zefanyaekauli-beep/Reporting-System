#!/usr/bin/env python3
"""
Create mock data for hospital cleaning zones and checklist templates.
Phase 1: Hospital Cleaning Zones & Templates
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import date, datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.user import User
from app.models.company import Company
from app.models.site import Site
from app.divisions.cleaning.models import CleaningZone, CleaningZoneTemplate
from app.divisions.security.models import ChecklistTemplate, ChecklistTemplateItem

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def create_hospital_zones_and_templates(db: Session, company_id: int, site_id: int):
    """Create hospital cleaning zones and checklist templates."""
    
    # 0. Add KPI columns if they don't exist
    from sqlalchemy import text, inspect
    inspector = inspect(db.bind)
    columns = [col['name'] for col in inspector.get_columns('checklist_template_items')]
    
    if 'kpi_key' not in columns:
        print("Adding KPI columns to checklist_template_items...")
        try:
            db.execute(text("ALTER TABLE checklist_template_items ADD COLUMN kpi_key VARCHAR(64)"))
            db.execute(text("ALTER TABLE checklist_template_items ADD COLUMN answer_type VARCHAR(16)"))
            db.execute(text("ALTER TABLE checklist_template_items ADD COLUMN photo_required BOOLEAN DEFAULT 0"))
            db.commit()
            print("✓ KPI columns added")
        except Exception as e:
            print(f"Warning: Could not add KPI columns: {e}")
            db.rollback()
    
    # 1. Create Checklist Templates for different area types
    
    # Template for Toilet
    toilet_template = ChecklistTemplate(
        company_id=company_id,
        site_id=site_id,
        name="Template Pembersihan Toilet",
        role="CLEANER",
        is_active=True,
    )
    db.add(toilet_template)
    db.flush()
    
    # Toilet template items
    toilet_items = [
        ChecklistTemplateItem(
            template_id=toilet_template.id,
            order=1,
            title="Toilet bersih dan tidak berbau",
            description="Pastikan toilet dalam kondisi bersih dan tidak ada bau tidak sedap",
            required=True,
            evidence_type="photo",
            kpi_key="TOILET_CLEAN",
            answer_type="BOOLEAN",
            photo_required=True,
        ),
        ChecklistTemplateItem(
            template_id=toilet_template.id,
            order=2,
            title="Stok tisu toilet",
            description="Periksa dan isi ulang jika perlu",
            required=True,
            evidence_type="photo",
            kpi_key="TISSUE_STOCK",
            answer_type="CHOICE",
            photo_required=False,
        ),
        ChecklistTemplateItem(
            template_id=toilet_template.id,
            order=3,
            title="Stok sabun",
            description="Periksa dan isi ulang dispenser sabun",
            required=True,
            evidence_type="photo",
            kpi_key="SOAP_STOCK",
            answer_type="CHOICE",
            photo_required=False,
        ),
        ChecklistTemplateItem(
            template_id=toilet_template.id,
            order=4,
            title="Lantai kering dan bersih",
            description="Pastikan lantai tidak licin dan tidak ada genangan air",
            required=True,
            evidence_type="photo",
            kpi_key="FLOOR_CLEAN",
            answer_type="BOOLEAN",
            photo_required=True,
        ),
        ChecklistTemplateItem(
            template_id=toilet_template.id,
            order=5,
            title="Tempat sampah dikosongkan",
            description="Kosongkan tempat sampah dan ganti kantong baru",
            required=True,
            evidence_type="photo",
            kpi_key="TRASH_EMPTIED",
            answer_type="BOOLEAN",
            photo_required=False,
        ),
        ChecklistTemplateItem(
            template_id=toilet_template.id,
            order=6,
            title="Catatan tambahan",
            description="Catatan atau temuan khusus",
            required=False,
            evidence_type="note",
            kpi_key="EXTRA_NOTES",
            answer_type="TEXT",
            photo_required=False,
        ),
    ]
    for item in toilet_items:
        db.add(item)
    
    # Template for Patient Room
    room_template = ChecklistTemplate(
        company_id=company_id,
        site_id=site_id,
        name="Template Pembersihan Ruang Pasien",
        role="CLEANER",
        is_active=True,
    )
    db.add(room_template)
    db.flush()
    
    room_items = [
        ChecklistTemplateItem(
            template_id=room_template.id,
            order=1,
            title="Tempat tidur dibersihkan dan disterilkan",
            description="Bersihkan dan sterilkan tempat tidur pasien",
            required=True,
            evidence_type="photo",
            kpi_key="BED_CLEANED",
            answer_type="BOOLEAN",
            photo_required=True,
        ),
        ChecklistTemplateItem(
            template_id=room_template.id,
            order=2,
            title="Lantai dibersihkan dan disterilkan",
            description="Vakum dan pel lantai dengan desinfektan",
            required=True,
            evidence_type="photo",
            kpi_key="FLOOR_CLEANED",
            answer_type="BOOLEAN",
            photo_required=True,
        ),
        ChecklistTemplateItem(
            template_id=room_template.id,
            order=3,
            title="Permukaan dibersihkan",
            description="Bersihkan meja, kursi, dan permukaan lainnya",
            required=True,
            evidence_type="photo",
            kpi_key="SURFACES_CLEANED",
            answer_type="BOOLEAN",
            photo_required=False,
        ),
        ChecklistTemplateItem(
            template_id=room_template.id,
            order=4,
            title="Kamar mandi dalam ruangan",
            description="Bersihkan kamar mandi jika ada",
            required=False,
            evidence_type="photo",
            kpi_key="BATHROOM_CLEANED",
            answer_type="BOOLEAN",
            photo_required=True,
        ),
        ChecklistTemplateItem(
            template_id=room_template.id,
            order=5,
            title="Tempat sampah dikosongkan",
            description="Kosongkan dan ganti kantong sampah",
            required=True,
            evidence_type="photo",
            kpi_key="TRASH_EMPTIED",
            answer_type="BOOLEAN",
            photo_required=False,
        ),
        ChecklistTemplateItem(
            template_id=room_template.id,
            order=6,
            title="Skor kebersihan keseluruhan",
            description="Beri skor 1-5 untuk kebersihan keseluruhan ruangan",
            required=True,
            evidence_type="none",
            kpi_key="OVERALL_SCORE",
            answer_type="SCORE",
            photo_required=False,
        ),
    ]
    for item in room_items:
        db.add(item)
    
    # Template for Lobby
    lobby_template = ChecklistTemplate(
        company_id=company_id,
        site_id=site_id,
        name="Template Pembersihan Lobby",
        role="CLEANER",
        is_active=True,
    )
    db.add(lobby_template)
    db.flush()
    
    lobby_items = [
        ChecklistTemplateItem(
            template_id=lobby_template.id,
            order=1,
            title="Lantai dibersihkan",
            description="Vakum dan pel lantai lobby",
            required=True,
            evidence_type="photo",
            kpi_key="FLOOR_CLEANED",
            answer_type="BOOLEAN",
            photo_required=True,
        ),
        ChecklistTemplateItem(
            template_id=lobby_template.id,
            order=2,
            title="Furnitur dibersihkan",
            description="Bersihkan kursi, meja, dan furnitur lainnya",
            required=True,
            evidence_type="photo",
            kpi_key="FURNITURE_CLEANED",
            answer_type="BOOLEAN",
            photo_required=False,
        ),
        ChecklistTemplateItem(
            template_id=lobby_template.id,
            order=3,
            title="Tempat sampah dikosongkan",
            description="Kosongkan semua tempat sampah",
            required=True,
            evidence_type="photo",
            kpi_key="TRASH_EMPTIED",
            answer_type="BOOLEAN",
            photo_required=False,
        ),
        ChecklistTemplateItem(
            template_id=lobby_template.id,
            order=4,
            title="Kaca jendela dibersihkan",
            description="Bersihkan kaca jendela dan pintu kaca",
            required=False,
            evidence_type="photo",
            kpi_key="WINDOWS_CLEANED",
            answer_type="BOOLEAN",
            photo_required=False,
        ),
    ]
    for item in lobby_items:
        db.add(item)
    
    # Template for Parking Lot
    parking_template = ChecklistTemplate(
        company_id=company_id,
        site_id=site_id,
        name="Template Pembersihan Area Parkir",
        role="CLEANER",
        is_active=True,
    )
    db.add(parking_template)
    db.flush()
    
    parking_items = [
        ChecklistTemplateItem(
            template_id=parking_template.id,
            order=1,
            title="Sampah dikumpulkan",
            description="Kumpulkan dan buang sampah yang ada",
            required=True,
            evidence_type="photo",
            kpi_key="TRASH_COLLECTED",
            answer_type="BOOLEAN",
            photo_required=True,
        ),
        ChecklistTemplateItem(
            template_id=parking_template.id,
            order=2,
            title="Drainase bersih",
            description="Pastikan saluran drainase tidak tersumbat",
            required=True,
            evidence_type="photo",
            kpi_key="DRAINAGE_CLEAR",
            answer_type="BOOLEAN",
            photo_required=False,
        ),
        ChecklistTemplateItem(
            template_id=parking_template.id,
            order=3,
            title="Kondisi umum area",
            description="Beri skor kondisi umum area parkir (1-5)",
            required=True,
            evidence_type="none",
            kpi_key="OVERALL_CONDITION",
            answer_type="SCORE",
            photo_required=False,
        ),
    ]
    for item in parking_items:
        db.add(item)
    
    db.commit()
    
    # 2. Create Cleaning Zones
    
    # Toilets
    toilets = [
        {"name": "Toilet 1", "floor": "Lantai 1", "area_type": "toilet", "qr_code": "TOILET-001"},
        {"name": "Toilet 2", "floor": "Lantai 1", "area_type": "toilet", "qr_code": "TOILET-002"},
        {"name": "Toilet 3", "floor": "Lantai 2", "area_type": "toilet", "qr_code": "TOILET-003"},
        {"name": "Toilet 4", "floor": "Lantai 2", "area_type": "toilet", "qr_code": "TOILET-004"},
        {"name": "Toilet 5", "floor": "Lantai 3", "area_type": "toilet", "qr_code": "TOILET-005"},
    ]
    
    for toilet_data in toilets:
        zone = CleaningZone(
            company_id=company_id,
            site_id=site_id,
            name=toilet_data["name"],
            floor=toilet_data["floor"],
            area_type=toilet_data["area_type"],
            qr_code=toilet_data["qr_code"],
            geofence_latitude=-6.2088,  # Example coordinates (adjust as needed)
            geofence_longitude=106.8456,
            geofence_radius_meters=20.0,
            is_active=True,
        )
        db.add(zone)
        db.flush()
        
        # Link to toilet template
        zone_template = CleaningZoneTemplate(
            zone_id=zone.id,
            checklist_template_id=toilet_template.id,
            frequency_type="DAILY_3X",
            frequency_detail="06:00,12:00,18:00",
            is_active=True,
        )
        db.add(zone_template)
    
    # Patient Rooms
    rooms = [
        {"name": "Ruang 1001", "floor": "Lantai 1", "area_type": "patient_room", "qr_code": "ROOM-1001"},
        {"name": "Ruang 1002", "floor": "Lantai 1", "area_type": "patient_room", "qr_code": "ROOM-1002"},
        {"name": "Ruang 1003", "floor": "Lantai 1", "area_type": "patient_room", "qr_code": "ROOM-1003"},
        {"name": "Ruang 1005", "floor": "Lantai 1", "area_type": "patient_room", "qr_code": "ROOM-1005"},
        {"name": "Ruang 2001", "floor": "Lantai 2", "area_type": "patient_room", "qr_code": "ROOM-2001"},
        {"name": "Ruang 2002", "floor": "Lantai 2", "area_type": "patient_room", "qr_code": "ROOM-2002"},
        {"name": "Ruang 3001", "floor": "Lantai 3", "area_type": "patient_room", "qr_code": "ROOM-3001"},
    ]
    
    for room_data in rooms:
        zone = CleaningZone(
            company_id=company_id,
            site_id=site_id,
            name=room_data["name"],
            floor=room_data["floor"],
            area_type=room_data["area_type"],
            qr_code=room_data["qr_code"],
            geofence_latitude=-6.2088,
            geofence_longitude=106.8456,
            geofence_radius_meters=15.0,
            is_active=True,
        )
        db.add(zone)
        db.flush()
        
        # Link to room template
        zone_template = CleaningZoneTemplate(
            zone_id=zone.id,
            checklist_template_id=room_template.id,
            frequency_type="DAILY",
            frequency_detail="08:00",
            is_active=True,
        )
        db.add(zone_template)
    
    # Lobby
    lobby_zone = CleaningZone(
        company_id=company_id,
        site_id=site_id,
        name="Lobby Utama",
        floor="Lantai 1",
        area_type="lobby",
        qr_code="LOBBY-001",
        geofence_latitude=-6.2088,
        geofence_longitude=106.8456,
        geofence_radius_meters=50.0,
        is_active=True,
    )
    db.add(lobby_zone)
    db.flush()
    
    lobby_zone_template = CleaningZoneTemplate(
        zone_id=lobby_zone.id,
        checklist_template_id=lobby_template.id,
        frequency_type="DAILY_3X",
        frequency_detail="06:00,12:00,18:00",
        is_active=True,
    )
    db.add(lobby_zone_template)
    
    # Parking Lot
    parking_zone = CleaningZone(
        company_id=company_id,
        site_id=site_id,
        name="Area Parkir",
        floor="Lantai Dasar",
        area_type="parking",
        qr_code="PARKING-001",
        geofence_latitude=-6.2088,
        geofence_longitude=106.8456,
        geofence_radius_meters=100.0,
        is_active=True,
    )
    db.add(parking_zone)
    db.flush()
    
    parking_zone_template = CleaningZoneTemplate(
        zone_id=parking_zone.id,
        checklist_template_id=parking_template.id,
        frequency_type="DAILY",
        frequency_detail="07:00",
        is_active=True,
    )
    db.add(parking_zone_template)
    
    # Additional areas
    additional_areas = [
        {"name": "Koridor Lantai 1", "floor": "Lantai 1", "area_type": "corridor", "qr_code": "CORRIDOR-101"},
        {"name": "Koridor Lantai 2", "floor": "Lantai 2", "area_type": "corridor", "qr_code": "CORRIDOR-201"},
        {"name": "Koridor Lantai 3", "floor": "Lantai 3", "area_type": "corridor", "qr_code": "CORRIDOR-301"},
        {"name": "Ruang Tunggu", "floor": "Lantai 1", "area_type": "waiting_room", "qr_code": "WAIT-001"},
        {"name": "Cafeteria", "floor": "Lantai 1", "area_type": "cafeteria", "qr_code": "CAFE-001"},
    ]
    
    for area_data in additional_areas:
        zone = CleaningZone(
            company_id=company_id,
            site_id=site_id,
            name=area_data["name"],
            floor=area_data["floor"],
            area_type=area_data["area_type"],
            qr_code=area_data["qr_code"],
            geofence_latitude=-6.2088,
            geofence_longitude=106.8456,
            geofence_radius_meters=25.0,
            is_active=True,
        )
        db.add(zone)
        db.flush()
        
        # Link to lobby template (generic cleaning)
        zone_template = CleaningZoneTemplate(
            zone_id=zone.id,
            checklist_template_id=lobby_template.id,
            frequency_type="DAILY",
            frequency_detail="08:00",
            is_active=True,
        )
        db.add(zone_template)
    
    db.commit()
    print(f"✅ Created hospital cleaning zones and templates for site_id={site_id}")

def main():
    db = SessionLocal()
    try:
        # Get or create company
        company = db.query(Company).first()
        if not company:
            company = Company(name="Rumah Sakit Verolux", code="RSV")
            db.add(company)
            db.commit()
            db.refresh(company)
        
        # Get or create site (using raw SQL to avoid schema issues)
        from sqlalchemy import text
        result = db.execute(text("SELECT id FROM sites LIMIT 1"))
        site_row = result.fetchone()
        
        if not site_row:
            # Create site using raw SQL
            db.execute(text("""
                INSERT INTO sites (company_id, name, address, lat, lng, geofence_radius_m)
                VALUES (:company_id, :name, :address, :lat, :lng, :radius)
            """), {
                "company_id": company.id,
                "name": "Rumah Sakit Verolux - Jakarta",
                "address": "Jl. Contoh No. 123, Jakarta",
                "lat": -6.2088,
                "lng": 106.8456,
                "radius": 100.0
            })
            db.commit()
            result = db.execute(text("SELECT id FROM sites WHERE name = :name"), {"name": "Rumah Sakit Verolux - Jakarta"})
            site_row = result.fetchone()
        
        site_id = site_row[0] if site_row else 1
        
        # Create zones and templates
        create_hospital_zones_and_templates(db, company.id, site_id)
        
        print("\n🎉 Phase 1 Complete: Hospital Cleaning Zones & Templates created!")
        print(f"   - Company: {company.name} (ID: {company.id})")
        print(f"   - Site ID: {site_id}")
        print("\n   Created zones:")
        print("   - 5 Toilets (Toilet 1-5)")
        print("   - 7 Patient Rooms (1001, 1002, 1003, 1005, 2001, 2002, 3001)")
        print("   - 1 Lobby")
        print("   - 1 Parking Lot")
        print("   - 5 Additional Areas (Corridors, Waiting Room, Cafeteria)")
        print("\n   Total: 19 cleaning zones with checklist templates")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()

