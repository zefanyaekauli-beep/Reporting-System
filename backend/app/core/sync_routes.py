# backend/app/core/sync_routes.py

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.core.database import get_db
from app.core.offline_models import Device, ClientEvent
from app.divisions.security.models import Checklist, ChecklistItem, ChecklistStatus, ChecklistItemStatus
from app.divisions.cleaning.models import CleaningZone
import math

router = APIRouter(prefix="/sync", tags=["sync"])

class SyncEvent(BaseModel):
    client_event_id: str
    type: str
    event_time: datetime
    payload: dict
    client_version: Optional[str] = None

class SyncRequest(BaseModel):
    device_id: str
    device_time_at_send: datetime
    events: List[SyncEvent]

class SyncResponse(BaseModel):
    synced_count: int
    errors: List[dict] = []

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS points in meters (Haversine formula)."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def validate_gps_anomalies(
    db: Session,
    device_id: str,
    event_type: str,
    payload: dict,
    event_time: datetime
) -> dict:
    """
    Validate GPS data for anomalies:
    - Speed anomaly (too fast movement)
    - Jump anomaly (location jump)
    - Out of zone (for cleaning checks)
    - Mock location (from payload)
    """
    anomalies = {
        "mock_location": payload.get("gps", {}).get("mock_location", False),
        "speed_anomaly": False,
        "jump_anomaly": False,
        "out_of_zone": False,
    }
    
    gps = payload.get("gps", {})
    if not gps.get("lat") or not gps.get("lng"):
        return anomalies
    
    lat = float(gps["lat"])
    lng = float(gps["lng"])
    
    # Get last GPS event from this device
    last_event = (
        db.query(ClientEvent)
        .filter(
            ClientEvent.device_id == device_id,
            ClientEvent.type.in_(["CLEANING_CHECK", "GPS_UPDATE"]),
            ClientEvent.event_time < event_time,
        )
        .order_by(ClientEvent.event_time.desc())
        .first()
    )
    
    if last_event and last_event.payload.get("gps"):
        last_gps = last_event.payload["gps"]
        last_lat = float(last_gps.get("lat", 0))
        last_lng = float(last_gps.get("lng", 0))
        
        if last_lat and last_lng:
            distance = calculate_distance(last_lat, last_lng, lat, lng)
            time_diff = (event_time - last_event.event_time).total_seconds()
            
            if time_diff > 0:
                # Speed in m/s, convert to km/h
                speed_kmh = (distance / time_diff) * 3.6
                if speed_kmh > 200:  # 200 km/h threshold
                    anomalies["speed_anomaly"] = True
                
                # Jump anomaly: > 2km in < 1 minute
                if distance > 2000 and time_diff < 60:
                    anomalies["jump_anomaly"] = True
    
    # Out of zone check for cleaning
    if event_type == "CLEANING_CHECK" and payload.get("zone_id"):
        zone = db.query(CleaningZone).filter(CleaningZone.id == payload["zone_id"]).first()
        if zone and zone.geofence_latitude and zone.geofence_longitude:
            zone_lat = float(zone.geofence_latitude)
            zone_lng = float(zone.geofence_longitude)
            radius = zone.geofence_radius_meters or 20
            
            distance = calculate_distance(zone_lat, zone_lng, lat, lng)
            if distance > radius:
                anomalies["out_of_zone"] = True
    
    return anomalies

@router.post("/events", response_model=SyncResponse)
def sync_events(
    payload: SyncRequest,
    db: Session = Depends(get_db),
):
    """
    Sync offline events from device.
    Handles idempotent event processing and GPS validation.
    """
    server_time = datetime.utcnow()
    time_offset = (payload.device_time_at_send - server_time).total_seconds()
    
    # Register or update device
    device = (
        db.query(Device)
        .filter(Device.device_id == payload.device_id)
        .first()
    )
    
    if not device:
        device = Device(
            device_id=payload.device_id,
            time_offset_sec=int(time_offset),
            time_untrusted=abs(time_offset) > 300,  # 5 minutes threshold
            last_sync_at=server_time,
        )
        db.add(device)
    else:
        device.time_offset_sec = int(time_offset)
        device.time_untrusted = abs(time_offset) > 300
        device.last_sync_at = server_time
        db.add(device)
    
    synced_count = 0
    errors = []
    
    for event in payload.events:
        try:
            # Check if event already exists (idempotent)
            existing = (
                db.query(ClientEvent)
                .filter(
                    ClientEvent.device_id == payload.device_id,
                    ClientEvent.client_event_id == event.client_event_id,
                )
                .first()
            )
            
            if existing:
                # Already synced, skip
                synced_count += 1
                continue
            
            # Validate GPS anomalies
            anomalies = validate_gps_anomalies(
                db, payload.device_id, event.type, event.payload, event.event_time
            )
            
            # Determine validity status
            validity_status = "VALID"
            if any([
                anomalies["mock_location"],
                anomalies["speed_anomaly"],
                anomalies["jump_anomaly"],
                anomalies["out_of_zone"],
                device.time_untrusted,
            ]):
                validity_status = "SUSPICIOUS"
            
            # Create client event
            client_event = ClientEvent(
                device_id=payload.device_id,
                client_event_id=event.client_event_id,
                type=event.type,
                event_time=event.event_time,  # Jam X from device
                server_received_at=server_time,  # Jam Y
                payload=event.payload,
                client_version=event.client_version,
                time_suspect=device.time_untrusted,
                mock_location=anomalies["mock_location"],
                speed_anomaly=anomalies["speed_anomaly"],
                jump_anomaly=anomalies["jump_anomaly"],
                out_of_zone=anomalies["out_of_zone"],
                validity_status=validity_status,
            )
            db.add(client_event)
            db.flush()
            
            # Process event based on type
            if event.type == "CLEANING_CHECK":
                mapped_id = process_cleaning_check(db, event, client_event.id)
                if mapped_id:
                    client_event.mapped_entity_id = mapped_id
            
            synced_count += 1
            
        except Exception as e:
            errors.append({
                "client_event_id": event.client_event_id,
                "error": str(e),
            })
    
    db.commit()
    
    return SyncResponse(synced_count=synced_count, errors=errors)

