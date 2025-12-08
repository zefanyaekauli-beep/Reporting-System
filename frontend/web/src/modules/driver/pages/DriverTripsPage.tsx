// frontend/web/src/modules/driver/pages/DriverTripsPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import { useAuthStore } from "../../../stores/authStore";
import {
  listTrips,
  DriverTripWithDetails,
} from "../../../api/driverApi";
import { theme } from "../../shared/components/theme";
import { usePullToRefresh } from "../../shared/hooks/usePullToRefresh";

export function DriverTripsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [trips, setTrips] = useState<DriverTripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadTrips = async () => {
    try {
      setLoading(true);
      const { data } = await listTrips({
        site_id: selectedSite?.id,
        driver_id: user?.id,
        trip_date: dateFilter,
      });
      setTrips(data);
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Gagal memuat trip", "error");
    } finally {
      setLoading(false);
    }
  };

  const { containerRef, isRefreshing } = usePullToRefresh(loadTrips);

  useEffect(() => {
    loadTrips();
  }, [selectedSite, dateFilter, user]);

  function getStatusColor(status: string) {
    switch (status) {
      case "PLANNED":
        return "info";
      case "IN_PROGRESS":
        return "warning";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "danger";
      default:
        return "info";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "PLANNED":
        return "Terjadwal";
      case "IN_PROGRESS":
        return "Berlangsung";
      case "COMPLETED":
        return "Selesai";
      case "CANCELLED":
        return "Dibatalkan";
      default:
        return status;
    }
  }

  function formatTime(timeStr: string | null | undefined) {
    if (!timeStr) return "-";
    try {
      const time = new Date(`2000-01-01T${timeStr}`);
      return time.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timeStr;
    }
  }

  return (
    <MobileLayout title="Trip Saya">
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

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ color: theme.colors.textSecondary }}>
              {t("common.loading")}
            </div>
          </div>
        ) : trips.length === 0 ? (
          <Card>
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ color: theme.colors.textSecondary }}>
                Tidak ada trip ditemukan
              </div>
            </div>
          </Card>
        ) : (
          trips.map((trip) => (
            <Card
              key={trip.id}
              style={{
                marginBottom: "16px",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/driver/trips/${trip.id}`)}
            >
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
                    {trip.vehicle?.plate_number || `Trip #${trip.id}`}
                  </h3>
                  <div
                    style={{
                      fontSize: "14px",
                      color: theme.colors.textSecondary,
                      marginTop: "4px",
                    }}
                  >
                    {formatTime(trip.planned_start_time)} -{" "}
                    {formatTime(trip.planned_end_time)}
                  </div>
                </div>
                <StatusBadge status={getStatusColor(trip.status)}>
                  {getStatusLabel(trip.status)}
                </StatusBadge>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  paddingTop: "12px",
                  borderTop: `1px solid ${theme.colors.border}`,
                  fontSize: "12px",
                  color: theme.colors.textSecondary,
                }}
              >
                <div>
                  <strong>Kendaraan:</strong> {trip.vehicle?.make} {trip.vehicle?.model}
                </div>
                {trip.stops.length > 0 && (
                  <div>
                    <strong>Stops:</strong> {trip.stops.length}
                  </div>
                )}
              </div>

              {trip.status === "PLANNED" && !trip.pre_trip_completed && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "8px",
                    background: "#fef3c7",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#92400e",
                  }}
                >
                  ⚠️ Pre-trip checklist belum selesai
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </MobileLayout>
  );
}

