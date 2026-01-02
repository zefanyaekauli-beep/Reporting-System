// frontend/web/src/api/driverApi.ts

import api from "./client";

// ========== Interfaces ==========

export interface Trip {
  id: number;
  company_id: number;
  site_id: number;
  user_id: number;
  vehicle_id?: number | null;
  trip_number?: string | null;
  trip_type: string; // "DELIVERY", "PICKUP", "TRANSPORT", "PATROL"
  origin: string;
  destination: string;
  departure_time?: string | null;
  arrival_time?: string | null;
  distance_km?: number | null;
  status: string; // "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Alias for backward compatibility
export type DriverTripWithDetails = Trip;

export interface TripChecklist {
  id: number;
  trip_id: number;
  checklist_type: "PRE_TRIP" | "POST_TRIP";
  status: string;
  items: ChecklistItem[];
  created_at: string;
  completed_at?: string | null;
}

export interface CreateTripPayload {
  site_id: number;
  vehicle_id?: number;
  trip_type: string;
  origin: string;
  destination: string;
  departure_time?: string;
  notes?: string;
}

export interface UpdateTripPayload {
  status?: string;
  arrival_time?: string;
  distance_km?: number;
  notes?: string;
}

export interface Vehicle {
  id: number;
  company_id: number;
  vehicle_type: string;
  license_plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  status: string; // "AVAILABLE", "IN_USE", "MAINTENANCE", "UNAVAILABLE"
  last_maintenance_date?: string | null;
  next_maintenance_date?: string | null;
  odometer_km?: number | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DriverReport {
  id: number;
  company_id: number;
  site_id: number;
  user_id: number;
  trip_id?: number | null;
  vehicle_id?: number | null;
  division?: string | null;
  report_type: string;
  title: string;
  description?: string | null;
  severity?: string | null;
  status: string;
  evidence_paths?: string | null;
  created_at: string;
}

export interface CreateDriverReportPayload {
  report_type: string;
  site_id: number;
  trip_id?: number;
  vehicle_id?: number;
  title: string;
  description?: string;
  severity?: string;
  evidenceFiles?: File[];
}

export interface DriverAttendance {
  id: number;
  site_id: number;
  checkin_time: string | null;
  checkout_time: string | null;
  status: string;
  is_valid_location: boolean;
}

export interface Checklist {
  id: number;
  context_type?: string | null; // "DRIVER_PRE_TRIP", "DRIVER_POST_TRIP"
  context_id?: number | null; // trip_id or vehicle_id
  status: "PENDING" | "COMPLETED" | "INCOMPLETE";
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: number;
  order?: number;
  title: string;
  description?: string | null;
  required: boolean | string;
  evidence_type?: string;
  status: "PENDING" | "COMPLETED" | "NOT_APPLICABLE" | "FAILED" | string;
  completed_at?: string | null;
  note?: string | null;
  evidence_id?: string | null;
  _tempNote?: string;
}

export interface DriverDashboard {
  total_trips_today: number;
  completed_trips: number;
  in_progress_trips: number;
  total_distance_km: number;
  active_vehicles: number;
  maintenance_due: number;
}

// ========== Trips Management ==========

export async function listTrips(params?: {
  site_id?: number;
  user_id?: number;
  vehicle_id?: number;
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}): Promise<{ data: Trip[] }> {
  const response = await api.get("/driver/trips", { params });
  return { data: response.data };
}

export async function getTripDetail(tripId: number): Promise<{ data: Trip }> {
  const response = await api.get(`/driver/trips/${tripId}`);
  return { data: response.data };
}

// Alias for backward compatibility
export const getTrip = getTripDetail;

export async function createTrip(payload: CreateTripPayload): Promise<{ data: Trip }> {
  const response = await api.post("/driver/trips", payload);
  return { data: response.data };
}

export async function updateTrip(
  tripId: number,
  payload: UpdateTripPayload
): Promise<{ data: Trip }> {
  const response = await api.patch(`/driver/trips/${tripId}`, payload);
  return { data: response.data };
}

export async function startTrip(tripId: number): Promise<{ data: Trip }> {
  const response = await api.post(`/driver/trips/${tripId}/start`);
  return { data: response.data };
}

export async function completeTrip(
  tripId: number,
  payload?: {
    arrival_time?: string;
    distance_km?: number;
    notes?: string;
  }
): Promise<{ data: Trip }> {
  const response = await api.post(`/driver/trips/${tripId}/complete`, payload);
  return { data: response.data };
}

// Alias for backward compatibility
export const endTrip = completeTrip;

export async function cancelTrip(
  tripId: number,
  reason?: string
): Promise<{ data: Trip }> {
  const response = await api.post(`/driver/trips/${tripId}/cancel`, { reason });
  return { data: response.data };
}

export async function getMyActiveTrips(): Promise<{ data: Trip[] }> {
  const response = await api.get("/driver/trips/my/active");
  return { data: response.data };
}

export async function getMyTripsToday(params?: {
  site_id?: number;
}): Promise<{ data: Trip[] }> {
  const response = await api.get("/driver/trips/my/today", { params });
  return { data: response.data };
}

// ========== Vehicles Management ==========

export async function listVehicles(params?: {
  status?: string;
  is_active?: boolean;
}): Promise<{ data: Vehicle[] }> {
  const response = await api.get("/driver/vehicles", { params });
  return { data: response.data };
}

export async function getVehicle(vehicleId: number): Promise<{ data: Vehicle }> {
  const response = await api.get(`/driver/vehicles/${vehicleId}`);
  return { data: response.data };
}

export async function getAvailableVehicles(): Promise<{ data: Vehicle[] }> {
  const response = await api.get("/driver/vehicles/available");
  return { data: response.data };
}

// ========== Dashboard ==========

export async function getDriverDashboard(params?: {
  site_id?: number;
  date_filter?: string;
}): Promise<{ data: DriverDashboard }> {
  const response = await api.get("/driver/dashboard", { params });
  return { data: response.data };
}

// ========== Reports ==========

export async function createDriverReport(
  payload: CreateDriverReportPayload
): Promise<{ data: DriverReport }> {
  // Validate required fields
  if (!payload.report_type || !payload.report_type.trim()) {
    throw new Error("Report type is required");
  }
  if (!payload.site_id || isNaN(Number(payload.site_id)) || Number(payload.site_id) <= 0) {
    throw new Error("Site ID is required and must be a valid number");
  }
  if (!payload.title || !payload.title.trim()) {
    throw new Error("Title is required");
  }
  
  const formData = new FormData();
  formData.append("report_type", payload.report_type.trim());
  formData.append("site_id", String(payload.site_id));
  formData.append("title", payload.title.trim());
  
  if (payload.trip_id != null && payload.trip_id > 0) {
    formData.append("trip_id", String(payload.trip_id));
  }
  if (payload.vehicle_id != null && payload.vehicle_id > 0) {
    formData.append("vehicle_id", String(payload.vehicle_id));
  }
  if (payload.description && payload.description.trim()) {
    formData.append("description", payload.description.trim());
  }
  if (payload.severity && payload.severity.trim()) {
    formData.append("severity", payload.severity.trim());
  }
  
  if (payload.evidenceFiles && payload.evidenceFiles.length > 0) {
    payload.evidenceFiles.forEach((file) => {
      formData.append("evidence_files", file);
    });
  }

  const response = await api.post("/driver/reports", formData);
  return { data: response.data };
}

export async function listDriverReports(params?: {
  site_id?: number;
  trip_id?: number;
  vehicle_id?: number;
  from_date?: string;
  to_date?: string;
}): Promise<{ data: DriverReport[] }> {
  const response = await api.get("/driver/reports", { params });
  return { data: response.data };
}

export async function getDriverReport(reportId: number): Promise<{ data: DriverReport }> {
  const response = await api.get(`/driver/reports/${reportId}`);
  return { data: response.data };
}

export async function exportDriverReportPDF(reportId: number): Promise<Blob> {
  const response = await api.get(`/driver/reports/${reportId}/export-pdf`, {
    responseType: "blob",
  });
  return response.data;
}

// ========== Attendance ==========

export async function getTodayDriverAttendance(
  siteId: number
): Promise<{ data: DriverAttendance | null }> {
  const response = await api.get(`/driver/attendance/today?site_id=${siteId}`);
  return { data: response.data };
}

// ========== Checklist ==========

export async function getTodayDriverChecklist(): Promise<{ data: Checklist | null }> {
  try {
    const response = await api.get("/driver/me/checklist/today");
    return { data: response.data };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { data: null };
    }
    throw error;
  }
}

export async function createDriverChecklistManually(
  siteId: number,
  contextType?: string,
  contextId?: number
): Promise<{ data: Checklist }> {
  const response = await api.post("/driver/me/checklist/create", {
    site_id: siteId,
    context_type: contextType,
    context_id: contextId,
  });
  return { data: response.data };
}

export async function createPreTripChecklist(
  siteId: number,
  tripId: number
): Promise<{ data: Checklist }> {
  return createDriverChecklistManually(siteId, "DRIVER_PRE_TRIP", tripId);
}

export async function createPostTripChecklist(
  siteId: number,
  tripId: number
): Promise<{ data: Checklist }> {
  return createDriverChecklistManually(siteId, "DRIVER_POST_TRIP", tripId);
}

// Get pre-trip checklist for a trip
export async function getPreTripChecklist(tripId: number): Promise<{ data: TripChecklist | null }> {
  try {
    const response = await api.get(`/driver/trips/${tripId}/checklist/pre-trip`);
    return { data: response.data };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { data: null };
    }
    throw error;
  }
}

