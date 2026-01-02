// frontend/web/src/services/darService.ts

import api from "../api/client";
import {
  DailyActivityReport,
  DailyActivityReportList,
  DailyActivityReportCreate,
  DailyActivityReportUpdate,
} from "../types/dar";

export async function createDAR(data: DailyActivityReportCreate): Promise<DailyActivityReport> {
  const response = await api.post("/dar", data);
  return response.data;
}

export async function listDARs(params?: {
  site_id?: number;
  report_date?: string;
  shift?: string;
  status?: string;
  skip?: number;
  limit?: number;
}): Promise<DailyActivityReportList[]> {
  const response = await api.get("/dar", { params });
  return response.data;
}

export async function getDAR(darId: number): Promise<DailyActivityReport> {
  const response = await api.get(`/dar/${darId}`);
  return response.data;
}

export async function updateDAR(
  darId: number,
  data: DailyActivityReportUpdate
): Promise<DailyActivityReport> {
  const response = await api.put(`/dar/${darId}`, data);
  return response.data;
}

export async function deleteDAR(darId: number): Promise<void> {
  await api.delete(`/dar/${darId}`);
}

export async function submitDAR(darId: number): Promise<DailyActivityReport> {
  const response = await api.post(`/dar/${darId}/submit`);
  return response.data;
}

export async function approveDAR(darId: number): Promise<DailyActivityReport> {
  const response = await api.post(`/dar/${darId}/approve`);
  return response.data;
}

export async function rejectDAR(darId: number, rejectionReason: string): Promise<DailyActivityReport> {
  const response = await api.post(`/dar/${darId}/reject`, null, {
    params: { rejection_reason: rejectionReason },
  });
  return response.data;
}

export async function exportDARPDF(darId: number): Promise<Blob> {
  const response = await api.get(`/dar/${darId}/export-pdf`, {
    responseType: "blob",
  });
  return response.data;
}

export async function uploadDARPhoto(file: File): Promise<{ photo_url: string; filename: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await api.post("/dar/upload-photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

// Re-export types for convenience
export type {
  DailyActivityReport,
  DailyActivityReportList,
  DailyActivityReportCreate,
  DailyActivityReportUpdate,
} from "../types/dar";

