// frontend/web/src/api/visitorApi.ts

import api from "./client";

export interface Visitor {
  id: number;
  company_id: number;
  site_id: number;
  name: string;
  company?: string | null;
  id_card_number?: string | null;
  id_card_type?: string | null;
  phone?: string | null;
  email?: string | null;
  purpose?: string | null;
  category?: string | null;
  visit_date: string;
  expected_duration_minutes?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  is_checked_in: boolean;
  host_user_id?: number | null;
  host_name?: string | null;
  security_user_id?: number | null;
  badge_number?: string | null;
  photo_path?: string | null;
  id_card_photo_path?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
}

export interface VisitorCreate {
  site_id: number;
  name: string;
  company?: string;
  id_card_number?: string;
  id_card_type?: string;
  phone?: string;
  email?: string;
  purpose?: string;
  category?: string;
  visit_date: string;
  expected_duration_minutes?: number;
  host_user_id?: number;
  host_name?: string;
  notes?: string;
}

/**
 * List visitors
 */
export async function listVisitors(params?: {
  site_id?: number;
  category?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
}): Promise<Visitor[]> {
  const response = await api.get("/visitors", { params });
  return response.data;
}

/**
 * Get visitor by ID
 */
export async function getVisitor(visitorId: number): Promise<Visitor> {
  const response = await api.get(`/visitors/${visitorId}`);
  return response.data;
}

/**
 * Create visitor
 */
export async function createVisitor(
  payload: VisitorCreate,
  photo?: File,
  idCardPhoto?: File
): Promise<Visitor> {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  if (photo) {
    formData.append("photo", photo);
  }
  if (idCardPhoto) {
    formData.append("id_card_photo", idCardPhoto);
  }
  
  const response = await api.post("/visitors", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Update visitor
 */
export async function updateVisitor(
  visitorId: number,
  payload: Partial<VisitorCreate>,
  photo?: File,
  idCardPhoto?: File
): Promise<Visitor> {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  if (photo) {
    formData.append("photo", photo);
  }
  if (idCardPhoto) {
    formData.append("id_card_photo", idCardPhoto);
  }
  
  const response = await api.patch(`/visitors/${visitorId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Check in visitor
 */
export async function checkInVisitor(visitorId: number): Promise<Visitor> {
  const response = await api.post(`/visitors/${visitorId}/check-in`);
  return response.data;
}

/**
 * Check out visitor
 */
export async function checkOutVisitor(visitorId: number): Promise<Visitor> {
  const response = await api.post(`/visitors/${visitorId}/check-out`);
  return response.data;
}

/**
 * Upload visitor photo
 */
export async function uploadVisitorPhoto(visitorId: number, photo: File): Promise<Visitor> {
  const formData = new FormData();
  formData.append("photo", photo);
  
  const response = await api.patch(`/visitors/${visitorId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Upload ID card photo
 */
export async function uploadIdCardPhoto(visitorId: number, idCardPhoto: File): Promise<Visitor> {
  const formData = new FormData();
  formData.append("id_card_photo", idCardPhoto);
  
  const response = await api.patch(`/visitors/${visitorId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Get visitor categories
 */
export async function getVisitorCategories(): Promise<string[]> {
  const response = await api.get("/visitors/categories");
  return response.data;
}

/**
 * Delete visitor
 */
export async function deleteVisitor(visitorId: number): Promise<void> {
  await api.delete(`/visitors/${visitorId}`);
}

