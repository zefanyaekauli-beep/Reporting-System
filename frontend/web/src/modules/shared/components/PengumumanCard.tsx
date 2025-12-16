// frontend/web/src/modules/shared/components/PengumumanCard.tsx

import { useEffect, useState } from "react";
import { theme } from "./theme";
import { useTranslation } from "../../../i18n/useTranslation";
import {
  AnnouncementWithState,
  fetchMyAnnouncements,
  markAnnouncementRead,
  markAnnouncementAck,
  listPanicAlerts,
  acknowledgePanicAlert,
  resolvePanicAlert,
  CreatePanicAlertPayload,
} from "../../../api/announcementApi";
import { useToast } from "./Toast";

interface PengumumanCardProps {
  limit?: number;
  showAll?: boolean;
}

// Extended type for panic alerts that look like announcements
type AnnouncementLike = AnnouncementWithState & {
  type?: "panic" | "announcement";
  status?: string;
  location_text?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  panicId?: number; // Original panic alert ID for API calls
  resolution_notes?: string | null; // Resolution notes for resolved panic alerts
};

export function PengumumanCard({ limit = 5, showAll = false }: PengumumanCardProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [items, setItems] = useState<AnnouncementWithState[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementLike | null>(null);
  const [panicItems, setPanicItems] = useState<AnnouncementLike[]>([]);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolveMessage, setResolveMessage] = useState("");



  useEffect(() => {
    loadAnnouncements();
    debugPanicAlerts();
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

  const debugPanicAlerts = async () => {
  try {
    const data = await listPanicAlerts();

    const sorted = data.data.sort((a, b) => {
      if (a.status !== "resolved" && b.status === "resolved") return -1;
      if (a.status === "resolved" && b.status !== "resolved") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // HATI-HATI: tadi kamu pakai panicData → SALAH
    const panicMapped: AnnouncementLike[] = sorted.map((p) => ({
  id: `panic-${p.id}` as any, // String ID untuk panic alerts
  company_id: 0, // Not applicable for panic alerts
  title:
    p.status === "resolved"
      ? "Panic Alert (Selesai)"
      : "🚨 PANIC ALERT — Perlu perhatian!",
  message: p.message || "Panic alert aktif",
  priority: "critical" as const, // supaya merah
  scope: "all" as const,
  created_by_id: p.user_id || 0,
  created_at: p.created_at,
  valid_from: p.created_at,
  valid_until: null,
  is_active: true,
  require_ack: p.status !== "acknowledged" && p.status !== "resolved", // Panic alerts perlu acknowledge jika belum
  is_read: p.status === "resolved" || p.status === "acknowledged",
  read_at: (p.status === "resolved" || p.status === "acknowledged") ? p.created_at : null,
  is_ack: p.status === "acknowledged" || p.status === "resolved",
  ack_at: p.status === "acknowledged" ? p.created_at : null, // TODO: Use acknowledged_at from API if available
  type: "panic" as const,
  status: p.status,
  latitude: p.latitude,
  longitude: p.longitude,
  location_text: p.location_text,
  panicId: p.id, // Store original panic alert ID for API calls
  resolution_notes: p.resolution_notes || null, // Resolution notes from API
}));


    setPanicItems(panicMapped);
  } catch (err) {
    console.error("Failed load panic alerts:", err);
  }
};

const combined: AnnouncementLike[] = [...panicItems, ...items];

const sortedItems = combined.sort((a, b) => {
  const aActive = a.type === "panic" && a.status !== "resolved";
  const bActive = b.type === "panic" && b.status !== "resolved";

  if (aActive && !bActive) return -1;
  if (!aActive && bActive) return 1;

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
});

  const handleClick = async (ann: AnnouncementLike) => {
    // Mark as read if not already read
    // Note: Panic alerts are not real announcements, so skip API call for them
    
    // Defensive check: if ID is string starting with "panic-", it's definitely a panic alert
    const annIdStr = String(ann.id);
    const isPanic = ann.type === "panic" || annIdStr.startsWith("panic-");
    
    // Debug logging
    if (import.meta.env.DEV) {
      console.log("handleClick - Announcement:", {
        id: ann.id,
        idType: typeof ann.id,
        idString: annIdStr,
        type: ann.type,
        isPanic,
        isRead: ann.is_read,
      });
    }
    
    if (isPanic) {
      // For panic alerts, just update local state (they're not real announcements)
      if (!ann.is_read) {
        setPanicItems((prev) =>
          prev.map((p) => 
            p.id === ann.id ? { ...p, is_read: true, read_at: new Date().toISOString() } : p
          )
        );
      }
      // Show full announcement in modal
      setSelectedAnnouncement(ann);
      return; // Early return - don't proceed with API call
    }
    
    // Only process real announcements (numeric ID, not panic)
    // IMPORTANT: Double check we're not processing panic alerts
    if (!ann.is_read && !isPanic) {
      try {
        // Only call API for real announcements (numeric ID)
        const announcementId = typeof ann.id === "string" ? parseInt(ann.id) : ann.id;
        // Triple check: make sure it's not a panic ID
        if (!isNaN(announcementId) && announcementId > 0 && !annIdStr.startsWith("panic-") && ann.type !== "panic") {
          if (import.meta.env.DEV) {
            console.log("Calling markAnnouncementRead for announcement ID:", announcementId);
          }
          await markAnnouncementRead(announcementId);
          setItems((prev) =>
            prev.map((i) => (i.id === ann.id ? { ...i, is_read: true, read_at: new Date().toISOString() } : i))
          );
        } else {
          if (import.meta.env.DEV) {
            console.warn("Skipping API call - invalid or panic ID:", {
              id: ann.id,
              parsed: announcementId,
              idStr: annIdStr,
              type: ann.type,
            });
          }
        }
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    } else if (isPanic) {
      // This should have been handled above with early return, but just in case
      if (import.meta.env.DEV) {
        console.log("Panic alert detected in second check, skipping API call");
      }
    }

    // Show full announcement in modal
    setSelectedAnnouncement(ann);
  };

  const handleAck = async (ann: AnnouncementLike, checked: boolean) => {
    // Handle panic alert acknowledge
    if (ann.type === "panic" && ann.panicId) {
      if (!checked) {
        showToast("Panic alert tidak bisa di-unacknowledge", "info");
        return;
      }
      
      if (ann.status === "acknowledged" || ann.status === "resolved") {
        return; // Already acknowledged
      }
      
      try {
        await acknowledgePanicAlert(ann.panicId);
        // Update local state
        setPanicItems((prev) =>
          prev.map((p) =>
            p.id === ann.id
              ? { ...p, is_ack: true, ack_at: new Date().toISOString(), is_read: true, status: "acknowledged", require_ack: false }
              : p
          )
        );
        // Update selected announcement if it's the same
        if (selectedAnnouncement?.id === ann.id) {
          setSelectedAnnouncement({
            ...ann,
            is_ack: true,
            ack_at: new Date().toISOString(),
            is_read: true,
            status: "acknowledged",
            require_ack: false,
          });
        }
        showToast("Panic alert telah diakui", "success");
        // Reload panic alerts to get updated status
        debugPanicAlerts();
      } catch (err) {
        console.error("Failed to acknowledge panic alert:", err);
        showToast("Gagal mengakui panic alert", "error");
      }
      return;
    }

    // Handle regular announcement acknowledge
    if (ann.require_ack) {
      if (!checked && ann.is_ack) {
        showToast("Pengumuman tidak bisa di-unacknowledge", "info");
        return;
      }
      
      if (checked && !ann.is_ack) {
        try {
          // Only call API for real announcements (numeric ID)
          const announcementId = typeof ann.id === "string" ? parseInt(ann.id) : ann.id;
          if (!isNaN(announcementId) && announcementId > 0) {
            await markAnnouncementAck(announcementId);
            setItems((prev) =>
              prev.map((i) =>
                i.id === ann.id
                  ? { ...i, is_ack: true, ack_at: new Date().toISOString(), is_read: true }
                  : i
              )
            );
            // Update selected announcement if it's the same
            if (selectedAnnouncement?.id === ann.id) {
              setSelectedAnnouncement({
                ...ann,
                is_ack: true,
                ack_at: new Date().toISOString(),
                is_read: true,
              });
            }
            showToast("Pengumuman telah diakui", "success");
          }
        } catch (err) {
          console.error("Failed to acknowledge:", err);
          showToast("Gagal mengakui pengumuman", "error");
        }
      }
    }
  };

  const handleResolve = async (ann: AnnouncementLike) => {
    if (ann.type !== "panic" || !ann.panicId) {
      return;
    }

    if (!resolveMessage.trim()) {
      showToast("Harap masukkan pesan resolusi", "error");
      return;
    }

    try {
      await resolvePanicAlert(ann.panicId, resolveMessage.trim());
      // Update local state
      setPanicItems((prev) =>
        prev.map((p) =>
          p.id === ann.id
            ? { 
                ...p, 
                status: "resolved", 
                is_read: true, 
                is_ack: true,
                read_at: new Date().toISOString(),
                resolution_notes: resolveMessage.trim(),
                require_ack: false,
              }
            : p
        )
      );
      // Update selected announcement if it's the same
      if (selectedAnnouncement?.id === ann.id) {
        setSelectedAnnouncement({
          ...ann,
          status: "resolved",
          is_read: true,
          is_ack: true,
          resolution_notes: resolveMessage.trim(),
          require_ack: false,
        });
      }
      showToast("Panic alert telah diselesaikan", "success");
      setShowResolveForm(false);
      setResolveMessage("");
      // Reload panic alerts to get updated status
      debugPanicAlerts();
    } catch (err) {
      console.error("Failed to resolve panic alert:", err);
      showToast("Gagal menyelesaikan panic alert", "error");
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: "150px",
              overflowY: "auto",
              overflowX: "hidden",
              paddingRight: "4px",
              // Custom scrollbar styles
              scrollbarWidth: "thin",
              scrollbarColor: `${theme.colors.border} transparent`,
            }}
            className="pengumuman-scroll"
          >
            {sortedItems.map((ann) => (
              <div
                key={ann.id}
                onClick={() => handleClick(ann)}
                style={{
                  padding: 8,
                  borderRadius: theme.radius.card,
                  border: `1px solid ${
  ann.type === "panic" && ann.status !== "resolved"
    ? "red"
    : ann.is_read
    ? theme.colors.border
    : getPriorityColor(ann.priority)
}`,

                  backgroundColor:
                    ann.type === "panic" && ann.status !== "resolved"
                      ? "rgba(255, 0, 0, 0.15)" // merah lembut
                      : ann.is_read
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

      {/* Custom scrollbar styles */}
      <style>
        {`
          .pengumuman-scroll::-webkit-scrollbar {
            width: 6px;
          }
          
          .pengumuman-scroll::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 10px;
          }
          
          .pengumuman-scroll::-webkit-scrollbar-thumb {
            background: ${theme.colors.border};
            border-radius: 10px;
          }
          
          .pengumuman-scroll::-webkit-scrollbar-thumb:hover {
            background: ${theme.colors.textMuted};
          }
        `}
      </style>

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
            {/* Panic Alert Extra Info */}
{selectedAnnouncement.type === "panic" && (
  <div style={{ marginTop: 12 }}>
    {selectedAnnouncement.location_text && (
      <div style={{ fontSize: 12, color: theme.colors.textMain, marginBottom: 6 }}>
        <b>Lokasi:</b> {selectedAnnouncement.location_text}
      </div>
    )}

    {selectedAnnouncement.latitude && selectedAnnouncement.longitude && (
      <a
        href={`https://www.google.com/maps?q=${selectedAnnouncement.latitude},${selectedAnnouncement.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          padding: "8px 12px",
          backgroundColor: theme.colors.danger,
          color: "white",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        🔍 Buka di Google Maps
      </a>
    )}
  </div>
)}


            {/* Acknowledge checkbox for panic alerts */}
            {selectedAnnouncement.type === "panic" && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px",
                  borderRadius: theme.radius.card,
                  backgroundColor: selectedAnnouncement.is_ack ? theme.colors.success + "10" : theme.colors.surface,
                  border: `1px solid ${selectedAnnouncement.is_ack ? theme.colors.success : theme.colors.border}`,
                  cursor: selectedAnnouncement.is_ack ? "default" : "pointer",
                  marginTop: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedAnnouncement.is_ack}
                  disabled={selectedAnnouncement.is_ack || selectedAnnouncement.status === "resolved"}
                  onChange={(e) => handleAck(selectedAnnouncement, e.target.checked)}
                  style={{
                    width: 18,
                    height: 18,
                    cursor: selectedAnnouncement.is_ack ? "not-allowed" : "pointer",
                    accentColor: theme.colors.danger,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textMain }}>
                    {selectedAnnouncement.is_ack ? "✓ Panic Alert telah diakui" : "Acknowledge Panic Alert"}
                  </div>
                  {selectedAnnouncement.is_ack && selectedAnnouncement.ack_at && (
                    <div style={{ fontSize: 11, color: theme.colors.textSoft, marginTop: 2 }}>
                      Diakui pada {new Date(selectedAnnouncement.ack_at).toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
              </label>
            )}

            {/* Resolve form for panic alerts */}
            {selectedAnnouncement.type === "panic" && 
             selectedAnnouncement.status !== "resolved" && (
              <div style={{ marginTop: 12 }}>
                {!showResolveForm ? (
                  <button
                    onClick={() => setShowResolveForm(true)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: theme.radius.card,
                      border: `1px solid ${theme.colors.danger}`,
                      backgroundColor: "transparent",
                      color: theme.colors.danger,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✓ Resolve Panic Alert
                  </button>
                ) : (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: theme.radius.card,
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.surface,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textMain, marginBottom: 8 }}>
                      Resolve Panic Alert
                    </div>
                    <textarea
                      value={resolveMessage}
                      onChange={(e) => setResolveMessage(e.target.value)}
                      placeholder="Masukkan pesan resolusi..."
                      style={{
                        width: "100%",
                        minHeight: 80,
                        padding: 8,
                        borderRadius: theme.radius.card,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.textMain,
                        fontSize: 12,
                        fontFamily: "inherit",
                        resize: "vertical",
                        marginBottom: 8,
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleResolve(selectedAnnouncement)}
                        disabled={!resolveMessage.trim()}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: theme.radius.card,
                          border: "none",
                          backgroundColor: resolveMessage.trim() ? theme.colors.danger : theme.colors.border,
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: resolveMessage.trim() ? "pointer" : "not-allowed",
                          opacity: resolveMessage.trim() ? 1 : 0.5,
                        }}
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => {
                          setShowResolveForm(false);
                          setResolveMessage("");
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: theme.radius.card,
                          border: `1px solid ${theme.colors.border}`,
                          backgroundColor: "transparent",
                          color: theme.colors.textMain,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resolution notes display for resolved panic alerts */}
            {selectedAnnouncement.type === "panic" && 
             selectedAnnouncement.status === "resolved" && 
             selectedAnnouncement.resolution_notes && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: theme.radius.card,
                  backgroundColor: theme.colors.success + "10",
                  border: `1px solid ${theme.colors.success}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.success, marginBottom: 6 }}>
                  ✓ Panic Alert Telah Diselesaikan
                </div>
                <div style={{ fontSize: 11, color: theme.colors.textMain, whiteSpace: "pre-wrap" }}>
                  {selectedAnnouncement.resolution_notes}
                </div>
              </div>
            )}

            {/* Acknowledge checkbox for regular announcements */}
            {selectedAnnouncement.type !== "panic" && selectedAnnouncement.require_ack && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px",
                  borderRadius: theme.radius.card,
                  backgroundColor: selectedAnnouncement.is_ack ? theme.colors.success + "10" : theme.colors.surface,
                  border: `1px solid ${selectedAnnouncement.is_ack ? theme.colors.success : theme.colors.border}`,
                  cursor: selectedAnnouncement.is_ack ? "default" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedAnnouncement.is_ack}
                  disabled={selectedAnnouncement.is_ack}
                  onChange={(e) => handleAck(selectedAnnouncement, e.target.checked)}
                  style={{
                    width: 18,
                    height: 18,
                    cursor: selectedAnnouncement.is_ack ? "not-allowed" : "pointer",
                    accentColor: theme.colors.primary,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textMain }}>
                    {selectedAnnouncement.is_ack ? "✓ Pengumuman telah diakui" : "Saya Mengerti / Acknowledge"}
                  </div>
                  {selectedAnnouncement.is_ack && selectedAnnouncement.ack_at && (
                    <div style={{ fontSize: 11, color: theme.colors.textSoft, marginTop: 2 }}>
                      Diakui pada {new Date(selectedAnnouncement.ack_at).toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
              </label>
            )}
          </div>
        </div>
      )}
    </>
  );
}