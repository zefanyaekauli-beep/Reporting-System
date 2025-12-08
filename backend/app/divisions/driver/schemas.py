# backend/app/divisions/driver/schemas.py

from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel

# Vehicle Schemas
class VehicleBase(BaseModel):
    id: int
    site_id: int
    plate_number: str
    vehicle_type: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    capacity: Optional[int] = None
    status: str

    class Config:
        from_attributes = True

class VehicleCreate(BaseModel):
    site_id: int
    plate_number: str
    vehicle_type: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    capacity: Optional[int] = None

# Driver Trip Schemas
class DriverTripStopBase(BaseModel):
    id: int
    trip_id: int
    sequence: int
    name: str
    address: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    planned_arrival_time: Optional[str] = None
    planned_departure_time: Optional[str] = None
    actual_arrival_time: Optional[datetime] = None
    actual_departure_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class DriverTripStopCreate(BaseModel):
    sequence: int
    name: str
    address: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    planned_arrival_time: Optional[str] = None
    planned_departure_time: Optional[str] = None

class DriverTripBase(BaseModel):
    id: int
    site_id: int
    driver_id: int
    vehicle_id: int
    route_id: Optional[int] = None
    trip_date: date
    planned_start_time: Optional[str] = None
    planned_end_time: Optional[str] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DriverTripCreate(BaseModel):
    site_id: int
    driver_id: int
    vehicle_id: int
    route_id: Optional[int] = None
    trip_date: date
    planned_start_time: Optional[str] = None
    planned_end_time: Optional[str] = None
    stops: Optional[List[DriverTripStopCreate]] = None

class DriverTripWithDetails(DriverTripBase):
    vehicle: Optional[VehicleBase] = None
    driver_name: Optional[str] = None
    stops: List[DriverTripStopBase] = []
    has_pre_trip_checklist: bool = False
    has_post_trip_checklist: bool = False
    pre_trip_completed: bool = False
    post_trip_completed: bool = False

    class Config:
        from_attributes = True

# Trip Event Schemas
class DriverTripEventBase(BaseModel):
    id: int
    trip_id: int
    stop_id: Optional[int] = None
    event_type: str
    time: datetime
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DriverTripEventCreate(BaseModel):
    trip_id: int
    stop_id: Optional[int] = None
    event_type: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    notes: Optional[str] = None

