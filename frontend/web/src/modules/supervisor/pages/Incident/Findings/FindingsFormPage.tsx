// frontend/web/src/modules/supervisor/pages/Incident/Findings/FindingsFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface FindingsFormData {
  site_id: number;                    // Required
  incident_date: string;              // Required (date format: YYYY-MM-DD)
  title: string;                      // Required
  description?: string;
  location?: string;
  finding_category?: string;         // Safety, Security, Compliance, etc.
  severity_level?: string;           // LOW, MEDIUM, HIGH, CRITICAL
  root_cause?: string;
  corrective_action?: string;
  preventive_action?: string;
  responsible_party?: string;
  due_date?: string;                 // date format: YYYY-MM-DD
}

export function FindingsFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FindingsFormData>({
    site_id: 0,
    incident_date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
    location: "",
    finding_category: "",
    severity_level: "",
    root_cause: "",
    corrective_action: "",
    preventive_action: "",
    responsible_party: "",
    due_date: "",
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
      const response = await api.get(`/api/v1/incidents/findings/${id}`);
      const report = response.data;
      setFormData({
        site_id: report.site_id,
        incident_date: report.incident_date,
        title: report.title || "",
        description: report.description || "",
        location: report.location || "",
        finding_category: report.finding_category || "",
        severity_level: report.severity_level || "",
        root_cause: report.root_cause || "",
        corrective_action: report.corrective_action || "",
        preventive_action: report.preventive_action || "",
        responsible_party: report.responsible_party || "",
        due_date: report.due_date || "",
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
        description: formData.description || null,
        location: formData.location || null,
        finding_category: formData.finding_category || null,
        severity_level: formData.severity_level || null,
        root_cause: formData.root_cause || null,
        corrective_action: formData.corrective_action || null,
        preventive_action: formData.preventive_action || null,
        responsible_party: formData.responsible_party || null,
        due_date: formData.due_date || null,
      };

      if (isEdit && id) {
        await api.patch(`/api/v1/incidents/findings/${id}`, payload);
      } else {
        await api.post("/incidents/findings", payload);
      }
      navigate("/supervisor/incident/findings");
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
          {isEdit ? "Edit Findings Report" : "Create Findings Report"}
        </h1>
        <button
          onClick={() => navigate("/supervisor/incident/findings")}
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

            <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finding Category
              </label>
              <select
                value={formData.finding_category}
                onChange={(e) =>
                  setFormData({ ...formData, finding_category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              >
                <option value="">Select Category</option>
                <option value="Safety">Safety</option>
                <option value="Security">Security</option>
                <option value="Compliance">Compliance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity Level
              </label>
              <select
                value={formData.severity_level}
                onChange={(e) =>
                  setFormData({ ...formData, severity_level: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              >
                <option value="">Select Severity</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
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

        <DashboardCard title="Analysis & Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Root Cause
              </label>
              <textarea
                value={formData.root_cause}
                onChange={(e) =>
                  setFormData({ ...formData, root_cause: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Corrective Action
              </label>
              <textarea
                value={formData.corrective_action}
                onChange={(e) =>
                  setFormData({ ...formData, corrective_action: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preventive Action
              </label>
              <textarea
                value={formData.preventive_action}
                onChange={(e) =>
                  setFormData({ ...formData, preventive_action: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsible Party
              </label>
              <input
                type="text"
                value={formData.responsible_party}
                onChange={(e) =>
                  setFormData({ ...formData, responsible_party: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
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
            onClick={() => navigate("/supervisor/incident/findings")}
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

