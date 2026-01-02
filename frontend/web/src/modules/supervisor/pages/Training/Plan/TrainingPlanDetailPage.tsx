// frontend/web/src/modules/supervisor/pages/Training/Plan/TrainingPlanDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface TrainingPlan {
  id: number;
  title: string;
  description?: string;
  category?: string;
  scheduled_date: string;
  duration_minutes?: number;
  location?: string;
  instructor_id?: number;
  instructor_name?: string;
  max_participants?: number;
  min_participants?: number;
  division?: string;
  notes?: string;
  status: string;
  site_id?: number;
  site_name?: string;
  created_at: string;
}

interface Participant {
  id: number;
  user_id: number;
  user_name: string;
  attendance_status: string;
  registered_at: string;
}

export function TrainingPlanDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [training, setTraining] = useState<TrainingPlan | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTraining();
      loadParticipants();
    }
  }, [id]);

  const loadTraining = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/training", { params: {} });
      const trainings = response.data || [];
      const foundTraining = trainings.find((t: any) => t.id === parseInt(id));
      
      if (!foundTraining) {
        setError("Training not found");
        return;
      }
      setTraining(foundTraining);
    } catch (err: any) {
      console.error("Failed to load training:", err);
      setError(err.response?.data?.detail || "Failed to load training");
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/training/${id}/attendance`);
      setParticipants(response.data || []);
    } catch (err: any) {
      console.error("Failed to load participants:", err);
      // Don't set error, participants are optional
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-800",
      ONGOING: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      POSTPONED: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-gray-500">Loading training details...</div>
      </div>
    );
  }

  if (error || !training) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || "Training not found"}
        </div>
        <button
          onClick={() => navigate("/supervisor/training/plan")}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back to Training Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Training Plan Details</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/supervisor/training/plan/${id}/edit`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Edit
          </button>
          <button
            onClick={() => navigate("/supervisor/training/participant/new", { state: { training_id: id } })}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Add Participant
          </button>
          <button
            onClick={() => navigate("/supervisor/training/plan")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard>
          <div className="text-sm text-gray-600">Training ID</div>
          <div className="text-lg font-bold text-[#002B4B]">{training.id}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Status</div>
          <div className="mt-2">{getStatusBadge(training.status)}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Scheduled Date</div>
          <div className="text-lg font-bold text-[#002B4B]">
            {format(new Date(training.scheduled_date), "MMM dd, yyyy HH:mm")}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Title</div>
            <div className="text-base font-medium">{training.title}</div>
          </div>
          {training.category && (
            <div>
              <div className="text-sm text-gray-600">Category</div>
              <div className="text-base font-medium">{training.category}</div>
            </div>
          )}
          {training.location && (
            <div>
              <div className="text-sm text-gray-600">Location</div>
              <div className="text-base font-medium">{training.location}</div>
            </div>
          )}
          {training.duration_minutes && (
            <div>
              <div className="text-sm text-gray-600">Duration</div>
              <div className="text-base font-medium">{training.duration_minutes} minutes</div>
            </div>
          )}
          {training.description && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">Description</div>
              <div className="text-base font-medium mt-1">{training.description}</div>
            </div>
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="Instructor & Participants">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Instructor</div>
            <div className="text-base font-medium">
              {training.instructor_name || training.instructor_id ? `User ${training.instructor_id}` : "Not assigned"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Division</div>
            <div className="text-base font-medium">{training.division || "All Divisions"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Participants</div>
            <div className="text-base font-medium">
              {participants.length} registered
              {training.max_participants && ` / ${training.max_participants} max`}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Min Participants</div>
            <div className="text-base font-medium">{training.min_participants || 1}</div>
          </div>
        </div>
      </DashboardCard>

      {participants.length > 0 && (
        <DashboardCard title="Participants List">
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div>
                  <div className="text-base font-medium">{participant.user_name}</div>
                  <div className="text-sm text-gray-600">
                    Status: {participant.attendance_status} | Registered: {format(new Date(participant.registered_at), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {training.notes && (
        <DashboardCard title="Notes">
          <div className="text-base font-medium">{training.notes}</div>
        </DashboardCard>
      )}

      <DashboardCard title="Metadata">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Created At</div>
            <div className="text-base font-medium">
              {format(new Date(training.created_at), "MMM dd, yyyy HH:mm")}
            </div>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

