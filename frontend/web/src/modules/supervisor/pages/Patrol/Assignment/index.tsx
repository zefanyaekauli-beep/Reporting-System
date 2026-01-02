// frontend/web/src/modules/supervisor/pages/Patrol/Assignment/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface PatrolAssignment {
  id: number;
  schedule_id: number;
  user_id: number;
  is_lead: boolean;
  status: string;
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
}

export function PatrolAssignmentPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<PatrolAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadAssignments();
  }, [status]);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (status) params.status = status;

      const response = await api.get("/patrol/assignments", { params });
      setAssignments(response.data);
    } catch (err: any) {
      console.error("Failed to load assignments:", err);
      setError(err.response?.data?.detail || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "MISSED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Patrol Assignment</h1>
        <button
          onClick={() => navigate("/supervisor/patrol/assignment/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create Assignment
        </button>
      </div>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status || ""}
              onChange={(e) => setStatus(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="MISSED">Missed</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Assignments Table */}
      <DashboardCard title="Patrol Assignments">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No assignments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">User</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Assigned At</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Started At</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Completed At</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">User {assignment.user_id}</td>
                    <td className="py-2 px-3">{assignment.is_lead ? "Lead" : "Member"}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">{format(new Date(assignment.assigned_at), "MMM dd, HH:mm")}</td>
                    <td className="py-2 px-3">
                      {assignment.started_at ? format(new Date(assignment.started_at), "MMM dd, HH:mm") : "-"}
                    </td>
                    <td className="py-2 px-3">
                      {assignment.completed_at ? format(new Date(assignment.completed_at), "MMM dd, HH:mm") : "-"}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/supervisor/patrol/assignment/${assignment.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          View
                        </button>
                        {assignment.status === "ASSIGNED" && (
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/api/v1/patrol/assignments/${assignment.id}/start`);
                                await loadAssignments();
                              } catch (err: any) {
                                alert(err.response?.data?.detail || "Failed to start patrol");
                              }
                            }}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            Start
                          </button>
                        )}
                        {assignment.status === "IN_PROGRESS" && (
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/api/v1/patrol/assignments/${assignment.id}/complete`);
                                await loadAssignments();
                              } catch (err: any) {
                                alert(err.response?.data?.detail || "Failed to complete patrol");
                              }
                            }}
                            className="text-orange-600 hover:text-orange-800 text-xs"
                          >
                            Complete
                          </button>
                        )}
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

