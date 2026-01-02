// frontend/web/src/modules/supervisor/pages/Reporting/DAR/DARFormPage.tsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createDAR, updateDAR, getDAR, uploadDARPhoto, DailyActivityReportCreate, DailyActivityReportUpdate } from "../../../../../services/darService";
import { listSites, Site, getOfficers, Officer } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { SmartDropdown } from "../../../../shared/components/ui/SmartDropdown";
import { DARActivity, DARPersonnel } from "../../../../../types/dar";

// Predefined options
const ROLE_OPTIONS = [
  { value: "Guard", label: "Guard" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "Team Leader", label: "Team Leader" },
  { value: "Security Manager", label: "Security Manager" },
  { value: "Patrol Officer", label: "Patrol Officer" },
  { value: "Gate Keeper", label: "Gate Keeper" },
];

const ACTIVITY_TYPE_OPTIONS = [
  { value: "Patrol", label: "Patrol" },
  { value: "Incident", label: "Incident" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Visitor", label: "Visitor Check" },
  { value: "Meeting", label: "Meeting" },
  { value: "Handover", label: "Handover" },
  { value: "Inspection", label: "Inspection" },
  { value: "Training", label: "Training" },
  { value: "Emergency", label: "Emergency Response" },
];

const WEATHER_OPTIONS = [
  { value: "Sunny", label: "☀️ Sunny" },
  { value: "Cloudy", label: "☁️ Cloudy" },
  { value: "Rainy", label: "🌧️ Rainy" },
  { value: "Stormy", label: "⛈️ Stormy" },
  { value: "Windy", label: "💨 Windy" },
  { value: "Foggy", label: "🌫️ Foggy" },
];

export function DARFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [sites, setSites] = useState<Site[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<DailyActivityReportCreate>({
    site_id: 0,
    report_date: new Date().toISOString().split("T")[0],
    shift: "MORNING",
    weather: "",
    summary: "",
    handover_notes: "",
    personnel: [],
    activities: [],
  });

  const [newActivity, setNewActivity] = useState<DARActivity>({
    activity_time: "08:00",
    activity_type: "",
    description: "",
    location: "",
    photo_url: "",
  });

  const [newPersonnel, setNewPersonnel] = useState<DARPersonnel>({
    user_id: 0,
    role: "",
    check_in_time: "08:00",
  });

  // Generate location options from site
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    loadSites();
    loadOfficers();
    if (isEdit && id) {
      loadDAR();
    }
  }, [id, isEdit]);

  // Update location options when site changes
  useEffect(() => {
    if (formData.site_id) {
      const selectedSite = sites.find(s => s.id === formData.site_id);
      if (selectedSite) {
        // Generate default locations based on site
        const defaultLocations = [
          { value: "Main Gate", label: "Main Gate" },
          { value: "Back Gate", label: "Back Gate" },
          { value: "Lobby", label: "Lobby" },
          { value: "Parking Area", label: "Parking Area" },
          { value: "Office Building", label: "Office Building" },
          { value: "Warehouse", label: "Warehouse" },
          { value: "Perimeter", label: "Perimeter" },
          { value: `${selectedSite.name} - General`, label: `${selectedSite.name} - General` },
        ];
        setLocationOptions(defaultLocations);
      }
    }
  }, [formData.site_id, sites]);

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

  const loadDAR = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const dar = await getDAR(parseInt(id));
      setFormData({
        site_id: dar.site_id,
        report_date: dar.report_date,
        shift: dar.shift,
        weather: dar.weather || "",
        summary: dar.summary || "",
        handover_notes: dar.handover_notes || "",
        personnel: dar.personnel || [],
        activities: dar.activities || [],
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load DAR");
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
        const updateData: DailyActivityReportUpdate = {
          weather: formData.weather,
          summary: formData.summary,
          handover_notes: formData.handover_notes,
          personnel: formData.personnel,
          activities: formData.activities,
        };
        await updateDAR(parseInt(id), updateData);
      } else {
        await createDAR(formData);
      }
      navigate("/supervisor/reporting/dar");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save DAR");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const result = await uploadDARPhoto(file);
      setNewActivity(prev => ({ ...prev, photo_url: result.photo_url }));
    } catch (err: any) {
      console.error("Failed to upload photo:", err);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
      // Reset input
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  const removePhoto = () => {
    setNewActivity(prev => ({ ...prev, photo_url: "" }));
  };

  const addActivity = () => {
    if (!newActivity.activity_type || !newActivity.description) {
      alert("Activity type and description are required");
      return;
    }
    setFormData({
      ...formData,
      activities: [...formData.activities, { ...newActivity }],
    });
    setNewActivity({
      activity_time: "08:00",
      activity_type: "",
      description: "",
      location: "",
      photo_url: "",
    });
  };

  const removeActivity = (index: number) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index),
    });
  };

  const addPersonnel = () => {
    if (!newPersonnel.user_id) {
      alert("User is required");
      return;
    }
    setFormData({
      ...formData,
      personnel: [...formData.personnel, { ...newPersonnel }],
    });
    setNewPersonnel({
      user_id: 0,
      role: "",
      check_in_time: "08:00",
    });
  };

  const removePersonnel = (index: number) => {
    setFormData({
      ...formData,
      personnel: formData.personnel.filter((_, i) => i !== index),
    });
  };

  // Helper to get officer name by ID
  const getOfficerName = (userId: number) => {
    const officer = officers.find(o => o.id === userId);
    return officer ? `${officer.name} (${officer.badge_id})` : `User ${userId}`;
  };

  // Officer options for dropdown
  const officerOptions = officers.map(o => ({
    value: o.id,
    label: `${o.name} (${o.badge_id}) - ${o.position || o.division || "Staff"}`,
  }));

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">
          {isEdit ? "Edit DAR" : "Create DAR"}
        </h1>
        <button
          onClick={() => navigate("/supervisor/reporting/dar")}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Report Date *</label>
              <input
                type="date"
                required
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shift *</label>
              <select
                required
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="NIGHT">Night</option>
              </select>
            </div>
            <SmartDropdown
              label="Weather"
              value={formData.weather || ""}
              onChange={(val) => setFormData({ ...formData, weather: String(val) })}
              options={WEATHER_OPTIONS}
              placeholder="Select weather condition"
              allowOther={true}
              otherLabel="Other weather"
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Summary</label>
            <textarea
              value={formData.summary || ""}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Shift summary..."
            />
          </div>
        </DashboardCard>

        {/* Personnel */}
        <DashboardCard title="Personnel on Duty">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <SmartDropdown
                label="Personnel"
                value={newPersonnel.user_id || ""}
                onChange={(val) => setNewPersonnel({ ...newPersonnel, user_id: Number(val) || 0 })}
                options={officerOptions}
                placeholder="Select personnel..."
                required={false}
                allowOther={true}
                otherLabel="Enter User ID manually"
              />
              <SmartDropdown
                label="Role"
                value={newPersonnel.role || ""}
                onChange={(val) => setNewPersonnel({ ...newPersonnel, role: String(val) })}
                options={ROLE_OPTIONS}
                placeholder="Select role..."
                required={false}
                allowOther={true}
                otherLabel="Other role"
              />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Check-in Time</label>
                <input
                  type="time"
                  value={newPersonnel.check_in_time || ""}
                  onChange={(e) => setNewPersonnel({ ...newPersonnel, check_in_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addPersonnel}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Personnel
                </button>
              </div>
            </div>

            {formData.personnel.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Added Personnel ({formData.personnel.length})</h4>
                <div className="space-y-2">
                  {formData.personnel.map((person, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {getOfficerName(person.user_id).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {getOfficerName(person.user_id)}
                          </span>
                          <div className="text-xs text-gray-500">
                            {person.role || "No role"} • Check-in: {person.check_in_time}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePersonnel(index)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Activities */}
        <DashboardCard title="Activities">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newActivity.activity_time}
                    onChange={(e) => setNewActivity({ ...newActivity, activity_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <SmartDropdown
                  label="Activity Type"
                  value={newActivity.activity_type}
                  onChange={(val) => setNewActivity({ ...newActivity, activity_type: String(val) })}
                  options={ACTIVITY_TYPE_OPTIONS}
                  placeholder="Select type..."
                  required={false}
                  allowOther={true}
                  otherLabel="Other activity type"
                />
                <SmartDropdown
                  label="Location"
                  value={newActivity.location || ""}
                  onChange={(val) => setNewActivity({ ...newActivity, location: String(val) })}
                  options={locationOptions}
                  placeholder="Select location..."
                  required={false}
                  allowOther={true}
                  otherLabel="Other location"
                />
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Photo Attachment</label>
                  <div className="flex gap-2">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        newActivity.photo_url
                          ? "bg-green-50 border-green-300 text-green-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      } ${uploadingPhoto ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {uploadingPhoto ? (
                        "Uploading..."
                      ) : newActivity.photo_url ? (
                        "📷 Photo Added"
                      ) : (
                        "📷 Add Photo"
                      )}
                    </button>
                    {newActivity.photo_url && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Photo Preview */}
              {newActivity.photo_url && (
                <div className="mb-4">
                  <img
                    src={newActivity.photo_url}
                    alt="Activity preview"
                    className="max-h-32 rounded-lg border border-gray-200"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Describe the activity..."
                />
              </div>

              <button
                type="button"
                onClick={addActivity}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Activity
              </button>
            </div>

            {formData.activities.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Added Activities ({formData.activities.length})</h4>
                <div className="space-y-3">
                  {formData.activities.map((activity, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {activity.activity_time}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                              {activity.activity_type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">{activity.description}</div>
                          {activity.location && (
                            <div className="text-xs text-gray-500 mt-1">📍 {activity.location}</div>
                          )}
                          {activity.photo_url && (
                            <div className="mt-2">
                              <img
                                src={activity.photo_url}
                                alt="Activity evidence"
                                className="max-h-24 rounded border border-gray-200"
                              />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeActivity(index)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Handover Notes */}
        <DashboardCard title="Handover Notes">
          <textarea
            value={formData.handover_notes || ""}
            onChange={(e) => setFormData({ ...formData, handover_notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Notes for next shift..."
          />
        </DashboardCard>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : isEdit ? "Update DAR" : "Create DAR"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/supervisor/reporting/dar")}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
