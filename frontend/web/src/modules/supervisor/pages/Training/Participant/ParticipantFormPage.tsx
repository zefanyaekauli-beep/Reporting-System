// frontend/web/src/modules/supervisor/pages/Training/Participant/ParticipantFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../../../api/client";
import { getOfficers, Officer } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface ParticipantFormData {
  training_id: number;               // Required (from URL param or state)
  user_id: number;                   // Required (user to enroll)
  notes?: string;
}

interface Training {
  id: number;
  title: string;
  scheduled_date: string;
  status: string;
  location?: string;
}

export function ParticipantFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [trainingId, setTrainingId] = useState<number | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ParticipantFormData>({
    training_id: 0,
    user_id: 0,
    notes: "",
  });

  useEffect(() => {
    // Get training_id from URL params or location state
    const params = new URLSearchParams(location.search);
    const trainingIdParam = params.get("training_id");
    const stateTrainingId = (location.state as any)?.training_id;
    
    const id = trainingIdParam ? parseInt(trainingIdParam) : (stateTrainingId ? parseInt(stateTrainingId) : null);
    if (id) {
      setTrainingId(id);
      setFormData(prev => ({ ...prev, training_id: id }));
    }
    
    loadData();
  }, [location]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([loadTrainings(), loadOfficers()]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadTrainings = async () => {
    try {
      const response = await api.get("/training", { 
        params: { 
          status: "SCHEDULED" // Only show scheduled trainings
        } 
      });
      const data = response.data || [];
      setTrainings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load trainings:", err);
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

  const handleTrainingChange = (selectedTrainingId: number) => {
    setTrainingId(selectedTrainingId);
    setFormData(prev => ({ ...prev, training_id: selectedTrainingId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingId || !formData.user_id) {
      setError("Training ID and User are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Enroll participant using the training participants endpoint
      await api.post("/training/participants", {
        training_id: trainingId,
        user_id: formData.user_id,
        notes: formData.notes || null,
      });
      navigate("/supervisor/training/participant");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to enroll participant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Enroll Training Participant</h1>
        <button
          onClick={() => navigate("/supervisor/training/participant")}
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

      {loadingData ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
          Loading data...
        </div>
      ) : trainings.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
          No scheduled trainings available. Please create a training plan first.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <DashboardCard title="Participant Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Training <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.training_id}
                onChange={(e) => handleTrainingChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading || loadingData}
              >
                <option value={0}>Select Training</option>
                {trainings.map((training) => (
                  <option key={training.id} value={training.id}>
                    {training.title} - {new Date(training.scheduled_date).toLocaleDateString("id-ID")} 
                    {training.location ? ` (${training.location})` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Only scheduled trainings are shown. You can also add participants from the Training Plan detail page.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.user_id}
                onChange={(e) =>
                  setFormData({ ...formData, user_id: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading || !trainingId || loadingData}
              >
                <option value={0}>Select User</option>
                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name} ({officer.badge_id || officer.id})
                  </option>
                ))}
              </select>
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
                placeholder="Additional notes about this enrollment (optional)"
              />
            </div>
          </div>
        </DashboardCard>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate("/supervisor/training/participant")}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !trainingId || loadingData}
          >
            {loading ? "Enrolling..." : "Enroll Participant"}
          </button>
        </div>
      </form>
    </div>
  );
}

