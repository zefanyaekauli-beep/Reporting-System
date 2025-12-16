// frontend/web/src/api/cctvApi.ts

import api from "./client";

export interface CCTV {
  id: number;
  company_id: number;
  site_id: number;
  name: string;
  location?: string | null;
  stream_url: string;
  camera_type?: string | null;
  stream_type?: string | null;
  brand?: string | null;
  model?: string | null;
  resolution?: string | null;
  is_active: boolean;
  is_recording: boolean;
  created_at: string;
}

export async function listCCTVCameras(params?: {
  site_id?: number;
  is_active?: boolean;
}): Promise<{ data: CCTV[] }> {
  const response = await api.get("/cctv", { params });
  return { data: response.data };
}

export async function getCCTVStream(cameraId: number): Promise<{
  camera_id: number;
  camera_name: string;
  stream_url: string;
  stream_type?: string;
  resolution?: string;
}> {
  const response = await api.get(`/cctv/${cameraId}/stream`);
  return response.data;
}

