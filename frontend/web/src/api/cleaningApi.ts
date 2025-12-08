// frontend/web/src/api/cleaningApi.ts

import api from "./client";

export interface CleaningZone {
  id: number;
  site_id: number;
  name: string;
  code?: string | null;
  qr_code?: string | null;
  floor?: string | null;
  area_type?: string | null;
  geofence_latitude?: string | null;
  geofence_longitude?: string | null;
  geofence_radius_meters?: number | null;
  is_active: boolean;
}

export interface CleaningZoneWithTasks {
  zone: CleaningZone;
  checklist?: {
    id: number;
    status: string;
  } | null;
  task_count: number;
  completed_count: number;
  status: string; // "CLEANED_ON_TIME", "LATE", "NOT_DONE", "PARTIAL"
  kpi_status?: string | null; // "OK", "WARN", "FAIL"
  last_cleaned_at?: string | null;
  kpi_summary?: Record<string, any> | null;
}

export interface CleaningZoneCreate {
  site_id: number;
  name: string;
  floor?: string | null;
  area_type?: string | null;
}

export interface CleaningInspection {
  id: number;
  zone_id: number;
  inspector_id: number;
  score?: number | null;
  status: string;
  notes?: string | null;
  inspection_date: string;
}

export interface CleaningInspectionCreate {
  zone_id: number;
  score?: number | null;
  status?: string;
  notes?: string | null;
  inspection_date?: string | null;
}

export interface ZoneChecklist {
  id: number;
  zone_id: number;
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
  // KPI fields
  kpi_key?: string | null;
  answer_type?: string | null;
  photo_required?: boolean;
  answer_bool?: boolean | null;
  answer_int?: number | null;
  answer_text?: string | null;
  photo_id?: number | null;
}

// List cleaning zones
export async function listCleaningZones(params?: {
  site_id?: number;
  is_active?: boolean;
}): Promise<{ data: CleaningZone[] }> {
  const response = await api.get("/cleaning/zones", { params });
  return { data: response.data };
}

// Create cleaning zone
export async function createCleaningZone(
  payload: CleaningZoneCreate
): Promise<{ data: CleaningZone }> {
  const response = await api.post("/cleaning/zones", payload);
  return { data: response.data };
}

// Get today's cleaning tasks
export async function getTodayCleaningTasks(params?: {
  site_id?: number;
}): Promise<{ data: CleaningZoneWithTasks[] }> {
  const response = await api.get("/cleaning/tasks/today", { params });
  return { data: response.data };
}

// Get zone checklist
export async function getZoneChecklist(
  zoneId: number
): Promise<{ data: ZoneChecklist }> {
  const response = await api.get(`/cleaning/zones/${zoneId}/checklist`);
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
    // KPI fields
    answer_bool?: boolean | null;
    answer_int?: number | null;
    answer_text?: string | null;
    photo_id?: number | null;
    gps_lat?: number | null;
    gps_lng?: number | null;
    gps_accuracy?: number | null;
    mock_location?: boolean | null;
  }
): Promise<{ data: any }> {
  const response = await api.post(
    `/security/me/checklist/${checklistId}/items/${itemId}/complete`,
    payload
  );
  return { data: response.data };
}

// Get cleaning dashboard (supervisor)
export async function getCleaningDashboard(params?: {
  site_id?: number;
  date_filter?: string;
}): Promise<{ data: CleaningZoneWithTasks[] }> {
  const response = await api.get("/cleaning/dashboard", { params });
  return { data: response.data };
}

// Create cleaning inspection
export async function createCleaningInspection(
  payload: CleaningInspectionCreate
): Promise<{ data: CleaningInspection }> {
  const response = await api.post("/cleaning/inspections", payload);
  return { data: response.data };
}

// List cleaning inspections
export async function listCleaningInspections(params?: {
  zone_id?: number;
  site_id?: number;
}): Promise<{ data: CleaningInspection[] }> {
  const response = await api.get("/cleaning/inspections", { params });
  return { data: response.data };
}

// ---- Attendance ----

export interface CleaningAttendance {
  id: number;
  site_id: number;
  checkin_time: string | null;
  checkout_time: string | null;
  status: string;
  is_valid_location: boolean;
}

export async function getTodayCleaningAttendance(
  siteId: number
): Promise<{ data: CleaningAttendance | null }> {
  const response = await api.get(`/cleaning/attendance/today?site_id=${siteId}`);
  return { data: response.data };
}

// ---- Reports ----

export interface CleaningReport {
  id: number;
  site_id: number;
  zone_id?: number | null;
  report_type: string;
  title: string;
  description?: string | null;
  severity?: string | null;
  status: string;
  location_text?: string | null;
  evidence_paths?: string | null;
  created_at: string;
}

export async function createCleaningReport(payload: {
  report_type: string;
  site_id: number;
  zone_id?: number;
  location_text?: string;
  title: string;
  description?: string;
  severity?: string;
  evidenceFiles?: File[];
}): Promise<{ data: CleaningReport }> {
  const formData = new FormData();
  formData.append("report_type", payload.report_type);
  formData.append("site_id", String(payload.site_id));
  if (payload.zone_id) formData.append("zone_id", String(payload.zone_id));
  if (payload.location_text) formData.append("location_text", payload.location_text);
  formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  if (payload.severity) formData.append("severity", payload.severity);
  if (payload.evidenceFiles) {
    payload.evidenceFiles.forEach((file) => {
      formData.append("evidence_files", file);
    });
  }
  const response = await api.post("/cleaning/reports", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { data: response.data };
}

export async function listCleaningReports(params?: {
  site_id?: number;
  zone_id?: number;
  from_date?: string;
  to_date?: string;
}): Promise<{ data: CleaningReport[] }> {
  const response = await api.get("/cleaning/reports", { params });
  return { data: response.data };
}

export async function getCleaningReport(reportId: number): Promise<{ data: CleaningReport }> {
  const response = await api.get(`/cleaning/reports/${reportId}`);
  return { data: response.data };
}

export async function exportCleaningReportPDF(reportId: number): Promise<Blob> {
  const response = await api.get(`/cleaning/reports/${reportId}/export-pdf`, {
    responseType: "blob",
  });
  return response.data;
}

export async function exportCleaningReportsSummaryPDF(params?: {
  site_id?: number;
  zone_id?: number;
  from_date?: string;
  to_date?: string;
}): Promise<Blob> {
  const response = await api.get("/cleaning/reports/export-pdf", {
    params,
    responseType: "blob",
  });
  return response.data;
}

