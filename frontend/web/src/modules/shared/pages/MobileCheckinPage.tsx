// frontend/web/src/modules/shared/pages/MobileCheckinPage.tsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../components/MobileLayout";
import { theme } from "../components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
// Toast will be handled via showToast function
import { Html5Qrcode } from "html5-qrcode";
import api from "../../../api/client";
import { getAttendanceStatus } from "../../../api/attendanceApi";

type RoleType = "SECURITY" | "CLEANING" | "DRIVER" | "PARKING";

interface MobileCheckinPageProps {
  roleType?: RoleType;
  siteName?: string;
}

export function MobileCheckinPage({ roleType = "SECURITY", siteName = "Entrance Gate" }: MobileCheckinPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Simple toast function
  const showToast = (message: string, type: "success" | "error" = "success") => {
    // Simple alert for now - can be replaced with proper toast component
    if (type === "success") {
      console.log("✅", message);
    } else {
      console.error("❌", message);
    }
  };
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  
  const [qrValue, setQrValue] = useState("");
  const [gps, setGps] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    status: "idle" | "getting" | "ready" | "error";
    error: string;
  }>({
    latitude: null,
    longitude: null,
    accuracy: null,
    status: "idle",
    error: "",
  });
  
  const [shift, setShift] = useState("");
  const [overtime, setOvertime] = useState(false);
  const [backup, setBackup] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [scanPaused, setScanPaused] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isOnShift, setIsOnShift] = useState(false);
  const [currentSiteName, setCurrentSiteName] = useState(siteName);

  // Load status and GPS on mount
  useEffect(() => {
    loadStatus();
    refreshGps();
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const loadStatus = async () => {
    try {
      const data = await getAttendanceStatus(roleType);
      setIsOnShift(data.status === "on_shift");
      if (data.current_attendance?.site_name) {
        setCurrentSiteName(data.current_attendance.site_name);
      }
    } catch (err) {
      console.error("Failed to load status:", err);
      // Default: not on shift
      setIsOnShift(false);
    }
  };

  const startScanner = async () => {
    if (scanning || scanPaused) return;
    
    try {
      const html5QrCode = new Html5Qrcode("qr-scanner-checkin");
      setScanning(true);
      setErrorMsg("");
      
      let cameraId: string | MediaTrackConstraints = { facingMode: "environment" };
      
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const backCamera = devices.find((d) => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("rear")
          );
          cameraId = backCamera ? backCamera.id : devices[0].id;
        }
      } catch (camErr) {
        cameraId = { facingMode: "environment" };
      }
      
      const container = scannerContainerRef.current;
      const qrboxSize = container ? Math.min(container.offsetWidth - 40, 300) : 250;
      
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!scanPaused && !isSubmitting && decodedText && decodedText !== qrValue) {
            setQrValue(decodedText);
            setScanPaused(true);
            setTimeout(() => setScanPaused(false), 1500);
          }
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      );
      
      scannerRef.current = html5QrCode;
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      setErrorMsg("Gagal membuka kamera: " + (err.message || "Unknown error"));
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const refreshGps = () => {
    if (!navigator.geolocation) {
      setGps((s) => ({
        ...s,
        status: "error",
        error: "GPS tidak didukung",
      }));
      return;
    }
    
    setGps((s) => ({ ...s, status: "getting", error: "" }));
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          status: "ready",
          error: "",
        });
      },
      (err) => {
        setGps({
          latitude: null,
          longitude: null,
          accuracy: null,
          status: "error",
          error: err.message || "Failed to get GPS",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleTakeSelfie = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "user"; // front camera on mobile
    input.onchange = () => {
      if (input.files && input.files[0]) {
        setPhotoFile(input.files[0]);
      }
    };
    input.click();
  };

  const handleSubmit = async () => {
    setMessage("");
    setErrorMsg("");
    
    if (!qrValue) {
      setErrorMsg("QR belum discan.");
      return;
    }
    
    if (!shift) {
      setErrorMsg("Shift belum dipilih.");
      return;
    }
    
    if (gps.status !== "ready") {
      setErrorMsg("GPS belum siap. Coba tekan Refresh GPS.");
      return;
    }
    
    setIsSubmitting(true);
    setScanPaused(true);
    
    try {
      const formData = new FormData();
      formData.append("qr_data", qrValue);
      formData.append("role_type", roleType);
      formData.append("shift", shift);
      formData.append("overtime", overtime ? "true" : "false");
      formData.append("backup", backup ? "true" : "false");
      formData.append("lat", String(gps.latitude));
      formData.append("lng", String(gps.longitude));
      formData.append("accuracy", String(gps.accuracy));
      
      // Photo is optional
      if (photoFile) {
        formData.append("photo", photoFile);
      }
      
      const response = await api.post("/attendance/scan-qr", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      const data = response.data;
      
      // Update status after successful submission
      await loadStatus();
      
      if (data.action === "clock_in" || data.clock_out_time === null) {
        setMessage(`✅ Absen MASUK di ${data.site_name}`);
        showToast(`Absen MASUK di ${data.site_name}`, "success");
        setIsOnShift(true);
        if (data.site_name) {
          setCurrentSiteName(data.site_name);
        }
      } else {
        setMessage(`✅ Absen PULANG di ${data.site_name}`);
        showToast(`Absen PULANG di ${data.site_name}`, "success");
        setIsOnShift(false);
      }
      
      // Clear state for next scan
      setQrValue("");
      setPhotoFile(null);
      
      setTimeout(() => {
        setMessage("");
        // Don't navigate away, allow for next scan
      }, 2000);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Gagal mengirim absen";
      setErrorMsg(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
      setScanPaused(false);
    }
  };

  const currentPosText =
    gps.status === "ready"
      ? `${gps.latitude?.toFixed(6)}, ${gps.longitude?.toFixed(6)} (±${Math.round(gps.accuracy || 0)} m)`
      : gps.status === "getting"
      ? "Mengambil posisi…"
      : gps.status === "error"
      ? `GPS error: ${gps.error}`
      : "Belum diambil";

  const submitLabel = isOnShift ? "Kirim Absen Pulang" : "Kirim Absen Masuk";
  const bannerText = isOnShift
    ? "Pindai QR untuk Absen Pulang"
    : "Pindai QR untuk Absen Masuk";

  return (
    <MobileLayout title={currentSiteName} showBottomNav={false}>
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {/* QR scanner area */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 12,
            boxShadow: theme.shadowCard,
          }}
        >
          <div
            ref={scannerContainerRef}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1",
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#000",
            }}
          >
            {!scanPaused && (
              <div
                id="qr-scanner-checkin"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            )}
            {scanPaused && (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: theme.colors.textSecondary,
                }}
              >
                Scan dijeda...
              </div>
            )}
            {/* White frame overlay */}
            <div
              style={{
                pointerEvents: "none",
                position: "absolute",
                inset: "32px",
                border: "4px solid rgba(255, 255, 255, 0.8)",
                borderRadius: 24,
              }}
            />
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: theme.colors.textSoft,
              textAlign: "center",
            }}
          >
            QR terbaca:{" "}
            {qrValue ? (
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: theme.colors.success,
                }}
              >
                {qrValue}
              </span>
            ) : (
              <span style={{ color: theme.colors.textMuted }}>Belum</span>
            )}
          </div>
        </div>

        {/* GPS Position */}
        <div
          style={{
            fontSize: 11,
            color: theme.colors.textMain,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>
            Posisi saat ini:{" "}
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: theme.colors.success,
              }}
            >
              {currentPosText}
            </span>
          </span>
          <button
            onClick={refreshGps}
            style={{
              padding: "4px 12px",
              fontSize: 10,
              borderRadius: theme.radius.pill,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMain,
              cursor: "pointer",
            }}
          >
            Refresh GPS
          </button>
        </div>

        {/* Banner Text */}
        <div
          style={{
            backgroundColor: theme.colors.primary,
            color: "#fff",
            fontSize: 11,
            textAlign: "center",
            padding: "8px 12px",
            borderRadius: theme.radius.pill,
            marginBottom: 12,
            fontWeight: 500,
            boxShadow: theme.shadowSoft,
          }}
        >
          {bannerText}
        </div>

        {/* Messages */}
        {message && (
          <div
            style={{
              backgroundColor: theme.colors.success + "20",
              border: `1px solid ${theme.colors.success}`,
              color: theme.colors.success,
              fontSize: 13,
              borderRadius: theme.radius.card,
              padding: "10px 12px",
              marginBottom: 12,
            }}
          >
            {message}
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              backgroundColor: theme.colors.danger + "20",
              border: `1px solid ${theme.colors.danger}`,
              color: theme.colors.danger,
              fontSize: 13,
              borderRadius: theme.radius.card,
              padding: "10px 12px",
              marginBottom: 12,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Form controls */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 12,
            boxShadow: theme.shadowCard,
          }}
        >
          {/* Shift */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Shift
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              style={{
                width: "100%",
                borderRadius: 12,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                padding: "8px 12px",
                fontSize: 13,
                color: theme.colors.textMain,
              }}
            >
              <option value="">Pilih shift…</option>
              <option value="0">Shift 0</option>
              <option value="1">Shift 1</option>
              <option value="2">Shift 2</option>
              <option value="3">Shift 3</option>
            </select>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: theme.colors.textMain }}>Overtime</span>
              <button
                type="button"
                onClick={() => setOvertime((v) => !v)}
                style={{
                  width: 40,
                  height: 20,
                  borderRadius: theme.radius.pill,
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  backgroundColor: overtime ? theme.colors.primary : theme.colors.border,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                    transform: overtime ? "translateX(20px)" : "translateX(0)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: theme.colors.textMain }}>Backup</span>
              <button
                type="button"
                onClick={() => setBackup((v) => !v)}
                style={{
                  width: 40,
                  height: 20,
                  borderRadius: theme.radius.pill,
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  backgroundColor: backup ? theme.colors.primary : theme.colors.border,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                    transform: backup ? "translateX(20px)" : "translateX(0)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
            </label>
          </div>

          {/* Selfie */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 11, color: theme.colors.textMain }}>
              Ambil Swafoto {photoFile && "✅"}
            </div>
            <button
              type="button"
              onClick={handleTakeSelfie}
              style={{
                padding: "6px 12px",
                borderRadius: 12,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMain,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Ambil Swafoto
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: theme.radius.card,
            fontSize: 14,
            fontWeight: 600,
            backgroundColor: isSubmitting ? theme.colors.textSoft : theme.colors.primary,
            color: "#fff",
            border: "none",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? "Mengirim..." : submitLabel}
        </button>
      </div>
    </MobileLayout>
  );
}

