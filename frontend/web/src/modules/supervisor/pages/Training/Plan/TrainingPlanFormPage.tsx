// frontend/web/src/modules/supervisor/pages/Training/Plan/TrainingPlanFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site, getOfficers, Officer } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface TrainingPlanFormData {
  site_id?: number;
  title: string;                      // Required
  description?: string;
  category?: string;                 // SAFETY, SKILL, COMPLIANCE, etc.
  scheduled_date: string;            // Required (datetime)
  duration_minutes?: number;
  location?: string;
  instructor_id?: number;
  instructor_name?: string;
  max_participants?: number;
  min_participants: number;          // Default: 1
  division?: string;                 // SECURITY, CLEANING, DRIVER, PARKING
  notes?: string;
}

export function TrainingPlanFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [sites, setSites] = useState<Site[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TrainingPlanFormData>({
    site_id: undefined,
    title: "",
    description: "",
    category: "",
    scheduled_date: new Date().toISOString().slice(0, 16), // datetime-local format
    duration_minutes: undefined,
    location: "",
    instructor_id: undefined,
    instructor_name: "",
    max_participants: undefined,
    min_participants: 1,
    division: "",
    notes: "",
  });

  useEffect(() => {
    loadSites();
    loadOfficers();
    if (isEdit && id) {
      loadTraining();
    }
  }, [id, isEdit]);

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

  const loadTraining = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Get training from list endpoint
      const response = await api.get("/training", { params: {} });
      const trainings = response.data || [];
      const training = trainings.find((t: any) => t.id === parseInt(id));
      
      if (!training) {
        setError("Training not found");
        return;
      }

      setFormData({
        site_id: training.site_id || undefined,
        title: training.title || "",
        description: training.description || "",
        category: training.category || "",
        scheduled_date: training.scheduled_date ? new Date(training.scheduled_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        duration_minutes: training.duration_minutes || undefined,
        location: training.location || "",
        instructor_id: training.instructor_id || undefined,
        instructor_name: training.instructor_name || "",
        max_participants: training.max_participants || undefined,
        min_participants: 1, // Default, not in response
        division: training.division || "",
        notes: "", // Not in response
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load training");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        site_id: formData.site_id || null,
        title: formData.title,
        description: formData.description || null,
        category: formData.category || null,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        duration_minutes: formData.duration_minutes || null,
        location: formData.location || null,
        instructor_id: formData.instructor_id || null,
        instructor_name: formData.instructor_name || null,
        max_participants: formData.max_participants || null,
        min_participants: formData.min_participants || 1,
        division: formData.division || null,
        notes: formData.notes || null,
      };

      if (isEdit && id) {
        // Note: PATCH endpoint may not exist, using POST as fallback
        try {
          await api.patch(`/training/${id}`, payload);
        } catch (patchErr: any) {
          // If PATCH doesn't exist, show error
          setError("Update endpoint not available. Please contact administrator.");
          return;
        }
      } else {
        await api.post("/training", payload);
      }
      navigate("/supervisor/training/plan");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save training plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">
          {isEdit ? "Edit Training Plan" : "Create Training Plan"}
        </h1>
        <button
          onClick={() => navigate("/supervisor/training/plan")}
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
        <DashboardCard title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site
              </label>
              <select
                value={formData.site_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, site_id: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              >
                <option value="">Select Site (Optional)</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              >
                <option value="">Select Category</option>
                <option value="SAFETY">Safety</option>
                <option value="SKILL">Skill</option>
                <option value="COMPLIANCE">Compliance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Schedule">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
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
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration_minutes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Instructor">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor (Internal)
              </label>
              <select
                value={formData.instructor_id || ""}
                onChange={(e) => {
                  const instructorId = e.target.value ? parseInt(e.target.value) : undefined;
                  setFormData({ 
                    ...formData, 
                    instructor_id: instructorId,
                    instructor_name: instructorId ? officers.find(o => o.id === instructorId)?.name || "" : ""
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              >
                <option value="">Select Instructor (Optional)</option>
                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name} ({officer.badge_id || officer.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor Name (External)
              </label>
              <input
                type="text"
                value={formData.instructor_name}
                onChange={(e) =>
                  setFormData({ ...formData, instructor_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter external instructor name"
                disabled={loading || !!formData.instructor_id}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Participants">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Participants
              </label>
              <input
                type="number"
                value={formData.min_participants}
                onChange={(e) =>
                  setFormData({ ...formData, min_participants: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Participants
              </label>
              <input
                type="number"
                value={formData.max_participants || ""}
                onChange={(e) =>
                  setFormData({ ...formData, max_participants: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division
              </label>
              <select
                value={formData.division}
                onChange={(e) =>
                  setFormData({ ...formData, division: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              >
                <option value="">All Divisions</option>
                <option value="SECURITY">Security</option>
                <option value="CLEANING">Cleaning</option>
                <option value="DRIVER">Driver</option>
                <option value="PARKING">Parking</option>
              </select>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Additional Information">
          <div className="grid grid-cols-1 gap-4">
            <div>
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
            onClick={() => navigate("/supervisor/training/plan")}
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
            {loading ? "Saving..." : isEdit ? "Update Training Plan" : "Create Training Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}

