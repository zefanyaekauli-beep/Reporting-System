// frontend/web/src/modules/cleaning/pages/CleaningQRScanPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { QRScanner } from "../../shared/components/QRScanner";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import { useAuthStore } from "../../../stores/authStore";
import {
  getZoneChecklist,
  ZoneChecklist,
} from "../../../api/cleaningApi";
import {
  getZonesForSync,
  ZoneForSync,
} from "../../../api/syncApi";
import {
  getGPSWithDetection,
  saveOfflineEvent,
  isOnline,
  getDeviceId,
} from "../../../utils/offlineStorage";
import { theme } from "../../shared/components/theme";

export function CleaningQRScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [showScanner, setShowScanner] = useState(true);
  const [zones, setZones] = useState<ZoneForSync[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadZones();
  }, [selectedSite]);

  async function loadZones() {
    try {
      const { data } = await getZonesForSync({
        site_id: selectedSite?.id,
      });
      setZones(data);
    } catch (error: any) {
      console.error("Failed to load zones:", error);
    }
  }

  async function handleQRScanSuccess(decodedText: string) {
    setShowScanner(false);
    setLoading(true);

    try {
      // Find zone by QR code
      const zone = zones.find((z) => z.qr_code === decodedText);

      if (!zone) {
        showToast("QR code tidak dikenali", "error");
        setShowScanner(true);
        setLoading(false);
        return;
      }

      // Get GPS
      let gps: any = null;
      let mockLocation = false;
      try {
        const gpsData = await getGPSWithDetection();
        gps = {
          lat: gpsData.latitude,
          lng: gpsData.longitude,
          accuracy: gpsData.accuracy,
          mock_location: gpsData.mock_location,
        };
        mockLocation = gpsData.mock_location;

        // Check geofence if available
        if (zone.geofence && zone.geofence.latitude && zone.geofence.longitude) {
          const distance = calculateDistance(
            parseFloat(zone.geofence.latitude!),
            parseFloat(zone.geofence.longitude!),
            parseFloat(gps.lat),
            parseFloat(gps.lng)
          );
          const radius = zone.geofence.radius_meters || 20;

          if (distance > radius) {
            showToast(
              `Peringatan: Anda berada di luar area ${zone.name} (${Math.round(distance)}m dari lokasi)`,
              "warning"
            );
          }
        }

        if (mockLocation) {
          showToast(
            "Peringatan: Mock location terdeteksi. Laporan mungkin tidak dianggap valid.",
            "warning"
          );
        }
      } catch (gpsError) {
        console.warn("GPS not available:", gpsError);
        showToast("GPS tidak tersedia, lanjutkan tanpa GPS", "warning");
      }

      // Save offline event for tracking
      const eventTime = new Date().toISOString();
      try {
        await saveOfflineEvent({
          type: "CLEANING_CHECK",
          event_time: eventTime,
          payload: {
            zone_id: zone.id,
            user_id: user?.id,
            gps: gps,
            qr_code: decodedText,
          },
        });
      } catch (offlineError) {
        console.warn("Failed to save offline event:", offlineError);
      }

      // Get or create checklist and navigate
      try {
        const { data: checklist } = await getZoneChecklist(zone.id);
        
        // Navigate to checklist page
        navigate(`/cleaning/zones/${zone.id}/checklist`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          showToast("Template checklist tidak ditemukan untuk zona ini. Silakan hubungi supervisor.", "error");
        } else {
          showToast("Gagal memuat checklist: " + (error.response?.data?.detail || error.message), "error");
        }
        setShowScanner(true);
      }
    } catch (error: any) {
      showToast("Error memproses QR code", "error");
      setShowScanner(true);
    } finally {
      setLoading(false);
    }
  }

  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  if (showScanner) {
    return (
      <MobileLayout title="Scan QR Code">
        <div style={{ padding: "16px", paddingBottom: "80px" }}>
          <div style={{ marginBottom: "16px" }}>
            <p style={{ color: theme.colors.textSecondary, fontSize: "14px" }}>
              Arahkan kamera ke QR code di zona pembersihan
            </p>
          </div>
          <QRScanner
            onScanSuccess={handleQRScanSuccess}
            onScanError={(error) => {
              console.error("QR scan error:", error);
            }}
            onClose={() => navigate("/cleaning/tasks")}
          />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Memproses...">
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ color: theme.colors.textSecondary }}>
          {t("common.loading")}
        </div>
      </div>
    </MobileLayout>
  );
}

