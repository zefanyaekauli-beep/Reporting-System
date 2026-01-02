// frontend/web/src/modules/supervisor/pages/Master/Worker/WorkerFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface WorkerFormData {
  username: string;
  password?: string;
  division?: string;
  role: string;
  site_id?: number;
  scope_type?: string;
  scope_id?: number;
}

export function WorkerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [sites, setSites] = useState<Site[]>([]);
  const [formData, setFormData] = useState<WorkerFormData>({
    username: "",
    password: "",
    division: "",
    role: "FIELD",
    site_id: undefined,
    scope_type: undefined,
    scope_id: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSites();
    if (isEdit && id) {
      loadWorker();
    }
  }, [id]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    } finally {
      setLoadingSites(false);
    }
  };

  const loadWorker = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/master/worker/${id}`);
      const worker = response.data;
      setFormData({
        username: worker.username,
        password: "", // Don't load password
        division: worker.division || "",
        role: worker.role,
        site_id: worker.site_id,
        scope_type: worker.scope_type || undefined,
        scope_id: worker.scope_id || undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load worker");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data - remove empty password on edit
      const submitData = { ...formData };
      if (isEdit && !submitData.password) {
        delete submitData.password;
      }

      if (isEdit) {
        await api.put(`/master/worker/${id}`, submitData);
      } else {
        if (!submitData.password) {
          setError("Password is required for new worker");
          setLoading(false);
          return;
        }
        await api.post("/master/worker", submitData);
      }
      navigate("/supervisor/master/worker");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save worker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">
          {isEdit ? "Edit Worker" : "Create Worker"}
        </h1>
        <button
          onClick={() => navigate("/supervisor/master/worker")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <DashboardCard title="Worker Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
                placeholder="Username for login"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required={!isEdit}
                disabled={loading}
                placeholder={isEdit ? "Leave blank to keep current" : "Password"}
              />
              {isEdit && (
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank to keep current password
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              >
                <option value="FIELD">Field Worker</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division {formData.role === "FIELD" && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
                required={formData.role === "FIELD"}
              >
                <option value="">Select Division</option>
                <option value="SECURITY">Security</option>
                <option value="CLEANING">Cleaning</option>
                <option value="DRIVER">Driver</option>
                <option value="PARKING">Parking</option>
              </select>
              {formData.role === "FIELD" && (
                <p className="mt-1 text-xs text-gray-500">
                  Division is required for Field Workers
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site
              </label>
              <select
                value={formData.site_id || ""}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading || loadingSites}
              >
                <option value="">Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scope Type <span className="text-xs text-gray-500">(For Supervisors)</span>
              </label>
              <select
                value={formData.scope_type || ""}
                onChange={(e) => setFormData({ ...formData, scope_type: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              >
                <option value="">None</option>
                <option value="DIVISION">Division</option>
                <option value="SITE">Site</option>
                <option value="COMPANY">Company</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scope ID <span className="text-xs text-gray-500">(Depends on Scope Type)</span>
              </label>
              <input
                type="number"
                value={formData.scope_id || ""}
                onChange={(e) => setFormData({ ...formData, scope_id: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
                placeholder="e.g., Site ID, Division Code"
              />
            </div>
          </div>
        </DashboardCard>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate("/supervisor/master/worker")}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || loadingSites}
          >
            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

