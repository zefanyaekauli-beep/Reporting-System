// frontend/web/src/modules/supervisor/pages/Master/CCTVZone/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface CCTVZone {
  id: number;
  site_id: number;
  zone_name: string;
  description?: string;
  camera_count: number;
  is_active: boolean;
}

export function MasterCCTVZonePage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<CCTVZone[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadSites();
    loadZones();
  }, []);

  useEffect(() => {
    loadZones();
  }, [siteId]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadZones = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (siteId) params.site_id = siteId;

      const response = await api.get("/master/cctv-zone", { params });
      setZones(response.data);
    } catch (err: any) {
      console.error("Failed to load CCTV zones:", err);
      setError(err.response?.data?.detail || "Failed to load zones");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/master/cctv-zone/${id}`);
      await loadZones();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete CCTV zone");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">CCTV Zone</h1>
        <button
          onClick={() => navigate("/supervisor/master/cctv-zone/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create Zone
        </button>
      </div>

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

      <DashboardCard title="CCTV Zones">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : zones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No CCTV zones found</div>
        ) : (
          <div className="space-y-2">
            {zones.map((zone) => {
              const site = sites.find(s => s.id === zone.site_id);
              return (
                <div key={zone.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{zone.zone_name}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Site: {site?.name || `Site ID: ${zone.site_id}`}</div>
                        <div>{zone.camera_count} camera{zone.camera_count !== 1 ? "s" : ""}</div>
                        {zone.description && (
                          <div className="text-gray-500 mt-1">{zone.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${zone.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {zone.is_active ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => navigate(`/supervisor/master/cctv-zone/${zone.id}/edit`)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id, zone.zone_name)}
                        className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

