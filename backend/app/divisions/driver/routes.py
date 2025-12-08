# backend/app/divisions/driver/routes.py

from datetime import date, datetime, time
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from . import models, schemas
from app.divisions.security.models import Checklist, ChecklistItem, ChecklistStatus, ChecklistItemStatus, ChecklistTemplate

router = APIRouter(tags=["driver"])

# ---- Vehicles ----

@router.get("/vehicles", response_model=List[schemas.VehicleBase])
def list_vehicles(
    site_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all vehicles."""
    q = db.query(models.Vehicle).filter(
        models.Vehicle.company_id == current_user.get("company_id", 1),
    )
    if site_id:
        q = q.filter(models.Vehicle.site_id == site_id)
    if status:
        q = q.filter(models.Vehicle.status == status)
    return q.all()

@router.post("/vehicles", response_model=schemas.VehicleBase)
def create_vehicle(
    payload: schemas.VehicleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new vehicle."""
    vehicle = models.Vehicle(
        company_id=current_user.get("company_id", 1),
        site_id=payload.site_id,
        plate_number=payload.plate_number,
        vehicle_type=payload.vehicle_type,
        make=payload.make,
        model=payload.model,
        year=payload.year,
        capacity=payload.capacity,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.get("/vehicles/{vehicle_id}", response_model=schemas.VehicleBase)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific vehicle."""
    vehicle = (
        db.query(models.Vehicle)
        .filter(
            models.Vehicle.id == vehicle_id,
            models.Vehicle.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

# ---- Driver Trips ----

@router.get("/trips", response_model=List[schemas.DriverTripWithDetails])
def list_trips(
    site_id: Optional[int] = Query(None),
    driver_id: Optional[int] = Query(None),
    vehicle_id: Optional[int] = Query(None),
    trip_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List driver trips."""
    q = db.query(models.DriverTrip).filter(
        models.DriverTrip.company_id == current_user.get("company_id", 1),
    )
    if site_id:
        q = q.filter(models.DriverTrip.site_id == site_id)
    if driver_id:
        q = q.filter(models.DriverTrip.driver_id == driver_id)
    if vehicle_id:
        q = q.filter(models.DriverTrip.vehicle_id == vehicle_id)
    if trip_date:
        q = q.filter(models.DriverTrip.trip_date == trip_date)
    if status:
        q = q.filter(models.DriverTrip.status == status)
    
    trips = q.order_by(models.DriverTrip.trip_date.desc(), models.DriverTrip.planned_start_time).all()
    
    result = []
    for trip in trips:
        # Get vehicle
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
        
        # Get driver name
        driver = db.query(User).filter(User.id == trip.driver_id).first()
        driver_name = driver.username if driver else None
        
        # Get stops
        stops = trip.stops
        
        # Check for pre-trip and post-trip checklists
        pre_trip_checklist = (
            db.query(Checklist)
            .filter(
                Checklist.company_id == trip.company_id,
                Checklist.context_type == "DRIVER_PRE_TRIP",
                Checklist.context_id == trip.id,
            )
            .first()
        )
        post_trip_checklist = (
            db.query(Checklist)
            .filter(
                Checklist.company_id == trip.company_id,
                Checklist.context_type == "DRIVER_POST_TRIP",
                Checklist.context_id == trip.id,
            )
            .first()
        )
        
        result.append(schemas.DriverTripWithDetails(
            id=trip.id,
            site_id=trip.site_id,
            driver_id=trip.driver_id,
            vehicle_id=trip.vehicle_id,
            route_id=trip.route_id,
            trip_date=trip.trip_date,
            planned_start_time=trip.planned_start_time.isoformat() if trip.planned_start_time else None,
            planned_end_time=trip.planned_end_time.isoformat() if trip.planned_end_time else None,
            actual_start_time=trip.actual_start_time,
            actual_end_time=trip.actual_end_time,
            status=trip.status.value if hasattr(trip.status, "value") else str(trip.status),
            notes=trip.notes,
            vehicle=schemas.VehicleBase(
                id=vehicle.id,
                site_id=vehicle.site_id,
                plate_number=vehicle.plate_number,
                vehicle_type=vehicle.vehicle_type.value if hasattr(vehicle.vehicle_type, "value") else str(vehicle.vehicle_type),
                make=vehicle.make,
                model=vehicle.model,
                year=vehicle.year,
                capacity=vehicle.capacity,
                status=vehicle.status.value if hasattr(vehicle.status, "value") else str(vehicle.status),
            ) if vehicle else None,
            driver_name=driver_name,
            stops=[schemas.DriverTripStopBase(
                id=stop.id,
                trip_id=stop.trip_id,
                sequence=stop.sequence,
                name=stop.name,
                address=stop.address,
                latitude=stop.latitude,
                longitude=stop.longitude,
                planned_arrival_time=stop.planned_arrival_time.isoformat() if stop.planned_arrival_time else None,
                planned_departure_time=stop.planned_departure_time.isoformat() if stop.planned_departure_time else None,
                actual_arrival_time=stop.actual_arrival_time,
                actual_departure_time=stop.actual_departure_time,
            ) for stop in stops],
            has_pre_trip_checklist=pre_trip_checklist is not None,
            has_post_trip_checklist=post_trip_checklist is not None,
            pre_trip_completed=pre_trip_checklist.status == ChecklistStatus.COMPLETED if pre_trip_checklist else False,
            post_trip_completed=post_trip_checklist.status == ChecklistStatus.COMPLETED if post_trip_checklist else False,
        ))
    
    return result

@router.post("/trips", response_model=schemas.DriverTripBase)
def create_trip(
    payload: schemas.DriverTripCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new driver trip."""
    # Verify vehicle exists
    vehicle = (
        db.query(models.Vehicle)
        .filter(
            models.Vehicle.id == payload.vehicle_id,
            models.Vehicle.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Parse times
    planned_start = None
    planned_end = None
    if payload.planned_start_time:
        try:
            planned_start = datetime.strptime(payload.planned_start_time, "%H:%M:%S").time()
        except:
            planned_start = datetime.strptime(payload.planned_start_time, "%H:%M").time()
    if payload.planned_end_time:
        try:
            planned_end = datetime.strptime(payload.planned_end_time, "%H:%M:%S").time()
        except:
            planned_end = datetime.strptime(payload.planned_end_time, "%H:%M").time()
    
    trip = models.DriverTrip(
        company_id=current_user.get("company_id", 1),
        site_id=payload.site_id,
        driver_id=payload.driver_id,
        vehicle_id=payload.vehicle_id,
        route_id=payload.route_id,
        trip_date=payload.trip_date,
        planned_start_time=planned_start,
        planned_end_time=planned_end,
        status=models.TripStatus.PLANNED,
    )
    db.add(trip)
    db.flush()
    
    # Create stops if provided
    if payload.stops:
        for stop_data in payload.stops:
            planned_arrival = None
            planned_departure = None
            if stop_data.planned_arrival_time:
                try:
                    planned_arrival = datetime.strptime(stop_data.planned_arrival_time, "%H:%M:%S").time()
                except:
                    planned_arrival = datetime.strptime(stop_data.planned_arrival_time, "%H:%M").time()
            if stop_data.planned_departure_time:
                try:
                    planned_departure = datetime.strptime(stop_data.planned_departure_time, "%H:%M:%S").time()
                except:
                    planned_departure = datetime.strptime(stop_data.planned_departure_time, "%H:%M").time()
            
            stop = models.DriverTripStop(
                trip_id=trip.id,
                sequence=stop_data.sequence,
                name=stop_data.name,
                address=stop_data.address,
                latitude=stop_data.latitude,
                longitude=stop_data.longitude,
                planned_arrival_time=planned_arrival,
                planned_departure_time=planned_departure,
            )
            db.add(stop)
    
    db.commit()
    db.refresh(trip)
    return trip

@router.get("/trips/{trip_id}", response_model=schemas.DriverTripWithDetails)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific trip with details."""
    trip = (
        db.query(models.DriverTrip)
        .filter(
            models.DriverTrip.id == trip_id,
            models.DriverTrip.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Similar logic as list_trips but for single trip
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
    driver = db.query(User).filter(User.id == trip.driver_id).first()
    stops = trip.stops
    
    pre_trip_checklist = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == trip.company_id,
            Checklist.context_type == "DRIVER_PRE_TRIP",
            Checklist.context_id == trip.id,
        )
        .first()
    )
    post_trip_checklist = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == trip.company_id,
            Checklist.context_type == "DRIVER_POST_TRIP",
            Checklist.context_id == trip.id,
        )
        .first()
    )
    
    return schemas.DriverTripWithDetails(
        id=trip.id,
        site_id=trip.site_id,
        driver_id=trip.driver_id,
        vehicle_id=trip.vehicle_id,
        route_id=trip.route_id,
        trip_date=trip.trip_date,
        planned_start_time=trip.planned_start_time.isoformat() if trip.planned_start_time else None,
        planned_end_time=trip.planned_end_time.isoformat() if trip.planned_end_time else None,
        actual_start_time=trip.actual_start_time,
        actual_end_time=trip.actual_end_time,
        status=trip.status.value if hasattr(trip.status, "value") else str(trip.status),
        notes=trip.notes,
        vehicle=schemas.VehicleBase(
            id=vehicle.id,
            site_id=vehicle.site_id,
            plate_number=vehicle.plate_number,
            vehicle_type=vehicle.vehicle_type.value if hasattr(vehicle.vehicle_type, "value") else str(vehicle.vehicle_type),
            make=vehicle.make,
            model=vehicle.model,
            year=vehicle.year,
            capacity=vehicle.capacity,
            status=vehicle.status.value if hasattr(vehicle.status, "value") else str(vehicle.status),
        ) if vehicle else None,
        driver_name=driver.username if driver else None,
        stops=[schemas.DriverTripStopBase(
            id=stop.id,
            trip_id=stop.trip_id,
            sequence=stop.sequence,
            name=stop.name,
            address=stop.address,
            latitude=stop.latitude,
            longitude=stop.longitude,
            planned_arrival_time=stop.planned_arrival_time.isoformat() if stop.planned_arrival_time else None,
            planned_departure_time=stop.planned_departure_time.isoformat() if stop.planned_departure_time else None,
            actual_arrival_time=stop.actual_arrival_time,
            actual_departure_time=stop.actual_departure_time,
        ) for stop in stops],
        has_pre_trip_checklist=pre_trip_checklist is not None,
        has_post_trip_checklist=post_trip_checklist is not None,
        pre_trip_completed=pre_trip_checklist.status == ChecklistStatus.COMPLETED if pre_trip_checklist else False,
        post_trip_completed=post_trip_checklist.status == ChecklistStatus.COMPLETED if post_trip_checklist else False,
    )

@router.post("/trips/{trip_id}/start", response_model=schemas.DriverTripBase)
def start_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Start a trip (driver action)."""
    trip = (
        db.query(models.DriverTrip)
        .filter(
            models.DriverTrip.id == trip_id,
            models.DriverTrip.company_id == current_user.get("company_id", 1),
            models.DriverTrip.driver_id == current_user.get("id"),
        )
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found or not assigned to you")
    
    if trip.status != models.TripStatus.PLANNED:
        raise HTTPException(status_code=400, detail="Trip is not in PLANNED status")
    
    # Check if pre-trip checklist is completed
    pre_trip_checklist = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == trip.company_id,
            Checklist.context_type == "DRIVER_PRE_TRIP",
            Checklist.context_id == trip.id,
        )
        .first()
    )
    
    if not pre_trip_checklist:
        raise HTTPException(status_code=400, detail="Pre-trip checklist not found. Please complete pre-trip checklist first.")
    
    if pre_trip_checklist.status != ChecklistStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Pre-trip checklist must be completed before starting trip")
    
    trip.status = models.TripStatus.IN_PROGRESS
    trip.actual_start_time = datetime.utcnow()
    
    # Create START event
    event = models.DriverTripEvent(
        trip_id=trip.id,
        event_type=models.TripEventType.START,
        time=datetime.utcnow(),
    )
    db.add(event)
    
    db.commit()
    db.refresh(trip)
    return trip

@router.post("/trips/{trip_id}/end", response_model=schemas.DriverTripBase)
def end_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """End a trip (driver action)."""
    trip = (
        db.query(models.DriverTrip)
        .filter(
            models.DriverTrip.id == trip_id,
            models.DriverTrip.company_id == current_user.get("company_id", 1),
            models.DriverTrip.driver_id == current_user.get("id"),
        )
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found or not assigned to you")
    
    if trip.status != models.TripStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Trip is not in progress")
    
    trip.status = models.TripStatus.COMPLETED
    trip.actual_end_time = datetime.utcnow()
    
    # Create END event
    event = models.DriverTripEvent(
        trip_id=trip.id,
        event_type=models.TripEventType.END,
        time=datetime.utcnow(),
    )
    db.add(event)
    
    db.commit()
    db.refresh(trip)
    return trip

# ---- Trip Checklists (Pre-trip and Post-trip) ----

@router.get("/trips/{trip_id}/pre-trip-checklist", response_model=dict)
def get_pre_trip_checklist(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get or create pre-trip checklist for a trip."""
    trip = (
        db.query(models.DriverTrip)
        .filter(
            models.DriverTrip.id == trip_id,
            models.DriverTrip.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Find or create checklist
    checklist = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == trip.company_id,
            Checklist.site_id == trip.site_id,
            Checklist.user_id == trip.driver_id,
            Checklist.shift_date == trip.trip_date,
            Checklist.context_type == "DRIVER_PRE_TRIP",
            Checklist.context_id == trip.id,
        )
        .first()
    )
    
    if not checklist:
        # Find template for pre-trip
        template = (
            db.query(ChecklistTemplate)
            .filter(
                ChecklistTemplate.company_id == trip.company_id,
                ChecklistTemplate.role == "DRIVER",
                ChecklistTemplate.name.ilike("%pre-trip%"),
                ChecklistTemplate.is_active == True,
            )
            .first()
        )
        
        if not template:
            raise HTTPException(status_code=404, detail="Pre-trip checklist template not found")
        
        # Create checklist
        checklist = Checklist(
            company_id=trip.company_id,
            site_id=trip.site_id,
            user_id=trip.driver_id,
            template_id=template.id,
            shift_date=trip.trip_date,
            context_type="DRIVER_PRE_TRIP",
            context_id=trip.id,
            status=ChecklistStatus.OPEN,
        )
        db.add(checklist)
        db.flush()
        
        # Create items
        for order, template_item in enumerate(template.items, start=1):
            item = ChecklistItem(
                checklist_id=checklist.id,
                template_item_id=template_item.id,
                order=order,
                title=template_item.title,
                description=template_item.description,
                required=template_item.required,
                evidence_type=template_item.evidence_type,
                status=ChecklistItemStatus.PENDING,
            )
            db.add(item)
        
        db.commit()
        db.refresh(checklist)
    
    items = [
        {
            "id": item.id,
            "order": item.order,
            "title": item.title,
            "description": item.description,
            "required": item.required,
            "evidence_type": item.evidence_type,
            "status": item.status.value if hasattr(item.status, "value") else str(item.status),
            "completed_at": item.completed_at.isoformat() if item.completed_at else None,
            "note": item.note,
            "evidence_id": item.evidence_id,
        }
        for item in checklist.items
    ]
    
    return {
        "id": checklist.id,
        "trip_id": trip_id,
        "status": checklist.status.value if hasattr(checklist.status, "value") else str(checklist.status),
        "items": items,
    }

@router.get("/trips/{trip_id}/post-trip-checklist", response_model=dict)
def get_post_trip_checklist(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get or create post-trip checklist for a trip."""
    trip = (
        db.query(models.DriverTrip)
        .filter(
            models.DriverTrip.id == trip_id,
            models.DriverTrip.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Similar to pre-trip but for post-trip
    checklist = (
        db.query(Checklist)
        .filter(
            Checklist.company_id == trip.company_id,
            Checklist.site_id == trip.site_id,
            Checklist.user_id == trip.driver_id,
            Checklist.shift_date == trip.trip_date,
            Checklist.context_type == "DRIVER_POST_TRIP",
            Checklist.context_id == trip.id,
        )
        .first()
    )
    
    if not checklist:
        template = (
            db.query(ChecklistTemplate)
            .filter(
                ChecklistTemplate.company_id == trip.company_id,
                ChecklistTemplate.role == "DRIVER",
                ChecklistTemplate.name.ilike("%post-trip%"),
                ChecklistTemplate.is_active == True,
            )
            .first()
        )
        
        if not template:
            raise HTTPException(status_code=404, detail="Post-trip checklist template not found")
        
        checklist = Checklist(
            company_id=trip.company_id,
            site_id=trip.site_id,
            user_id=trip.driver_id,
            template_id=template.id,
            shift_date=trip.trip_date,
            context_type="DRIVER_POST_TRIP",
            context_id=trip.id,
            status=ChecklistStatus.OPEN,
        )
        db.add(checklist)
        db.flush()
        
        for order, template_item in enumerate(template.items, start=1):
            item = ChecklistItem(
                checklist_id=checklist.id,
                template_item_id=template_item.id,
                order=order,
                title=template_item.title,
                description=template_item.description,
                required=template_item.required,
                evidence_type=template_item.evidence_type,
                status=ChecklistItemStatus.PENDING,
            )
            db.add(item)
        
        db.commit()
        db.refresh(checklist)
    
    items = [
        {
            "id": item.id,
            "order": item.order,
            "title": item.title,
            "description": item.description,
            "required": item.required,
            "evidence_type": item.evidence_type,
            "status": item.status.value if hasattr(item.status, "value") else str(item.status),
            "completed_at": item.completed_at.isoformat() if item.completed_at else None,
            "note": item.note,
            "evidence_id": item.evidence_id,
        }
        for item in checklist.items
    ]
    
    return {
        "id": checklist.id,
        "trip_id": trip_id,
        "status": checklist.status.value if hasattr(checklist.status, "value") else str(checklist.status),
        "items": items,
    }

# ---- Trip Events ----

@router.post("/trips/{trip_id}/events", response_model=schemas.DriverTripEventBase)
def create_trip_event(
    trip_id: int,
    payload: schemas.DriverTripEventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a trip event (arrival, departure, breakdown, etc.)."""
    trip = (
        db.query(models.DriverTrip)
        .filter(
            models.DriverTrip.id == trip_id,
            models.DriverTrip.company_id == current_user.get("company_id", 1),
        )
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    event = models.DriverTripEvent(
        trip_id=trip_id,
        stop_id=payload.stop_id,
        event_type=payload.event_type,
        time=datetime.utcnow(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        notes=payload.notes,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

