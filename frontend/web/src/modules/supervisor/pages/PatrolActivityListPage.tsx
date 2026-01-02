// frontend/web/src/modules/supervisor/pages/PatrolActivityListPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/client";
import { listSites, Site, getOfficers, Officer } from "../../../api/supervisorApi";
import { DashboardCard } from "../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface PatrolActivity {
  id: number;
  user_id: number;
  officer_name: string;
  site_id: number;
  site_name: string;
  start_time: string;
  end_time: string | null;
  area_text: string;
  notes: string;
  division: string;
}

const PatrolActivityListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<PatrolActivity[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [officerId, setOfficerId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [from, setFrom] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  
  // Detail modal
  const [selectedActivity, setSelectedActivity] = useState<PatrolActivity | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadSites();
    loadOfficers();
  }, []);

  useEffect(() => {
    load();
  }, [siteId, from, to]);

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
      setOfficers(data);
    } catch (err) {
      console.error("Failed to load officers:", err);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (from) params.date_from = from;
      if (to) params.date_to = to;
      if (siteId) params.site_id = siteId;
      
      const response = await api.get("/supervisor/patrol-activity", { params });
      let data = response.data || [];
      
      // Apply additional filters
      if (officerId) {
        data = data.filter((a: PatrolActivity) => 
          a.officer_name?.toLowerCase().includes(officerId.toLowerCase()) ||
          a.user_id?.toString() === officerId
        );
      }
      if (statusFilter === "ongoing") {
        data = data.filter((a: PatrolActivity) => !a.end_time);
      } else if (statusFilter === "completed") {
        data = data.filter((a: PatrolActivity) => a.end_time);
      }
      
      setActivities(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load patrol activities");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (activities.length === 0) {
      alert("No activities to export");
      return;
    }

    const headers = ["ID", "Date", "Officer", "Site", "Area", "Start", "End", "Duration", "Notes"];
    const rows = activities.map(a => {
      const duration = a.end_time 
        ? Math.round((new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / 60000)
        : "Ongoing";
      return [
        a.id,
        format(new Date(a.start_time), "yyyy-MM-dd"),
        a.officer_name || `User ${a.user_id}`,
        a.site_name,
        a.area_text || "",
        format(new Date(a.start_time), "HH:mm"),
        a.end_time ? format(new Date(a.end_time), "HH:mm") : "Ongoing",
        typeof duration === "number" ? `${duration} min` : duration,
        (a.notes || "").replace(/,/g, ";").replace(/\n/g, " "),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `patrol_activities_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const openDetailModal = async (activity: PatrolActivity) => {
    setSelectedActivity(activity);
    try {
      const response = await api.get(`/supervisor/patrol-activity/${activity.id}/qr`, {
        responseType: 'blob'
      });
      const blobUrl = URL.createObjectURL(response.data);
      setQrImageUrl(blobUrl);
    } catch (err) {
      console.error('Failed to load QR code:', err);
      setQrImageUrl(null);
    }
  };

  const closeDetailModal = () => {
    setSelectedActivity(null);
    if (qrImageUrl) {
      URL.revokeObjectURL(qrImageUrl);
      setQrImageUrl(null);
    }
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return "Ongoing";
    const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Calculate statistics
  const totalActivities = activities.length;
  const ongoingCount = activities.filter(a => !a.end_time).length;
  const completedCount = activities.filter(a => a.end_time).length;
  const totalDuration = activities
    .filter(a => a.end_time)
    .reduce((sum, a) => {
      return sum + Math.round((new Date(a.end_time!).getTime() - new Date(a.start_time).getTime()) / 60000);
    }, 0);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002B4B]">Patrol & Activity</h1>
          <p className="text-sm text-gray-600 mt-1">
            View patrol logs and activity records from Security division
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            onClick={load}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard>
          <div className="text-sm text-gray-600">Total Activities</div>
          <div className="text-2xl font-bold text-[#002B4B]">{totalActivities}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Ongoing</div>
          <div className="text-2xl font-bold text-blue-600">{ongoingCount}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Total Duration</div>
          <div className="text-2xl font-bold text-orange-600">
            {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
          </div>
        </DashboardCard>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Site</label>
            <select
              value={siteId || ""}
              onChange={(e) => setSiteId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Officer</label>
            <input
              type="text"
              placeholder="Search officer..."
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={load}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </DashboardCard>

      {/* Activities Table */}
      <DashboardCard title="Patrol Activities">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No patrol activities found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Officer</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Site</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Area</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Time</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Duration</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-3">
                      {format(new Date(activity.start_time), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium">{activity.officer_name || `User #${activity.user_id}`}</div>
                    </td>
                    <td className="py-3 px-3">{activity.site_name}</td>
                    <td className="py-3 px-3">{activity.area_text || "-"}</td>
                    <td className="py-3 px-3">
                      <div>{format(new Date(activity.start_time), "HH:mm")}</div>
                      {activity.end_time && (
                        <div className="text-xs text-gray-500">
                          → {format(new Date(activity.end_time), "HH:mm")}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {getDuration(activity.start_time, activity.end_time)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.end_time 
                          ? "bg-green-100 text-green-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {activity.end_time ? "Completed" : "Ongoing"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetailModal(activity)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      {/* Detail Modal */}
      {selectedActivity && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeDetailModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Patrol Activity #{selectedActivity.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedActivity.officer_name} • {selectedActivity.site_name}
                  </p>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Start Time</div>
                    <div className="text-sm font-medium">
                      {format(new Date(selectedActivity.start_time), "MMM dd, HH:mm")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">End Time</div>
                    <div className="text-sm font-medium">
                      {selectedActivity.end_time 
                        ? format(new Date(selectedActivity.end_time), "MMM dd, HH:mm")
                        : "Ongoing"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Duration</div>
                    <div className="text-sm font-medium">
                      {getDuration(selectedActivity.start_time, selectedActivity.end_time)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Area</div>
                    <div className="text-sm font-medium">
                      {selectedActivity.area_text || "Not specified"}
                    </div>
                  </div>
                </div>

                {selectedActivity.notes && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Notes</div>
                    <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                      {selectedActivity.notes}
                    </div>
                  </div>
                )}

                {/* QR Code */}
                <div className="border-t pt-4">
                  <div className="text-xs text-gray-500 mb-2">QR Code</div>
                  <div className="bg-white border rounded-lg p-4 flex justify-center">
                    {qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt="QR Code"
                        className="w-48 h-48 object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-sm">
                        Loading QR...
                      </div>
                    )}
                  </div>
                  {qrImageUrl && (
                    <div className="flex justify-center gap-4 mt-4">
                      <a
                        href={qrImageUrl}
                        download={`Patrol_${selectedActivity.id}.png`}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        Download PNG
                      </a>
                      <a
                        href={qrImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Open for Print
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatrolActivityListPage;
