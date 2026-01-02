// frontend/web/src/modules/supervisor/pages/Incident/Recap/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface IncidentRecapStats {
  total_incidents: number;
  open_incidents: number;
  in_review_incidents: number;
  closed_today: number;
  critical_alerts: number;
  lk_lp_count: number;
  bap_count: number;
  stplk_count: number;
  findings_count: number;
  incidents_by_status: Record<string, number>;
  incidents_by_type: Record<string, number>;
  incidents_by_severity: Record<string, number>;
}

export function IncidentRecapPage() {
  const [stats, setStats] = useState<IncidentRecapStats | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadSites();
    loadStats();
  }, []);

  useEffect(() => {
    loadStats();
  }, [siteId, dateFrom, dateTo]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        from_date: dateFrom,
        to_date: dateTo,
      };
      if (siteId) params.site_id = siteId;

      const response = await api.get("/incidents/recap", { params });
      setStats(response.data);
    } catch (err: any) {
      console.error("Failed to load incident recap:", err);
      setError(err.response?.data?.detail || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const typeData = stats
    ? Object.entries(stats.incidents_by_type).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Incident Recap</h1>
      </div>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Site</label>
            <select
              value={siteId || ""}
              onChange={(e) => setSiteId(e.target.value ? parseInt(e.target.value) : undefined)}
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <DashboardCard>
            <div className="text-sm text-gray-600">Total Incidents</div>
            <div className="text-2xl font-bold text-[#002B4B]">{stats.total_incidents}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Open</div>
            <div className="text-2xl font-bold text-blue-600">{stats.open_incidents}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">In Review</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.in_review_incidents}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Closed Today</div>
            <div className="text-2xl font-bold text-green-600">{stats.closed_today}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Critical Alerts</div>
            <div className="text-2xl font-bold text-red-600">{stats.critical_alerts}</div>
          </DashboardCard>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardCard title="Incidents by Type">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">No data</div>
            )}
          </DashboardCard>

          <DashboardCard title="Incident Breakdown">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">LK/LP</span>
                <span className="text-sm font-bold text-blue-600">{stats.lk_lp_count}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">BAP</span>
                <span className="text-sm font-bold text-green-600">{stats.bap_count}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">STPLK</span>
                <span className="text-sm font-bold text-orange-600">{stats.stplk_count}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">Findings</span>
                <span className="text-sm font-bold text-red-600">{stats.findings_count}</span>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}

