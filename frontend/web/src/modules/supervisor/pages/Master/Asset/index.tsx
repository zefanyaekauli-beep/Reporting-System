// frontend/web/src/modules/supervisor/pages/Master/Asset/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface Asset {
  id: number;
  site_id: number;
  asset_name: string;
  quantity: number;
  category?: string;
  condition?: string;
  detail?: string;
  remark?: string;
  site_name?: string;
}

export function MasterAssetPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [condition, setCondition] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadSites();
    loadAssets();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [siteId, category, condition]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (siteId) params.site_id = siteId;
      if (category) params.category = category;
      if (condition) params.condition = condition;

      const response = await api.get("/assets", { params });
      setAssets(response.data);
    } catch (err: any) {
      console.error("Failed to load assets:", err);
      setError(err.response?.data?.detail || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/assets/${id}`);
      await loadAssets();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete asset");
    }
  };

  // Get unique categories and conditions for filters
  const categories = Array.from(new Set(assets.map(a => a.category).filter(Boolean))) as string[];
  const conditions = Array.from(new Set(assets.map(a => a.condition).filter(Boolean))) as string[];

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Asset Management</h1>
        <button
          onClick={() => navigate("/supervisor/master/asset/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create Asset
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category || ""}
              onChange={(e) => setCategory(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Condition</label>
            <select
              value={condition || ""}
              onChange={(e) => setCondition(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Conditions</option>
              {conditions.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
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

      <DashboardCard title="Assets">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No assets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Asset Name</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Site</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Quantity</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Condition</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{asset.asset_name}</td>
                    <td className="py-2 px-3">{asset.site_name || "-"}</td>
                    <td className="py-2 px-3">{asset.quantity}</td>
                    <td className="py-2 px-3">{asset.category || "-"}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        asset.condition === "Good" ? "bg-green-100 text-green-800" :
                        asset.condition === "Fair" ? "bg-yellow-100 text-yellow-800" :
                        asset.condition === "Poor" || asset.condition === "Damaged" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {asset.condition || "-"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/supervisor/master/asset/${asset.id}/edit`)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id, asset.asset_name)}
                          className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                        >
                          Delete
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

