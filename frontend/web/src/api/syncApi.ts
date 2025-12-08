// frontend/web/src/api/syncApi.ts

import api from "./client";
import { getDeviceId } from "../utils/offlineStorage";
import type { OfflineEvent } from "../utils/offlineStorage";

export interface SyncEvent {
  client_event_id: string;
  type: string;
  event_time: string;
  payload: any;
  client_version?: string;
}

export interface SyncRequest {
  device_id: string;
  device_time_at_send: string;
  events: SyncEvent[];
}

export interface SyncResponse {
  synced_count: number;
  errors: Array<{ client_event_id: string; error: string }>;
}

export interface ZoneForSync {
  id: number;
  site_id: number;
  name: string;
  code?: string | null;
  qr_code?: string | null;
  floor?: string | null;
  area_type?: string | null;
  geofence?: {
    latitude?: string | null;
    longitude?: string | null;
    radius_meters?: number | null;
  } | null;
}

/**
 * Sync offline events to server
 */
export async function syncEvents(
  events: OfflineEvent[]
): Promise<SyncResponse> {
  const deviceId = getDeviceId();
  const deviceTimeAtSend = new Date().toISOString();

  const syncEvents: SyncEvent[] = events.map((event) => ({
    client_event_id: event.local_id,
    type: event.type,
    event_time: event.event_time,
    payload: event.payload,
    client_version: "1.0.0",
  }));

  const payload: SyncRequest = {
    device_id: deviceId,
    device_time_at_send: deviceTimeAtSend,
    events: syncEvents,
  };

  const response = await api.post("/sync/events", payload);
  return response.data;
}

/**
 * Get zones for offline caching
 */
export async function getZonesForSync(params?: {
  site_id?: number;
}): Promise<{ data: ZoneForSync[] }> {
  const response = await api.get("/sync/zones", { params });
  return { data: response.data };
}

