// frontend/web/src/modules/security/pages/SecurityDispatchPage.tsx

import { useState, useEffect } from "react";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../../shared/components/Toast";
import { useSite } from "../../shared/contexts/SiteContext";
import {
  listDispatchTickets,
  updateDispatchTicket,
  DispatchTicket,
} from "../../../api/securityApi";
import { usePullToRefresh } from "../../shared/hooks/usePullToRefresh";

export function SecurityDispatchPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { selectedSite } = useSite();
  const siteId = selectedSite?.id || 1;

  const [tickets, setTickets] = useState<DispatchTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await listDispatchTickets({
        site_id: siteId,
        status: statusFilter || undefined,
      });
      setTickets(data);
    } catch (err: any) {
      console.error("Failed to load tickets:", err);
      showToast(t("security.failedToLoadTickets"), "error");
    } finally {
      setLoading(false);
    }
  };

  const { containerRef, isRefreshing } = usePullToRefresh(loadTickets);

  useEffect(() => {
    loadTickets();
  }, [siteId, statusFilter]);

  const handleUpdateStatus = async (ticketId: number, newStatus: string) => {
    try {
      await updateDispatchTicket(ticketId, { status: newStatus });
      showToast(t("security.ticketStatusUpdated"), "success");
      await loadTickets();
    } catch (err: any) {
      console.error("Failed to update ticket:", err);
      showToast(t("security.failedToUpdateTicket"), "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return theme.colors.warning;
      case "ASSIGNED":
        return theme.colors.primary;
      case "ONSCENE":
        return "#3B82F6";
      case "CLOSED":
        return theme.colors.success;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <MobileLayout title={t("security.dispatchTickets")}>
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

        {/* Filter */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 12,
            boxShadow: theme.shadowCard,
          }}
        >
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 8,
              fontSize: 14,
              backgroundColor: theme.colors.surface,
            }}
          >
            <option value="">Semua Status</option>
            <option value="NEW">Baru</option>
            <option value="ASSIGNED">Ditugaskan</option>
            <option value="ONSCENE">Di Lokasi</option>
            <option value="CLOSED">Selesai</option>
          </select>
        </div>

        {/* Tickets List */}
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
        ) : tickets.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: theme.colors.textMuted,
            }}
          >
            Tidak ada dispatch tickets
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
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
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.colors.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    {ticket.ticket_number}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: theme.colors.textMain,
                      marginBottom: 4,
                    }}
                  >
                    {ticket.incident_type.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: theme.colors.textMain,
                      marginBottom: 8,
                    }}
                  >
                    {ticket.description}
                  </div>
                  {ticket.location && (
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.colors.textMuted,
                        marginBottom: 4,
                      }}
                    >
                      📍 {ticket.location}
                    </div>
                  )}
                  {ticket.caller_name && (
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.colors.textMuted,
                      }}
                    >
                      📞 {ticket.caller_name}
                      {ticket.caller_phone && ` - ${ticket.caller_phone}`}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: theme.radius.pill,
                    backgroundColor: `${getStatusColor(ticket.status)}20`,
                    color: getStatusColor(ticket.status),
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {ticket.status}
                </span>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginTop: 12,
                  flexWrap: "wrap",
                }}
              >
                {ticket.status === "NEW" && (
                  <button
                    onClick={() => handleUpdateStatus(ticket.id, "ASSIGNED")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      backgroundColor: theme.colors.primary,
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Assign
                  </button>
                )}
                {ticket.status === "ASSIGNED" && (
                  <button
                    onClick={() => handleUpdateStatus(ticket.id, "ONSCENE")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      backgroundColor: "#3B82F6",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    On Scene
                  </button>
                )}
                {ticket.status === "ONSCENE" && (
                  <button
                    onClick={() => handleUpdateStatus(ticket.id, "CLOSED")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      backgroundColor: theme.colors.success,
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                )}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: theme.colors.textSoft,
                  marginTop: 8,
                }}
              >
                {new Date(ticket.created_at).toLocaleString("id-ID")}
              </div>
            </div>
          ))
        )}
      </div>
    </MobileLayout>
  );
}

