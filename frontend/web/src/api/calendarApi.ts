// frontend/web/src/api/calendarApi.ts

import api from "./client";

export interface CalendarEvent {
  id: number;
  type: "ATTENDANCE" | "PATROL" | "REPORT" | "INCIDENT" | "TRAINING" | "VISITOR";
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  color?: string;
  details?: {
    user_id?: number;
    site_id?: number;
    area_text?: string;
    report_type?: string;
    severity?: string;
    category?: string;
    location?: string;
    purpose?: string;
  };
}

/**
 * Get calendar events for a specific month
 */
export async function getCalendarEvents(params: {
  year: number;
  month: number;
  site_id?: number;
  event_types?: string; // Comma-separated: "ATTENDANCE,PATROL,REPORT"
}): Promise<CalendarEvent[]> {
  const response = await api.get("/calendar/events", { params });
  return response.data;
}

