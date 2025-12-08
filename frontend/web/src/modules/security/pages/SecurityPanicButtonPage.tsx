// frontend/web/src/modules/security/pages/SecurityPanicButtonPage.tsx

import { useState } from "react";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../../shared/components/Toast";
import { useSite } from "../../shared/contexts/SiteContext";
import { triggerPanicAlert } from "../../../api/securityApi";

export function SecurityPanicButtonPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { selectedSite } = useSite();
  const siteId = selectedSite?.id || 1;

  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState("");

  const handlePanic = async () => {
    if (!confirm(t("security.confirmPanic"))) {
      return;
    }

    setTriggering(true);
    try {
      // Get GPS coordinates synchronously before sending
      let latitude = "0";
      let longitude = "0";
      let locationText = "";

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0, // Force fresh GPS reading
              }
            );
          });
          
          latitude = position.coords.latitude.toString();
          longitude = position.coords.longitude.toString();
          locationText = `Lat: ${latitude}, Lng: ${longitude}`;
          
          // Also update location in database for tracking
          try {
            const { updateLocation } = await import("../../../api/securityApi");
            await updateLocation({
              site_id: siteId,
              latitude,
              longitude,
              accuracy: String(position.coords.accuracy || 0),
            });
          } catch (locErr) {
            // Ignore location update errors, panic alert is more important
            console.warn("Failed to update location:", locErr);
          }
        } catch (error) {
          console.warn("GPS not available:", error);
          showToast(t("security.gpsNotAvailableWarning"), "warning");
        }
      }

      await triggerPanicAlert({
        site_id: siteId,
        alert_type: "panic",
        latitude,
        longitude,
        location_text: locationText || selectedSite?.name || "Unknown",
        message: message || undefined,
      });

      showToast(t("security.panicSent"), "success");
      setMessage("");
    } catch (err: any) {
      console.error("Failed to trigger panic:", err);
      showToast(t("security.panicFailed"), "error");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <MobileLayout title={t("security.panicButton")}>
      <div style={{ padding: "20px 0" }}>
        {/* Warning */}
        <div
          style={{
            backgroundColor: "#FEE2E2",
            border: `2px solid ${theme.colors.danger}`,
            borderRadius: theme.radius.card,
            padding: 16,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🚨</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.colors.danger,
              marginBottom: 4,
            }}
          >
            PANIC BUTTON
          </div>
          <div
            style={{
              fontSize: 12,
              color: theme.colors.textMain,
            }}
          >
            Gunakan hanya dalam keadaan darurat
          </div>
        </div>

        {/* Message Input */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
              color: theme.colors.textMain,
            }}
          >
            Pesan (Opsional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Jelaskan situasi darurat..."
            style={{
              width: "100%",
              padding: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.card,
              fontSize: 14,
              fontFamily: "inherit",
              minHeight: 100,
              resize: "vertical",
            }}
          />
        </div>

        {/* Panic Button */}
        <button
          onClick={handlePanic}
          disabled={triggering}
          style={{
            width: "100%",
            padding: "20px",
            backgroundColor: theme.colors.danger,
            color: "#FFFFFF",
            border: "none",
            borderRadius: theme.radius.card,
            fontSize: 18,
            fontWeight: 700,
            cursor: triggering ? "not-allowed" : "pointer",
            opacity: triggering ? 0.6 : 1,
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {triggering ? "MENGIRIM..." : "🚨 PANIC ALERT 🚨"}
        </button>

        {/* Info */}
        <div
          style={{
            marginTop: 24,
            padding: 12,
            backgroundColor: theme.colors.background,
            borderRadius: theme.radius.card,
            fontSize: 12,
            color: theme.colors.textMuted,
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: 4, fontWeight: 600 }}>
            Apa yang terjadi saat panic button ditekan?
          </div>
          <div>
            • Alert langsung dikirim ke control room
            <br />
            • Lokasi GPS Anda dikirim otomatis
            <br />
            • Supervisor akan segera dihubungi
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

