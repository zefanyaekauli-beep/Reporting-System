// frontend/web/src/modules/security/pages/SecurityPatrolMapPage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import { listPatrolLogs, getGPSTrack } from "../../../api/securityApi";
import { MapView } from "../../shared/components/MapView";
import { formatDateTime } from "../../../utils/formatDate";

interface PatrolLog {
  id: number;
  user_id: number;
  officer_name: string;
  site_id: number;
  site_name: string;
  start_time: string;
  end_time: string | null;
  area_text: string | null;
  status: string;
}

export function SecurityPatrolMapPage() {
  const [patrols, setPatrols] = useState<PatrolLog[]>([]);
  const [selectedPatrol, setSelectedPatrol] = useState<number | null>(null);
  const [gpsTrack, setGpsTrack] = useState<Array<[number, number]>>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]);
  const [mapZoom, setMapZoom] = useState(13);

  const loadPatrols = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await listPatrolLogs({ limit: 50 });
      setPatrols(data);
      if (data.length > 0 && !selectedPatrol) {
        setSelectedPatrol(data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to load patrol logs");
    } finally {
      setLoading(false);
    }
  };

  const loadGPSTrack = async (patrolId: number) => {
    try {
      const track = await getGPSTrack(patrolId);
      if (track && track.positions && track.positions.length > 0) {
        const positions: Array<[number, number]> = track.positions.map((p: any) => [p.lat, p.lng]);
        setGpsTrack(positions);
        
        // Set map center to first position
        if (positions.length > 0) {
          setMapCenter(positions[0]);
          setMapZoom(15);
        }
      } else {
        setGpsTrack([]);
      }
    } catch (err: any) {
      console.error("Failed to load GPS track:", err);
      setGpsTrack([]);
    }
  };

  useEffect(() => {
    loadPatrols();
  }, []);

  useEffect(() => {
    if (selectedPatrol) {
      loadGPSTrack(selectedPatrol);
    }
  }, [selectedPatrol]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return theme.colors.success;
      case "partial":
        return theme.colors.warning;
      case "aborted":
        return theme.colors.danger;
      default:
        return theme.colors.textMuted;
    }
  };

  const markers = gpsTrack.length > 0 ? [
    {
      id: "start",
      position: gpsTrack[0] as [number, number],
      label: "Start",
      color: theme.colors.success,
    },
    ...(gpsTrack.length > 1 ? [{
      id: "end",
      position: gpsTrack[gpsTrack.length - 1] as [number, number],
      label: "End",
      color: theme.colors.danger,
    }] : []),
  ] : [];

  const tracks = gpsTrack.length > 1 ? [
    {
      id: "patrol-track",
      positions: gpsTrack,
      color: theme.colors.primary,
    },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
          Real-time Patrol Map
        </h1>
        <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
          View patrol routes and GPS tracks on interactive map
        </p>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 16 }}>
        {/* Map */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 16,
            boxShadow: theme.shadowCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            markers={markers}
            tracks={tracks}
            height="600px"
          />
        </div>

        {/* Patrol List */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 16,
            boxShadow: theme.shadowCard,
            border: `1px solid ${theme.colors.border}`,
            maxHeight: "600px",
            overflowY: "auto",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain, marginBottom: 12 }}>
            Select Patrol
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 20, color: theme.colors.textMuted }}>
              Loading...
            </div>
          ) : patrols.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: theme.colors.textMuted }}>
              No patrol logs found
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {patrols.map((patrol) => (
                <div
                  key={patrol.id}
                  onClick={() => setSelectedPatrol(patrol.id)}
                  style={{
                    padding: 12,
                    borderRadius: theme.radius.input,
                    backgroundColor: selectedPatrol === patrol.id ? theme.colors.primary + "20" : theme.colors.background,
                    border: `1px solid ${selectedPatrol === patrol.id ? theme.colors.primary : theme.colors.border}`,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textMain, marginBottom: 4 }}>
                    {patrol.officer_name}
                  </div>
                  <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                    {patrol.site_name}
                  </div>
                  <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                    {formatDateTime(patrol.start_time)}
                  </div>
                  {patrol.area_text && (
                    <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                      Area: {patrol.area_text}
                    </div>
                  )}
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 6px",
                        borderRadius: theme.radius.badge,
                        fontSize: 10,
                        fontWeight: 500,
                        backgroundColor: getStatusColor(patrol.status) + "20",
                        color: getStatusColor(patrol.status),
                      }}
                    >
                      {patrol.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GPS Track Info */}
      {selectedPatrol && gpsTrack.length > 0 && (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            boxShadow: theme.shadowCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textMain, marginBottom: 8 }}>
            GPS Track Information
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: theme.colors.textMuted }}>
            <span>Total Points: {gpsTrack.length}</span>
            <span>Start: {gpsTrack[0] ? `${gpsTrack[0][0].toFixed(6)}, ${gpsTrack[0][1].toFixed(6)}` : "N/A"}</span>
            <span>End: {gpsTrack[gpsTrack.length - 1] ? `${gpsTrack[gpsTrack.length - 1][0].toFixed(6)}, ${gpsTrack[gpsTrack.length - 1][1].toFixed(6)}` : "N/A"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

