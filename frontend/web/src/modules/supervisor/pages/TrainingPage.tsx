// frontend/web/src/modules/supervisor/pages/TrainingPage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import {
  listTrainings,
  createTraining,
  updateTraining,
  deleteTraining,
  registerForTraining,
  listTrainingAttendances,
  Training,
  TrainingCreate,
  TrainingAttendance,
} from "../../../api/trainingApi";
import { listSites, Site } from "../../../api/supervisorApi";

export function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [attendances, setAttendances] = useState<TrainingAttendance[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [formData, setFormData] = useState<TrainingCreate>({
    site_id: undefined,
    title: "",
    description: "",
    category: "",
    scheduled_date: new Date().toISOString(),
    duration_minutes: 60,
    location: "",
    max_participants: 20,
    division: "",
  });

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {};
      if (selectedSiteId) params.site_id = selectedSiteId;
      if (selectedDivision) params.division = selectedDivision;

      const [trainingsData, sitesData] = await Promise.all([
        listTrainings(params),
        listSites(),
      ]);

      setTrainings(trainingsData);
      setSites(sitesData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to load trainings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId, selectedDivision]);

  useEffect(() => {
    if (selectedTrainingId) {
      loadAttendances(selectedTrainingId);
    }
  }, [selectedTrainingId]);

  const loadAttendances = async (trainingId: number) => {
    try {
      const data = await listTrainingAttendances(trainingId);
      setAttendances(data);
    } catch (err: any) {
      console.error("Failed to load attendances:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTraining(editingId, formData);
      } else {
        await createTraining(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        site_id: undefined,
        title: "",
        description: "",
        category: "",
        scheduled_date: new Date().toISOString(),
        duration_minutes: 60,
        location: "",
        max_participants: 20,
        division: "",
      });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to save training");
    }
  };

  const handleEdit = (training: Training) => {
    setEditingId(training.id);
    setFormData({
      site_id: training.site_id || undefined,
      title: training.title,
      description: training.description || "",
      category: training.category || "",
      scheduled_date: training.scheduled_date,
      duration_minutes: training.duration_minutes || 60,
      location: training.location || "",
      max_participants: training.max_participants || 20,
      division: training.division || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this training?")) return;
    try {
      await deleteTraining(id);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to delete training");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return theme.colors.success;
      case "ONGOING":
        return theme.colors.info;
      case "SCHEDULED":
        return theme.colors.warning;
      case "CANCELLED":
        return theme.colors.danger;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
            Training & Development
          </h1>
          <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
            Manage training sessions and track attendance
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 20px",
            borderRadius: theme.radius.button,
            backgroundColor: theme.colors.primary,
            color: "white",
            border: "none",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + New Training
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: theme.colors.danger + "20",
            border: `1px solid ${theme.colors.danger}`,
            color: theme.colors.danger,
            fontSize: 12,
            borderRadius: theme.radius.card,
            padding: "10px 12px",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          padding: 12,
          boxShadow: theme.shadowCard,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            Site
          </label>
          <select
            value={selectedSiteId || ""}
            onChange={(e) => setSelectedSiteId(e.target.value ? parseInt(e.target.value) : null)}
            style={{
              width: "100%",
              borderRadius: theme.radius.input,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          >
            <option value="">All Sites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            Division
          </label>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            style={{
              width: "100%",
              borderRadius: theme.radius.input,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          >
            <option value="">All Divisions</option>
            <option value="SECURITY">Security</option>
            <option value="CLEANING">Cleaning</option>
            <option value="DRIVER">Driver</option>
          </select>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 16,
            boxShadow: theme.shadowCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain, marginBottom: 8 }}>
              {editingId ? "Edit Training" : "Create Training"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Scheduled Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_date ? new Date(formData.scheduled_date).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: new Date(e.target.value).toISOString() })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_minutes || 60}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Max Participants
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_participants || 20}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 20 })}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  borderRadius: theme.radius.input,
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: theme.colors.textMain,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    site_id: undefined,
                    title: "",
                    description: "",
                    category: "",
                    scheduled_date: new Date().toISOString(),
                    duration_minutes: 60,
                    location: "",
                    max_participants: 20,
                    division: "",
                  });
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: theme.radius.button,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textMain,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  borderRadius: theme.radius.button,
                  backgroundColor: theme.colors.primary,
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trainings List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
          Loading...
        </div>
      ) : trainings.length === 0 ? (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 40,
            textAlign: "center",
            color: theme.colors.textMuted,
            boxShadow: theme.shadowCard,
          }}
        >
          No trainings found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {trainings.map((training) => (
            <div
              key={training.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                padding: 16,
                boxShadow: theme.shadowCard,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textMain, marginBottom: 4 }}>
                    {training.title}
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                    {new Date(training.scheduled_date).toLocaleString()}
                  </div>
                  {training.location && (
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                      Location: {training.location}
                    </div>
                  )}
                  {training.description && (
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                      {training.description}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: theme.radius.badge,
                      fontSize: 11,
                      fontWeight: 500,
                      backgroundColor: getStatusColor(training.status) + "20",
                      color: getStatusColor(training.status),
                    }}
                  >
                    {training.status}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => {
                        setSelectedTrainingId(training.id);
                        setShowAttendance(true);
                      }}
                      style={{
                        padding: "4px 8px",
                        borderRadius: theme.radius.button,
                        backgroundColor: theme.colors.info + "20",
                        color: theme.colors.info,
                        border: "none",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Attendance
                    </button>
                    <button
                      onClick={() => handleEdit(training)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: theme.radius.button,
                        backgroundColor: theme.colors.primary + "20",
                        color: theme.colors.primary,
                        border: "none",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(training.id)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: theme.radius.button,
                        backgroundColor: theme.colors.danger + "20",
                        color: theme.colors.danger,
                        border: "none",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Panel */}
      {showAttendance && selectedTrainingId && (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 16,
            boxShadow: theme.shadowCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain }}>
              Training Attendance
            </div>
            <button
              onClick={() => {
                setShowAttendance(false);
                setSelectedTrainingId(null);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: theme.radius.button,
                backgroundColor: theme.colors.background,
                color: theme.colors.textMain,
                border: `1px solid ${theme.colors.border}`,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>

          {attendances.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: theme.colors.textMuted }}>
              No attendance records found
            </div>
          ) : (
            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                overflow: "hidden",
                boxShadow: theme.shadowCard,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: theme.colors.background, borderBottom: `1px solid ${theme.colors.border}` }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                      Participant
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                      Status
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                      Registered
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                      Attended
                    </th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance, idx) => (
                    <tr
                      key={attendance.id}
                      style={{
                        borderBottom: `1px solid ${theme.colors.border}`,
                        backgroundColor: idx % 2 === 0 ? theme.colors.surface : theme.colors.background,
                      }}
                    >
                      <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain }}>
                        {attendance.user_name || `User ${attendance.user_id}`}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: theme.radius.badge,
                            fontSize: 11,
                            fontWeight: 500,
                            backgroundColor: attendance.attendance_status === "ATTENDED" ? theme.colors.success + "20" : theme.colors.warning + "20",
                            color: attendance.attendance_status === "ATTENDED" ? theme.colors.success : theme.colors.warning,
                          }}
                        >
                          {attendance.attendance_status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                        {new Date(attendance.registered_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                        {attendance.attended_at ? new Date(attendance.attended_at).toLocaleString() : "-"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontSize: 13, color: theme.colors.textMain }}>
                        {attendance.score !== null && attendance.score !== undefined ? attendance.score : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

