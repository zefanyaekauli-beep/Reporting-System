// frontend/web/src/modules/supervisor/pages/Patrol/Schedule/ScheduleFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { listPatrolRoutes, PatrolRoute } from "../../../../../api/securityApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface ScheduleFormData {
  site_id: number;                   // Required
  route_id: number;                  // Required
  scheduled_date: string;            // Required (date)
  scheduled_time: string;            // Required (time)
  frequency: string;                 // ONCE, DAILY, WEEKLY (default: ONCE)
  recurrence_end_date?: string;      // date (if frequency != ONCE)
  notes?: string;
}

export function ScheduleFormPage() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [routes, setRoutes] = useState<PatrolRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ScheduleFormData>({
    site_id: 0,
    route_id: 0,
    scheduled_date: new Date().toISOString().split("T")[0],
    scheduled_time: "08:00",
    frequency: "ONCE",
    recurrence_end_date: "",
    notes: "",
  });

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (formData.site_id) {
      loadRoutes(formData.site_id);
    } else {
      setRoutes([]);
      setFormData(prev => ({ ...prev, route_id: 0 }));
    }
  }, [formData.site_id]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, site_id: data[0].id }));
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        site_id: formData.site_id,
        route_id: formData.route_id,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        frequency: formData.frequency,
        recurrence_end_date: formData.recurrence_end_date || null,
        notes: formData.notes || null,
      };

      await api.post("/patrol/schedules", payload);
      navigate("/supervisor/patrol/schedule");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create patrol schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Create Patrol Schedule</h1>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <DashboardCard title="Schedule Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.site_id}
                onChange={(e) =>
                  setFormData({ ...formData, site_id: parseInt(e.target.value), route_id: 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              >
                <option value={0}>Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.route_id}
                onChange={(e) =>
                  setFormData({ ...formData, route_id: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading || !formData.site_id || routes.length === 0}
              >
                <option value={0}>Select Route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
              {formData.site_id && routes.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No active routes found for this site</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_time: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value, recurrence_end_date: e.target.value === "ONCE" ? "" : formData.recurrence_end_date })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
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
                  Recurrence End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.recurrence_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, recurrence_end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required={formData.frequency !== "ONCE"}
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
            {loading ? "Creating..." : "Create Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}

