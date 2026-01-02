// frontend/web/src/api/securityApi.ts

import api from "./client";

export interface CreateSecurityReportPayload {
  report_type: string; // "daily" | "incident" | "finding"
  site_id: number;
  location_id?: number | null;
  location_text?: string | null;
  title: string;
  description?: string;
  severity?: string | null;
  evidenceFiles?: File[];
}


export async function createSecurityReport(
  payload: CreateSecurityReportPayload
) {
  const formData = new FormData();

  // Required fields - ensure they are not empty
  if (!payload.report_type || !payload.report_type.trim()) {
    throw new Error("Report type is required");
  }
  if (!payload.site_id || isNaN(Number(payload.site_id)) || Number(payload.site_id) <= 0) {
    throw new Error("Site ID is required and must be a valid number");
  }
  if (!payload.title || !payload.title.trim()) {
    throw new Error("Title is required");
  }
  
  formData.append("report_type", payload.report_type.trim());
  formData.append("site_id", String(payload.site_id));
  formData.append("title", payload.title.trim());
  
  // Optional fields - only append if they exist and have values
  if (payload.location_id != null && payload.location_id > 0) {
    formData.append("location_id", String(payload.location_id));
  }
  
  if (payload.location_text && payload.location_text.trim()) {
    formData.append("location_text", payload.location_text.trim());
  }
  
  if (payload.description && payload.description.trim()) {
    formData.append("description", payload.description.trim());
  }
  
  if (payload.severity && payload.severity.trim()) {
    formData.append("severity", payload.severity.trim());
  }
  
  // Handle evidence files - append each file individually
  // Backend expects: evidence_files as a list
  if (payload.evidenceFiles && payload.evidenceFiles.length > 0) {
    payload.evidenceFiles.forEach((file) => {
      // Use the same field name for all files - FastAPI will collect them as a list
      formData.append("evidence_files", file);
    });
  }

  // Debug logging (remove in production)
  if (import.meta.env.DEV) {
    console.log("FormData contents:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
  }

  // Don't set Content-Type header - let browser/Axios set it automatically with boundary
  // Setting it manually will break multipart/form-data encoding
  return api.post("/security/reports", formData);
}

export async function createSecurityReportAlternative(
  payload: CreateSecurityReportPayload
) {
  const formData = new FormData();

  // Add all non-file fields first
  formData.append("report_type", payload.report_type);
  formData.append("site_id", String(payload.site_id));
  formData.append("title", payload.title);
  
  if (payload.location_text) {
    formData.append("location_text", payload.location_text);
  }
  
  if (payload.description) {
    formData.append("description", payload.description);
  }
  
  if (payload.severity) {
    formData.append("severity", payload.severity);
  }

  // If backend expects files as individual named fields
  if (payload.evidenceFiles && payload.evidenceFiles.length > 0) {
    payload.evidenceFiles.forEach((file, index) => {
      formData.append(`evidence_file_${index}`, file);
    });
    // Also send the count
    formData.append("evidence_file_count", String(payload.evidenceFiles.length));
  }

  return api.post("/security/reports", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function testFormDataUpload() {
  const formData = new FormData();
  formData.append("test_field", "test_value");
  formData.append("test_number", "123");
  
  // Create a test file
  const testFile = new Blob(["test content"], { type: "text/plain" });
  const file = new File([testFile], "test.txt", { type: "text/plain" });
  formData.append("test_file", file);

  try {
    const response = await api.post("/debug/test-upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Test upload response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Test upload error:", error);
    throw error;
  }
}

export async function getTodayAttendance(siteId: number) {
  return api.get("/security/attendance/today", {
    params: { site_id: siteId },
  });
}

export async function checkInAttendance(
  siteId: number,
  location?: string,
  photo?: File
) {
  const formData = new FormData();
  formData.append("site_id", String(siteId));
  
  if (location) {
    formData.append("location", location);
  }
  
  if (photo) {
    formData.append("photo", photo);
  }

  return api.post("/security/attendance/check-in", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function checkOutAttendance(
  siteId: number,
  location?: string,
  photo?: File
) {
  const formData = new FormData();
  formData.append("site_id", String(siteId));
  
  if (location) {
    formData.append("location", location);
  }
  
  if (photo) {
    formData.append("photo", photo);
  }

  return api.post("/security/attendance/check-out", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function listSecurityReports(params?: {
  site_id?: number;
  from_date?: string;
  to_date?: string;
}) {
  return api.get("/security/reports", { params });
}

export async function getSecurityReport(reportId: number) {
  return api.get(`/security/reports/${reportId}`);
}

export async function exportSecurityReportPDF(reportId: number): Promise<Blob> {
  const response = await api.get(`/security/reports/${reportId}/export-pdf`, {
    responseType: "blob",
  });
  return response.data;
}

export async function exportSecurityReportsSummaryPDF(params?: {
  site_id?: number;
  start_date?: string;
  end_date?: string;
}): Promise<Blob> {
  // Backend expects from_date and to_date, not start_date and end_date
  const backendParams: any = {};
  if (params?.site_id) backendParams.site_id = params.site_id;
  if (params?.start_date) backendParams.from_date = params.start_date;
  if (params?.end_date) backendParams.to_date = params.end_date;
  
  const response = await api.get("/security/reports/export-pdf", {
    params: backendParams,
    responseType: "blob",
  });
  return response.data;
}

export interface CreatePatrolLogPayload {
  site_id: number;
  start_time: string; // ISO datetime string
  end_time?: string | null;
  area_text?: string | null;
  notes?: string | null;
  main_photo?: File | null;
}

export async function createPatrolLog(payload: CreatePatrolLogPayload) {
  const formData = new FormData();
  formData.append("site_id", String(payload.site_id));
  formData.append("start_time", payload.start_time);
  
  if (payload.end_time) {
    formData.append("end_time", payload.end_time);
  }
  
  if (payload.area_text) {
    formData.append("area_text", payload.area_text);
  }
  
  if (payload.notes) {
    formData.append("notes", payload.notes);
  }
  
  if (payload.main_photo) {
    formData.append("main_photo", payload.main_photo);
  }

  return api.post("/security/patrols", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function listPatrolLogs(params?: {
  site_id?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
}): Promise<any[]> {
  const response = await api.get("/security/patrols", { params });
  // Backend returns array directly, but handle both cases
  if (Array.isArray(response.data)) {
    return response.data;
  }
  // If response has a data property that's an array
  if (response.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  // If response.data is an object with items or results
  if (response.data?.items && Array.isArray(response.data.items)) {
    return response.data.items;
  }
  // Default: return empty array if structure is unexpected
  console.warn("Unexpected response structure from /security/patrols:", response.data);
  return [];
}

// Get detailed patrol information
export async function getPatrolDetail(patrolId: number): Promise<any> {
  const response = await api.get(`/security/patrols/${patrolId}/detail`);
  return response.data;
}

// Get GPS track for a patrol
export async function getGPSTrack(patrolId: number): Promise<any> {
  const response = await api.get(`/security/patrols/${patrolId}/gps-track`);
  return response.data;
}

// ---- Checklist APIs ----

export interface ChecklistItem {
  id: number;
  checklist_id: number;
  template_item_id?: number | null;
  order: number;
  title: string;
  description?: string | null;
  required: boolean | string; // Can be boolean or string "true"/"false"
  evidence_type?: string | null;
  status: string; // "PENDING" | "COMPLETED" | "NOT_APPLICABLE" | "FAILED"
  completed_at?: string | null;
  evidence_path?: string | null;
  note?: string | null;
  _tempNote?: string; // Temporary note for UI
}

export interface Checklist {
  id: number;
  company_id: number;
  site_id: number;
  user_id: number;
  attendance_id?: number | null;
  template_id?: number | null;
  shift_date: string;
  status: string; // "OPEN" | "COMPLETED" | "INCOMPLETE"
  completed_at?: string | null;
  notes?: string | null;
  items: ChecklistItem[];
  created_at: string;
}

export async function getTodayChecklist(): Promise<{ data: Checklist | null }> {
  try {
  const response = await api.get("/security/me/checklist/today");
  return { data: response.data };
  } catch (error: any) {
    // 404 is expected when user hasn't checked in yet - return null instead of throwing
    if (error?.response?.status === 404) {
      return { data: null };
    }
    // Re-throw other errors
    throw error;
  }
}

export async function createChecklistManually(siteId: number): Promise<{ data: Checklist }> {
  const response = await api.post("/security/me/checklist/create", { site_id: siteId });
  return { data: response.data };
}

export interface CompleteChecklistItemPayload {
  status: "COMPLETED" | "NOT_APPLICABLE" | "FAILED";
  note?: string;
  evidence_file?: File;
}

export async function completeChecklistItem(
  checklistId: number,
  itemId: number,
  payload: CompleteChecklistItemPayload
) {
  return api.post(
    `/security/me/checklist/${checklistId}/items/${itemId}/complete`,
    payload
  );
}

// Admin endpoints
export interface ChecklistSummary {
  id: number;
  user_id: number;
  user_name: string;
  site_id: number;
  site_name: string;
  shift_date: string;
  shift_type?: string | null;
  status: string;
  completed_count: number;
  total_required: number;
}

export async function getAdminChecklists(params?: {
  date_str?: string;
  site_id?: number;
  status_filter?: string;
}): Promise<{ data: ChecklistSummary[] }> {
  const response = await api.get("/security/admin/checklists", { params });
  return { data: response.data };
}

// ---- Dispatch & Panic APIs ----

export interface DispatchTicket {
  id: number;
  ticket_number: string;
  site_id: number;
  caller_name?: string | null;
  caller_phone?: string | null;
  incident_type: string;
  priority: string;
  description: string;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  status: string; // "NEW" | "ASSIGNED" | "ONSCENE" | "CLOSED" | "CANCELLED"
  assigned_to_user_id?: number | null;
  assigned_at?: string | null;
  onscene_at?: string | null;
  closed_at?: string | null;
  created_at: string;
}

export interface CreateDispatchTicketPayload {
  site_id: number;
  caller_name?: string;
  caller_phone?: string;
  incident_type: string;
  priority?: string;
  description: string;
  location?: string;
  latitude?: string;
  longitude?: string;
}

export interface UpdateDispatchTicketPayload {
  status?: string;
  assigned_to_user_id?: number;
  resolution_notes?: string;
}

export async function createDispatchTicket(
  payload: CreateDispatchTicketPayload
): Promise<{ data: DispatchTicket }> {
  const response = await api.post("/security/dispatch/tickets", payload);
  return { data: response.data };
}

export async function listDispatchTickets(params?: {
  site_id?: number;
  status?: string;
  assigned_to?: number;
}): Promise<{ data: DispatchTicket[] }> {
  const response = await api.get("/security/dispatch/tickets", { params });
  return { data: response.data };
}

export async function updateDispatchTicket(
  ticketId: number,
  payload: UpdateDispatchTicketPayload
): Promise<{ data: DispatchTicket }> {
  const response = await api.patch(`/security/dispatch/tickets/${ticketId}`, payload);
  return { data: response.data };
}

export interface PanicAlert {
  id: number;
  site_id: number;
  user_id: number;
  alert_type: string;
  latitude: string;
  longitude: string;
  location_text?: string | null;
  message?: string | null;
  status: string;
  created_at: string;
}

export interface CreatePanicAlertPayload {
  site_id: number;
  alert_type?: string;
  latitude: string;
  longitude: string;
  location_text?: string;
  message?: string;
}

export async function triggerPanicAlert(
  payload: CreatePanicAlertPayload
): Promise<{ data: PanicAlert }> {
  const response = await api.post("/security/panic/alert", payload);
  return { data: response.data };
}

export async function listPanicAlerts(params?: {
  site_id?: number;
  status?: string;
}): Promise<{ data: PanicAlert[] }> {
  const response = await api.get("/security/panic/alerts", { params });
  return { data: response.data };
}

export async function acknowledgePanicAlert(
  alertId: number
): Promise<{ message: string; alert: PanicAlert }> {
  const response = await api.post(`/security/panic/alerts/${alertId}/acknowledge`);
  return response.data;
}

// ---- DAR & Passdown APIs ----

export interface DailyActivityReport {
  id: number;
  site_id: number;
  shift_date: string;
  shift_type?: string | null;
  report_number: string;
  summary_data?: any;
  status: string;
  created_at: string;
}

export async function generateDAR(params: {
  site_id: number;
  shift_date?: string;
  shift_type?: string;
}): Promise<{ data: DailyActivityReport }> {
  const response = await api.post("/security/dar/generate", null, { params });
  return { data: response.data };
}

export async function listDARReports(params?: {
  site_id?: number;
  shift_date?: string;
}): Promise<{ data: DailyActivityReport[] }> {
  const response = await api.get("/security/dar/reports", { params });
  return { data: response.data };
}

export interface ShiftHandover {
  id: number;
  site_id: number;
  shift_date: string;
  from_shift_type?: string | null;
  to_shift_type?: string | null;
  from_user_id: number;
  to_user_id?: number | null;
  category?: string | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface CreateShiftHandoverPayload {
  site_id: number;
  shift_date: string;
  to_shift_type?: string;
  to_user_id?: number;
  category?: string;
  title: string;
  description: string;
  priority?: string;
}

export async function createPassdownNote(
  payload: CreateShiftHandoverPayload
): Promise<{ data: ShiftHandover }> {
  const response = await api.post("/security/passdown/notes", payload);
  return { data: response.data };
}

export async function listPassdownNotes(params?: {
  site_id?: number;
  shift_date?: string;
  status?: string;
}): Promise<{ data: ShiftHandover[] }> {
  const response = await api.get("/security/passdown/notes", { params });
  return { data: response.data };
}

export async function acknowledgePassdownNote(
  noteId: number
): Promise<{ message: string; note: ShiftHandover }> {
  const response = await api.post(`/security/passdown/notes/${noteId}/acknowledge`);
  return response.data;
}


// ---- Tour Checkpoints & Routes APIs ----

export interface PatrolRoute {
  id: number;
  site_id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  checkpoints: PatrolCheckpoint[];
}

export interface PatrolCheckpoint {
  id: number;
  route_id: number;
  order: number;
  name: string;
  description?: string | null;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  nfc_code?: string | null;
  qr_code?: string | null;
  required: boolean;
  time_window_start?: string | null;
  time_window_end?: string | null;
}

export interface ScanCheckpointPayload {
  route_id: number;
  checkpoint_id: number;
  scan_code: string;
  scan_method: "NFC" | "QR";
  latitude?: string | null;
  longitude?: string | null;
  notes?: string | null;
}

export async function listPatrolRoutes(params?: {
  site_id?: number;
  is_active?: boolean;
}): Promise<{ data: PatrolRoute[] }> {
  const response = await api.get("/security/patrol/routes", { params });
  return { data: response.data };
}

export async function scanCheckpoint(
  payload: ScanCheckpointPayload
): Promise<{ data: any }> {
  const response = await api.post("/security/patrol/checkpoints/scan", payload);
  return { data: response.data };
}

export async function getMissedCheckpoints(params: {
  route_id: number;
  shift_date?: string;
}): Promise<{ data: any }> {
  const response = await api.get("/security/patrol/checkpoints/missed", {
    params,
  });
  return { data: response.data };
}

// ---- Post Orders & Policy APIs ----

export interface PostOrder {
  id: number;
  site_id?: number | null;
  title: string;
  content: string;
  category?: string | null;
  priority: string;
  is_active: boolean;
  effective_date?: string | null;
  expires_date?: string | null;
  created_at: string;
}

export interface PostOrderAcknowledgment {
  id: number;
  post_order_id: number;
  user_id: number;
  acknowledged_at: string;
}

export async function listPostOrders(params?: {
  site_id?: number;
  is_active?: boolean;
  priority?: string;
}): Promise<{ data: PostOrder[] }> {
  const response = await api.get("/security/post-orders", { params });
  return { data: response.data };
}

export async function getPostOrder(
  orderId: number
): Promise<{ data: PostOrder }> {
  const response = await api.get(`/security/post-orders/${orderId}`);
  return { data: response.data };
}

export async function acknowledgePostOrder(
  orderId: number
): Promise<{ data: PostOrderAcknowledgment }> {
  const response = await api.post(`/security/post-orders/${orderId}/acknowledge`);
  return { data: response.data };
}

export async function getMyAcknowledgments(): Promise<{
  data: PostOrderAcknowledgment[];
}> {
  const response = await api.get("/security/post-orders/acknowledgments/my");
  return { data: response.data };
}

// ---- Shift Scheduling APIs ----

export interface ShiftSchedule {
  id: number;
  site_id: number;
  user_id: number;
  shift_date: string;
  shift_type: string;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  confirmed_at?: string | null;
}

export async function getMyShifts(params?: {
  start_date?: string;
  end_date?: string;
  status?: string;
}): Promise<{ data: ShiftSchedule[] }> {
  const response = await api.get("/security/shifts/my", { params });
  return { data: response.data };
}

export async function getOpenShifts(params?: {
  site_id?: number;
  shift_date?: string;
  shift_type?: string;
}): Promise<{ data: ShiftSchedule[] }> {
  const response = await api.get("/security/shifts/open", { params });
  return { data: response.data };
}

export interface ConfirmShiftPayload {
  confirmed: boolean;
  notes?: string | null;
}

export async function confirmShift(
  shiftId: number,
  payload: ConfirmShiftPayload
): Promise<{ data: ShiftSchedule }> {
  const response = await api.post(`/security/shifts/${shiftId}/confirm`, payload);
  return { data: response.data };
}

// ---- GPS Tracking & Idle Alerts APIs ----

export interface GuardLocation {
  id: number;
  user_id: number;
  latitude: string;
  longitude: string;
  timestamp: string;
}

export interface UpdateLocationPayload {
  site_id: number;
  latitude: string;
  longitude: string;
  accuracy?: string | null;
  heading?: string | null;
  speed?: string | null;
}

export async function updateLocation(
  payload: UpdateLocationPayload
): Promise<{ data: any }> {
  const response = await api.post("/security/location/update", payload);
  return { data: response.data };
}

export async function getLiveLocations(params?: {
  site_id?: number;
}): Promise<{ data: GuardLocation[] }> {
  const response = await api.get("/security/location/live", { params });
  return { data: response.data };
}

export interface IdleAlert {
  id: number;
  user_id: number;
  alert_type: string;
  idle_duration_minutes: number;
  status: string;
  created_at: string;
}

export async function getIdleAlerts(params?: {
  site_id?: number;
  status?: string;
}): Promise<{ data: IdleAlert[] }> {
  const response = await api.get("/security/alerts/idle", { params });
  return { data: response.data };
}

export async function acknowledgeIdleAlert(
  alertId: number
): Promise<{ data: any }> {
  const response = await api.post(`/security/alerts/idle/${alertId}/acknowledge`);
  return { data: response.data };
}

// ---- Payroll Export API ----

export async function exportPayroll(params: {
  start_date: string;
  end_date: string;
  site_id?: number;
  user_id?: number;
}): Promise<Blob> {
  const response = await api.get("/security/payroll/export", {
    params,
    responseType: "blob",
  });
  return response.data;
}

// ---- Client Portal APIs ----

export async function getClientReports(params?: {
  site_id?: number;
  start_date?: string;
  end_date?: string;
  report_type?: string;
}): Promise<{ data: any[] }> {
  const response = await api.get("/security/client/reports", { params });
  return { data: response.data };
}

export async function getClientDAR(darId: number): Promise<{ data: any }> {
  const response = await api.get(`/security/client/dar/${darId}`);
  return { data: response.data };
}

export async function exportDARPDF(darId: number): Promise<Blob> {
  const response = await api.get(`/security/client/dar/export/${darId}`, {
    responseType: "blob",
  });
  return response.data;
}

// ---- Shift Exchange APIs ----

export interface ShiftExchange {
  id: number;
  site_id: number;
  from_user_id: number;
  to_user_id?: number | null;
  from_shift_id: number;
  to_shift_id?: number | null;
  status: string;
  request_message?: string | null;
  response_message?: string | null;
  requested_at: string;
  requires_approval?: boolean;
  approval_status?: string | null;
  approved_by_user_id?: number | null;
  approved_at?: string | null;
  approval_notes?: string | null;
  applied_at?: string | null;
}

export interface CreateShiftExchangePayload {
  site_id: number;
  from_shift_id: number;
  to_shift_id?: number | null;
  to_user_id?: number | null;
  request_message?: string | null;
}

export interface RespondToExchangePayload {
  accept: boolean;
  response_message?: string | null;
}

export async function createShiftExchange(
  payload: CreateShiftExchangePayload
): Promise<{ data: ShiftExchange }> {
  const response = await api.post("/security/shifts/exchange", payload);
  return { data: response.data };
}

export async function getMyShiftExchanges(params?: {
  status?: string;
}): Promise<{ data: ShiftExchange[] }> {
  const response = await api.get("/security/shifts/exchange/my", { params });
  return { data: response.data };
}

export async function getOpenShiftExchanges(params?: {
  site_id?: number;
}): Promise<{ data: ShiftExchange[] }> {
  const response = await api.get("/security/shifts/exchange/open", { params });
  return { data: response.data };
}

export async function respondToShiftExchange(
  exchangeId: number,
  payload: RespondToExchangePayload
): Promise<{ data: ShiftExchange }> {
  const response = await api.post(
    `/security/shifts/exchange/${exchangeId}/respond`,
    payload
  );
  return { data: response.data };
}

export async function cancelShiftExchange(
  exchangeId: number
): Promise<{ message: string }> {
  const response = await api.post(
    `/security/shifts/exchange/${exchangeId}/cancel`
  );
  return response.data;
}

export interface ShiftExchangeApprovalPayload {
  approve: boolean;
  approval_notes?: string | null;
}

export async function getPendingApprovals(params?: {
  site_id?: number;
}): Promise<{ data: ShiftExchange[] }> {
  const response = await api.get("/security/shifts/exchange/pending-approval", {
    params,
  });
  return { data: response.data };
}

export async function approveShiftExchange(
  exchangeId: number,
  payload: ShiftExchangeApprovalPayload
): Promise<{ data: ShiftExchange }> {
  const response = await api.post(
    `/security/shifts/exchange/${exchangeId}/approve`,
    payload
  );
  return { data: response.data };
}

export async function applyShiftExchange(
  exchangeId: number
): Promise<{ message: string; exchange: ShiftExchange }> {
  const response = await api.post(
    `/security/shifts/exchange/${exchangeId}/apply`
  );
  return response.data;
}