def process_cleaning_check(db: Session, event: SyncEvent, client_event_id: int) -> Optional[int]:
    """
    Process CLEANING_CHECK event and create checklist/items.
    Returns mapped_entity_id (checklist.id).
    """
    payload = event.payload
    zone_id = payload.get("zone_id")
    if not zone_id:
        return None
    
    zone = db.query(CleaningZone).filter(CleaningZone.id == zone_id).first()
    if not zone:
        return None
    
    # Find or create checklist for this zone and date
    checklist_date = event.event_time.date()
    user_id = payload.get("user_id", 1)  # Should come from auth context
    
    checklist = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == zone.company_id,
            Checklist.site_id == zone.site_id,
            Checklist.user_id == user_id,
            Checklist.shift_date == checklist_date,
            Checklist.context_type == "CLEANING_ZONE",
            Checklist.context_id == zone.id,
        )
        .first()
    )
    
    if not checklist:
        # Find template for this zone
        from app.divisions.cleaning.models import CleaningZoneTemplate
        from app.divisions.security.models import ChecklistTemplate
        
        zone_template = (
            db.query(CleaningZoneTemplate)
            .filter(
                CleaningZoneTemplate.zone_id == zone_id,
                CleaningZoneTemplate.is_active == True,
            )
            .first()
        )
        
        if not zone_template:
            return None
        
        template = db.query(ChecklistTemplate).filter(
            ChecklistTemplate.id == zone_template.checklist_template_id
        ).first()
        
        if not template:
            return None
        
        checklist = Checklist(
            company_id=zone.company_id,
            site_id=zone.site_id,
            user_id=user_id,
            template_id=template.id,
            shift_date=checklist_date,
            context_type="CLEANING_ZONE",
            context_id=zone.id,
            status=ChecklistStatus.OPEN,
        )
        db.add(checklist)
        db.flush()
    
    # Process KPI answers
    kpi_answers = payload.get("kpi_answers", [])
    gps = payload.get("gps", {})
    
    for answer in kpi_answers:
        kpi_key = answer.get("kpi_key")
        value = answer.get("value")
        item_id = answer.get("item_id")  # Template item ID
        
        # Find checklist item by kpi_key or template_item_id
        item = (
            db.query(ChecklistItem)
            .filter(
                ChecklistItem.checklist_id == checklist.id,
                ChecklistItem.kpi_key == kpi_key,
            )
            .first()
        )
        
        if not item and item_id:
            # Find by template item
            item = (
                db.query(ChecklistItem)
                .filter(
                    ChecklistItem.checklist_id == checklist.id,
                    ChecklistItem.template_item_id == item_id,
                )
                .first()
            )
        
        if item:
            # Update item with answer
            item.status = ChecklistItemStatus.COMPLETED
            item.completed_at = event.event_time  # Use jam X
            
            # Set answer based on type
            if item.answer_type == "BOOLEAN":
                item.answer_bool = value in [True, "YES", "yes", "true", "True", "Ya"]
            elif item.answer_type == "SCORE":
                try:
                    item.answer_int = int(value) if isinstance(value, (int, str)) and str(value).strip() else None
                except (ValueError, TypeError):
                    item.answer_int = None
            elif item.answer_type == "TEXT":
                item.answer_text = str(value) if value else None
            elif item.answer_type == "CHOICE":
                item.answer_text = str(value) if value else None
            
            # Set GPS
            if gps.get("lat") and gps.get("lng"):
                item.gps_latitude = float(gps["lat"])
                item.gps_longitude = float(gps["lng"])
                item.gps_accuracy = float(gps.get("accuracy", 0))
                item.mock_location = gps.get("mock_location", False)
            
            # Photo ID (if uploaded separately)
            photo_id = answer.get("photo_id")
            if photo_id:
                item.photo_id = photo_id
                item.evidence_id = f"photo_{photo_id}"
            
            db.add(item)
    
    # Update checklist status
    required_items = [item for item in checklist.items if item.required]
    completed_required = [
        item for item in required_items
        if item.status in [ChecklistItemStatus.COMPLETED, ChecklistItemStatus.NOT_APPLICABLE]
    ]
    
    if len(completed_required) == len(required_items):
        checklist.status = ChecklistStatus.COMPLETED
        checklist.completed_at = event.event_time
    else:
        checklist.status = ChecklistStatus.INCOMPLETE
    
    db.add(checklist)
    db.commit()
    
    return checklist.id

@router.get("/zones")
def get_zones_for_sync(
    site_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Get cleaning zones with QR codes for offline caching.
    """
    q = db.query(CleaningZone).filter(CleaningZone.is_active == True)
    if site_id:
        q = q.filter(CleaningZone.site_id == site_id)
    
    zones = q.all()
    
    return [
        {
            "id": zone.id,
            "site_id": zone.site_id,
            "name": zone.name,
            "code": zone.code,
            "qr_code": zone.qr_code,
            "floor": zone.floor,
            "area_type": zone.area_type,
            "geofence": {
                "latitude": zone.geofence_latitude,
                "longitude": zone.geofence_longitude,
                "radius_meters": zone.geofence_radius_meters,
            } if zone.geofence_latitude else None,
        }
        for zone in zones
    ]

