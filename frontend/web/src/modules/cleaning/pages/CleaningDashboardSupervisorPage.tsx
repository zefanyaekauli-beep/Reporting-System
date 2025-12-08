// frontend/web/src/modules/cleaning/pages/CleaningDashboardSupervisorPage.tsx

import { useState, useEffect } from "react";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import {
  getCleaningDashboard,
  CleaningZoneWithTasks,
} from "../../../api/cleaningApi";
import { theme } from "../../shared/components/theme";
import { usePullToRefresh } from "../../shared/hooks/usePullToRefresh";

export function CleaningDashboardSupervisorPage() {
  const { t } = useTranslation();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const [zones, setZones] = useState<CleaningZoneWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await getCleaningDashboard({
        site_id: selectedSite?.id,
        date_filter: dateFilter,
      });
      setZones(data);
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Gagal memuat dashboard",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const { containerRef, isRefreshing } = usePullToRefresh(loadDashboard);

  useEffect(() => {
    loadDashboard();
  }, [selectedSite, dateFilter]);

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

  function getKPIStatusColor(kpiStatus?: string | null) {
    switch (kpiStatus) {
      case "OK":
        return theme.colors.success;
      case "WARN":
        return theme.colors.warning;
      case "FAIL":
        return theme.colors.danger;
      default:
        return theme.colors.textSecondary;
    }
  }

  function getKPIStatusLabel(kpiStatus?: string | null) {
    switch (kpiStatus) {
      case "OK":
        return "✓ Baik";
      case "WARN":
        return "⚠ Perhatian";
      case "FAIL":
        return "✗ Gagal";
      default:
        return "-";
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

  const stats = {
    total: zones.length,
    completed: zones.filter((z) => z.status === "CLEANED_ON_TIME").length,
    partial: zones.filter((z) => z.status === "PARTIAL").length,
    notDone: zones.filter((z) => z.status === "NOT_DONE").length,
  };

  return (
    <MobileLayout title="Dashboard Pembersihan">
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

        {/* Date Filter */}
        <Card style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
              color: theme.colors.text,
            }}
          >
            Tanggal
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
        </Card>

        {/* Stats Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <Card>
            <div style={{ fontSize: "12px", color: theme.colors.textSecondary }}>
              Total Zona
            </div>
            <div style={{ fontSize: "24px", fontWeight: 600, marginTop: "4px" }}>
              {stats.total}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: "12px", color: theme.colors.textSecondary }}>
              Selesai
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                marginTop: "4px",
                color: theme.colors.success,
              }}
            >
              {stats.completed}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: "12px", color: theme.colors.textSecondary }}>
              Sebagian
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                marginTop: "4px",
                color: theme.colors.warning,
              }}
            >
              {stats.partial}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: "12px", color: theme.colors.textSecondary }}>
              Belum
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                marginTop: "4px",
                color: theme.colors.danger,
              }}
            >
              {stats.notDone}
            </div>
          </Card>
        </div>

        {/* Zones List */}
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
                Tidak ada zona ditemukan
              </div>
            </div>
          </Card>
        ) : (
          zones.map((zoneTask) => (
            <Card key={zoneTask.zone.id} style={{ marginBottom: "16px" }}>
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
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {zoneTask.completed_count} / {zoneTask.task_count} tugas
                  </div>
                  {zoneTask.last_cleaned_at && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: theme.colors.textSecondary,
                        marginTop: "4px",
                      }}
                    >
                      Terakhir: {new Date(zoneTask.last_cleaned_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  {zoneTask.kpi_status && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: getKPIStatusColor(zoneTask.kpi_status),
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      {getKPIStatusLabel(zoneTask.kpi_status)}
                    </div>
                  )}
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
              </div>
            </Card>
          ))
        )}
      </div>
    </MobileLayout>
  );
}

