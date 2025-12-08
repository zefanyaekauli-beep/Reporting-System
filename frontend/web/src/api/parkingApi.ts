// frontend/web/src/api/parkingApi.ts

import api from "./client";

// ---- Attendance ----

export interface ParkingAttendance {
  id: number;
  site_id: number;
  checkin_time: string | null;
  checkout_time: string | null;
  status: string;
  is_valid_location: boolean;
}

export async function getTodayParkingAttendance(
  siteId: number
): Promise<{ data: ParkingAttendance | null }> {
  const response = await api.get(`/parking/attendance/today?site_id=${siteId}`);
  return { data: response.data };
}

// ---- Reports ----

export interface ParkingReport {
  id: number;
  site_id: number;
  report_type: string;
  title: string;
  description?: string | null;
  severity?: string | null;
  status: string;
  location_text?: string | null;
  evidence_paths?: string | null;
  created_at: string;
}

export async function createParkingReport(payload: {
  report_type: string;
  site_id: number;
  location_text?: string;
  title: string;
  description?: string;
  severity?: string;
  evidenceFiles?: File[];
}): Promise<{ data: ParkingReport }> {
  const formData = new FormData();
  formData.append("report_type", payload.report_type);
  formData.append("site_id", String(payload.site_id));
  if (payload.location_text) formData.append("location_text", payload.location_text);
  formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  if (payload.severity) formData.append("severity", payload.severity);
  if (payload.evidenceFiles) {
    payload.evidenceFiles.forEach((file) => {
      formData.append("evidence_files", file);
    });
  }
  const response = await api.post("/parking/reports", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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

