# backend/app/divisions/driver/models.py

from datetime import datetime, date
from typing import Optional
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    ForeignKey,
    Text,
    Boolean,
    Enum,
    Float,
    Time,
)
from sqlalchemy.orm import relationship
from app.models.base import Base

class VehicleStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    OUT_OF_SERVICE = "OUT_OF_SERVICE"
    IN_MAINTENANCE = "IN_MAINTENANCE"
    SOLD = "SOLD"

class VehicleType(str, enum.Enum):
    CAR = "CAR"
    TRUCK = "TRUCK"
    BUS = "BUS"
    VAN = "VAN"
    MOTORCYCLE = "MOTORCYCLE"

class Vehicle(Base):
    """
    Fleet vehicles (cars, trucks, buses, vans, motorcycles).
    """
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    plate_number = Column(String(32), unique=True, nullable=False, index=True)
    vehicle_type = Column(Enum(VehicleType), nullable=False)
    make = Column(String(128), nullable=True)  # e.g., "Toyota"
    model = Column(String(128), nullable=True)  # e.g., "Hiace"
    year = Column(Integer, nullable=True)
    capacity = Column(Integer, nullable=True)  # Passenger or cargo capacity
    status = Column(Enum(VehicleStatus), default=VehicleStatus.ACTIVE, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    trips = relationship("DriverTrip", back_populates="vehicle", cascade="all, delete-orphan")

class TripStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class DriverTrip(Base):
    """
    Driver trip assignment (who drives what, when, on which route).
    """
    __tablename__ = "driver_trips"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    route_id = Column(Integer, nullable=True)  # Optional: link to route definition
    trip_date = Column(Date, nullable=False, index=True)
    planned_start_time = Column(Time, nullable=True)
    planned_end_time = Column(Time, nullable=True)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    status = Column(Enum(TripStatus), default=TripStatus.PLANNED, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("User", foreign_keys=[driver_id])
    stops = relationship("DriverTripStop", back_populates="trip", cascade="all, delete-orphan", order_by="DriverTripStop.sequence")
    events = relationship("DriverTripEvent", back_populates="trip", cascade="all, delete-orphan", order_by="DriverTripEvent.time")

class DriverTripStop(Base):
    """
    Planned stops for a trip (pickups, deliveries, internal shuttle stops).
    """
    __tablename__ = "driver_trip_stops"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("driver_trips.id"), nullable=False, index=True)
    sequence = Column(Integer, nullable=False)  # Order of stops (1, 2, 3, ...)
    name = Column(String(255), nullable=False)  # e.g., "Main Gate", "Warehouse A"
    address = Column(Text, nullable=True)
    latitude = Column(String(32), nullable=True)
    longitude = Column(String(32), nullable=True)
    planned_arrival_time = Column(Time, nullable=True)
    planned_departure_time = Column(Time, nullable=True)
    actual_arrival_time = Column(DateTime, nullable=True)
    actual_departure_time = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    trip = relationship("DriverTrip", back_populates="stops")

class TripEventType(str, enum.Enum):
    START = "START"
    STOP_ARRIVAL = "STOP_ARRIVAL"
    STOP_DEPARTURE = "STOP_DEPARTURE"
    BREAKDOWN = "BREAKDOWN"
    ACCIDENT = "ACCIDENT"
    FUEL = "FUEL"
    NOTE = "NOTE"
    END = "END"

class DriverTripEvent(Base):
    """
    Actual events during a trip (location, arrival, delay, fuel stop, breakdown, etc.).
    """
    __tablename__ = "driver_trip_events"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("driver_trips.id"), nullable=False, index=True)
    stop_id = Column(Integer, ForeignKey("driver_trip_stops.id"), nullable=True, index=True)  # Nullable for non-stop events
    event_type = Column(Enum(TripEventType), nullable=False)
    time = Column(DateTime, nullable=False, index=True)
    latitude = Column(String(32), nullable=True)
    longitude = Column(String(32), nullable=True)
    gps_log_id = Column(Integer, nullable=True)  # Link to guard_locations if needed
    details_json = Column(Text, nullable=True)  # JSON for additional event data
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    trip = relationship("DriverTrip", back_populates="events")
    stop = relationship("DriverTripStop", foreign_keys=[stop_id])

