// frontend/web/src/modules/supervisor/pages/Patrol/Schedule/ScheduleAssignPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { getOfficers, Officer } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface Assignment {
  id: number;
  schedule_id: number;
  user_id: number;
  user_name?: string;
  is_lead: boolean;
  status: string;
  assigned_at: string;
}

interface AssignmentFormData {
  user_id: number;
  is_lead: boolean;
  notes?: string;
}

export function ScheduleAssignPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<AssignmentFormData>({
    user_id: 0,
    is_lead: false,
    notes: "",
  });

  useEffect(() => {
    if (id) {
      loadSchedule();
      loadAssignments();
      loadOfficers();
    }
  }, [id]);

  const loadSchedule = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/api/v1/patrol/schedules/${id}`);
      setSchedule(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load schedule");
    }
  };

  const loadAssignments = async () => {
    if (!id) return;
    try {
      const response = await api.get("/patrol/assignments", { params: { schedule_id: id } });
      const assignmentsData = response.data || [];
      // Fetch user names for assignments
      const assignmentsWithNames = await Promise.all(
        assignmentsData.map(async (assignment: Assignment) => {
          try {
            // Try to get user name from officers list or API
            const officer = officers.find(o => o.id === assignment.user_id);
            return {
              ...assignment,
              user_name: officer?.name || `User ${assignment.user_id}`,
            };
          } catch {
            return {
              ...assignment,
              user_name: `User ${assignment.user_id}`,
            };
          }
        })
      );
      setAssignments(assignmentsWithNames);
    } catch (err: any) {
      console.error("Failed to load assignments:", err);
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

  useEffect(() => {
    if (officers.length > 0 && assignments.length > 0) {
      loadAssignments(); // Reload to get names
    }
  }, [officers.length]);

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.user_id) {
      setError("User is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post("/patrol/assignments", {
        schedule_id: parseInt(id),
        user_id: formData.user_id,
        is_lead: formData.is_lead,
        notes: formData.notes || null,
      });
      setFormData({ user_id: 0, is_lead: false, notes: "" });
      setShowAddForm(false);
      loadAssignments();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to remove this assignment?")) return;

    try {
      await api.delete(`/api/v1/patrol/assignments/${assignmentId}`);
      loadAssignments();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to remove assignment");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Assign Officers to Schedule</h1>
        <button
          onClick={() => navigate("/supervisor/patrol/schedule")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {schedule && (
        <DashboardCard title="Schedule Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Schedule ID</div>
              <div className="text-base font-medium">{schedule.id}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Scheduled Date</div>
              <div className="text-base font-medium">
                {format(new Date(schedule.scheduled_date), "MMM dd, yyyy")} at {schedule.scheduled_time}
              </div>
            </div>
          </div>
        </DashboardCard>
      )}

      <DashboardCard title="Assignments">
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-gray-500 text-sm">No assignments yet</p>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="text-base font-medium">
                    {assignment.user_name || `User ${assignment.user_id}`}
                    {assignment.is_lead && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        Lead
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: {assignment.status} | Assigned: {format(new Date(assignment.assigned_at), "MMM dd, yyyy")}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAssignment(assignment.id)}
                  className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            ))
          )}

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              + Add Assignment
            </button>
          ) : (
            <form onSubmit={handleAddAssignment} className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
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
                  {officers
                    .filter(o => !assignments.some(a => a.user_id === o.id))
                    .map((officer) => (
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

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Assignment"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ user_id: 0, is_lead: false, notes: "" });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}

