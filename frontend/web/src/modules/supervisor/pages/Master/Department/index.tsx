// frontend/web/src/modules/supervisor/pages/Master/Department/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export function MasterDepartmentPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/master/department");
      setDepartments(response.data);
    } catch (err: any) {
      console.error("Failed to load departments:", err);
      setError(err.response?.data?.detail || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/master/department/${id}`);
      await loadDepartments();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete department");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Department</h1>
        <button
          onClick={() => navigate("/supervisor/master/department/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create Department
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <DashboardCard title="Departments">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : departments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No departments found. Click "Create Department" to add one.
          </div>
        ) : (
          <div className="space-y-2">
            {departments.map((dept) => (
              <div key={dept.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{dept.name}</div>
                    <div className="text-sm text-gray-600">Code: {dept.code}</div>
                    {dept.description && (
                      <div className="text-sm text-gray-500 mt-1">{dept.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${dept.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {dept.is_active ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => navigate(`/supervisor/master/department/${dept.id}/edit`)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
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

