// frontend/web/src/modules/supervisor/pages/Patrol/Joint/JointDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJointPatrol, updateJointPatrol, deleteJointPatrol, JointPatrol } from "../../../../../api/patrolApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

export function JointDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [patrol, setPatrol] = useState<JointPatrol | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPatrol();
    }
  }, [id]);

  const loadPatrol = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getJointPatrol(parseInt(id));
      setPatrol(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load joint patrol");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !patrol) return;
    try {
      const now = new Date().toISOString();
      const updateData: any = { status: newStatus };
      
      if (newStatus === "IN_PROGRESS" && !patrol.actual_start) {
        updateData.actual_start = now;
      }
      if (newStatus === "COMPLETED" && !patrol.actual_end) {
        updateData.actual_end = now;
      }
      
      await updateJointPatrol(parseInt(id), updateData);
      await loadPatrol();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this joint patrol?")) return;
    
    try {
      await deleteJointPatrol(parseInt(id));
      navigate("/supervisor/patrol/joint");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete joint patrol");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDuration = (start?: string, end?: string) => {
    if (!start || !end) return "N/A";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const minutes = Math.floor((endTime - startTime) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !patrol) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || "Joint patrol not found"}
        </div>
        <button
          onClick={() => navigate("/supervisor/patrol/joint")}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002B4B]">{patrol.title}</h1>
          <p className="text-sm text-gray-600 mt-1">{patrol.site_name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {patrol.status === "SCHEDULED" && (
            <>
              <button
                onClick={() => handleStatusChange("IN_PROGRESS")}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Start Patrol
              </button>
              <button
                onClick={() => navigate(`/supervisor/patrol/joint/${patrol.id}/edit`)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Edit
              </button>
            </>
          )}
          {patrol.status === "IN_PROGRESS" && (
            <button
              onClick={() => handleStatusChange("COMPLETED")}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Complete Patrol
            </button>
          )}
          {patrol.status !== "COMPLETED" && (
            <button
              onClick={() => handleStatusChange("CANCELLED")}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
          >
            Delete
          </button>
          <button
            onClick={() => navigate("/supervisor/patrol/joint")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(patrol.status)}`}>
          {patrol.status}
        </span>
        {patrol.route && (
          <span className="text-sm text-gray-600">📍 {patrol.route}</span>
        )}
      </div>

      {/* Schedule Info */}
      <DashboardCard title="Schedule & Timing">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600">Scheduled Start</div>
            <div className="text-sm font-medium">
              {format(new Date(patrol.scheduled_start), "MMM dd, yyyy HH:mm")}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Scheduled End</div>
            <div className="text-sm font-medium">
              {patrol.scheduled_end 
                ? format(new Date(patrol.scheduled_end), "MMM dd, yyyy HH:mm")
                : "Not set"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Actual Start</div>
            <div className="text-sm font-medium">
              {patrol.actual_start 
                ? format(new Date(patrol.actual_start), "MMM dd, yyyy HH:mm")
                : "Not started"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Actual End</div>
            <div className="text-sm font-medium">
              {patrol.actual_end 
                ? format(new Date(patrol.actual_end), "MMM dd, yyyy HH:mm")
                : "Not ended"}
            </div>
          </div>
        </div>
        {patrol.actual_start && patrol.actual_end && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-green-800">
              <strong>Duration:</strong> {getDuration(patrol.actual_start, patrol.actual_end)}
            </span>
          </div>
        )}
      </DashboardCard>

      {/* Team */}
      <DashboardCard title={`Team (${(patrol.participant_ids?.length || 0) + 1} members)`}>
        <div className="space-y-3">
          {/* Lead Officer */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">
                {patrol.lead_officer_name?.charAt(0) || "L"}
              </span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">
                {patrol.lead_officer_name || `Officer ${patrol.lead_officer_id}`}
              </div>
              <div className="text-xs text-blue-600 font-medium">Lead Officer</div>
            </div>
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
              LEAD
            </span>
          </div>

          {/* Participants */}
          {patrol.participant_names?.map((name, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center">
                <span className="text-white font-bold">
                  {name?.charAt(0) || "P"}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{name}</div>
                <div className="text-xs text-gray-500">Participant</div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Description & Notes */}
      {(patrol.description || patrol.notes) && (
        <DashboardCard title="Details">
          {patrol.description && (
            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-1">Description</div>
              <p className="text-sm text-gray-800">{patrol.description}</p>
            </div>
          )}
          {patrol.notes && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Notes</div>
              <p className="text-sm text-gray-800">{patrol.notes}</p>
            </div>
          )}
        </DashboardCard>
      )}

      {/* Findings */}
      {patrol.findings && (
        <DashboardCard title="Findings">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{patrol.findings}</p>
        </DashboardCard>
      )}

      {/* Photos */}
      {patrol.photos && patrol.photos.length > 0 && (
        <DashboardCard title={`Photos (${patrol.photos.length})`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {patrol.photos.map((photo, idx) => (
              <a
                key={idx}
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
              >
                <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* Timeline */}
      <DashboardCard title="Timeline">
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="relative">
            <div className="absolute -left-4 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            <div className="text-sm">
              <span className="font-medium">Created</span>
              <span className="text-gray-500 ml-2">
                {format(new Date(patrol.created_at), "MMM dd, yyyy HH:mm")}
              </span>
            </div>
          </div>

          {patrol.actual_start && (
            <div className="relative">
              <div className="absolute -left-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              <div className="text-sm">
                <span className="font-medium">Patrol Started</span>
                <span className="text-gray-500 ml-2">
                  {format(new Date(patrol.actual_start), "MMM dd, yyyy HH:mm")}
                </span>
              </div>
            </div>
          )}

          {patrol.actual_end && (
            <div className="relative">
              <div className="absolute -left-4 w-3 h-3 bg-green-600 rounded-full border-2 border-white"></div>
              <div className="text-sm">
                <span className="font-medium">Patrol Completed</span>
                <span className="text-gray-500 ml-2">
                  {format(new Date(patrol.actual_end), "MMM dd, yyyy HH:mm")}
                </span>
              </div>
            </div>
          )}

          {patrol.status === "CANCELLED" && (
            <div className="relative">
              <div className="absolute -left-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              <div className="text-sm">
                <span className="font-medium text-red-600">Cancelled</span>
              </div>
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}

