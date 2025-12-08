// frontend/web/src/api/supervisorApi.ts

import api from "./client";

export interface DivisionAttendanceSnapshot {
  on_duty: number;
  expected: number;
  late: number;
  no_show: number;
}

export interface DivisionTaskCompletion {
  completion_percent: number;
  total_tasks: number;
  completed_tasks: number;
  missed_count: number;
}

export interface Overview {
  // Overall metrics
  total_today: number;
  on_shift_now: number;
  overtime_today: number;
  unique_guards_today: number;
  
  // Division attendance breakdown
  security_attendance: DivisionAttendanceSnapshot;
  cleaning_attendance: DivisionAttendanceSnapshot;
  driver_attendance: DivisionAttendanceSnapshot;
  
  // Division task completion
  security_tasks: DivisionTaskCompletion;
  cleaning_tasks: DivisionTaskCompletion;
  driver_tasks: DivisionTaskCompletion;
  
  // Legacy fields for backward compatibility
  security_today?: number;
  cleaning_today?: number;
  parking_today?: number;
  cleaning_zones_completed?: number;
  cleaning_zones_total?: number;
  parking_sessions_today?: number;
  reports_today?: number;
  incidents_today?: number;
  patrols_today?: number;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  user_name?: string;
  site_name: string;
  role_type: string; // Division: SECURITY, CLEANING, DRIVER, PARKING
  checkin_time: string;
  checkout_time: string | null;
  shift?: string | null;
  is_overtime: boolean;
  is_backup: boolean;
  status: string; // IN_PROGRESS, COMPLETED
  gps_valid?: boolean | null; // GPS location validation
  photo_evidence?: boolean | null; // Photo evidence available
}

export interface AttendanceUpdate {
  checkin_time?: string;
  checkout_time?: string;
  shift?: string;
  is_overtime?: boolean;
  is_backup?: boolean;
}

export interface ReportRecord {
  id: number;
  division: string;
  report_type: string;
  title: string;
  description?: string;
  created_by_name?: string;
  site_name: string;
  created_at: string;
  status: string;
}

export interface Site {
  id: number;
  name: string;
  address?: string;
  qr_code?: string;
}

export async function getOverview(): Promise<Overview> {
  const response = await api.get("/supervisor/overview");
  return response.data;
}

export async function listAttendance(params?: {
  date_from?: string;
  date_to?: string;
  site_id?: number;
  user_id?: number;
  role_type?: string; // SECURITY, CLEANING, DRIVER, PARKING
  status?: string; // on_duty, completed, IN_PROGRESS, COMPLETED
  company_id?: number;
}): Promise<AttendanceRecord[]> {
  const response = await api.get("/supervisor/attendance", { params });
  // Handle paginated response
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }
  // If it's a paginated response, extract items
  if (response.data && response.data.items && Array.isArray(response.data.items)) {
    return response.data.items;
  }
  // Fallback to empty array
  return [];
}

export async function updateAttendance(
  attendanceId: number,
  payload: AttendanceUpdate
): Promise<AttendanceRecord> {
  const response = await api.patch(`/supervisor/attendance/${attendanceId}`, payload);
  return response.data;
}

export async function listReports(params?: {
  division?: string;
  date_from?: string;
  date_to?: string;
  site_id?: number;
  search?: string;
  status?: string;
  company_id?: number;
  limit?: number;
}): Promise<ReportRecord[]> {
  const response = await api.get("/supervisor/reports", { params });
  // Handle paginated response
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }
  // If it's a paginated response, extract items
  if (response.data && response.data.items && Array.isArray(response.data.items)) {
    return response.data.items;
  }
  // Fallback to empty array
  return [];
}

export async function listSites(params?: {
  company_id?: number;
}): Promise<Site[]> {
  const response = await api.get("/supervisor/sites", { params });
  return response.data;
}

export async function createSite(payload: SiteCreate): Promise<Site> {
  const response = await api.post("/supervisor/sites", payload);
  return response.data;
}

export function getSiteQrCodeUrl(siteId: number): string {
  return `${api.defaults.baseURL}/supervisor/sites/${siteId}/qr`;
}

// ========== Officer Management ==========

export interface Officer {
  id: number;
  name: string;
  badge_id: string;
  position: string;
  division: string;
  status: "active" | "inactive";
}

export async function getOfficers(params?: {
  division?: string;
  site_id?: number;
}): Promise<Officer[]> {
  const response = await api.get("/supervisor/officers", { params });
  return response.data;
}

export async function createOfficer(payload: Partial<Officer>): Promise<Officer> {
  const response = await api.post("/supervisor/officers", payload);
  return response.data;
}

