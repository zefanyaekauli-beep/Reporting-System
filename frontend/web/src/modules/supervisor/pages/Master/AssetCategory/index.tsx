// frontend/web/src/modules/supervisor/pages/Master/AssetCategory/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface AssetCategory {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export function MasterAssetCategoryPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/master/asset-category");
      setCategories(response.data);
    } catch (err: any) {
      console.error("Failed to load asset categories:", err);
      setError(err.response?.data?.detail || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/master/asset-category/${id}`);
      await loadCategories();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete asset category");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Asset Category</h1>
        <button
          onClick={() => navigate("/supervisor/master/asset-category/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <DashboardCard title="Asset Categories">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No categories found</div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{category.name}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Code: {category.code}</div>
                      {category.description && (
                        <div className="text-gray-500 mt-1">{category.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${category.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => navigate(`/supervisor/master/asset-category/${category.id}/edit`)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
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

