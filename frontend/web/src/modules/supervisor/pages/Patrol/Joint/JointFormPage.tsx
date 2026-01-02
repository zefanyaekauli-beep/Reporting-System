// frontend/web/src/modules/supervisor/pages/Patrol/Joint/JointFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  createJointPatrol, 
  updateJointPatrol, 
  getJointPatrol,
  JointPatrolCreate,
  JointPatrolUpdate 
} from "../../../../../api/patrolApi";
import { listSites, Site, getOfficers, Officer } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

const ROUTE_OPTIONS = [
  "Main Gate Area",
  "Perimeter Fence",
  "Parking Lot",
  "Building A",
  "Building B",
  "Warehouse Area",
  "Loading Dock",
  "Emergency Exits",
  "Server Room",
  "Executive Floor",
];

export function JointFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [sites, setSites] = useState<Site[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<JointPatrolCreate>({
    site_id: 0,
    title: "",
    description: "",
    route: "",
    scheduled_start: new Date().toISOString().slice(0, 16),
    scheduled_end: "",
    lead_officer_id: 0,
    participant_ids: [],
    notes: "",
  });

  useEffect(() => {
    loadSites();
    loadOfficers();
    if (isEdit && id) {
      loadJointPatrol();
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

  const loadJointPatrol = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const jp = await getJointPatrol(parseInt(id));
      setFormData({
        site_id: jp.site_id,
        title: jp.title,
        description: jp.description || "",
        route: jp.route || "",
        scheduled_start: jp.scheduled_start.slice(0, 16),
        scheduled_end: jp.scheduled_end?.slice(0, 16) || "",
        lead_officer_id: jp.lead_officer_id,
        participant_ids: jp.participant_ids || [],
        notes: jp.notes || "",
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load joint patrol");
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
        const updateData: JointPatrolUpdate = {
          title: formData.title,
          description: formData.description,
          route: formData.route,
          scheduled_start: formData.scheduled_start,
          scheduled_end: formData.scheduled_end || undefined,
          lead_officer_id: formData.lead_officer_id,
          participant_ids: formData.participant_ids,
          notes: formData.notes,
        };
        await updateJointPatrol(parseInt(id), updateData);
      } else {
        await createJointPatrol(formData);
      }
      navigate("/supervisor/patrol/joint");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save joint patrol");
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantToggle = (officerId: number) => {
    setFormData(prev => {
      const current = prev.participant_ids || [];
      if (current.includes(officerId)) {
        return { ...prev, participant_ids: current.filter(id => id !== officerId) };
      } else {
        return { ...prev, participant_ids: [...current, officerId] };
      }
    });
  };

  const getOfficerName = (officerId: number) => {
    const officer = officers.find(o => o.id === officerId);
    return officer ? officer.name : `Officer ${officerId}`;
  };

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">
          {isEdit ? "Edit Joint Patrol" : "Create Joint Patrol"}
        </h1>
        <button
          onClick={() => navigate("/supervisor/patrol/joint")}
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
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., Night Perimeter Patrol"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Site *</label>
              <select
                required
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Route/Area</label>
              <select
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select Route</option>
                {ROUTE_OPTIONS.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
                <option value="custom">Other (Custom)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Brief description of the patrol objectives..."
              />
            </div>
          </div>
        </DashboardCard>

        {/* Schedule */}
        <DashboardCard title="Schedule">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.scheduled_start}
                onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="datetime-local"
                value={formData.scheduled_end}
                onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </DashboardCard>

        {/* Team Assignment */}
        <DashboardCard title="Team Assignment">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lead Officer *</label>
              <select
                required
                value={formData.lead_officer_id}
                onChange={(e) => setFormData({ ...formData, lead_officer_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="0">Select Lead Officer</option>
                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name} ({officer.badge_id}) - {officer.position || officer.division}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Participants * (Select at least 1 more officer)
              </label>
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {officers
                  .filter(o => o.id !== formData.lead_officer_id)
                  .map((officer) => (
                    <label
                      key={officer.id}
                      className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 ${
                        formData.participant_ids.includes(officer.id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.participant_ids.includes(officer.id)}
                        onChange={() => handleParticipantToggle(officer.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{officer.name}</div>
                        <div className="text-xs text-gray-500">
                          {officer.badge_id} • {officer.position || officer.division}
                        </div>
                      </div>
                    </label>
                  ))}
              </div>
              {formData.participant_ids.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Selected: {formData.participant_ids.length} participant(s)
                </div>
              )}
            </div>
          </div>
        </DashboardCard>

        {/* Notes */}
        <DashboardCard title="Additional Notes">
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Special instructions, equipment needed, etc..."
          />
        </DashboardCard>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || formData.participant_ids.length === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : isEdit ? "Update Joint Patrol" : "Create Joint Patrol"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/supervisor/patrol/joint")}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

