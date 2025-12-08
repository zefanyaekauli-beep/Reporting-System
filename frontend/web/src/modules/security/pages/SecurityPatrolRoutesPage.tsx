// frontend/web/src/modules/security/pages/SecurityPatrolRoutesPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { QRScanner } from "../../shared/components/QRScanner";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import {
  listPatrolRoutes,
  scanCheckpoint,
  getMissedCheckpoints,
  type PatrolRoute,
  type ScanCheckpointPayload,
} from "../../../api/securityApi";
import { theme } from "../../shared/components/theme";

export function SecurityPatrolRoutesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const [routes, setRoutes] = useState<PatrolRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState<{
    route: PatrolRoute;
    checkpoint: any;
  } | null>(null);

  useEffect(() => {
    loadRoutes();
  }, [selectedSite]);

  async function loadRoutes() {
    try {
      setLoading(true);
      const { data } = await listPatrolRoutes({
        site_id: selectedSite?.id,
        is_active: true,
      });
      setRoutes(data);
    } catch (error: any) {
      showToast(t("common.error"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleScanClick(route: PatrolRoute, checkpoint: any) {
    if (checkpoint.qr_code) {
      // Open QR scanner
      setCurrentCheckpoint({ route, checkpoint });
      setShowQRScanner(true);
    } else if (checkpoint.nfc_code) {
      // For NFC, we'll use manual entry or NFC API if available
      await handleScanSubmit(route, checkpoint, checkpoint.nfc_code, "NFC");
    } else {
      showToast(t("security.noScanCode"), "error");
    }
  }

  async function handleScanSubmit(
    route: PatrolRoute,
    checkpoint: any,
    scanCode: string,
    method: "NFC" | "QR"
  ) {
    try {
      setScanning(true);
      
      // Get GPS location if available
      let latitude: string | null = null;
      let longitude: string | null = null;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 0,
            });
          });
          latitude = String(position.coords.latitude);
          longitude = String(position.coords.longitude);
        } catch (err) {
          // GPS not available, continue without it
        }
      }

      const payload: ScanCheckpointPayload = {
        route_id: route.id,
        checkpoint_id: checkpoint.id,
        scan_code: scanCode,
        scan_method: method,
        latitude,
        longitude,
      };

      await scanCheckpoint(payload);
      showToast("Checkpoint scanned successfully", "success");
      loadRoutes();
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Scan failed", "error");
    } finally {
      setScanning(false);
    }
  }

  function handleQRScanSuccess(decodedText: string) {
    if (currentCheckpoint) {
      handleScanSubmit(
        currentCheckpoint.route,
        currentCheckpoint.checkpoint,
        decodedText,
        "QR"
      );
      setShowQRScanner(false);
      setCurrentCheckpoint(null);
    }
  }

  async function checkMissed(routeId: number) {
    try {
      const { data } = await getMissedCheckpoints({
        route_id: routeId,
        shift_date: new Date().toISOString().split("T")[0],
      });
      if (data.missed && data.missed.length > 0) {
        showToast(
          `${data.missed.length} missed checkpoints`,
          "warning"
        );
      } else {
        showToast("All checkpoints completed", "success");
      }
    } catch (error: any) {
      showToast("Error checking missed checkpoints", "error");
    }
  }

  return (
    <MobileLayout
      title={t("security.patrolRoutes")}
      showBack
      onBackClick={() => navigate("/security")}
    >
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ color: theme.colors.textSecondary }}>Loading...</div>
          </div>
        ) : routes.length === 0 ? (
          <Card>
          <Card>
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ color: theme.colors.textSecondary }}>
                {t("security.noPatrolRoutes")}
              </div>
            </div>
          </Card>
          </Card>
        ) : (
          routes.map((route) => (
            <Card key={route.id} style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, color: theme.colors.text }}>
                    {route.name}
                  </h3>
                  {route.description && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: theme.colors.textSecondary,
                        fontSize: "14px",
                      }}
                    >
                      {route.description}
                    </p>
                  )}
                </div>
                <StatusBadge
                  status={route.is_active ? "active" : "inactive"}
                />
              </div>

              <div style={{ marginTop: "16px" }}>
                <div
                  style={{
                    fontSize: "14px",
                    color: theme.colors.textSecondary,
                    marginBottom: "8px",
                  }}
                >
                  {route.checkpoints.length} {t("security.checkpoints")}
                </div>
                {route.checkpoints.map((cp, idx) => (
                  <div
                    key={cp.id}
                    style={{
                      padding: "12px",
                      background: theme.colors.backgroundSecondary,
                      borderRadius: "8px",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, color: theme.colors.text }}>
                        {idx + 1}. {cp.name}
                      </div>
                      {cp.location && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: theme.colors.textSecondary,
                            marginTop: "4px",
                          }}
                        >
                          {cp.location}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleScanClick(route, cp)}
                      disabled={scanning}
                      style={{
                        padding: "8px 16px",
                        background: theme.colors.primary,
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: scanning ? "not-allowed" : "pointer",
                      }}
                    >
                      {cp.qr_code ? t("security.scanQR") : cp.nfc_code ? t("security.scanNFC") : t("security.scan")}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => checkMissed(route.id)}
                style={{
                  width: "100%",
                  marginTop: "12px",
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
                {t("security.checkMissed")}
              </button>
            </Card>
          ))
        )}

        {showQRScanner && (
          <QRScanner
            onScanSuccess={handleQRScanSuccess}
            onScanError={(error) => showToast(`Scan error: ${error}`, "error")}
            onClose={() => {
              setShowQRScanner(false);
              setCurrentCheckpoint(null);
            }}
          />
        )}
      </div>
    </MobileLayout>
  );
}

