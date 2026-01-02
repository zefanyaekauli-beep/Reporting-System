// frontend/web/src/modules/supervisor/pages/Patrol/Security/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface SecurityPatrol {
  id: number;
  user_id: number;
  officer_name: string;
  site_id: number;
  site_name: string;
  start_time: string;
  end_time: string | null;
  area_text: string;
  notes: string | null;
  division?: string;
  created_at: string;
}

export function PatrolSecurityPage() {
  const navigate = useNavigate();
  const [patrols, setPatrols] = useState<SecurityPatrol[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, active, completed

  useEffect(() => {
    loadSites();
    loadPatrols();
  }, []);

  useEffect(() => {
    loadPatrols();
  }, [siteId, dateFrom, dateTo, statusFilter]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadPatrols = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        date_from: dateFrom,
        date_to: dateTo,
      };
      if (siteId) params.site_id = siteId;

      const response = await api.get("/supervisor/patrol-activity", { params });
      let data: SecurityPatrol[] = response.data || [];

      // Filter by status
      if (statusFilter === "active") {
        data = data.filter((p) => !p.end_time);
      } else if (statusFilter === "completed") {
        data = data.filter((p) => p.end_time);
      }

      // Filter by division (only SECURITY)
      data = data.filter((p) => p.division === "SECURITY" || !p.division);

      setPatrols(data);
    } catch (err: any) {
      console.error("Failed to load patrols:", err);
      setError(err.response?.data?.detail || "Failed to load security patrols");
    } finally {
      setLoading(false);
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

  const getStatusBadge = (endTime: string | null) => {
    if (!endTime) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          Active
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
        Completed
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Security Patrol</h1>
        <button
          onClick={() => navigate("/security/patrol/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + New Patrol
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard>
          <div className="text-sm text-gray-600">Total Patrols</div>
          <div className="text-2xl font-bold text-[#002B4B]">{patrols.length}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Active Now</div>
          <div className="text-2xl font-bold text-blue-600">
            {patrols.filter((p) => !p.end_time).length}
          </div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {patrols.filter((p) => p.end_time).length}
          </div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Today</div>
          <div className="text-2xl font-bold text-orange-600">
            {
              patrols.filter((p) => {
                const patrolDate = new Date(p.start_time).toDateString();
                return patrolDate === new Date().toDateString();
              }).length
            }
          </div>
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Patrols Table */}
      <DashboardCard title="Security Patrols">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : patrols.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No patrols found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Officer
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Site
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Area/Route
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Start Time
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    End Time
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Duration
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {patrols.map((patrol) => (
                  <tr
                    key={patrol.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 px-3">{patrol.officer_name}</td>
                    <td className="py-2 px-3">{patrol.site_name}</td>
                    <td className="py-2 px-3">{patrol.area_text || "-"}</td>
                    <td className="py-2 px-3">
                      {format(new Date(patrol.start_time), "MMM dd, HH:mm")}
                    </td>
                    <td className="py-2 px-3">
                      {patrol.end_time
                        ? format(new Date(patrol.end_time), "MMM dd, HH:mm")
                        : "-"}
                    </td>
                    <td className="py-2 px-3">
                      {getDuration(patrol.start_time, patrol.end_time)}
                    </td>
                    <td className="py-2 px-3">
                      {getStatusBadge(patrol.end_time)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/security/patrol/${patrol.id}`)
                          }
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          View
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
    </div>
  );
}

