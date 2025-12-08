// frontend/web/src/modules/security/pages/SecurityPatrolListPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { Card } from "../../shared/components/Card";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { EmptyState } from "../../shared/components/EmptyState";
import { usePullToRefresh } from "../../shared/hooks/usePullToRefresh";
import { listPatrolLogs } from "../../../api/securityApi";
import { formatDateTime, formatTime } from "../../../utils/formatDate";

export function SecurityPatrolListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patrols, setPatrols] = useState<any[]>([]);

  useEffect(() => {
    loadPatrols();
  }, []);

  const loadPatrols = async () => {
    setLoading(true);
    try {
      const { data } = await listPatrolLogs();
      setPatrols(data);
    } catch (err) {
      console.error("Failed to load patrol logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const { isRefreshing, pullProgress } = usePullToRefresh({
    onRefresh: loadPatrols,
    enabled: !loading,
  });

  const getDuration = (start: string, end?: string | null) => {
    if (!end) return "Berlangsung";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const minutes = Math.floor((endTime - startTime) / 60000);
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}j ${mins}m`;
  };

  return (
    <MobileLayout title={t("security.patrolTitle")}>
      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div
          style={{
            textAlign: "center",
            padding: 12,
            fontSize: 13,
            color: theme.colors.primary,
          }}
        >
          Memuat ulang...
        </div>
      )}
      {pullProgress > 0 && !isRefreshing && (
        <div
          style={{
            textAlign: "center",
            padding: 12,
            fontSize: 13,
            color: theme.colors.textMuted,
            transform: `translateY(${-20 + pullProgress * 20}px)`,
            opacity: pullProgress,
          }}
        >
          {pullProgress >= 1 ? "Lepas untuk memuat ulang" : "Tarik ke bawah untuk memuat ulang"}
        </div>
      )}
      
      <div data-pull-refresh>
        {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : patrols.length === 0 ? (
        <EmptyState
          icon="🚶"
          title="Belum ada patroli"
          message="Mulai patroli baru untuk mencatat aktivitas"
          action={
            <button
              onClick={() => navigate("/security/patrol")}
              style={{
                padding: "10px 20px",
                borderRadius: 9999,
                border: "none",
                backgroundColor: theme.colors.primary,
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Mulai Patroli
            </button>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {patrols.map((patrol) => (
            <Card
              key={patrol.id}
              onClick={() => navigate(`/security/patrol/${patrol.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {patrol.area_text || "Patroli Umum"}
                </div>
                {patrol.notes && (
                  <div
                    style={{
                      fontSize: 13,
                      color: theme.colors.textMuted,
                      marginBottom: 4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {patrol.notes}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.textSoft,
                    marginTop: 4,
                  }}
                >
                  🕐 {formatTime(patrol.start_time)}
                  {patrol.end_time && ` - ${formatTime(patrol.end_time)}`}
                  {patrol.end_time && (
                    <span style={{ marginLeft: 8 }}>
                      • {getDuration(patrol.start_time, patrol.end_time)}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: theme.colors.textSoft,
                    marginTop: 4,
                  }}
                >
                  {formatDateTime(patrol.start_time)}
                </div>
              </div>
              {patrol.main_photo_path && (
                <div
                  style={{
                    fontSize: 11,
                    color: theme.colors.primary,
                    marginTop: 4,
                  }}
                >
                  📷 Foto tersedia
                </div>
              )}
            </Card>
          ))}
        </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/security/patrol")}
        style={{
          position: "fixed",
          bottom: 80,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          border: "none",
          backgroundColor: theme.colors.primary,
          color: "#FFFFFF",
          fontSize: 24,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
          zIndex: 100,
        }}
      >
        +
      </button>
    </MobileLayout>
  );
}

