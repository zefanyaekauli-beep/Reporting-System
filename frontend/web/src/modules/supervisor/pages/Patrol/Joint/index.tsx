// frontend/web/src/modules/supervisor/pages/Patrol/Joint/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listJointPatrols, deleteJointPatrol, JointPatrol } from "../../../../../api/patrolApi";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

export function PatrolJointPage() {
  const navigate = useNavigate();
  const [jointPatrols, setJointPatrols] = useState<JointPatrol[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  useEffect(() => {
    loadSites();
    loadJointPatrols();
  }, []);

  useEffect(() => {
    loadJointPatrols();
  }, [siteId, status, dateFrom, dateTo]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadJointPatrols = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        date_from: dateFrom,
        date_to: dateTo,
      };
      if (siteId) params.site_id = siteId;
      if (status) params.status = status;

      const data = await listJointPatrols(params);
      setJointPatrols(data);
    } catch (err: any) {
      console.error("Failed to load joint patrols:", err);
      setError(err.response?.data?.detail || "Failed to load joint patrols");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this joint patrol?")) return;
    
    try {
      await deleteJointPatrol(id);
      await loadJointPatrols();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete joint patrol");
    }
  };

  const getDuration = (start: string, end?: string | null) => {
    if (!end) return "Ongoing";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const minutes = Math.floor((endTime - startTime) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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

  // Calculate statistics
  const totalJointPatrols = jointPatrols.length;
  const scheduledCount = jointPatrols.filter((jp) => jp.status === "SCHEDULED").length;
  const inProgressCount = jointPatrols.filter((jp) => jp.status === "IN_PROGRESS").length;
  const completedCount = jointPatrols.filter((jp) => jp.status === "COMPLETED").length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002B4B]">Joint Patrol</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage patrols conducted by multiple personnel together
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadJointPatrols}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate("/supervisor/patrol/joint/new")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            + New Joint Patrol
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard>
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-[#002B4B]">{totalJointPatrols}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Scheduled</div>
          <div className="text-2xl font-bold text-yellow-600">{scheduledCount}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
        </DashboardCard>
      </div>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Site
            </label>
            <select
              value={siteId || ""}
              onChange={(e) =>
                setSiteId(e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Joint Patrols List */}
      <DashboardCard title="Joint Patrols">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : jointPatrols.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No joint patrols found</div>
            <button
              onClick={() => navigate("/supervisor/patrol/joint/new")}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Create First Joint Patrol
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jointPatrols.map((patrol) => (
              <div
                key={patrol.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 
                        className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() => navigate(`/supervisor/patrol/joint/${patrol.id}`)}
                      >
                        {patrol.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patrol.status)}`}>
                        {patrol.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {patrol.site_name} {patrol.route && `• ${patrol.route}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {(patrol.participant_ids?.length || 0) + 1} Participants
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(patrol.scheduled_start), "MMM dd, HH:mm")}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Lead Officer</div>
                    <div className="font-medium">{patrol.lead_officer_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Scheduled</div>
                    <div className="font-medium">
                      {format(new Date(patrol.scheduled_start), "MMM dd, HH:mm")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Duration</div>
                    <div className="font-medium">
                      {patrol.actual_start && patrol.actual_end
                        ? getDuration(patrol.actual_start, patrol.actual_end)
                        : patrol.scheduled_end
                        ? getDuration(patrol.scheduled_start, patrol.scheduled_end)
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Participants</div>
                    <div className="font-medium">
                      {patrol.participant_names?.slice(0, 2).join(", ")}
                      {(patrol.participant_names?.length || 0) > 2 && 
                        ` +${(patrol.participant_names?.length || 0) - 2} more`}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/supervisor/patrol/joint/${patrol.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    View Details
                  </button>
                  {patrol.status === "SCHEDULED" && (
                    <button
                      onClick={() => navigate(`/supervisor/patrol/joint/${patrol.id}/edit`)}
                      className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(patrol.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
