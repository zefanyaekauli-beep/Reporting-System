// frontend/web/src/modules/supervisor/pages/KPI/CCTV/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface KPICCTVStats {
  total_cameras: number;
  active_cameras: number;
  offline_cameras: number;
  uptime_percentage: number;
}

export function KPICCTVPage() {
  const [stats, setStats] = useState<KPICCTVStats | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadSites();
    loadStats();
  }, []);

  useEffect(() => {
    loadStats();
  }, [siteId]);

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
      const params: any = {};
      if (siteId) params.site_id = siteId;

      const response = await api.get("/kpi/cctv", { params });
      setStats(response.data);
    } catch (err: any) {
      console.error("Failed to load CCTV KPI:", err);
      setError(err.response?.data?.detail || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[#002B4B]">KPI CCTV</h1>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardCard>
            <div className="text-sm text-gray-600">Total Cameras</div>
            <div className="text-2xl font-bold text-[#002B4B]">{stats.total_cameras}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.active_cameras}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Offline</div>
            <div className="text-2xl font-bold text-red-600">{stats.offline_cameras}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Uptime</div>
            <div className="text-2xl font-bold text-blue-600">{stats.uptime_percentage.toFixed(1)}%</div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}

