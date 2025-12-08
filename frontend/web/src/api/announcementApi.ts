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
  const response = await api.post("/announcements", payload);
  return response.data;
}

export async function listAnnouncements(
  division?: string,
  limit: number = 50
): Promise<Announcement[]> {
  const response = await api.get("/announcements", {
    params: { division, limit },
  });
  // Ensure response is array
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

