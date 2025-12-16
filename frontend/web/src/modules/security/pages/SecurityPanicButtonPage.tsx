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
    console.log("🚨 [handlePanic] === PANIC BUTTON PRESSED ===");
    console.log("🚨 [handlePanic] Site ID:", siteId);
    console.log("🚨 [handlePanic] Selected Site:", selectedSite);
    console.log("🚨 [handlePanic] Message:", message || "(empty)");
    
    if (!confirm(t("security.confirmPanic"))) {
      console.log("⚠️ [handlePanic] User cancelled panic alert");
      return;
    }

    console.log("✅ [handlePanic] User confirmed panic alert");
    setTriggering(true);
    
    try {
      console.log("📍 [handlePanic] === STEP 1: Getting GPS Location ===");
      
      // Get GPS coordinates synchronously before sending
      let latitude = "0";
      let longitude = "0";
      let locationText = "";

      if (navigator.geolocation) {
        console.log("📍 [handlePanic] Geolocation API available");
        
        try {
          console.log("📍 [handlePanic] Requesting GPS position...");
          console.log("📍 [handlePanic] Options:", {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
          
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
          
          console.log("✅ [handlePanic] GPS location obtained:");
          console.log("📍 Latitude:", latitude);
          console.log("📍 Longitude:", longitude);
          console.log("📍 Accuracy:", position.coords.accuracy, "meters");
          console.log("📍 Location Text:", locationText);
          
          // Also update location in database for tracking
          console.log("📍 [handlePanic] Updating location in database...");
          try {
            const { updateLocation } = await import("../../../api/securityApi");
            await updateLocation({
              site_id: siteId,
              latitude,
              longitude,
              accuracy: String(position.coords.accuracy || 0),
            });
            console.log("✅ [handlePanic] Location updated in database");
          } catch (locErr) {
            // Ignore location update errors, panic alert is more important
            console.warn("⚠️ [handlePanic] Failed to update location (continuing anyway):", locErr);
          }
        } catch (error: any) {
          console.error("❌ [handlePanic] GPS error:");
          console.error("❌ Error name:", error?.name);
          console.error("❌ Error code:", error?.code);
          console.error("❌ Error message:", error?.message);
          console.error("❌ Full error:", error);
          
          showToast(t("security.gpsNotAvailableWarning"), "warning");
          console.log("⚠️ [handlePanic] Continuing with default location (0, 0)");
        }
      } else {
        console.error("❌ [handlePanic] Geolocation API not available in this browser");
      }

      console.log("🚨 [handlePanic] === STEP 2: Sending Panic Alert ===");
      
      const panicPayload = {
        site_id: siteId,
        alert_type: "panic" as const,
        latitude,
        longitude,
        location_text: locationText || selectedSite?.name || "Unknown",
        message: message || undefined,
      };
      
      console.log("🚨 [handlePanic] Panic alert payload:", panicPayload);
      console.log("🚨 [handlePanic] Calling triggerPanicAlert API...");
      
      const response = await triggerPanicAlert(panicPayload);
      
      console.log("✅ [handlePanic] Panic alert sent successfully!");
      console.log("✅ [handlePanic] Response:", response);

      showToast(t("security.panicSent"), "success");
      setMessage("");
      
      console.log("🎉 [handlePanic] === PANIC ALERT COMPLETED ===");
    } catch (err: any) {
      console.error("❌ [handlePanic] === ERROR OCCURRED ===");
      console.error("❌ [handlePanic] Error object:", err);
      console.error("❌ [handlePanic] Error details:", {
        message: err?.message,
        response: err?.response,
        responseData: err?.response?.data,
        responseDetail: err?.response?.data?.detail,
        stack: err?.stack
      });
      
      console.error("Failed to trigger panic:", err);
      showToast(t("security.panicFailed"), "error");
    } finally {
      console.log("🔚 [handlePanic] Setting triggering to false");
      setTriggering(false);
      console.log("🏁 [handlePanic] handlePanic function completed");
    }
  };

  console.log("🔄 [SecurityPanicButtonPage] Component rendered");
  console.log("🔄 Current state:", {
    triggering,
    messageLength: message.length,
    siteId,
    siteName: selectedSite?.name
  });

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
            onChange={(e) => {
              const newMessage = e.target.value;
              console.log("✏️ [Message Input] Changed:", newMessage.substring(0, 50) + (newMessage.length > 50 ? "..." : ""));
              setMessage(newMessage);
            }}
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
          onClick={() => {
            console.log("🔴 [Panic Button] Button clicked!");
            handlePanic();
          }}
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