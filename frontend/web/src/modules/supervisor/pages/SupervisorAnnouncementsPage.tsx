// frontend/web/src/modules/supervisor/pages/SupervisorAnnouncementsPage.tsx

import { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import { useToast } from "../../shared/components/Toast";
import {
  Announcement,
  AnnouncementCreatePayload,
  createAnnouncement,
  listAnnouncements,
  AnnouncementPriority,
  AnnouncementScope,
} from "../../../api/announcementApi";
import { listSites, Site } from "../../../api/supervisorApi";
import api from "../../../api/client";

export function SupervisorAnnouncementsPage() {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<AnnouncementCreatePayload>({
    title: "",
    message: "",
    priority: "info",
    scope: "all",
    division_ids: [],
    user_ids: [],
    require_ack: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annData, sitesData] = await Promise.all([
        listAnnouncements(),
        listSites(),
      ]);
      setAnnouncements(Array.isArray(annData) ? annData : []);
      setSites(Array.isArray(sitesData) ? sitesData : []);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      showToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate
      if (!formData.title.trim()) {
        showToast("Judul wajib diisi", "error");
        setSubmitting(false);
        return;
      }
      if (!formData.message.trim()) {
        showToast("Pesan wajib diisi", "error");
        setSubmitting(false);
        return;
      }
      if (formData.scope === "divisions" && (!formData.division_ids || formData.division_ids.length === 0)) {
        showToast("Pilih minimal satu divisi", "error");
        setSubmitting(false);
        return;
      }
      if (formData.scope === "users" && (!formData.user_ids || formData.user_ids.length === 0)) {
        showToast("Pilih minimal satu personel", "error");
        setSubmitting(false);
        return;
      }

      await createAnnouncement(formData);
      showToast("Pengumuman berhasil dibuat", "success");
      setShowCreateForm(false);
      setFormData({
        title: "",
        message: "",
        priority: "info",
        scope: "all",
        division_ids: [],
        user_ids: [],
        require_ack: false,
      });
      await loadData();
    } catch (err: any) {
      console.error("Failed to create announcement:", err);
      showToast(err.response?.data?.detail || "Gagal membuat pengumuman", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return theme.colors.danger;
      case "warning":
        return theme.colors.warning;
      case "info":
      default:
        return theme.colors.primary;
    }
  };

  const divisionMap: Record<number, string> = {
    1: "Security",
    2: "Cleaning",
    3: "Parking",
    4: "Driver",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textMain, margin: 0 }}>
            Pengumuman
          </h2>
          <p style={{ fontSize: 12, color: theme.colors.textMuted, margin: "4px 0 0 0" }}>
            Kelola pengumuman untuk semua personel
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: "8px 16px",
            borderRadius: theme.radius.card,
            border: "none",
            backgroundColor: theme.colors.primary,
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Buat Pengumuman
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowCreateForm(false)}
        >
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: 20,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: theme.shadowCard,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Buat Pengumuman Baru
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Judul *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: theme.radius.card,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Pesan *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: theme.radius.card,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                    resize: "vertical",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Prioritas
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: theme.radius.card,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Target
                </label>
                <select
                  value={formData.scope}
                  onChange={(e) => {
                    const scope = e.target.value as AnnouncementScope;
                    setFormData({
                      ...formData,
                      scope,
                      division_ids: scope !== "divisions" ? [] : formData.division_ids,
                      user_ids: scope !== "users" ? [] : formData.user_ids,
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: theme.radius.card,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="all">Semua Personel</option>
                  <option value="divisions">Per Divisi</option>
                  <option value="users">Personel Tertentu</option>
                </select>
              </div>

              {formData.scope === "divisions" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                    Pilih Divisi *
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.entries(divisionMap).map(([id, name]) => (
                      <label
                        key={id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.division_ids?.includes(Number(id)) || false}
                          onChange={(e) => {
                            const divId = Number(id);
                            const current = formData.division_ids || [];
                            if (e.target.checked) {
                              setFormData({ ...formData, division_ids: [...current, divId] });
                            } else {
                              setFormData({
                                ...formData,
                                division_ids: current.filter((d) => d !== divId),
                              });
                            }
                          }}
                        />
                        <span>{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.scope === "users" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                    Pilih Personel *
                  </label>
                  <div style={{ fontSize: 11, color: theme.colors.textSoft, marginBottom: 8 }}>
                    (Fitur ini memerlukan endpoint untuk list users - TODO)
                  </div>
                  <input
                    type="text"
                    placeholder="Masukkan user IDs (contoh: 1,2,3)"
                    value={formData.user_ids?.join(",") || ""}
                    onChange={(e) => {
                      const ids = e.target.value
                        .split(",")
                        .map((s) => parseInt(s.trim()))
                        .filter((n) => !isNaN(n));
                      setFormData({ ...formData, user_ids: ids });
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: theme.radius.card,
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: 13,
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.require_ack}
                    onChange={(e) => setFormData({ ...formData, require_ack: e.target.checked })}
                  />
                  <span>Wajib diakui (Acknowledge)</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: theme.radius.card,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: "transparent",
                    color: theme.colors.textMain,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "8px 16px",
                    borderRadius: theme.radius.card,
                    border: "none",
                    backgroundColor: theme.colors.primary,
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
          Memuat...
        </div>
      ) : announcements.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: theme.colors.textMuted,
            fontSize: 13,
          }}
        >
          Belum ada pengumuman
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {announcements.map((ann) => (
            <div
              key={ann.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                padding: 16,
                boxShadow: theme.shadowCard,
                borderLeft: `4px solid ${getPriorityColor(ann.priority)}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px 0", color: theme.colors.textMain }}>
                    {ann.title}
                  </h4>
                  <div style={{ fontSize: 11, color: theme.colors.textSoft }}>
                    {new Date(ann.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    padding: "4px 8px",
                    borderRadius: theme.radius.pill,
                    backgroundColor: getPriorityColor(ann.priority) + "20",
                    color: getPriorityColor(ann.priority),
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {ann.priority}
                </span>
              </div>
              <p style={{ fontSize: 13, color: theme.colors.textMain, margin: "8px 0", lineHeight: 1.6 }}>
                {ann.message}
              </p>
              <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                Target: {ann.scope === "all" ? "Semua" : ann.scope === "divisions" ? "Divisi Tertentu" : "Personel Tertentu"}
                {ann.require_ack && " • Wajib diakui"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

