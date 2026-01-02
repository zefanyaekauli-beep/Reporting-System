// frontend/web/src/modules/supervisor/pages/Patrol/Schedule/ScheduleEditPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { listPatrolRoutes, PatrolRoute } from "../../../../../api/securityApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface ScheduleUpdateData {
  scheduled_date?: string;
  scheduled_time?: string;
  frequency?: string;
  recurrence_end_date?: string;
  notes?: string;
  is_active?: boolean;
}

export function ScheduleEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sites, setSites] = useState<Site[]>([]);
  const [routes, setRoutes] = useState<PatrolRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<any>(null);

  const [formData, setFormData] = useState<ScheduleUpdateData>({
    scheduled_date: "",
    scheduled_time: "",
    frequency: "",
    recurrence_end_date: "",
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      loadSchedule();
      loadSites();
    }
  }, [id]);

  useEffect(() => {
    if (schedule?.site_id) {
      loadRoutes(schedule.site_id);
    }
  }, [schedule?.site_id]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadRoutes = async (siteId: number) => {
    try {
      const response = await listPatrolRoutes({ site_id: siteId, is_active: true });
      setRoutes(response.data || []);
    } catch (err) {
      console.error("Failed to load routes:", err);
    }
  };

  const loadSchedule = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/patrol/schedules/${id}`);
      const scheduleData = response.data;
      setSchedule(scheduleData);
      setFormData({
        scheduled_date: scheduleData.scheduled_date,
        scheduled_time: scheduleData.scheduled_time,
        frequency: scheduleData.frequency,
        recurrence_end_date: scheduleData.recurrence_end_date || "",
        notes: scheduleData.notes || "",
        is_active: scheduleData.is_active,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {};
      if (formData.scheduled_date) payload.scheduled_date = formData.scheduled_date;
      if (formData.scheduled_time) payload.scheduled_time = formData.scheduled_time;
      if (formData.frequency) payload.frequency = formData.frequency;
      if (formData.recurrence_end_date) payload.recurrence_end_date = formData.recurrence_end_date;
      if (formData.notes !== undefined) payload.notes = formData.notes || null;
      if (formData.is_active !== undefined) payload.is_active = formData.is_active;

      await api.put(`/api/v1/patrol/schedules/${id}`, payload);
      navigate("/supervisor/patrol/schedule");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update schedule");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !schedule) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-gray-500">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Edit Patrol Schedule</h1>
        <button
          onClick={() => navigate("/supervisor/patrol/schedule")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {schedule && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <DashboardCard title="Schedule Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site
                </label>
                <input
                  type="text"
                  value={sites.find(s => s.id === schedule.site_id)?.name || `Site ${schedule.site_id}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route
                </label>
                <input
                  type="text"
                  value={routes.find(r => r.id === schedule.route_id)?.name || `Route ${schedule.route_id}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_time: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value, recurrence_end_date: e.target.value === "ONCE" ? "" : formData.recurrence_end_date })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={loading}
                >
                  <option value="ONCE">Once</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>

              {formData.frequency !== "ONCE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recurrence End Date
                  </label>
                  <input
                    type="date"
                    value={formData.recurrence_end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, recurrence_end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={loading}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded"
                    disabled={loading}
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </DashboardCard>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate("/supervisor/patrol/schedule")}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Schedule"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

