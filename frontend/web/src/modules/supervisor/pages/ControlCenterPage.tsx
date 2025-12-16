// frontend/web/src/modules/supervisor/pages/ControlCenterPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SupervisorLayout from "../layout/SupervisorLayout";
import { Card } from "../../shared/components/Card";
import { theme } from "../../shared/components/theme";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { MapView } from "../../shared/components/MapView";
import { CCTVViewer } from "../../shared/components/CCTVViewer";
import {
  getControlCenterStatus,
  getActivePatrols,
  getActiveIncidents,
  getPanicAlerts,
  getDispatchTickets,
  ControlCenterStatus,
  ActivePatrol,
  ActiveIncident,
  PanicAlert,
  DispatchTicket,
} from "../../../api/supervisorApi";
import { formatDateTime, formatTime } from "../../../utils/formatDate";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import api from "../../../api/client";

interface CCTV {
  id: number;
  name: string;
  location?: string | null;
  stream_url: string;
  is_active: boolean;
}

export default function ControlCenterPage() {
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ControlCenterStatus | null>(null);
  const [activePatrols, setActivePatrols] = useState<ActivePatrol[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<ActiveIncident[]>([]);
  const [panicAlerts, setPanicAlerts] = useState<PanicAlert[]>([]);
  const [dispatchTickets, setDispatchTickets] = useState<DispatchTicket[]>([]);
  const [cctvCameras, setCctvCameras] = useState<CCTV[]>([]);
  const [selectedCCTV, setSelectedCCTV] = useState<CCTV | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = selectedSite ? { site_id: selectedSite.id } : undefined;

      const [statusData, patrolsData, incidentsData, alertsData, ticketsData, cctvData] =
        await Promise.all([
          getControlCenterStatus(params),
          getActivePatrols(params),
          getActiveIncidents(params),
          getPanicAlerts({ ...params, status: "active" }),
          getDispatchTickets({ ...params, status: "NEW,ASSIGNED,ONSCENE" }),
          api.get("/cctv", { params: { ...params, is_active: true } }),
        ]);

      setStatus(statusData);
      setActivePatrols(patrolsData);
      setActiveIncidents(incidentsData);
      setPanicAlerts(alertsData);
      setDispatchTickets(ticketsData);
      setCctvCameras(cctvData.data || []);
    } catch (err: any) {
      console.error("Failed to load control center data:", err);
      showToast(err?.response?.data?.detail || "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSite]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedSite]);

  const getPatrolMarkers = () => {
    return activePatrols
      .filter((p) => p.current_location)
      .map((patrol) => ({
        id: patrol.id,
        position: [
          patrol.current_location!.latitude,
          patrol.current_location!.longitude,
        ] as [number, number],
        label: `${patrol.user_name} - ${patrol.area_text || "Patrol"}`,
        color: theme.colors.primary,
      }));
  };

  const getIncidentMarkers = () => {
    return activeIncidents
      .filter((i) => i.location_text)
      .map((incident) => ({
        id: incident.id,
        position: [0, 0] as [number, number], // Would need lat/lng from location_text
        label: incident.title,
        color: theme.colors.danger,
      }));
  };

  const getSeverityColor = (severity?: string | null) => {
    switch (severity?.toLowerCase()) {
      case "high":
      case "critical":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "info";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "URGENT":
        return "danger";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "info";
      case "LOW":
        return "success";
      default:
        return "info";
    }
  };

  if (loading && !status) {
    return (
      <SupervisorLayout>
        <div style={{ padding: 20 }}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ color: theme.colors.textSecondary }}>Memuat data...</div>
          </div>
        </div>
      </SupervisorLayout>
    );
  }

  return (
    <SupervisorLayout>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Control Center</h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              Auto-refresh
            </label>
            <button
              onClick={loadData}
              style={{
                padding: "8px 16px",
                backgroundColor: theme.colors.primary,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Status Cards */}
        {status && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Card hover={false}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                On Duty
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.primary }}>
                {status.total_on_duty}
              </div>
            </Card>
            <Card hover={false}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                Active Patrols
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.info }}>
                {status.total_active_patrols}
              </div>
            </Card>
            <Card hover={false}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                Active Incidents
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.danger }}>
                {status.total_active_incidents}
              </div>
            </Card>
            <Card hover={false}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                Panic Alerts
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.danger }}>
                {status.total_panic_alerts}
              </div>
            </Card>
            <Card hover={false}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                Dispatch Tickets
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.warning }}>
                {status.total_dispatch_tickets}
              </div>
            </Card>
          </div>
        )}

        {/* Map View */}
        {activePatrols.length > 0 && (
          <Card hover={false} style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 16,
                color: theme.colors.textMain,
              }}
            >
              Real-time Patrol Map
            </h2>
            <MapView
              center={
                activePatrols[0]?.current_location
                  ? [
                      activePatrols[0].current_location.latitude,
                      activePatrols[0].current_location.longitude,
                    ]
                  : [-6.2088, 106.8456]
              }
              markers={[...getPatrolMarkers(), ...getIncidentMarkers()]}
              height="400px"
            />
          </Card>
        )}

        {/* Two Column Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginBottom: 24,
          }}
        >
          {/* Active Patrols */}
          <Card hover={false}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 16,
                color: theme.colors.textMain,
              }}
            >
              Active Patrols ({activePatrols.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activePatrols.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: theme.colors.textMuted }}>
                  Tidak ada patrol aktif
                </div>
              ) : (
                activePatrols.map((patrol) => (
                  <div
                    key={patrol.id}
                    style={{
                      padding: 12,
                      backgroundColor: theme.colors.bgSecondary,
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/security/patrol/${patrol.id}`)}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {patrol.user_name}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                      {patrol.site_name} • {patrol.area_text || "Patrol"}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      Durasi: {patrol.duration_minutes || 0} menit
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Active Incidents */}
          <Card hover={false}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 16,
                color: theme.colors.textMain,
              }}
            >
              Active Incidents ({activeIncidents.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeIncidents.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: theme.colors.textMuted }}>
                  Tidak ada insiden aktif
                </div>
              ) : (
                activeIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    style={{
                      padding: 12,
                      backgroundColor: theme.colors.bgSecondary,
                      borderRadius: 8,
                      cursor: "pointer",
                      borderLeft: `4px solid ${theme.colors[getSeverityColor(incident.severity)]}`,
                    }}
                    onClick={() => navigate(`/security/reports/${incident.id}`)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>
                        {incident.title}
                      </div>
                      <StatusBadge
                        status={incident.severity || "N/A"}
                        color={getSeverityColor(incident.severity)}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                      {incident.site_name} • {incident.reported_by}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      {formatTime(incident.reported_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Panic Alerts & Dispatch Tickets */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginBottom: 24,
          }}
        >
          {/* Panic Alerts */}
          <Card hover={false}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 16,
                color: theme.colors.textMain,
              }}
            >
              Panic Alerts ({panicAlerts.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {panicAlerts.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: theme.colors.textMuted }}>
                  Tidak ada panic alert
                </div>
              ) : (
                panicAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      padding: 12,
                      backgroundColor: theme.colors.danger + "20",
                      borderRadius: 8,
                      border: `2px solid ${theme.colors.danger}`,
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/security/panic`)}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: theme.colors.danger }}>
                      🚨 {alert.user_name}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                      {alert.site_name} • {alert.alert_type}
                    </div>
                    {alert.message && (
                      <div style={{ fontSize: 12, color: theme.colors.textMain, marginBottom: 4 }}>
                        {alert.message}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      {formatTime(alert.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Dispatch Tickets */}
          <Card hover={false}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 16,
                color: theme.colors.textMain,
              }}
            >
              Dispatch Tickets ({dispatchTickets.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dispatchTickets.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: theme.colors.textMuted }}>
                  Tidak ada dispatch ticket
                </div>
              ) : (
                dispatchTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    style={{
                      padding: 12,
                      backgroundColor: theme.colors.bgSecondary,
                      borderRadius: 8,
                      cursor: "pointer",
                      borderLeft: `4px solid ${theme.colors[getPriorityColor(ticket.priority)]}`,
                    }}
                    onClick={() => navigate(`/security/dispatch`)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        #{ticket.ticket_number}
                      </div>
                      <StatusBadge status={ticket.priority} color={getPriorityColor(ticket.priority)} />
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                      {ticket.site_name} • {ticket.incident_type}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      {ticket.assigned_to_name || "Unassigned"} • {formatTime(ticket.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* CCTV Grid */}
        {cctvCameras.length > 0 && (
          <Card hover={false}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                marginBottom: 16,
                color: theme.colors.textMain,
              }}
            >
              CCTV Cameras
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {cctvCameras.slice(0, 4).map((camera) => (
                <div key={camera.id}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: theme.colors.textMain,
                    }}
                  >
                    {camera.name}
                    {camera.location && ` - ${camera.location}`}
                  </div>
                  <CCTVViewer
                    streamUrl={camera.stream_url}
                    cameraName={camera.name}
                    height="200px"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </SupervisorLayout>
  );
}

