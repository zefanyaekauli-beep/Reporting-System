// frontend/web/src/api/driverApi.ts

import api from "./client";

export interface Vehicle {
  id: number;
  site_id: number;
  plate_number: string;
  vehicle_type: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  capacity?: number | null;
  status: string;
}

export interface VehicleCreate {
  site_id: number;
  plate_number: string;
  vehicle_type: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  capacity?: number | null;
}

export interface DriverTripStop {
  id: number;
  trip_id: number;
  sequence: number;
  name: string;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  planned_arrival_time?: string | null;
  planned_departure_time?: string | null;
  actual_arrival_time?: string | null;
  actual_departure_time?: string | null;
}

export interface DriverTripStopCreate {
  sequence: number;
  name: string;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  planned_arrival_time?: string | null;
  planned_departure_time?: string | null;
}

export interface DriverTrip {
  id: number;
  site_id: number;
  driver_id: number;
  vehicle_id: number;
  route_id?: number | null;
  trip_date: string;
  planned_start_time?: string | null;
  planned_end_time?: string | null;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  status: string;
  notes?: string | null;
}

export interface DriverTripWithDetails extends DriverTrip {
  vehicle?: Vehicle | null;
  driver_name?: string | null;
  stops: DriverTripStop[];
  has_pre_trip_checklist: boolean;
  has_post_trip_checklist: boolean;
  pre_trip_completed: boolean;
  post_trip_completed: boolean;
}

export interface DriverTripCreate {
  site_id: number;
  driver_id: number;
  vehicle_id: number;
  route_id?: number | null;
  trip_date: string;
  planned_start_time?: string | null;
  planned_end_time?: string | null;
  stops?: DriverTripStopCreate[] | null;
}

export interface DriverTripEvent {
  id: number;
  trip_id: number;
  stop_id?: number | null;
  event_type: string;
  time: string;
  latitude?: string | null;
  longitude?: string | null;
  notes?: string | null;
}

export interface DriverTripEventCreate {
  trip_id: number;
  stop_id?: number | null;
  event_type: string;
  latitude?: string | null;
  longitude?: string | null;
  notes?: string | null;
}

export interface TripChecklist {
  id: number;
  trip_id: number;
  status: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: number;
  order: number;
  title: string;
  description?: string | null;
  required: boolean;
  evidence_type: string;
  status: string;
  completed_at?: string | null;
  note?: string | null;
  evidence_id?: string | null;
}

// Vehicles
export async function listVehicles(params?: {
  site_id?: number;
  status?: string;
}): Promise<{ data: Vehicle[] }> {
  const response = await api.get("/driver/vehicles", { params });
  return { data: response.data };
}

export async function createVehicle(
  payload: VehicleCreate
): Promise<{ data: Vehicle }> {
  const response = await api.post("/driver/vehicles", payload);
  return { data: response.data };
}

export async function getVehicle(vehicleId: number): Promise<{ data: Vehicle }> {
  const response = await api.get(`/driver/vehicles/${vehicleId}`);
  return { data: response.data };
}

// Driver Trips
export async function listTrips(params?: {
  site_id?: number;
  driver_id?: number;
  vehicle_id?: number;
  trip_date?: string;
  status?: string;
}): Promise<{ data: DriverTripWithDetails[] }> {
  const response = await api.get("/driver/trips", { params });
  return { data: response.data };
}

export async function createTrip(
  payload: DriverTripCreate
): Promise<{ data: DriverTrip }> {
  const response = await api.post("/driver/trips", payload);
  return { data: response.data };
}

export async function getTrip(
  tripId: number
): Promise<{ data: DriverTripWithDetails }> {
  const response = await api.get(`/driver/trips/${tripId}`);
  return { data: response.data };
}

export async function startTrip(tripId: number): Promise<{ data: DriverTrip }> {
  const response = await api.post(`/driver/trips/${tripId}/start`);
  return { data: response.data };
}

export async function endTrip(tripId: number): Promise<{ data: DriverTrip }> {
  const response = await api.post(`/driver/trips/${tripId}/end`);
  return { data: response.data };
}

// Trip Checklists
export async function getPreTripChecklist(
  tripId: number
): Promise<{ data: TripChecklist }> {
  const response = await api.get(`/driver/trips/${tripId}/pre-trip-checklist`);
  return { data: response.data };
}

export async function getPostTripChecklist(
  tripId: number
): Promise<{ data: TripChecklist }> {
  const response = await api.get(`/driver/trips/${tripId}/post-trip-checklist`);
  return { data: response.data };
}

// Complete checklist item (reuse security API endpoint)
export async function completeChecklistItem(
  checklistId: number,
  itemId: number,
  payload: {
    status: string;
    note?: string | null;
    evidence_id?: string | null;
  }
): Promise<{ data: any }> {
  const response = await api.post(
    `/security/checklists/${checklistId}/items/${itemId}/complete`,
    payload
  );
  return { data: response.data };
}

// Trip Events
export async function createTripEvent(
  tripId: number,
  payload: DriverTripEventCreate
): Promise<{ data: DriverTripEvent }> {
  const response = await api.post(`/driver/trips/${tripId}/events`, payload);
  return { data: response.data };
}

