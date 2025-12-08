// frontend/web/src/modules/security/pages/SecurityGPSTrackingPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import {
  updateLocation,
  getLiveLocations,
  getIdleAlerts,
  type GuardLocation,
  type IdleAlert,
} from "../../../api/securityApi";
import { theme } from "../../shared/components/theme";

export function SecurityGPSTrackingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const [locations, setLocations] = useState<GuardLocation[]>([]);
  const [alerts, setAlerts] = useState<IdleAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [selectedSite]);

  async function loadData() {
    try {
      setLoading(true);
      const [locationsRes, alertsRes] = await Promise.all([
        getLiveLocations({ site_id: selectedSite?.id }),
        getIdleAlerts({ site_id: selectedSite?.id, status: "active" }),
      ]);
      setLocations(locationsRes.data);
      setAlerts(alertsRes.data);
    } catch (error: any) {
      showToast("Error loading GPS data", "error");
    } finally {
      setLoading(false);
    }
  }

  function startTracking() {
    if (!selectedSite) {
      showToast(t("security.selectSite"), "error");
      return;
    }

    if (!navigator.geolocation) {
      showToast(t("security.gpsNotAvailable"), "error");
      return;
    }

    setTracking(true);
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await updateLocation({
            site_id: selectedSite.id,
            latitude: String(position.coords.latitude),
            longitude: String(position.coords.longitude),
            accuracy: String(position.coords.accuracy),
          });
          loadData();
        } catch (error: any) {
          showToast(t("common.error"), "error");
        }
      },
      (error) => {
        showToast(t("security.gpsNotAvailable"), "error");
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
    setWatchId(id);
  }

  function stopTracking() {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTracking(false);
  }

  return (
    <MobileLayout
      title={t("security.gpsTracking")}
      showBack
      onBackClick={() => navigate("/security")}
    >
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {/* Tracking Control */}
        <Card style={{ marginBottom: "16px" }}>
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 16px", color: theme.colors.text }}>
              {t("security.liveTracking")}
            </h3>
            {!tracking ? (
              <button
                onClick={startTracking}
                style={{
                  padding: "12px 24px",
                  background: theme.colors.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("security.startTracking")}
              </button>
            ) : (
              <button
                onClick={stopTracking}
                style={{
                  padding: "12px 24px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("security.stopTracking")}
              </button>
            )}
            {tracking && (
              <div
                style={{
                  marginTop: "12px",
                  color: theme.colors.primary,
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                ● {t("security.trackingActive")}
              </div>
            )}
          </div>
        </Card>

        {/* Idle Alerts */}
        {alerts.length > 0 && (
          <Card style={{ marginBottom: "16px", border: "2px solid #ea580c" }}>
            <h3 style={{ margin: "0 0 12px", color: "#ea580c" }}>
              {t("security.idleAlerts")} ({alerts.length})
            </h3>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: "12px",
                  background: theme.colors.backgroundSecondary,
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ fontWeight: 500, color: theme.colors.text }}>
                  {t("security.guard")} #{alert.user_id}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: theme.colors.textSecondary,
                    marginTop: "4px",
                  }}
                >
                  {t("security.idleFor")} {alert.idle_duration_minutes} {t("security.minutes")}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Live Locations */}
        <Card>
          <h3 style={{ margin: "0 0 16px", color: theme.colors.text }}>
            {t("security.liveLocations")} ({locations.length})
          </h3>
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ color: theme.colors.textSecondary }}>{t("common.loading")}</div>
            </div>
          ) : locations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ color: theme.colors.textSecondary }}>
                {t("security.noActiveLocations")}
              </div>
            </div>
          ) : (
            locations.map((loc) => (
              <div
                key={loc.id}
                style={{
                  padding: "12px",
                  background: theme.colors.backgroundSecondary,
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ fontWeight: 500, color: theme.colors.text }}>
                  {t("security.guard")} #{loc.user_id}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: theme.colors.textSecondary,
                    marginTop: "4px",
                  }}
                >
                  {loc.latitude}, {loc.longitude}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: theme.colors.textSecondary,
                    marginTop: "2px",
                  }}
                >
                  {new Date(loc.timestamp).toLocaleTimeString()}
                </div>
                <a
                  href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "8px",
                    padding: "6px 12px",
                    background: theme.colors.primary,
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  {t("security.viewOnMap")}
                </a>
              </div>
            ))
          )}
        </Card>
      </div>
    </MobileLayout>
  );
}

