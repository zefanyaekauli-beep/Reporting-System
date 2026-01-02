// frontend/web/src/api/parkingApi.ts

import api from "./client";

// ========== Interfaces ==========

export interface ParkingSession {
  id: number;
  company_id: number;
  site_id: number;
  vehicle_type: string;
  license_plate: string;
  driver_name?: string | null;
  driver_phone?: string | null;
  entry_time: string;
  exit_time?: string | null;
  parking_fee?: number | null;
  payment_status?: string | null;
  entry_photo_path?: string | null;
  exit_photo_path?: string | null;
  notes?: string | null;
  status: string; // "ACTIVE", "COMPLETED"
  created_at: string;
}

export interface CreateParkingEntryPayload {
  site_id: number;
  vehicle_type: string;
  license_plate: string;
  driver_name?: string;
  driver_phone?: string;
  notes?: string;
  entry_photo?: File;
}

export interface CreateParkingExitPayload {
  session_id: number;
  parking_fee?: number;
  payment_status?: string;
  notes?: string;
  exit_photo?: File;
}

export interface ParkingReport {
  id: number;
  company_id: number;
  site_id: number;
  user_id: number;
  division?: string | null;
  report_type: string;
  location_text?: string | null;
  title: string;
  description?: string | null;
  severity?: string | null;
  status: string;
  evidence_paths?: string | null;
  created_at: string;
}

export interface CreateParkingReportPayload {
  report_type: string;
  site_id: number;
  location_text?: string;
  title: string;
  description?: string;
  severity?: string;
  evidenceFiles?: File[];
}

export interface ParkingAttendance {
  id: number;
  site_id: number;
  checkin_time: string | null;
  checkout_time: string | null;
  status: string;
  is_valid_location: boolean;
}

