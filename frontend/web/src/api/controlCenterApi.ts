// frontend/web/src/api/controlCenterApi.ts

import api from "./client";

export interface ControlCenterStatus {
  total_on_duty: number;
  total_active_patrols: number;
  total_active_incidents: number;
  total_panic_alerts: number;
  total_dispatch_tickets: number;
  last_updated: string;
}

export interface ActivePatrol {
  id: number;
  user_id: number;
  user_name: string;
  site_id: number;
  site_name: string;
  start_time: string;
  area_text?: string | null;
  current_location?: {
    latitude: number;
    longitude: number;
    recorded_at: string;
    accuracy?: number;
  } | null;
  duration_minutes?: number | null;
}

export interface ActiveIncident {
  id: number;
  title: string;
  report_type: string;
  severity?: string | null;
  site_id: number;
  site_name: string;
  reported_by: string;
  reported_at: string;
  status: string;
  location_text?: string | null;
}

export async function getControlCenterStatus(params?: {
  site_id?: number;
}): Promise<ControlCenterStatus> {
  const response = await api.get("/control-center/status", { params });
  return response.data;
}

export async function getActivePatrols(params?: {
  site_id?: number;
}): Promise<ActivePatrol[]> {
  const response = await api.get("/control-center/active-patrols", { params });
  return response.data;
}

export async function getActiveIncidents(params?: {
  site_id?: number;
}): Promise<ActiveIncident[]> {
  const response = await api.get("/control-center/active-incidents", { params });
  return response.data;
}

export async function getPanicAlerts(params?: {
  site_id?: number;
  status?: string;
}): Promise<any[]> {
  const response = await api.get("/control-center/panic-alerts", { params });
  return response.data;
}

export async function getDispatchTickets(params?: {
  site_id?: number;
  status?: string;
}): Promise<any[]> {
  const response = await api.get("/control-center/dispatch-tickets", { params });
  return response.data;
}

