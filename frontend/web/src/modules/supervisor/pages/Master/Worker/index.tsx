// frontend/web/src/modules/supervisor/pages/Master/Worker/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface Worker {
  id: number;
  username: string;
  division?: string;
  role: string;
  site_id?: number;
  company_id: number;
  scope_type?: string;
  scope_id?: number;
}

export function MasterWorkerPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [division, setDivision] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadSites();
    loadWorkers();
  }, []);

  useEffect(() => {
    loadWorkers();
  }, [siteId, division, role]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (siteId) params.site_id = siteId;
      if (division) params.division = division;
      if (role) params.role = role;

      const response = await api.get("/master/worker", { params });
      setWorkers(response.data);
    } catch (err: any) {
      console.error("Failed to load workers:", err);
      setError(err.response?.data?.detail || "Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Worker Data</h1>
        <button
          onClick={() => navigate("/supervisor/master/worker/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create Worker
        </button>
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Division</label>
            <select
              value={division || ""}
              onChange={(e) => setDivision(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Divisions</option>
              <option value="SECURITY">Security</option>
              <option value="CLEANING">Cleaning</option>
              <option value="DRIVER">Driver</option>
              <option value="PARKING">Parking</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role || ""}
              onChange={(e) => setRole(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Roles</option>
              <option value="FIELD">Field</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Workers Table */}
      <DashboardCard title="Workers">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : workers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No workers found. Click "Create Worker" to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Username</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Division</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Site ID</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Scope</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{worker.username}</td>
                    <td className="py-2 px-3">{worker.division || "-"}</td>
                    <td className="py-2 px-3">{worker.role}</td>
                    <td className="py-2 px-3">{worker.site_id || "-"}</td>
                    <td className="py-2 px-3 text-xs">
                      {worker.scope_type ? `${worker.scope_type}: ${worker.scope_id || "-"}` : "-"}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/supervisor/master/worker/${worker.id}/edit`)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          Edit
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
