// frontend/web/src/modules/supervisor/pages/Patrol/Assignment/AssignmentDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
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
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

interface Schedule {
  id: number;
  site_id: number;
  route_id: number;
  scheduled_date: string;
  scheduled_time: string;
  route_name?: string;
  site_name?: string;
}

export function AssignmentDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAssignment();
    }
  }, [id]);

  const loadAssignment = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/patrol/assignments/${id}`);
      const assignmentData = response.data;
      setAssignment(assignmentData);

      // Load schedule details
      if (assignmentData.schedule_id) {
        try {
          const scheduleResponse = await api.get(`/api/v1/patrol/schedules/${assignmentData.schedule_id}`);
          setSchedule(scheduleResponse.data);
        } catch (err) {
          console.error("Failed to load schedule:", err);
        }
      }
    } catch (err: any) {
      console.error("Failed to load assignment:", err);
      setError(err.response?.data?.detail || "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      ASSIGNED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
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
        <div className="text-center py-8 text-gray-500">Loading assignment details...</div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || "Assignment not found"}
        </div>
        <button
          onClick={() => navigate("/supervisor/patrol/assignment")}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back to Assignments
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Patrol Assignment Details</h1>
        <div className="flex gap-2">
          {schedule && (
            <button
              onClick={() => navigate(`/supervisor/patrol/schedule/${schedule.id}`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              View Schedule
            </button>
          )}
          <button
            onClick={() => navigate("/supervisor/patrol/assignment")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard>
          <div className="text-sm text-gray-600">Assignment ID</div>
          <div className="text-lg font-bold text-[#002B4B]">{assignment.id}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Status</div>
          <div className="mt-2">{getStatusBadge(assignment.status)}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Assigned At</div>
          <div className="text-lg font-bold text-[#002B4B]">
            {format(new Date(assignment.assigned_at), "MMM dd, yyyy HH:mm")}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Assignment Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Assigned Officer</div>
            <div className="text-base font-medium">
              {assignment.user_name || `User ${assignment.user_id}`}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Role</div>
            <div className="text-base font-medium">
              {assignment.is_lead ? (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  Lead Officer
                </span>
              ) : (
                "Officer"
              )}
            </div>
          </div>
          {assignment.started_at && (
            <div>
              <div className="text-sm text-gray-600">Started At</div>
              <div className="text-base font-medium">
                {format(new Date(assignment.started_at), "MMM dd, yyyy HH:mm")}
              </div>
            </div>
          )}
          {assignment.completed_at && (
            <div>
              <div className="text-sm text-gray-600">Completed At</div>
              <div className="text-base font-medium">
                {format(new Date(assignment.completed_at), "MMM dd, yyyy HH:mm")}
              </div>
            </div>
          )}
          {assignment.notes && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">Notes</div>
              <div className="text-base font-medium mt-1">{assignment.notes}</div>
            </div>
          )}
        </div>
      </DashboardCard>

      {schedule && (
        <DashboardCard title="Schedule Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Schedule ID</div>
              <div className="text-base font-medium">{schedule.id}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Scheduled Date & Time</div>
              <div className="text-base font-medium">
                {format(new Date(schedule.scheduled_date), "MMM dd, yyyy")} at {schedule.scheduled_time}
              </div>
            </div>
            {schedule.route_name && (
              <div>
                <div className="text-sm text-gray-600">Route</div>
                <div className="text-base font-medium">{schedule.route_name}</div>
              </div>
            )}
            {schedule.site_name && (
              <div>
                <div className="text-sm text-gray-600">Site</div>
                <div className="text-base font-medium">{schedule.site_name}</div>
              </div>
            )}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}

