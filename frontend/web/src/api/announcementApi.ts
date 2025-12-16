// frontend/web/src/api/announcementApi.ts

import api from "./client";

export type AnnouncementPriority = "info" | "warning" | "critical";
export type AnnouncementScope = "all" | "divisions" | "users";

export interface Announcement {
  id: number;
  company_id: number;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  scope: AnnouncementScope;
  created_by_id: number;
  created_at: string;
  valid_from: string;
  valid_until?: string | null;
  is_active: boolean;
  require_ack: boolean;
}

export interface AnnouncementWithState extends Announcement {
  is_read: boolean;
  read_at?: string | null;
  is_ack: boolean;
  ack_at?: string | null;
}

export interface AnnouncementCreatePayload {
  title: string;
  message: string;
  priority: AnnouncementPriority;
  scope: AnnouncementScope;
  division_ids?: number[];
  user_ids?: number[];
  valid_from?: string;
  valid_until?: string;
  require_ack?: boolean;
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
  resolution_notes?: string | null;
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

export async function resolvePanicAlert(
  alertId: number,
  resolutionNotes: string
): Promise<{ message: string; alert: PanicAlert }> {
  // Backend expects resolution_notes as string in body (Body(...) in FastAPI)
  // FastAPI Body(...) expects the raw string value, not JSON object
  const response = await api.post(`/security/panic/alerts/${alertId}/resolve`, resolutionNotes);
  return response.data;
}

export async function fetchMyAnnouncements(
  onlyUnread: boolean = false,
  limit: number = 20
): Promise<AnnouncementWithState[]> {
  const response = await api.get("/announcements/me", {
    params: { only_unread: onlyUnread, limit },
  });
  // Ensure response is array
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

export async function markAnnouncementRead(id: number): Promise<void> {
  await api.post(`/announcements/${id}/read`); 
}

export async function markAnnouncementAck(id: number): Promise<void> {
  await api.post(`/announcements/${id}/ack`);
}

export async function createAnnouncement(
  payload: AnnouncementCreatePayload
): Promise<Announcement> {
  const response = await api.post("/announcements/", payload);
  return response.data;
}

export async function listAnnouncements(
  division?: string,
  limit: number = 50
): Promise<Announcement[]> {
  const response = await api.get("/announcements/", {
    params: { division, limit },
  });
  // Ensure response is array
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
} 