export interface Checklist {
  id: number;
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

export interface ParkingDashboard {
  total_sessions_today: number;
  active_sessions: number;
  completed_sessions: number;
  total_revenue_today: number;
  occupancy_rate: number;
  average_duration_minutes: number;
}

// ========== Parking Sessions ==========

export async function listParkingSessions(params?: {
  site_id?: number;
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}): Promise<{ data: ParkingSession[] }> {
  const response = await api.get("/parking/sessions", { params });
  return { data: response.data };
}

export async function getParkingSession(sessionId: number): Promise<{ data: ParkingSession }> {
  const response = await api.get(`/parking/sessions/${sessionId}`);
  return { data: response.data };
}

export async function createParkingEntry(
  payload: CreateParkingEntryPayload
): Promise<{ data: ParkingSession }> {
  const formData = new FormData();
  formData.append("site_id", String(payload.site_id));
  formData.append("vehicle_type", payload.vehicle_type);
  formData.append("license_plate", payload.license_plate);
  
  if (payload.driver_name) {
    formData.append("driver_name", payload.driver_name);
  }
  if (payload.driver_phone) {
    formData.append("driver_phone", payload.driver_phone);
  }
  if (payload.notes) {
    formData.append("notes", payload.notes);
  }
  if (payload.entry_photo) {
    formData.append("entry_photo", payload.entry_photo);
  }

  const response = await api.post("/parking/entry", formData);
  return { data: response.data };
}

export async function createParkingExit(
  payload: CreateParkingExitPayload
): Promise<{ data: ParkingSession }> {
  const formData = new FormData();
  formData.append("session_id", String(payload.session_id));
  
  if (payload.parking_fee !== undefined) {
    formData.append("parking_fee", String(payload.parking_fee));
  }
  if (payload.payment_status) {
    formData.append("payment_status", payload.payment_status);
  }
  if (payload.notes) {
    formData.append("notes", payload.notes);
  }
  if (payload.exit_photo) {
    formData.append("exit_photo", payload.exit_photo);
  }

  const response = await api.post("/parking/exit", formData);
  return { data: response.data };
}

export async function getActiveSessions(params?: {
  site_id?: number;
}): Promise<{ data: ParkingSession[] }> {
  const response = await api.get("/parking/sessions/active", { params });
  return { data: response.data };
}

// ========== Dashboard ==========

export async function getParkingDashboard(params?: {
  site_id?: number;
  date_filter?: string;
}): Promise<{ data: ParkingDashboard }> {
  const response = await api.get("/parking/dashboard", { params });
  return { data: response.data };
}

// ========== Reports ==========

export async function createParkingReport(
  payload: CreateParkingReportPayload
): Promise<{ data: ParkingReport }> {
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
  
  if (payload.location_text && payload.location_text.trim()) {
    formData.append("location_text", payload.location_text.trim());
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

  const response = await api.post("/parking/reports", formData);
  return { data: response.data };
}

export async function listParkingReports(params?: {
  site_id?: number;
  from_date?: string;
  to_date?: string;
}): Promise<{ data: ParkingReport[] }> {
  const response = await api.get("/parking/reports", { params });
  return { data: response.data };
}

export async function getParkingReport(reportId: number): Promise<{ data: ParkingReport }> {
  const response = await api.get(`/parking/reports/${reportId}`);
  return { data: response.data };
}

export async function exportParkingReportPDF(reportId: number): Promise<Blob> {
  const response = await api.get(`/parking/reports/${reportId}/export-pdf`, {
    responseType: "blob",
  });
  return response.data;
}

export async function exportParkingReportsSummaryPDF(params?: {
  site_id?: number;
  from_date?: string;
  to_date?: string;
}): Promise<Blob> {
  const response = await api.get("/parking/reports/export-pdf", {
    params,
    responseType: "blob",
  });
  return response.data;
}

// ========== Attendance ==========

export async function getTodayParkingAttendance(
  siteId: number
): Promise<{ data: ParkingAttendance | null }> {
  const response = await api.get(`/parking/attendance/today?site_id=${siteId}`);
  return { data: response.data };
}

// ========== Checklist ==========

export async function getTodayParkingChecklist(): Promise<{ data: Checklist | null }> {
  try {
    const response = await api.get("/parking/me/checklist/today");
    return { data: response.data };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { data: null };
    }
    throw error;
  }
}

export async function createParkingChecklistManually(
  siteId: number
): Promise<{ data: Checklist }> {
  const response = await api.post("/parking/me/checklist/create", { site_id: siteId });
  return { data: response.data };
}

export async function completeParkingChecklistItem(
  checklistId: number,
  itemId: number,
  payload: {
    status: string;
    note?: string | null;
    evidence_id?: string | null;
  }
): Promise<{ data: Checklist }> {
  const response = await api.patch(
    `/parking/me/checklist/${checklistId}/items/${itemId}/complete`,
    payload
  );
  return { data: response.data };
}

// ========== Shifts ==========

export async function getParkingShiftsCalendar(params: {
  start: string;
  end: string;
}): Promise<any[]> {
  const response = await api.get("/parking/shifts/calendar", { params });
  return response.data;
}

export async function parkingShiftAction(
  shiftId: number,
  action: "confirm" | "cancel" | "take"
): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`/parking/shifts/${shiftId}/${action}`);
  return response.data;
}

// ========== Statistics ==========

export async function getParkingStatistics(params?: {
  site_id?: number;
  from_date?: string;
  to_date?: string;
}): Promise<any> {
  const response = await api.get("/parking/statistics", { params });
  return response.data;
}

export async function getVehicleTypeBreakdown(params?: {
  site_id?: number;
  date?: string;
}): Promise<any> {
  const response = await api.get("/parking/statistics/vehicle-types", { params });
  return response.data;
}

export async function getRevenueReport(params?: {
  site_id?: number;
  from_date?: string;
  to_date?: string;
}): Promise<any> {
  const response = await api.get("/parking/statistics/revenue", { params });
  return response.data;
}
