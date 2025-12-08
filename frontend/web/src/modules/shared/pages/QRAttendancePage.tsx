// frontend/web/src/modules/shared/pages/QRAttendancePage.tsx

import { useState, useEffect, useRef } from "react";
import { MobileLayout } from "../components/MobileLayout";
import { theme } from "../components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../components/Toast";
import { useAuthStore } from "../../../stores/authStore";
import { scanQRAttendance, getAttendanceStatus, AttendanceStatus } from "../../../api/attendanceApi";
import { Html5Qrcode } from "html5-qrcode";

type RoleType = "SECURITY" | "CLEANING" | "DRIVER" | "PARKING";

interface QRAttendancePageProps {
  roleType: RoleType;
}

export function QRAttendancePage({ roleType }: QRAttendancePageProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "on_shift" | "not_clocked_in">("loading");
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceStatus["current_attendance"]>(null);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanPaused, setScanPaused] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchStatus();
    
    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext && window.location.protocol !== "http:" || 
        (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && window.location.protocol !== "https:")) {
      console.warn("Camera access may require HTTPS on mobile devices");
    }
    
    // Start scanner after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 500);
    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [roleType]);

  const startScanner = async () => {
    if (scanning || scanPaused) return;
    
    try {
      const html5QrCode = new Html5Qrcode("qr-scanner-attendance");
      setScanning(true);
      setErrorMsg(""); // Clear any previous errors
      
      // Try to get available cameras first
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length === 0) {
        throw new Error("Tidak ada kamera yang ditemukan");
      }
      
      // Find back camera (environment) or use first available
      let cameraId: string | MediaTrackConstraints = { facingMode: "environment" };
      const backCamera = devices?.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"));
      if (backCamera) {
        cameraId = backCamera.id;
      } else if (devices && devices.length > 0) {
        cameraId = devices[0].id;
      }
      
      // Calculate QR box size based on viewport (better for mobile)
      const container = scannerContainerRef.current;
      const qrboxSize = container ? Math.min(container.offsetWidth - 40, 300) : 250;
      
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        (decodedText) => {
          if (!scanPaused && !isSubmitting && decodedText) {
            handleScan(decodedText);
          }
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
        }
      );
      
      scannerRef.current = html5QrCode;
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      let errorMessage = "Gagal membuka kamera";
      
      if (err.name === "NotAllowedError" || err.message?.includes("permission") || err.message?.includes("Permission denied")) {
        errorMessage = "Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.";
      } else if (err.name === "NotFoundError" || err.message?.includes("camera") || err.message?.includes("kamera") || err.message?.includes("No camera")) {
        errorMessage = "Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.";
      } else if (err.name === "NotReadableError" || err.message?.includes("readable") || err.message?.includes("in use")) {
        errorMessage = "Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.";
      } else if (err.message?.includes("HTTPS") || err.message?.includes("secure context") || (!window.isSecureContext && window.location.protocol !== "http:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")) {
        errorMessage = "Browser memerlukan HTTPS untuk akses kamera. Gunakan HTTPS atau test di localhost.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setErrorMsg(errorMessage);
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

  const fetchStatus = async () => {
    try {
      const data = await getAttendanceStatus(roleType);
      setStatus(data.status);
      setCurrentAttendance(data.current_attendance);
    } catch (err: any) {
      console.error(err);
      setStatus("not_clocked_in");
      setCurrentAttendance(null);
    }
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("GPS tidak didukung"));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const takePhoto = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment"; // mobile: open camera
      input.onchange = () => {
        if (input.files && input.files[0]) {
          resolve(input.files[0]);
        } else {
          reject(new Error("Foto tidak diambil"));
        }
      };
      input.onerror = () => {
        reject(new Error("Gagal membuka kamera untuk foto"));
      };
      input.click();
    });
  };


  const handleScan = async (qrText: string) => {
    if (!qrText || isSubmitting || scanPaused) return;

    setIsSubmitting(true);
    setScanPaused(true);
    setErrorMsg("");
    setMessage("");
    
    // Pause scanner temporarily
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause();
      } catch (err) {
        // Ignore pause errors
      }
    }

    try {
      // Get GPS location (optional, continue even if fails)
      let location: { latitude: number | null; longitude: number | null; accuracy: number | null } = {
        latitude: null,
        longitude: null,
        accuracy: null,
      };
      try {
        const gps = await getLocation();
        location = gps;
      } catch (err) {
        console.warn("GPS failed:", err);
        // Continue without GPS
      }

      // Take photo
      const photo = await takePhoto();

      // Submit to backend
      const result = await scanQRAttendance({
        qr_data: qrText,
        role_type: roleType,
        lat: location.latitude ?? undefined,
        lng: location.longitude ?? undefined,
        accuracy: location.accuracy ?? undefined,
        photo,
      });

      // Show success message
      if (result.action === "clock_in") {
        setMessage(`✅ Clock IN di ${result.site_name}`);
        showToast(`Clock IN di ${result.site_name}`, "success");
      } else {
        setMessage(`✅ Clock OUT di ${result.site_name}`);
        showToast(`Clock OUT di ${result.site_name}`, "success");
      }

      // Refresh status
      await fetchStatus();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Scan gagal";
      setErrorMsg(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
      // Resume scanner after a delay
      setTimeout(async () => {
        setScanPaused(false);
        if (scannerRef.current) {
          try {
            await scannerRef.current.resume();
          } catch (err) {
            // If resume fails, restart scanner
            stopScanner();
            setTimeout(() => startScanner(), 500);
          }
        }
      }, 2000);
    }
  };

  const getRoleLabel = () => {
    switch (roleType) {
      case "SECURITY":
        return "Security";
      case "CLEANING":
        return "Pembersihan";
      case "DRIVER":
        return "Driver";
      case "PARKING":
        return "Parkir";
      default:
        return "Staff";
    }
  };

  return (
    <MobileLayout title={`QR Attendance - ${getRoleLabel()}`}>
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {/* Status Card */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 16,
            boxShadow: theme.shadowCard,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Status
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 8px",
                borderRadius: theme.radius.pill,
                fontSize: 11,
                fontWeight: 600,
                backgroundColor:
                  status === "on_shift"
                    ? theme.colors.success + "20"
                    : theme.colors.backgroundSecondary,
                color:
                  status === "on_shift"
                    ? theme.colors.success
                    : theme.colors.textSecondary,
              }}
            >
              {status === "on_shift" ? "Sedang Bekerja" : "Belum Clock In"}
            </div>
            {currentAttendance && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: theme.colors.textSoft,
                }}
              >
                Di {currentAttendance.site_name}
              </div>
            )}
          </div>
          <button
            onClick={fetchStatus}
            style={{
              fontSize: 11,
              padding: "6px 12px",
              borderRadius: theme.radius.pill,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMain,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {/* QR Scanner */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 16,
            boxShadow: theme.shadowCard,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              color: theme.colors.textMuted,
              marginBottom: 8,
            }}
          >
            Scan QR Code
          </div>
          <div
            ref={scannerContainerRef}
            style={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#000",
              aspectRatio: "1",
              position: "relative",
            }}
          >
            {scanPaused ? (
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
            ) : (
              <div
                id="qr-scanner-attendance"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            )}
          </div>
          <p
            style={{
              marginTop: 8,
              fontSize: 11,
              color: theme.colors.textSoft,
            }}
          >
            Arahkan kamera ke QR code di area/posting ini.
          </p>
          
          {errorMsg && !scanning && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => {
                  setErrorMsg("");
                  startScanner();
                }}
                style={{
                  width: "100%",
                  fontSize: 12,
                  padding: "8px 16px",
                  borderRadius: theme.radius.pill,
                  border: `1px solid ${theme.colors.primary}`,
                  backgroundColor: theme.colors.primary,
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                🔄 Coba Lagi
              </button>
            </div>
          )}
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
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{errorMsg}</div>
            {errorMsg.includes("izin") || errorMsg.includes("permission") ? (
              <div style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}>
                💡 Tips: Buka pengaturan browser → Izin → Kamera → Izinkan
              </div>
            ) : errorMsg.includes("HTTPS") || errorMsg.includes("secure") ? (
              <div style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}>
                💡 Tips: Beberapa browser memerlukan HTTPS untuk kamera. Coba gunakan browser yang berbeda atau set up HTTPS untuk development.
              </div>
            ) : null}
          </div>
        )}

        {isSubmitting && (
          <div
            style={{
              fontSize: 11,
              color: theme.colors.textSecondary,
              textAlign: "center",
            }}
          >
            Memproses...
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

