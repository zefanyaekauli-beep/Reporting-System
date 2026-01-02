// frontend/web/src/modules/supervisor/pages/Patrol/Schedule/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface PatrolSchedule {
  id: number;
  site_id: number;
  route_id: number;
  scheduled_date: string;
  scheduled_time: string;
  frequency: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export function PatrolSchedulePage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<PatrolSchedule[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [scheduledDate, setScheduledDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadSites();
    loadSchedules();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [siteId, scheduledDate]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (siteId) params.site_id = siteId;
      if (scheduledDate) params.scheduled_date = scheduledDate;

      const response = await api.get("/patrol/schedules", { params });
      setSchedules(response.data);
    } catch (err: any) {
      console.error("Failed to load schedules:", err);
      setError(err.response?.data?.detail || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) {
      return;
    }
    try {
      await api.delete(`/patrol/schedules/${id}`);
      await loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete schedule");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Patrol Schedule</h1>
        <button
          onClick={() => navigate("/supervisor/patrol/schedule/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create Schedule
        </button>
      </div>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Site</label>
            <select
              value={siteId || ""}
              onChange={(e) => setSiteId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={scheduledDate || ""}
              onChange={(e) => setScheduledDate(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Schedules Table */}
      <DashboardCard title="Patrol Schedules">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No schedules found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Time</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Route</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Frequency</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{format(new Date(schedule.scheduled_date), "MMM dd, yyyy")}</td>
                    <td className="py-2 px-3">{schedule.scheduled_time}</td>
                    <td className="py-2 px-3">Route {schedule.route_id}</td>
                    <td className="py-2 px-3">{schedule.frequency}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${schedule.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {schedule.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/supervisor/patrol/schedule/${schedule.id}/assign`)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => navigate(`/supervisor/patrol/schedule/${schedule.id}/edit`)}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

