// frontend/web/src/api/heatmapApi.ts

import api from "./client";

export interface HeatmapDataPoint {
  x: string;
  y: string;
  value: number;
  label?: string;
}

export interface HeatmapResponse {
  type: string;
  data: HeatmapDataPoint[];
  x_axis_label: string;
  y_axis_label: string;
  value_label: string;
  date_range?: string;
}

export interface HeatmapParams {
  start_date?: string;
  end_date?: string;
  division?: string;
  site_id?: number;
  activity_type?: string;
}

/**
 * Get attendance heatmap data
 */
export async function getAttendanceHeatmap(
  params?: HeatmapParams
): Promise<HeatmapResponse> {
  const response = await api.get("/heatmap/attendance", { params });
  return response.data;
}

/**
 * Get activity heatmap data (patrols, reports, checklists)
 */
export async function getActivityHeatmap(
  params?: HeatmapParams
): Promise<HeatmapResponse> {
  const response = await api.get("/heatmap/activity", { params });
  return response.data;
}

/**
 * Get site performance heatmap
 */
export async function getSitePerformanceHeatmap(
  params?: HeatmapParams
): Promise<HeatmapResponse> {
  const response = await api.get("/heatmap/site-performance", { params });
  return response.data;
}

/**
 * Get user activity heatmap
 */
export async function getUserActivityHeatmap(
  params?: HeatmapParams
): Promise<HeatmapResponse> {
  const response = await api.get("/heatmap/user-activity", { params });
  return response.data;
}

