// frontend/web/src/modules/supervisor/pages/Dashboard/index.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardData, DashboardFilters as DashboardFiltersType } from "./hooks/useDashboardData";
import { AttendanceWidget } from "./components/AttendanceWidget";
import { PatrolWidget } from "./components/PatrolWidget";
import { IncidentWidget } from "./components/IncidentWidget";
import { TaskWidget } from "./components/TaskWidget";
import { DashboardFilters } from "./components/DashboardFilters";

export function DashboardPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DashboardFiltersType>({});
  const { data, loading, error, refetch } = useDashboardData(filters);

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">Error loading dashboard: {error}</p>
          <button
            onClick={refetch}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#002B4B] mb-2">Live Dashboard</h1>
          <p className="text-sm text-gray-600">
            Real-time overview of operations and activities
          </p>
        </div>
        <button
          onClick={() => navigate("/supervisor/dashboard")}
          className="px-4 py-2 text-sm font-medium text-[#002B4B] bg-white border border-[#002B4B] rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      <DashboardFilters filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-6">
        {data && (
          <>
            <AttendanceWidget data={data.attendance_summary} loading={loading} />
            <PatrolWidget data={data.patrol_status} loading={loading} />
            <IncidentWidget data={data.incident_summary} loading={loading} />
            <TaskWidget data={data.task_completion} loading={loading} />
          </>
        )}

        {loading && !data && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#002B4B]"></div>
            <p className="mt-2 text-sm text-gray-600">Loading dashboard data...</p>
          </div>
        )}
      </div>

      {data && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {new Date(data.last_updated).toLocaleString()}
        </div>
      )}
    </div>
  );
}