export async function updateOfficer(id: number, payload: Partial<Officer>): Promise<Officer> {
  const response = await api.patch(`/supervisor/officers/${id}`, payload);
  return response.data;
}

export async function deleteOfficer(id: number): Promise<void> {
  await api.delete(`/supervisor/officers/${id}`);
}

// ========== Attendance Correction ==========

export interface CorrectionRequest {
  id: number;
  officer_name: string;
  date: string;
  type: "late" | "missing_clock_in" | "missing_clock_out" | "overtime";
  requested_clock_in?: string | null;
  requested_clock_out?: string | null;
  reason: string;
  evidence_url?: string;
  status: "pending" | "approved" | "rejected";
}

export async function getCorrections(): Promise<CorrectionRequest[]> {
  const response = await api.get("/supervisor/attendance/corrections");
  return response.data;
}

export async function approveCorrection(id: number): Promise<CorrectionRequest> {
  const response = await api.post(`/supervisor/attendance/corrections/${id}/approve`);
  return response.data;
}

export async function rejectCorrection(id: number, reason: string): Promise<CorrectionRequest> {
  const response = await api.post(`/supervisor/attendance/corrections/${id}/reject`, { reason });
  return response.data;
}

// ========== Inspect Points ==========

export interface InspectPoint {
  id: number;
  name: string;
  code: string; // QR code content
  site_name: string;
  description?: string;
  is_active: boolean;
}

export async function getInspectPoints(): Promise<InspectPoint[]> {
  const response = await api.get("/supervisor/inspectpoints");
  return response.data;
}

export async function createInspectPoint(payload: Partial<InspectPoint>): Promise<InspectPoint> {
  const response = await api.post("/supervisor/inspectpoints", payload);
  return response.data;
}

export async function updateInspectPoint(
  id: number,
  payload: Partial<InspectPoint>
): Promise<InspectPoint> {
  const response = await api.patch(`/supervisor/inspectpoints/${id}`, payload);
  return response.data;
}

export async function deleteInspectPoint(id: number): Promise<void> {
  await api.delete(`/supervisor/inspectpoints/${id}`);
}

export function getInspectPointQrUrl(id: number): string {
  return `${api.defaults.baseURL}/supervisor/inspectpoints/${id}/qr`;
}

export function getPatrolActivityQrUrl(id: number): string {
  return `${api.defaults.baseURL}/supervisor/patrol-activity/${id}/qr`;
}

// ========== Checklist / Task Console ==========

export interface ChecklistTask {
  id: number;
  template_name?: string | null;
  division: string;
  context_type?: string | null;
  site_name: string;
  zone_or_vehicle?: string | null;
  assigned_user_name?: string | null;
  start_time?: string | null;
  completed_time?: string | null;
  completion_percent: number;
  evidence_available: boolean;
  status: string;
}

export async function listChecklists(params?: {
  date?: string;
  site_id?: number;
  division?: string;
  context_type?: string;
  status?: string;
  company_id?: number;
  page?: number;
  limit?: number;
}): Promise<{ items: ChecklistTask[]; total: number; page: number; limit: number; pages: number }> {
  const response = await api.get("/supervisor/checklists", { params });
  // Handle paginated response
  if (response.data && response.data.items && Array.isArray(response.data.items)) {
    return response.data;
  }
  // Fallback to empty array
  return { items: [], total: 0, page: 1, limit: 20, pages: 0 };
}

// ========== Shift Management ==========

export interface Shift {
  id: number;
  company_id: number;
  site_id: number;
  site_name?: string | null;
  division: string;
  shift_date: string; // ISO date string
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  shift_type?: string | null;
  user_id?: number | null;
  user_name?: string | null;
  status: string; // ASSIGNED, OPEN, COMPLETED, CANCELLED
  notes?: string | null;
}

export interface ShiftCreate {
  site_id: number;
  division: string;
  shift_date: string; // YYYY-MM-DD format
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  shift_type?: string;
  user_id?: number | null;
  notes?: string;
}

export interface ShiftUpdate {
  user_id?: number | null;
  status?: string;
  notes?: string;
}

export async function getShiftsCalendar(params: {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  site_id?: number;
  division?: string;
}): Promise<Shift[]> {
  const response = await api.get("/supervisor/shifts/calendar", { params });
  return response.data;
}

export async function createShift(payload: ShiftCreate): Promise<Shift> {
  const response = await api.post("/supervisor/shifts", payload);
  return response.data;
}

export async function updateShift(shiftId: number, payload: ShiftUpdate): Promise<Shift> {
  const response = await api.patch(`/supervisor/shifts/${shiftId}`, payload);
  return response.data;
}

export async function deleteShift(shiftId: number): Promise<void> {
  await api.delete(`/supervisor/shifts/${shiftId}`);
}

