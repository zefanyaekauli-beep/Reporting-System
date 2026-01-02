// frontend/web/src/modules/supervisor/pages/Dashboard/hooks/useDashboardData.ts

import { useState, useEffect, useCallback } from "react";
import api from "../../../../../api/client";

export interface DashboardFilters {
  date_from?: string;
  date_to?: string;
  site_ids?: number[];
  division?: string;
  shift?: string;
}

export interface AttendanceSummaryWidget {
  total_on_duty: number;
  total_late: number;
  total_absent: number;
  total_early_checkout: number;
}

export interface PatrolStatusWidget {
  routes_completed: number;
  routes_in_progress: number;
  routes_pending: number;
  missed_checkpoints: number;
}

export interface IncidentSummaryWidget {
  open_incidents: number;
  in_review: number;
  closed_today: number;
  critical_alerts: number;
}

export interface TaskCompletionWidget {
  checklist_progress: number;
  overdue_tasks: number;
  completed_today: number;
  total_tasks: number;
}

export interface DashboardData {
  attendance_summary: AttendanceSummaryWidget;
  patrol_status: PatrolStatusWidget;
  incident_summary: IncidentSummaryWidget;
  task_completion: TaskCompletionWidget;
  filters?: DashboardFilters;
  last_updated: string;
}

export function useDashboardData(filters?: DashboardFilters) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (filters?.date_from) params.date_from = filters.date_from;
      if (filters?.date_to) params.date_to = filters.date_to;
      if (filters?.site_ids && filters.site_ids.length > 0) {
        params.site_ids = filters.site_ids.join(",");
      }
      if (filters?.division) params.division = filters.division;
      if (filters?.shift) params.shift = filters.shift;

      const response = await api.get("/dashboard/widgets", { params });
      setData(response.data);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err?.response?.data?.detail || err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}

