// frontend/web/src/api/trainingApi.ts

import api from "./client";

export interface Training {
  id: number;
  company_id: number;
  site_id?: number | null;
  title: string;
  description?: string | null;
  category?: string | null;
  scheduled_date: string;
  duration_minutes?: number | null;
  location?: string | null;
  instructor_id?: number | null;
  instructor_name?: string | null;
  max_participants?: number | null;
  status: string;
  division?: string | null;
  created_at: string;
}

export interface TrainingCreate {
  site_id?: number;
  title: string;
  description?: string;
  category?: string;
  scheduled_date: string;
  duration_minutes?: number;
  location?: string;
  instructor_id?: number;
  instructor_name?: string;
  max_participants?: number;
  min_participants?: number;
  division?: string;
  notes?: string;
}

export interface TrainingAttendance {
  id: number;
  training_id: number;
  user_id: number;
  user_name?: string;
  registered_at: string;
  attendance_status: string;
  attended_at?: string | null;
  score?: number | null;
  passed?: boolean | null;
  completion_date?: string | null;
  certificate_url?: string | null;
  feedback?: string | null;
  rating?: number | null;
}

export interface DevelopmentPlan {
  id: number;
  company_id: number;
  user_id: number;
  user_name?: string;
  development_type: string;
  title: string;
  description?: string | null;
  start_date?: string | null;
  target_date?: string | null;
  completion_date?: string | null;
  status: string;
  evaluation?: string | null;
  evaluation_date?: string | null;
  evaluated_by?: number | null;
  created_at: string;
}

/**
 * List trainings
 */
export async function listTrainings(params?: {
  site_id?: number;
  division?: string;
  status?: string;
}): Promise<Training[]> {
  const response = await api.get("/training", { params });
  return response.data;
}

/**
 * Create training
 */
export async function createTraining(
  payload: TrainingCreate
): Promise<Training> {
  const response = await api.post("/training", payload);
  return response.data;
}

/**
 * Get training by ID
 */
export async function getTraining(trainingId: number): Promise<Training> {
  const response = await api.get(`/training/${trainingId}`);
  return response.data;
}

/**
 * Update training
 */
export async function updateTraining(
  trainingId: number,
  payload: Partial<TrainingCreate>
): Promise<Training> {
  const response = await api.patch(`/training/${trainingId}`, payload);
  return response.data;
}

/**
 * Delete training
 */
export async function deleteTraining(trainingId: number): Promise<void> {
  await api.delete(`/training/${trainingId}`);
}

/**
 * List training attendances
 */
export async function listTrainingAttendances(
  trainingId: number
): Promise<TrainingAttendance[]> {
  const response = await api.get(`/training/${trainingId}/attendances`);
  return response.data;
}

/**
 * Register for training
 */
export async function registerForTraining(
  trainingId: number
): Promise<TrainingAttendance> {
  const response = await api.post(`/training/${trainingId}/register`);
  return response.data;
}

/**
 * List development plans
 */
export async function listDevelopmentPlans(params?: {
  user_id?: number;
  status?: string;
}): Promise<DevelopmentPlan[]> {
  const response = await api.get("/training/development-plans", { params });
  return response.data;
}

/**
 * Create development plan
 */
export async function createDevelopmentPlan(
  payload: Partial<DevelopmentPlan>
): Promise<DevelopmentPlan> {
  const response = await api.post("/training/development-plans", payload);
  return response.data;
}

