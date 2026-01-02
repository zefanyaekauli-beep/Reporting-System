// frontend/web/src/modules/supervisor/pages/Incident/BAP/BAPFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface BAPFormData {
  site_id: number;
  incident_date: string;
  title: string;
  description?: string;
  location?: string;
  investigation_date?: string;
  investigator_name?: string;
  subject_name?: string;
  subject_id_number?: string;
  investigation_findings?: string;
  recommendations?: string;
  related_incident_id?: number;
}

export function BAPFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<BAPFormData>({
    site_id: 0,
    incident_date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
    location: "",
    investigation_date: "",
    investigator_name: "",
    subject_name: "",
    subject_id_number: "",
    investigation_findings: "",
    recommendations: "",
    related_incident_id: undefined,
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
      const response = await api.get(`/api/v1/incidents/bap/${id}`);
      const report = response.data;
      setFormData({
        site_id: report.site_id,
        incident_date: report.incident_date,
        title: report.title || "",
        description: report.description || "",
        location: report.location || "",
        investigation_date: report.investigation_date || "",
        investigator_name: report.investigator_name || "",
        subject_name: report.subject_name || "",
        subject_id_number: report.subject_id_number || "",
        investigation_findings: report.investigation_findings || "",
        recommendations: report.recommendations || "",
        related_incident_id: report.related_incident_id,
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
      const payload: any = {
        site_id: formData.site_id,
        incident_date: formData.incident_date,
        title: formData.title,
        description: formData.description || null,
        location: formData.location || null,
        investigation_date: formData.investigation_date || null,
        investigator_name: formData.investigator_name || null,
        subject_name: formData.subject_name || null,
        subject_id_number: formData.subject_id_number || null,
        investigation_findings: formData.investigation_findings || null,
        recommendations: formData.recommendations || null,
        related_incident_id: formData.related_incident_id || null,
      };

      if (isEdit && id) {
        // Note: Update endpoint may need to be added to backend
        await api.patch(`/api/v1/incidents/bap/${id}`, payload);
      } else {
        await api.post("/incidents/bap", payload);
      }
      navigate("/supervisor/incident/bap");
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
          {isEdit ? "Edit BAP Report" : "Create BAP Report"}
        </h1>
        <button
          onClick={() => navigate("/supervisor/incident/bap")}
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
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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

        <DashboardCard title="Investigation Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investigation Date
              </label>
              <input
                type="date"
                value={formData.investigation_date}
                onChange={(e) =>
                  setFormData({ ...formData, investigation_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investigator Name
              </label>
              <input
                type="text"
                value={formData.investigator_name}
                onChange={(e) =>
                  setFormData({ ...formData, investigator_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Subject Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Name
              </label>
              <input
                type="text"
                value={formData.subject_name}
                onChange={(e) =>
                  setFormData({ ...formData, subject_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject ID Number
              </label>
              <input
                type="text"
                value={formData.subject_id_number}
                onChange={(e) =>
                  setFormData({ ...formData, subject_id_number: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Findings & Recommendations">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investigation Findings
              </label>
              <textarea
                value={formData.investigation_findings}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    investigation_findings: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recommendations
              </label>
              <textarea
                value={formData.recommendations}
                onChange={(e) =>
                  setFormData({ ...formData, recommendations: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate("/supervisor/incident/bap")}
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

