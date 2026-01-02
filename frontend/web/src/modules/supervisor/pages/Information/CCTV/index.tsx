// frontend/web/src/modules/supervisor/pages/Information/CCTV/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface CCTVStatus {
  id: number;
  name: string;
  location?: string;
  site_id: number;
  is_active: boolean;
  is_recording: boolean;
  status: string;
  last_check?: string;
  stream_url?: string;
}

export function InformationCCTVPage() {
  const [cameras, setCameras] = useState<CCTVStatus[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadSites();
    loadCameras();
  }, []);

  useEffect(() => {
    loadCameras();
  }, [siteId, statusFilter]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadCameras = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (siteId) params.site_id = siteId;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get("/information/cctv-status", { params });
      setCameras(response.data);
    } catch (err: any) {
      console.error("Failed to load CCTV status:", err);
      setError(err.response?.data?.detail || "Failed to load CCTV status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE":
        return "bg-green-100 text-green-800";
      case "OFFLINE":
        return "bg-red-100 text-red-800";
      case "ERROR":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[#002B4B]">CCTV Status Monitoring</h1>

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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <DashboardCard title="CCTV Cameras">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : cameras.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No cameras found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Location</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Recording</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Last Check</th>
                </tr>
              </thead>
              <tbody>
                {cameras.map((camera) => (
                  <tr key={camera.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{camera.name}</td>
                    <td className="py-2 px-3">{camera.location || "-"}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(camera.status)}`}>
                        {camera.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${camera.is_recording ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {camera.is_recording ? "Recording" : "Not Recording"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {camera.last_check ? new Date(camera.last_check).toLocaleString() : "-"}
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

