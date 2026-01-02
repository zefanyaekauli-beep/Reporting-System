// frontend/web/src/types/dar.ts

export interface DARActivity {
  id?: number;
  activity_time: string; // HH:mm format
  activity_type: string;
  description: string;
  location?: string;
  photo_url?: string;
}

export interface DARPersonnel {
  id?: number;
  user_id: number;
  role?: string;
  check_in_time?: string; // HH:mm format
  check_out_time?: string; // HH:mm format
}

export interface DailyActivityReport {
  id: number;
  site_id: number;
  site_name?: string;
  report_date: string; // YYYY-MM-DD
  shift: string; // MORNING, AFTERNOON, NIGHT
  weather?: string;
  summary?: string;
  handover_notes?: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  created_by: number;
  created_by_name?: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  personnel: DARPersonnel[];
  activities: DARActivity[];
}

export interface DailyActivityReportList {
  id: number;
  site_id: number;
  site_name?: string;
  report_date: string;
  shift: string;
  status: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  activities_count: number;
  personnel_count: number;
}

export interface DailyActivityReportCreate {
  site_id: number;
  report_date: string;
  shift: string;
  weather?: string;
  summary?: string;
  handover_notes?: string;
  personnel: DARPersonnel[];
  activities: DARActivity[];
}

export interface DailyActivityReportUpdate {
  weather?: string;
  summary?: string;
  handover_notes?: string;
  personnel?: DARPersonnel[];
  activities?: DARActivity[];
}

