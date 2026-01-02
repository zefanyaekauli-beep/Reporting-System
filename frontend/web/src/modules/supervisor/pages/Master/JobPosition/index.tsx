// frontend/web/src/modules/supervisor/pages/Master/JobPosition/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface JobPosition {
  id: number;
  code: string;
  name: string;
  description?: string;
  division?: string;
  is_active: boolean;
}

export function MasterJobPositionPage() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [division, setDivision] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadPositions();
  }, []);

  useEffect(() => {
    loadPositions();
  }, [division]);

  const loadPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (division) params.division = division;

      const response = await api.get("/master/job-position", { params });
      setPositions(response.data);
    } catch (err: any) {
      console.error("Failed to load job positions:", err);
      setError(err.response?.data?.detail || "Failed to load job positions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/master/job-position/${id}`);
      await loadPositions();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete job position");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Job Position</h1>
        <button
          onClick={() => navigate("/supervisor/master/job-position/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create Job Position
        </button>
      </div>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <DashboardCard title="Job Positions">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : positions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No job positions found</div>
        ) : (
          <div className="space-y-2">
            {positions.map((position) => (
              <div key={position.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{position.name}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Code: {position.code}</div>
                      {position.division && (
                        <div>Division: {position.division}</div>
                      )}
                      {position.description && (
                        <div className="text-gray-500 mt-1">{position.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${position.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {position.is_active ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => navigate(`/supervisor/master/job-position/${position.id}/edit`)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(position.id, position.name)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

