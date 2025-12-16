// frontend/web/src/api/masterDataApi.ts

import api from "./client";

export interface MasterData {
  id: number;
  company_id?: number;
  category: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: number;
  extra_data?: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  division?: string;
  created_at: string;
  updated_at: string;
}

export interface MasterDataCreate {
  category: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: number;
  extra_data?: Record<string, any>;
  sort_order?: number;
  is_active?: boolean;
  division?: string;
}

export interface MasterDataUpdate {
  name?: string;
  description?: string;
  extra_data?: Record<string, any>;
  sort_order?: number;
  is_active?: boolean;
}

export async function listMasterData(params?: {
  category?: string;
  division?: string;
  is_active?: boolean;
  parent_id?: number;
}): Promise<MasterData[]> {
  const response = await api.get("/master-data", { params });
  return response.data;
}

export async function getMasterData(id: number): Promise<MasterData> {
  const response = await api.get(`/master-data/${id}`);
  return response.data;
}

export async function createMasterData(payload: MasterDataCreate): Promise<MasterData> {
  const response = await api.post("/master-data", payload);
  return response.data;
}

export async function updateMasterData(id: number, payload: MasterDataUpdate): Promise<MasterData> {
  const response = await api.put(`/master-data/${id}`, payload);
  return response.data;
}

export async function deleteMasterData(id: number): Promise<void> {
  await api.delete(`/master-data/${id}`);
}

export async function getMasterDataByCategory(category: string, division?: string): Promise<MasterData[]> {
  const params: any = { category, is_active: true };
  if (division) params.division = division;
  const response = await api.get("/master-data", { params });
  return response.data;
}
