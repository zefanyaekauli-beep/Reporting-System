// frontend/web/src/modules/supervisor/pages/Patrol/Report/ReportFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  createPatrolReport, 
  updatePatrolReport, 
  getPatrolReport,
  PatrolReportCreate,
  PatrolReportUpdate 
} from "../../../../../api/patrolApi";
import { listSites, Site, getOfficers, Officer } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

const PATROL_TYPES = [
  { value: "ROUTINE", label: "Routine Patrol" },
  { value: "EMERGENCY", label: "Emergency Response" },
  { value: "SPECIAL", label: "Special Assignment" },
];

const SHIFTS = [
  { value: "MORNING", label: "Morning (06:00 - 14:00)" },
  { value: "AFTERNOON", label: "Afternoon (14:00 - 22:00)" },
  { value: "NIGHT", label: "Night (22:00 - 06:00)" },
];

const AREA_OPTIONS = [
  "Main Gate",
  "Perimeter",
  "Parking Area",
  "Building A",
  "Building B",
  "Warehouse",
  "Office Floor",
  "Emergency Exits",
  "Server Room",
  "Loading Dock",
];

export function ReportFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [sites, setSites] = useState<Site[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toISOString().slice(11, 16);

  const [formData, setFormData] = useState<PatrolReportCreate>({
    site_id: 0,
    report_date: today + "T" + nowTime,
    shift: "MORNING",
    officer_id: 0,
    patrol_type: "ROUTINE",
    area_covered: "",
    start_time: today + "T" + nowTime,
    end_time: "",
    summary: "",
    findings: "",
    recommendations: "",
    photos: [],
  });

  useEffect(() => {
    loadSites();
    loadOfficers();
    if (isEdit && id) {
      loadReport();
    }
  }, [id, isEdit]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadOfficers = async () => {
    try {
      const data = await getOfficers();
      setOfficers(data);
    } catch (err) {
      console.error("Failed to load officers:", err);
    }
  };

  const loadReport = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const report = await getPatrolReport(parseInt(id));
      setFormData({
        site_id: report.site_id,
        report_date: report.report_date.slice(0, 16),
        shift: report.shift,
        officer_id: report.officer_id,
        patrol_type: report.patrol_type,
        area_covered: report.area_covered || "",
        start_time: report.start_time.slice(0, 16),
        end_time: report.end_time?.slice(0, 16) || "",
        summary: report.summary || "",
        findings: report.findings || "",
        recommendations: report.recommendations || "",
        photos: report.photos || [],
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
      if (isEdit && id) {
        const updateData: PatrolReportUpdate = {
          area_covered: formData.area_covered,
          start_time: formData.start_time,
          end_time: formData.end_time || undefined,
          summary: formData.summary,
          findings: formData.findings,
          recommendations: formData.recommendations,
          photos: formData.photos,
        };
        await updatePatrolReport(parseInt(id), updateData);
      } else {
        await createPatrolReport(formData);
      }
      navigate("/supervisor/patrol/report");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">
          {isEdit ? "Edit Patrol Report" : "Create Patrol Report"}
        </h1>
        <button
          onClick={() => navigate("/supervisor/patrol/report")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
        {/* Basic Information */}
        <DashboardCard title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Site *</label>
              <select
                required
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={isEdit}
              >
                <option value="0">Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Officer *</label>
              <select
                required
                value={formData.officer_id}
                onChange={(e) => setFormData({ ...formData, officer_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={isEdit}
              >
                <option value="0">Select Officer</option>
                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name} ({officer.badge_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Report Date *</label>
              <input
                type="datetime-local"
                required
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={isEdit}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shift *</label>
              <select
                required
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={isEdit}
              >
                {SHIFTS.map((shift) => (
                  <option key={shift.value} value={shift.value}>
                    {shift.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Patrol Type *</label>
              <select
                required
                value={formData.patrol_type}
                onChange={(e) => setFormData({ ...formData, patrol_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={isEdit}
              >
                {PATROL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Area Covered</label>
              <select
                value={formData.area_covered}
                onChange={(e) => setFormData({ ...formData, area_covered: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select Area</option>
                {AREA_OPTIONS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </DashboardCard>

        {/* Time */}
        <DashboardCard title="Patrol Time">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </DashboardCard>

        {/* Report Content */}
        <DashboardCard title="Report Content">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Summary</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Brief summary of the patrol..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Findings</label>
              <textarea
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="What was observed during the patrol..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Recommendations</label>
              <textarea
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Suggested actions or improvements..."
              />
            </div>
          </div>
        </DashboardCard>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : isEdit ? "Update Report" : "Create Report"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/supervisor/patrol/report")}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

