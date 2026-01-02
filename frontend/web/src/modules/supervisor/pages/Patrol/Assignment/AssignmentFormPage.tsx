// frontend/web/src/modules/supervisor/pages/Patrol/Assignment/AssignmentFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { getOfficers, Officer } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface AssignmentFormData {
  schedule_id: number;                // Required
  user_id: number;                   // Required
  is_lead: boolean;                  // Default: false
  notes?: string;
}

interface Schedule {
  id: number;
  site_id: number;
  route_id: number;
  scheduled_date: string;
  scheduled_time: string;
}

export function AssignmentFormPage() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<AssignmentFormData>({
    schedule_id: 0,
    user_id: 0,
    is_lead: false,
    notes: "",
  });

  useEffect(() => {
    loadSites();
    loadOfficers();
    loadSchedules();
  }, []);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadOfficers = async () => {
    try {
      const data = await getOfficers();
      setOfficers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load officers:", err);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await api.get("/patrol/schedules");
      setSchedules(response.data || []);
    } catch (err) {
      console.error("Failed to load schedules:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/patrol/assignments", {
        schedule_id: formData.schedule_id,
        user_id: formData.user_id,
        is_lead: formData.is_lead,
        notes: formData.notes || null,
      });
      navigate("/supervisor/patrol/assignment");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Create Patrol Assignment</h1>
        <button
          onClick={() => navigate("/supervisor/patrol/assignment")}
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
        <DashboardCard title="Assignment Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.schedule_id}
                onChange={(e) =>
                  setFormData({ ...formData, schedule_id: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              >
                <option value={0}>Select Schedule</option>
                {schedules.map((schedule) => {
                  const siteName = sites.find(s => s.id === schedule.site_id)?.name || `Site ${schedule.site_id}`;
                  return (
                    <option key={schedule.id} value={schedule.id}>
                      Schedule #{schedule.id} - {siteName} - {schedule.scheduled_date} {schedule.scheduled_time}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Officer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.user_id}
                onChange={(e) =>
                  setFormData({ ...formData, user_id: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              >
                <option value={0}>Select Officer</option>
                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name} ({officer.badge_id || officer.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_lead}
                  onChange={(e) =>
                    setFormData({ ...formData, is_lead: e.target.checked })
                  }
                  className="rounded"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">Is Lead</span>
              </label>
            </div>

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
            onClick={() => navigate("/supervisor/patrol/assignment")}
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
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}

