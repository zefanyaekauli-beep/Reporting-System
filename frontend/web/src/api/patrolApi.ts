// frontend/web/src/api/patrolApi.ts

import api from "./client";

export interface PatrolTarget {
  id: number;
  site_id: number;
  site_name?: string;
  zone_id?: number;
  zone_name?: string;
  route_id?: number;
  target_date: string;
  target_checkpoints: number;
  completed_checkpoints: number;
  completion_percentage: number;
  status: string;
}

export interface PatrolTargetCreate {
  site_id: number;
  zone_id?: number;
  route_id?: number;
  target_date: string;
  target_checkpoints: number;
  target_duration_minutes?: number;
  target_patrols?: number;
  notes?: string;
}

export interface PatrolTeam {
  id: number;
  company_id: number;
  site_id: number;
  name: string;
  division: string;
  team_members: number[];
  assigned_routes?: number[];
  team_leader_id?: number;
  is_active: boolean;
  created_at: string;
}

export interface PatrolTeamCreate {
  site_id: number;
  name: string;
  division: string;
  team_members: number[];
  assigned_routes?: number[];
  team_leader_id?: number;
  description?: string;
  notes?: string;
}

/**
 * List patrol targets
 */
export async function listPatrolTargets(params?: {
  site_id?: number;
  target_date?: string;
  status?: string;
}): Promise<PatrolTarget[]> {
  const response = await api.get("/patrol/targets", { params });
  return response.data;
}

/**
 * Create patrol target
 */
export async function createPatrolTarget(
  payload: PatrolTargetCreate
): Promise<PatrolTarget> {
  const response = await api.post("/patrol/targets", payload);
  return response.data;
}

/**
 * List patrol teams
 */
export async function listPatrolTeams(params?: {
  site_id?: number;
  division?: string;
  is_active?: boolean;
}): Promise<PatrolTeam[]> {
  const response = await api.get("/patrol/teams", { params });
  return response.data;
}

/**
 * Create patrol team
 */
export async function createPatrolTeam(
  payload: PatrolTeamCreate
): Promise<PatrolTeam> {
  const response = await api.post("/patrol/teams", payload);
  return response.data;
}

/**
 * Get foot patrols
 */
export interface FootPatrol {
  id: number;
  user_id: number;
  user_name: string;
  site_id: number;
  site_name: string;
  start_time: string;
  end_time?: string | null;
  distance_covered?: number | null;
  steps_count?: number | null;
  area_text?: string | null;
  duration_minutes?: number | null;
}

export async function getFootPatrols(params?: {
  site_id?: number;
  from_date?: string;
  to_date?: string;
}): Promise<FootPatrol[]> {
  const response = await api.get("/patrol/foot-patrols", { params });
  return response.data;
}

// ============================================
// Joint Patrol API
// ============================================

export interface JointPatrol {
  id: number;
  site_id: number;
  site_name?: string;
  title: string;
  description?: string;
  route?: string;
  scheduled_start: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  lead_officer_id: number;
  lead_officer_name?: string;
  participant_ids: number[];
  participant_names?: string[];
  status: string;
  notes?: string;
  findings?: string;
  photos?: string[];
  created_by: number;
  created_at: string;
}

export interface JointPatrolCreate {
  site_id: number;
  title: string;
  description?: string;
  route?: string;
  scheduled_start: string;
  scheduled_end?: string;
  lead_officer_id: number;
  participant_ids: number[];
  notes?: string;
}

export interface JointPatrolUpdate {
  title?: string;
  description?: string;
  route?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  lead_officer_id?: number;
  participant_ids?: number[];
  status?: string;
  notes?: string;
  findings?: string;
  photos?: string[];
}

export async function listJointPatrols(params?: {
  site_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<JointPatrol[]> {
  const response = await api.get("/patrol/joint", { params });
  return response.data;
}

export async function getJointPatrol(id: number): Promise<JointPatrol> {
  const response = await api.get(`/patrol/joint/${id}`);
  return response.data;
}

export async function createJointPatrol(data: JointPatrolCreate): Promise<JointPatrol> {
  const response = await api.post("/patrol/joint", data);
  return response.data;
}

export async function updateJointPatrol(id: number, data: JointPatrolUpdate): Promise<JointPatrol> {
  const response = await api.put(`/patrol/joint/${id}`, data);
  return response.data;
}

export async function deleteJointPatrol(id: number): Promise<void> {
  await api.delete(`/patrol/joint/${id}`);
}

// ============================================
// Patrol Report API
// ============================================

export interface PatrolReportData {
  id: number;
  site_id: number;
  site_name?: string;
  report_date: string;
  shift: string;
  officer_id: number;
  officer_name?: string;
  patrol_type: string;
  area_covered?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  summary?: string;
  findings?: string;
  recommendations?: string;
  incidents?: any[];
  photos?: string[];
  status: string;
  created_by: number;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
}

export interface PatrolReportCreate {
  site_id: number;
  report_date: string;
  shift: string;
  officer_id: number;
  patrol_type: string;
  area_covered?: string;
  start_time: string;
  end_time?: string;
  summary?: string;
  findings?: string;
  recommendations?: string;
  photos?: string[];
}

export interface PatrolReportUpdate {
  area_covered?: string;
  start_time?: string;
  end_time?: string;
  summary?: string;
  findings?: string;
  recommendations?: string;
  photos?: string[];
  status?: string;
}

export async function listPatrolReports(params?: {
  site_id?: number;
  officer_id?: number;
  status?: string;
  patrol_type?: string;
  date_from?: string;
  date_to?: string;
}): Promise<PatrolReportData[]> {
  const response = await api.get("/patrol/reports", { params });
  return response.data;
}

export async function getPatrolReport(id: number): Promise<PatrolReportData> {
  const response = await api.get(`/patrol/reports/${id}`);
  return response.data;
}

export async function createPatrolReport(data: PatrolReportCreate): Promise<PatrolReportData> {
  const response = await api.post("/patrol/reports", data);
  return response.data;
}

export async function updatePatrolReport(id: number, data: PatrolReportUpdate): Promise<PatrolReportData> {
  const response = await api.put(`/patrol/reports/${id}`, data);
  return response.data;
}

export async function deletePatrolReport(id: number): Promise<void> {
  await api.delete(`/patrol/reports/${id}`);
}

export async function submitPatrolReport(id: number): Promise<PatrolReportData> {
  const response = await api.post(`/patrol/reports/${id}/submit`);
  return response.data;
}

export async function approvePatrolReport(id: number): Promise<PatrolReportData> {
  const response = await api.post(`/patrol/reports/${id}/approve`);
  return response.data;
}

