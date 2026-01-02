// frontend/web/src/modules/supervisor/pages/KPI/Report/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface KPIReportStats {
  total_reports: number;
  submitted_reports: number;
  approved_reports: number;
  rejected_reports: number;
  submission_rate: number;
  approval_rate: number;
}

export function KPIReportPage() {
  const [stats, setStats] = useState<KPIReportStats | null>(null);
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

      const response = await api.get("/kpi/report", { params });
      setStats(response.data);
    } catch (err: any) {
      console.error("Failed to load report KPI:", err);
      setError(err.response?.data?.detail || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[#002B4B]">KPI Report</h1>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardCard>
            <div className="text-sm text-gray-600">Total Reports</div>
            <div className="text-2xl font-bold text-[#002B4B]">{stats.total_reports}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Submission Rate</div>
            <div className="text-2xl font-bold text-blue-600">{stats.submission_rate.toFixed(1)}%</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Approval Rate</div>
            <div className="text-2xl font-bold text-green-600">{stats.approval_rate.toFixed(1)}%</div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}

