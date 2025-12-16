// frontend/web/src/modules/security/pages/SecurityPatrolDetailPage.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { Card } from "../../shared/components/Card";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { listPatrolLogs, getPatrolDetail, getGPSTrack } from "../../../api/securityApi";
import { formatDateTime, formatTime } from "../../../utils/formatDate";
import { MapView } from "../../shared/components/MapView";

export function SecurityPatrolDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patrol, setPatrol] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPatrol();
    }
  }, [id]);

  const loadPatrol = async () => {
    setLoading(true);
    setError(null);
    try {
      if (id) {
        const detail = await getPatrolDetail(Number(id));
        setPatrol(detail);
      } else {
        setError("ID patrol tidak ditemukan");
      }
    } catch (err: any) {
      console.error("Failed to load patrol:", err);
      setError(err?.response?.data?.detail || "Gagal memuat log patroli");
    } finally {
      setLoading(false);
    }
  };

  const getDuration = (start: string, end?: string | null) => {
    if (!end) return "Berlangsung";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const minutes = Math.floor((endTime - startTime) / 60000);
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} jam ${mins} menit`;
  };

  const getGPSMarkers = () => {
    if (!patrol?.gps_tracks || patrol.gps_tracks.length === 0) return [];
    return patrol.gps_tracks.map((track: any, index: number) => ({
      id: index,
      position: [track.latitude, track.longitude] as [number, number],
      label: `Point ${index + 1}`,
      color: index === 0 ? "#10b981" : index === patrol.gps_tracks.length - 1 ? "#ef4444" : "#3b82f6",
    }));
  };

  const getGPSTrack = () => {
    if (!patrol?.gps_tracks || patrol.gps_tracks.length < 2) return [];
    return [{
      id: patrol.id,
      positions: patrol.gps_tracks.map((track: any) => [track.latitude, track.longitude] as [number, number]),
      color: "#3b82f6",
    }];
  };

  if (loading) {
    return (
      <MobileLayout title={t("security.patrolDetail")}>
        <SkeletonCard />
        <SkeletonCard />
      </MobileLayout>
    );
  }

  if (error || !patrol) {
    return (
      <MobileLayout title={t("security.patrolDetail")}>
        <Card hover={false}>
          <div style={{ textAlign: "center", padding: 40, color: theme.colors.danger }}>
            {error || "Log patroli tidak ditemukan"}
          </div>
          <button
            onClick={() => navigate("/security/patrol")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: theme.colors.primary,
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Kembali ke Daftar
          </button>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={t("security.patrolDetail")}>
      {/* Header Card */}
      <Card hover={false}>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 12,
              color: theme.colors.textMuted,
              marginBottom: 4,
            }}
          >
            ID: #{patrol.id}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            {patrol.area_text || "Patroli Umum"}
          </div>
        </div>
      </Card>

      {/* Details Card */}
      <Card hover={false}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            color: theme.colors.textMain,
          }}
        >
          Detail Patroli
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Waktu Mulai
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              🕐 {formatTime(patrol.start_time)} • {formatDateTime(patrol.start_time)}
            </div>
          </div>
          {patrol.end_time && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  marginBottom: 4,
                }}
              >
                Waktu Selesai
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                🕐 {formatTime(patrol.end_time)} • {formatDateTime(patrol.end_time)}
              </div>
            </div>
          )}
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Durasi
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              ⏱️ {getDuration(patrol.start_time, patrol.end_time)}
            </div>
          </div>
          {patrol.notes && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  marginBottom: 4,
                }}
              >
                Catatan
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: theme.colors.textMain,
                }}
              >
                {patrol.notes}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* GPS Track Map */}
      {patrol.gps_tracks && patrol.gps_tracks.length > 0 && (
        <Card hover={false}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
              color: theme.colors.textMain,
            }}
          >
            Rute GPS
          </h3>
          <MapView
            center={
              patrol.gps_tracks.length > 0
                ? [patrol.gps_tracks[0].latitude, patrol.gps_tracks[0].longitude]
                : [-6.2088, 106.8456]
            }
            markers={getGPSMarkers()}
            tracks={getGPSTrack()}
            height="300px"
          />
        </Card>
      )}

      {/* Timeline */}
      {patrol.timeline && patrol.timeline.length > 0 && (
        <Card hover={false}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
              color: theme.colors.textMain,
            }}
          >
            Timeline
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {patrol.timeline.map((event: any, index: number) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: 12,
                  paddingLeft: 8,
                  borderLeft: `2px solid ${
                    event.type === "START"
                      ? theme.colors.success
                      : event.type === "END"
                      ? theme.colors.danger
                      : theme.colors.primary
                  }`,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor:
                      event.type === "START"
                        ? theme.colors.success
                        : event.type === "END"
                        ? theme.colors.danger
                        : theme.colors.primary,
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 2 }}>
                    {formatTime(event.time)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    {event.description}
                  </div>
                  {event.location && (
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      📍 {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Checkpoint Scans */}
      {patrol.checkpoint_scans && patrol.checkpoint_scans.length > 0 && (
        <Card hover={false}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
              color: theme.colors.textMain,
            }}
          >
            Checkpoint Scans ({patrol.checkpoint_scans.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {patrol.checkpoint_scans.map((scan: any, index: number) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  backgroundColor: theme.colors.bgSecondary,
                  borderRadius: 8,
                  border: `1px solid ${scan.is_valid ? theme.colors.success : theme.colors.danger}`,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  {scan.checkpoint_name}
                </div>
                <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                  {formatTime(scan.scan_time)} • {scan.scan_method}
                  {scan.is_valid ? " ✓" : " ✗"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Photo */}
      {patrol.main_photo_path && (
        <Card hover={false}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
              color: theme.colors.textMain,
            }}
          >
            Foto Patroli
          </h3>
          <div
            style={{
              aspectRatio: "16/9",
              backgroundColor: theme.colors.border,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <img
              src={`http://localhost:8000/${patrol.main_photo_path}`}
              alt="Patrol photo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement!.innerHTML =
                  '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 48px;">📷</div>';
              }}
            />
          </div>
        </Card>
      )}

      {/* Actions */}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => navigate("/security/patrol")}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: "#FFFFFF",
            color: theme.colors.textMain,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Kembali ke Daftar
        </button>
      </div>
    </MobileLayout>
  );
}

