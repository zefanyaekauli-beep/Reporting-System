// frontend/web/src/modules/supervisor/pages/Incident/LKLP/LKLPFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface LKLPFormData {
  site_id: number;
  incident_date: string;
  title: string;
  description?: string;
  location?: string;
  police_report_number?: string;
  police_station?: string;
  perpetrator_name?: string;
  perpetrator_details?: string;
  witness_names: string[];
  damage_estimate?: string;
  follow_up_required: boolean;
  evidence_files?: File[];
}

export function LKLPFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<LKLPFormData>({
    site_id: 0,
    incident_date: new Date().toISOString().split("T")[0],
    title: "",
    description: "",
    location: "",
    police_report_number: "",
    police_station: "",
    perpetrator_name: "",
    perpetrator_details: "",
    witness_names: [],
    damage_estimate: "",
    follow_up_required: false,
    evidence_files: [],
  });

  const [newWitness, setNewWitness] = useState("");

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
      const response = await api.get(`/api/v1/incidents/lk-lp/${id}`);
      const report = response.data;
      setFormData({
        site_id: report.site_id,
        incident_date: report.incident_date,
        title: report.title || "",
        description: report.description || "",
        location: report.location || "",
        police_report_number: report.police_report_number || "",
        police_station: report.police_station || "",
        perpetrator_name: report.perpetrator_name || "",
        perpetrator_details: report.perpetrator_details || "",
        witness_names: report.witness_names || [],
        damage_estimate: report.damage_estimate || "",
        follow_up_required: report.follow_up_required || false,
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
        police_report_number: formData.police_report_number || null,
        police_station: formData.police_station || null,
        perpetrator_name: formData.perpetrator_name || null,
        perpetrator_details: formData.perpetrator_details || null,
        witness_names: formData.witness_names.length > 0 ? formData.witness_names : null,
        damage_estimate: formData.damage_estimate || null,
        follow_up_required: formData.follow_up_required,
      };

      if (isEdit && id) {
        await api.patch(`/api/v1/incidents/lk-lp/${id}`, payload);
      } else {
        await api.post("/incidents/lk-lp", payload);
      }
      navigate("/supervisor/incident/lk-lp");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save report");
    } finally {
      setLoading(false);
    }
  };

  const addWitness = () => {
    if (newWitness.trim()) {
      setFormData({
        ...formData,
        witness_names: [...formData.witness_names, newWitness.trim()],
      });
      setNewWitness("");
    }
  };

  const removeWitness = (index: number) => {
    setFormData({
      ...formData,
      witness_names: formData.witness_names.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">
          {isEdit ? "Edit LK/LP Report" : "Create LK/LP Report"}
        </h1>
        <button
          onClick={() => navigate("/supervisor/incident/lk-lp")}
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

        <DashboardCard title="Police Report Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Police Report Number
              </label>
              <input
                type="text"
                value={formData.police_report_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    police_report_number: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Police Station
              </label>
              <input
                type="text"
                value={formData.police_station}
                onChange={(e) =>
                  setFormData({ ...formData, police_station: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Perpetrator Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perpetrator Name
              </label>
              <input
                type="text"
                value={formData.perpetrator_name}
                onChange={(e) =>
                  setFormData({ ...formData, perpetrator_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Damage Estimate
              </label>
              <input
                type="text"
                value={formData.damage_estimate}
                onChange={(e) =>
                  setFormData({ ...formData, damage_estimate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perpetrator Details
              </label>
              <textarea
                value={formData.perpetrator_details}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    perpetrator_details: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Witnesses">
          <div className="space-y-2">
            {formData.witness_names.map((witness, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <span className="flex-1">{witness}</span>
                <button
                  type="button"
                  onClick={() => removeWitness(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newWitness}
                onChange={(e) => setNewWitness(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addWitness();
                  }
                }}
                placeholder="Enter witness name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
              <button
                type="button"
                onClick={addWitness}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                Add
              </button>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Follow-up">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.follow_up_required}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  follow_up_required: e.target.checked,
                })
              }
              className="rounded"
              disabled={loading}
            />
            <label className="text-sm font-medium text-gray-700">
              Follow-up Required
            </label>
          </div>
        </DashboardCard>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate("/supervisor/incident/lk-lp")}
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