// Get post-trip checklist for a trip
export async function getPostTripChecklist(tripId: number): Promise<{ data: TripChecklist | null }> {
  try {
    const response = await api.get(`/driver/trips/${tripId}/checklist/post-trip`);
    return { data: response.data };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { data: null };
    }
    throw error;
  }
}

export async function completeDriverChecklistItem(
  checklistId: number,
  itemId: number,
  payload: {
    status: string;
    note?: string | null;
    evidence_id?: string | null;
  }
): Promise<{ data: Checklist }> {
  const response = await api.patch(
    `/driver/me/checklist/${checklistId}/items/${itemId}/complete`,
    payload
  );
  return { data: response.data };
}

// Alias for backward compatibility
export const completeChecklistItem = completeDriverChecklistItem;

// ========== Shifts ==========

export async function getDriverShiftsCalendar(params: {
  start: string;
  end: string;
}): Promise<any[]> {
  const response = await api.get("/driver/shifts/calendar", { params });
  return response.data;
}

export async function driverShiftAction(
  shiftId: number,
  action: "confirm" | "cancel" | "take"
): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/driver/shifts/${shiftId}/${action}`);
  return response.data;
}

// ========== Maintenance ==========

export async function getMaintenanceDue(params?: {
  days_ahead?: number;
}): Promise<{ data: Vehicle[] }> {
  const response = await api.get("/driver/maintenance/due", { params });
  return { data: response.data };
}

export async function recordMaintenance(payload: {
  vehicle_id: number;
  maintenance_type: string;
  description?: string;
  cost?: number;
  performed_at?: string;
  next_maintenance_date?: string;
}): Promise<{ success: boolean }> {
  const response = await api.post("/driver/maintenance/record", payload);
  return response.data;
}

// ========== GPS Tracking ==========

export async function updateTripLocation(payload: {
  trip_id: number;
  latitude: string;
  longitude: string;
  accuracy?: string;
  speed?: string;
}): Promise<{ success: boolean }> {
  const response = await api.post("/driver/location/update", payload);
  return response.data;
}

export async function getTripRoute(tripId: number): Promise<any> {
  const response = await api.get(`/driver/trips/${tripId}/route`);
  return response.data;
}

// ========== Statistics ==========

export async function getDriverStatistics(params?: {
  user_id?: number;
  from_date?: string;
  to_date?: string;
}): Promise<any> {
  const response = await api.get("/driver/statistics", { params });
  return response.data;
}

export async function getVehicleUtilization(params?: {
  from_date?: string;
  to_date?: string;
}): Promise<any> {
  const response = await api.get("/driver/statistics/vehicle-utilization", { params });
  return response.data;
}
