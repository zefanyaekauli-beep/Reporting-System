// frontend/web/src/modules/shared/components/PengumumanCard.tsx

import { useEffect, useState } from "react";
import { theme } from "./theme";
import { useTranslation } from "../../../i18n/useTranslation";
import {
  AnnouncementWithState,
  fetchMyAnnouncements,
  markAnnouncementRead,
  markAnnouncementAck,
} from "../../../api/announcementApi";
import { useToast } from "./Toast";

interface PengumumanCardProps {
  limit?: number;
  showAll?: boolean;
}

export function PengumumanCard({ limit = 5, showAll = false }: PengumumanCardProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [items, setItems] = useState<AnnouncementWithState[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementWithState | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await fetchMyAnnouncements(false, limit);
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load announcements:", err);
      showToast("Gagal memuat pengumuman", "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (ann: AnnouncementWithState) => {
    // Mark as read if not already read
    if (!ann.is_read) {
      try {
        await markAnnouncementRead(ann.id);
        setItems((prev) =>
          prev.map((i) => (i.id === ann.id ? { ...i, is_read: true, read_at: new Date().toISOString() } : i))
        );
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    }

    // Show full announcement in modal
    setSelectedAnnouncement(ann);
  };

  const handleAck = async (ann: AnnouncementWithState) => {
    if (ann.require_ack && !ann.is_ack) {
      try {
        await markAnnouncementAck(ann.id);
        setItems((prev) =>
          prev.map((i) =>
            i.id === ann.id
              ? { ...i, is_ack: true, ack_at: new Date().toISOString(), is_read: true }
              : i
          )
        );
        showToast("Pengumuman telah diakui", "success");
        setSelectedAnnouncement(null);
      } catch (err) {
        console.error("Failed to acknowledge:", err);
        showToast("Gagal mengakui pengumuman", "error");
      }
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

  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <>
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          padding: 12,
          boxShadow: theme.shadowCard,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textMain }}>
            Pengumuman
          </div>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.danger + "20",
                color: theme.colors.danger,
                fontWeight: 600,
              }}
            >
              {unreadCount} belum dibaca
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ fontSize: 11, color: theme.colors.textMuted, textAlign: "center", padding: 8 }}>
            Memuat...
          </div>
        ) : items.length === 0 ? (
          <div style={{ fontSize: 11, color: theme.colors.textMuted, textAlign: "center", padding: 8 }}>
            Belum ada pengumuman
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((ann) => (
              <div
                key={ann.id}
                onClick={() => handleClick(ann)}
                style={{
                  padding: 8,
                  borderRadius: theme.radius.card,
                  border: `1px solid ${ann.is_read ? theme.colors.border : getPriorityColor(ann.priority)}`,
                  backgroundColor: ann.is_read
                    ? theme.colors.surface
                    : getPriorityColor(ann.priority) + "10",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = getPriorityColor(ann.priority);
                  e.currentTarget.style.transform = "translateX(2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ann.is_read
                    ? theme.colors.border
                    : getPriorityColor(ann.priority);
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 4,
                  }}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: theme.colors.textMain,
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ann.title}
                    </span>
                    {!ann.is_read && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: getPriorityColor(ann.priority),
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 10,
                    color: theme.colors.textMuted,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {ann.message}
                </p>
                <div
                  style={{
                    fontSize: 9,
                    color: theme.colors.textSoft,
                    marginTop: 4,
                  }}
                >
                  {new Date(ann.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for full announcement */}
      {selectedAnnouncement && (
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
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: 20,
              maxWidth: 500,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: theme.shadowCard,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: theme.colors.textMain,
                  margin: 0,
                  flex: 1,
                }}
              >
                {selectedAnnouncement.title}
              </h3>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  color: theme.colors.textMuted,
                  cursor: "pointer",
                  padding: 0,
                  marginLeft: 12,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                fontSize: 11,
                color: theme.colors.textSoft,
                marginBottom: 12,
              }}
            >
              {new Date(selectedAnnouncement.created_at).toLocaleString("id-ID")}
            </div>

            <div
              style={{
                fontSize: 13,
                color: theme.colors.textMain,
                lineHeight: 1.6,
                marginBottom: 16,
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedAnnouncement.message}
            </div>

            {selectedAnnouncement.require_ack && !selectedAnnouncement.is_ack && (
              <button
                onClick={() => handleAck(selectedAnnouncement)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: theme.radius.card,
                  border: "none",
                  backgroundColor: theme.colors.primary,
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Saya Mengerti / Acknowledge
              </button>
            )}

            {selectedAnnouncement.is_ack && (
              <div
                style={{
                  fontSize: 11,
                  color: theme.colors.success,
                  textAlign: "center",
                  padding: 8,
                }}
              >
                ✓ Telah diakui pada {selectedAnnouncement.ack_at ? new Date(selectedAnnouncement.ack_at).toLocaleString("id-ID") : ""}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

