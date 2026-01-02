// frontend/web/src/modules/supervisor/pages/Incident/STPLK/STPLKFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface STPLKFormData {
  site_id: number;                    // Required
  incident_date: string;              // Required (date format: YYYY-MM-DD)
  title: string;                      // Required
  lost_item_description: string;      // Required
  lost_item_value?: string;
  lost_date?: string;                 // date format: YYYY-MM-DD
  lost_location?: string;
  owner_name?: string;
  owner_contact?: string;
  police_report_number?: string;
  description?: string;
}

export function STPLKFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<STPLKFormData>({
    site_id: 0,
    incident_date: new Date().toISOString().split("T")[0],
    title: "",
    lost_item_description: "",
    lost_item_value: "",
    lost_date: "",
    lost_location: "",
    owner_name: "",
    owner_contact: "",
    police_report_number: "",
    description: "",
  });

  useEffect(() => {
    loadSites();
    if (isEdit && id) {
      loadReport();
    }
  }, [id, isEdit]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
      if (data.length > 0 && !isEdit) {
        setFormData((prev) => ({ ...prev, site_id: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadReport = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/incidents/stplk/${id}`);
      const report = response.data;
      setFormData({
        site_id: report.site_id,
        incident_date: report.incident_date,
        title: report.title || "",
        lost_item_description: report.lost_item_description || "",
        lost_item_value: report.lost_item_value || "",
        lost_date: report.lost_date || "",
        lost_location: report.lost_location || "",
        owner_name: report.owner_name || "",
        owner_contact: report.owner_contact || "",
        police_report_number: report.police_report_number || "",
        description: report.description || "",
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        site_id: formData.site_id,
        incident_date: formData.incident_date,
        title: formData.title,
        lost_item_description: formData.lost_item_description,
        lost_item_value: formData.lost_item_value || null,
        lost_date: formData.lost_date || null,
        lost_location: formData.lost_location || null,
        owner_name: formData.owner_name || null,
        owner_contact: formData.owner_contact || null,
        police_report_number: formData.police_report_number || null,
        description: formData.description || null,
      };

      if (isEdit && id) {
        await api.patch(`/api/v1/incidents/stplk/${id}`, payload);
      } else {
        await api.post("/incidents/stplk", payload);
      }
      navigate("/supervisor/incident/stplk");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">
          {isEdit ? "Edit STPLK Report" : "Create STPLK Report"}
        </h1>
        <button
          onClick={() => navigate("/supervisor/incident/stplk")}
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
        <DashboardCard title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.site_id}
                onChange={(e) =>
                  setFormData({ ...formData, site_id: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading || isEdit}
              >
                <option value={0}>Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.incident_date}
                onChange={(e) =>
                  setFormData({ ...formData, incident_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading || isEdit}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lost Item Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.lost_item_description}
                onChange={(e) =>
                  setFormData({ ...formData, lost_item_description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                required
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Lost Item Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lost Item Value
              </label>
              <input
                type="text"
                value={formData.lost_item_value}
                onChange={(e) =>
                  setFormData({ ...formData, lost_item_value: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lost Date
              </label>
              <input
                type="date"
                value={formData.lost_date}
                onChange={(e) =>
                  setFormData({ ...formData, lost_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lost Location
              </label>
              <input
                type="text"
                value={formData.lost_location}
                onChange={(e) =>
                  setFormData({ ...formData, lost_location: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Owner Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Name
              </label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) =>
                  setFormData({ ...formData, owner_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Contact
              </label>
              <input
                type="text"
                value={formData.owner_contact}
                onChange={(e) =>
                  setFormData({ ...formData, owner_contact: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Police Report">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Police Report Number
              </label>
              <input
                type="text"
                value={formData.police_report_number}
                onChange={(e) =>
                  setFormData({ ...formData, police_report_number: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate("/supervisor/incident/stplk")}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : isEdit ? "Update Report" : "Create Report"}
          </button>
        </div>
      </form>
    </div>
  );
}

