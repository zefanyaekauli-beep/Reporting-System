// frontend/web/src/modules/security/pages/SecurityPassdownPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../../shared/components/Toast";
import { useSite } from "../../shared/contexts/SiteContext";
import {
  listPassdownNotes,
  createPassdownNote,
  acknowledgePassdownNote,
  ShiftHandover,
} from "../../../api/securityApi";
import { usePullToRefresh } from "../../shared/hooks/usePullToRefresh";

export function SecurityPassdownPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { selectedSite } = useSite();
  const navigate = useNavigate();
  const siteId = selectedSite?.id || 1;

  const [notes, setNotes] = useState<ShiftHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "normal",
    to_shift_type: "",
  });

  const loadNotes = async () => {
    setLoading(true);
    try {
      const { data } = await listPassdownNotes({
        site_id: siteId,
        status: "pending",
      });
      setNotes(data);
    } catch (err: any) {
      console.error("Failed to load notes:", err);
      showToast(t("security.failedToLoadPassdown"), "error");
    } finally {
      setLoading(false);
    }
  };

  const { containerRef, isRefreshing } = usePullToRefresh(loadNotes);

  useEffect(() => {
    loadNotes();
  }, [siteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPassdownNote({
        site_id: siteId,
        shift_date: new Date().toISOString().split("T")[0],
        title: formData.title,
        description: formData.description,
        category: formData.category || undefined,
        priority: formData.priority,
        to_shift_type: formData.to_shift_type || undefined,
      });
      showToast(t("security.passdownNoteCreated"), "success");
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "normal",
        to_shift_type: "",
      });
      await loadNotes();
    } catch (err: any) {
      console.error("Failed to create note:", err);
      showToast(t("security.failedToCreatePassdown"), "error");
    }
  };

  const handleAcknowledge = async (noteId: number) => {
    try {
      await acknowledgePassdownNote(noteId);
      showToast(t("security.noteAcknowledged"), "success");
      await loadNotes();
    } catch (err: any) {
      console.error("Failed to acknowledge:", err);
      showToast(t("security.failedToAcknowledge"), "error");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return theme.colors.danger;
      case "high":
        return theme.colors.warning;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <MobileLayout title={t("security.shiftHandover")}>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          minHeight: "100%",
        }}
      >
        {isRefreshing && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: 12,
              textAlign: "center",
              fontSize: 12,
              color: theme.colors.textMuted,
              backgroundColor: theme.colors.background,
              zIndex: 100,
            }}
          >
            {t("security.reloading")}
          </div>
        )}

        {/* New Note Button */}
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: theme.colors.primary,
              color: "#FFFFFF",
              border: "none",
              borderRadius: theme.radius.card,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {showForm ? t("common.cancel") : `+ ${t("security.createPassdown")}`}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: 16,
              marginBottom: 12,
              boxShadow: theme.shadowCard,
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: theme.colors.textMain,
                  }}
                >
                  Judul
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: theme.colors.textMain,
                  }}
                >
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    minHeight: 80,
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                      color: theme.colors.textMain,
                    }}
                  >
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                  >
                    <option value="">Pilih...</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="incident">Incident</option>
                    <option value="note">Note</option>
                    <option value="task">Task</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                      color: theme.colors.textMain,
                    }}
                  >
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: theme.colors.success,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("common.save")} {t("security.passdownNote")}
              </button>
            </form>
          </div>
        )}

        {/* Notes List */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 8,
            color: theme.colors.textMain,
          }}
        >
          Pending Handover Notes
        </div>

        {loading ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: theme.colors.textMuted,
            }}
          >
            Memuat...
          </div>
        ) : notes.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: theme.colors.textMuted,
            }}
          >
            Tidak ada passdown notes
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                padding: 14,
                marginBottom: 8,
                boxShadow: theme.shadowCard,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: theme.colors.textMain,
                      marginBottom: 4,
                    }}
                  >
                    {note.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: theme.colors.textMain,
                      marginBottom: 8,
                    }}
                  >
                    {note.description}
                  </div>
                  {note.category && (
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.colors.textMuted,
                        marginBottom: 4,
                      }}
                    >
                      Kategori: {note.category}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.colors.textMuted,
                    }}
                    >
                    Dari: Shift {note.from_shift_type || "?"} → Shift {note.to_shift_type || "Selanjutnya"}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: theme.radius.pill,
                    backgroundColor: `${getPriorityColor(note.priority)}20`,
                    color: getPriorityColor(note.priority),
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {note.priority}
                </span>
              </div>

              {note.status === "pending" && (
                <button
                  onClick={() => handleAcknowledge(note.id)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: theme.colors.primary,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: 8,
                  }}
                >
                  Acknowledge
                </button>
              )}

              <div
                style={{
                  fontSize: 11,
                  color: theme.colors.textSoft,
                  marginTop: 8,
                }}
              >
                {new Date(note.created_at).toLocaleString("id-ID")}
              </div>
            </div>
          ))
        )}
      </div>
    </MobileLayout>
  );
}

