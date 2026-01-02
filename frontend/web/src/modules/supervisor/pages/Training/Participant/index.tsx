// frontend/web/src/modules/supervisor/pages/Training/Participant/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface TrainingParticipant {
  id: number;
  training_id: number;
  user_id: number;
  registered_at: string;
  attendance_status: string;
  attended_at?: string;
  score?: number;
  passed?: boolean;
}

export function TrainingParticipantPage() {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<TrainingParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [trainingId, setTrainingId] = useState<number | undefined>(undefined);
  const [attendanceStatus, setAttendanceStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadParticipants();
  }, [trainingId, attendanceStatus]);

  const loadParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (trainingId) params.training_id = trainingId;
      if (attendanceStatus) params.attendance_status = attendanceStatus;

      const response = await api.get("/training/participants", { params });
      setParticipants(response.data);
    } catch (err: any) {
      console.error("Failed to load participants:", err);
      setError(err.response?.data?.detail || "Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return "bg-blue-100 text-blue-800";
      case "ATTENDED":
        return "bg-green-100 text-green-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Training Participant</h1>
        <button
          onClick={() => navigate("/supervisor/training/participant/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Enroll Participant
        </button>
      </div>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Training ID</label>
            <input
              type="number"
              value={trainingId || ""}
              onChange={(e) => setTrainingId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Filter by training ID"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Attendance Status</label>
            <select
              value={attendanceStatus || ""}
              onChange={(e) => setAttendanceStatus(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="REGISTERED">Registered</option>
              <option value="ATTENDED">Attended</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Participants Table */}
      <DashboardCard title="Training Participants">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : participants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No participants found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Training ID</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">User ID</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Registered At</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Score</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Passed</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr key={participant.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{participant.training_id}</td>
                    <td className="py-2 px-3">User {participant.user_id}</td>
                    <td className="py-2 px-3">{format(new Date(participant.registered_at), "MMM dd, yyyy HH:mm")}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(participant.attendance_status)}`}>
                        {participant.attendance_status}
                      </span>
                    </td>
                    <td className="py-2 px-3">{participant.score ?? "-"}</td>
                    <td className="py-2 px-3">
                      {participant.passed !== null ? (participant.passed ? "Yes" : "No") : "-"}
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

