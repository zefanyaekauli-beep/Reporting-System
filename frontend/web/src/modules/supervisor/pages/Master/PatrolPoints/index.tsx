// frontend/web/src/modules/supervisor/pages/Master/PatrolPoints/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface PatrolPoint {
  id: number;
  site_id: number;
  name: string;
  code: string;  // QR code content
  description?: string;
  is_active: boolean;
}

export function MasterPatrolPointsPage() {
  const navigate = useNavigate();
  const [points, setPoints] = useState<PatrolPoint[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadSites();
    loadPoints();
  }, []);

  useEffect(() => {
    loadPoints();
  }, [siteId]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadPoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (siteId) params.site_id = siteId;

      const response = await api.get("/master/patrol-points", { params });
      setPoints(response.data);
    } catch (err: any) {
      console.error("Failed to load patrol points:", err);
      setError(err.response?.data?.detail || "Failed to load patrol points");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/master/patrol-points/${id}`);
      await loadPoints();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete patrol point");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Patrol and Guard Points</h1>
        <button
          onClick={() => navigate("/supervisor/master/patrol-points/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create Patrol Point
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

      <DashboardCard title="Patrol Points">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : points.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No patrol points found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Code</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Site</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Description</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => {
                  const site = sites.find(s => s.id === point.site_id);
                  return (
                    <tr key={point.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">{point.name}</td>
                      <td className="py-2 px-3 font-mono text-xs">{point.code}</td>
                      <td className="py-2 px-3">{site?.name || "-"}</td>
                      <td className="py-2 px-3">{point.description || "-"}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${point.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {point.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/supervisor/master/patrol-points/${point.id}/edit`)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(point.id, point.name)}
                            className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

