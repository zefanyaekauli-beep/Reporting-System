// frontend/web/src/modules/cleaning/pages/CleaningTasksPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import {
  getTodayCleaningTasks,
  CleaningZoneWithTasks,
} from "../../../api/cleaningApi";
import { theme } from "../../shared/components/theme";
import { usePullToRefresh } from "../../shared/hooks/usePullToRefresh";

export function CleaningTasksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const [zones, setZones] = useState<CleaningZoneWithTasks[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data } = await getTodayCleaningTasks({
        site_id: selectedSite?.id,
      });
      setZones(data);
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Gagal memuat tugas", "error");
    } finally {
      setLoading(false);
    }
  };

  const { containerRef, isRefreshing } = usePullToRefresh(loadTasks);

  useEffect(() => {
    loadTasks();
  }, [selectedSite]);

  function getStatusColor(status: string) {
    switch (status) {
      case "CLEANED_ON_TIME":
        return "success";
      case "PARTIAL":
        return "warning";
      case "LATE":
        return "warning";
      case "NOT_DONE":
        return "danger";
      default:
        return "info";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "CLEANED_ON_TIME":
        return "Selesai";
      case "PARTIAL":
        return "Sebagian";
      case "LATE":
        return "Terlambat";
      case "NOT_DONE":
        return "Belum";
      default:
        return status;
    }
  }

  return (
    <MobileLayout title={t("cleaning.todaysTasks") || "Tugas Hari Ini"}>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          minHeight: "100%",
          padding: "16px",
          paddingBottom: "80px",
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
            {t("security.reloading") || "Memuat ulang..."}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ color: theme.colors.textSecondary }}>
              {t("common.loading")}
            </div>
          </div>
        ) : zones.length === 0 ? (
          <Card>
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ color: theme.colors.textSecondary }}>
                Tidak ada tugas pembersihan hari ini
              </div>
            </div>
          </Card>
        ) : (
          zones.map((zoneTask) => (
            <Card
              key={zoneTask.zone.id}
              style={{
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <button
                  onClick={() => navigate("/cleaning/scan")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: theme.colors.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  📷 Scan QR
                </button>
                <button
                  onClick={() =>
                    navigate(`/cleaning/zones/${zoneTask.zone.id}/checklist`)
                  }
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: theme.colors.backgroundSecondary,
                    color: theme.colors.text,
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Buka Checklist
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: theme.colors.text }}>
                    {zoneTask.zone.name}
                  </h3>
                  {zoneTask.zone.floor && (
                    <div
                      style={{
                        fontSize: "14px",
                        color: theme.colors.textSecondary,
                        marginTop: "4px",
                      }}
                    >
                      {zoneTask.zone.floor}
                    </div>
                  )}
                </div>
                <StatusBadge status={getStatusColor(zoneTask.status)}>
                  {getStatusLabel(zoneTask.status)}
                </StatusBadge>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "12px",
                  borderTop: `1px solid ${theme.colors.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: theme.colors.textSecondary,
                  }}
                >
                  {zoneTask.completed_count} / {zoneTask.task_count} tugas
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: theme.colors.primary,
                    fontWeight: 500,
                  }}
                >
                  {zoneTask.completed_count > 0
                    ? Math.round(
                        (zoneTask.completed_count / zoneTask.task_count) * 100
                      )
                    : 0}
                  %
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </MobileLayout>
  );
}

