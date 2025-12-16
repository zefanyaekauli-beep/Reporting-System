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

