// frontend/web/src/modules/shared/pages/QRAttendancePage.tsx

import { useState, useEffect, useRef } from "react";
import { MobileLayout } from "../components/MobileLayout";
import { theme } from "../components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../components/Toast";
import { useAuthStore } from "../../../stores/authStore";
import { scanQRAttendance, getAttendanceStatus, AttendanceStatus } from "../../../api/attendanceApi";
import { Html5Qrcode } from "html5-qrcode";

import { useNavigate } from "react-router-dom";

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
  const videoStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [status, setStatus] = useState<"loading" | "on_shift" | "not_clocked_in">("loading");
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceStatus["current_attendance"]>(null);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanPaused, setScanPaused] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pendingQrData, setPendingQrData] = useState<string | null>(null);
  const [showPhotoPrompt, setShowPhotoPrompt] = useState(false);
  const [loadingState, setLoadingState] = useState<{
    show: boolean;
    message: string;
    progress: number;
  }>({
    show: false,
    message: "",
    progress: 0
  });
  const navigate = useNavigate();


  useEffect(() => {
    fetchStatus();
    
    // Check if we're in a secure context
    if (!window.isSecureContext && window.location.protocol !== "http:" || 
        (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && window.location.protocol !== "https:")) {
      console.warn("Camera access may require HTTPS on mobile devices");
    }
    
    // Start scanner after a short delay
    const timer = setTimeout(() => {
      startScanner();
    }, 500);
    
    return () => {
      clearTimeout(timer);
      stopScanner();
      cleanupVideoStream();
    };
  }, [roleType]);

  const cleanupVideoStream = () => {
    if (videoStreamRef.current) {
      console.log("🧹 Cleaning up video stream");
      videoStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("⏹️ Track stopped:", track.kind);
      });
      videoStreamRef.current = null;
    }
  };

  const startScanner = async () => {
    if (scanning || scanPaused) return;
    
    try {
      const html5QrCode = new Html5Qrcode("qr-scanner-attendance");
      setScanning(true);
      setErrorMsg("");
      
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
      
      // Calculate QR box size based on viewport
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
          // Ignore scanning errors
        }
      );
      
      scannerRef.current = html5QrCode;
    } catch (err: any) {
      console.error("Gagal memulai scanner:", err);
      let errorMessage = "Gagal membuka kamera";
      
      if (err.name === "NotAllowedError" || err.message?.includes("permission")) {
        errorMessage = "Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.";
      } else if (err.name === "NotFoundError" || err.message?.includes("camera")) {
        errorMessage = "Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.";
      } else if (err.name === "NotReadableError" || err.message?.includes("in use")) {
        errorMessage = "Kamera sedang digunakan oleh aplikasi lain.";
      } else if (err.message?.includes("HTTPS") || err.message?.includes("secure context")) {
        errorMessage = "Browser memerlukan HTTPS untuk akses kamera.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setErrorMsg(errorMessage);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      
      try {
        await scanner.stop();
        await scanner.clear();
        console.log("✅ Scanner stopped and cleared");
      } catch (err) {
        console.warn("⚠️ Scanner stop error (ignoring):", err);
      }
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
      console.log("📍 Getting location...");
      if (!navigator.geolocation) {
        return reject(new Error("GPS tidak didukung"));
      }
      
      const timeoutId = setTimeout(() => {
        reject(new Error("GPS timeout"));
      }, 10000);
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId);
          console.log("✅ Location obtained");
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          clearTimeout(timeoutId);
          console.warn("⚠️ Location error:", err.message);
          reject(err);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 8000, 
          maximumAge: 0 
        }
      );
    });
  };

  const handlePhotoCapture = async (file: File | null) => {
    console.log("=".repeat(60));
    console.log("📸 [handlePhotoCapture] === PHOTO CAPTURE STARTED ===");
    console.log("=".repeat(60));
    console.log("📸 Photo received:", file ? file.name : "null");
    
    if (file) {
      console.log("📸 File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
        isFile: file instanceof File,
        isBlob: file instanceof Blob
      });
      
      // Verify file is valid
      if (file.size === 0) {
        console.error("❌ ERROR: Photo file has 0 bytes!");
        setErrorMsg("Foto tidak valid (0 bytes). Silakan ambil foto lagi.");
        setPendingQrData(null);
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        console.warn("⚠️ WARNING: File type is not an image:", file.type);
      } else {
        console.log("✅ File type is valid image:", file.type);
      }
      
      // Read file as data URL to verify it's actually an image
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          console.log("✅ File can be read as data URL, length:", result.length);
          // Check if it's a valid image data URL
          if (result.startsWith("data:image/")) {
            console.log("✅ File is valid image format (verified via FileReader)");
          } else {
            console.warn("⚠️ FileReader result doesn't look like an image data URL");
          }
        }
      };
      reader.onerror = (err) => {
        console.error("❌ ERROR reading file with FileReader:", err);
      };
      reader.readAsDataURL(file);
    } else {
      console.warn("⚠️ No photo file provided - will proceed without photo");
    }
    
    if (!pendingQrData) {
      console.error("❌ No pending QR data");
      setErrorMsg("QR code tidak ditemukan. Silakan scan ulang.");
      return;
    }

    console.log("📸 Proceeding to process attendance with photo...");
    await processAttendance(pendingQrData, file);
    setPendingQrData(null);
    console.log("=".repeat(60));
    console.log("📸 [handlePhotoCapture] === PHOTO CAPTURE COMPLETED ===");
    console.log("=".repeat(60));
  };

  const processAttendance = async (qrText: string, photo: File | null) => {
    try {
      console.log("🌐 [processAttendance] === Submitting to Backend ===");
      setLoadingState({ show: true, message: "Memuat", progress: 0 });

      // Get location
      let location: { latitude: number | null; longitude: number | null; accuracy: number | null } = {
        latitude: null,
        longitude: null,
        accuracy: null,
      };
      
      try {
        const gps = await getLocation();
        location = gps;
        console.log("✅ GPS location obtained:", location);
      } catch (err) {
        console.warn("⚠️ GPS failed, continuing without location:", err);
      }

      console.log("=".repeat(60));
      console.log("🌐 [processAttendance] === PREPARING PAYLOAD ===");
      console.log("=".repeat(60));
      console.log("🌐 [processAttendance] Payload:", {
        qr_data: qrText,
        role_type: roleType,
        lat: location.latitude ?? undefined,
        lng: location.longitude ?? undefined,
        accuracy: location.accuracy ?? undefined,
        photo: photo ? { 
          name: photo.name, 
          size: photo.size, 
          type: photo.type,
          lastModified: new Date(photo.lastModified).toISOString()
        } : null
      });
      
      // CRITICAL: Verify photo before sending
      if (photo) {
        console.log("📸 [processAttendance] Photo verification:");
        console.log("  - Name:", photo.name);
        console.log("  - Size:", photo.size, "bytes");
        console.log("  - Type:", photo.type);
        console.log("  - Is File:", photo instanceof File);
        console.log("  - Is Blob:", photo instanceof Blob);
        
        if (photo.size === 0) {
          console.error("❌ ERROR: Photo size is 0 bytes - cannot send!");
          throw new Error("Foto tidak valid (0 bytes)");
        }
        
        if (photo.size > 10 * 1024 * 1024) { // 10MB
          console.warn("⚠️ WARNING: Photo is very large:", photo.size, "bytes (>10MB)");
        }
        
        console.log("✅ Photo is valid and ready to send");
      } else {
        console.warn("⚠️ No photo provided - attendance will be processed without photo");
      }
      
      console.log("=".repeat(60));
      console.log("📡 [processAttendance] === SENDING TO BACKEND ===");
      console.log("=".repeat(60));
      console.log("📡 Calling scanQRAttendance API with photo...");
      
      const result = await scanQRAttendance({
        qr_data: qrText,
        role_type: roleType,
        lat: location.latitude ?? undefined,
        lng: location.longitude ?? undefined,
        accuracy: location.accuracy ?? undefined,
        photo: photo ?? undefined,
      });
      
      console.log("=".repeat(60));
      console.log("✅ [processAttendance] === BACKEND RESPONSE RECEIVED ===");
      console.log("=".repeat(60));
      console.log("✅ [processAttendance] Backend response:", result);
      
      // Check if photo was processed
      if (photo && result) {
        console.log("=".repeat(60));
        console.log("📸 [processAttendance] === PHOTO PROCESSING STATUS ===");
        console.log("=".repeat(60));
        console.log("📸 Photo sent to backend:");
        console.log("  - Original filename:", photo.name);
        console.log("  - Original size:", photo.size, "bytes");
        console.log("  - Original type:", photo.type);
        console.log("");
        console.log("📋 Attendance result:");
        console.log("  - Action:", result.action);
        console.log("  - Site:", result.site_name);
        console.log("  - Attendance ID:", result.attendance_id);
        console.log("  - Check-in time:", result.checkin_time);
        console.log("  - Valid location:", result.is_valid_location);
        
        // CRITICAL: Check if photo_path is in response (indicates watermark was applied)
        if (result.photo_path) {
          console.log("");
          console.log("✅ WATERMARK STATUS:");
          console.log("  - Photo saved to:", result.photo_path);
          console.log("  - ✅ Watermark should have been applied by backend");
          console.log("  - 📁 Check file at:", result.photo_path);
          console.log("  - 💡 Verify watermark by opening the saved file");
        } else {
          console.log("");
          console.warn("⚠️ WATERMARK STATUS:");
          console.warn("  - ⚠️ No photo_path in response");
          console.warn("  - ⚠️ This might indicate photo was not saved or watermark failed");
          console.warn("  - 💡 Check backend logs for watermark processing details");
        }
        console.log("=".repeat(60));
      } else if (!photo) {
        console.log("ℹ️ No photo was sent - attendance processed without photo");
      }
      
      console.log("=".repeat(60));

      setLoadingState({ show: false, message: "", progress: 0 });

      if (result.action === "clock_in") {
        const msg = `✅ Clock IN di ${result.site_name}`;
        setMessage(msg);
        showToast(msg, "success");
        navigate("/security/passdown")
        
      } else {
        const msg = `✅ Clock OUT di ${result.site_name}`;
        setMessage(msg);
        showToast(msg, "success");
        navigate("/security/passdown")
        
      }

      await fetchStatus();

      setTimeout(() => {
        setMessage("");
      }, 3000);
      
    } catch (err: any) {
      console.error("❌ [processAttendance] Error:", err);
      
      setLoadingState({ show: false, message: "", progress: 0 });
      
      const errorMessage = err?.response?.data?.detail || err?.message || "Scan gagal";
      setErrorMsg(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
      setScanPaused(true);
    }
  };

  const handleScan = async (qrText: string) => {
    console.log("🔍 [handleScan] QR detected:", qrText);
    
    if (!qrText || isSubmitting || scanPaused) {
      console.warn("⚠️ [handleScan] Scan blocked");
      return;
    }

    console.log("🚀 [handleScan] Starting scan process");
    setIsSubmitting(true);
    setScanPaused(true);
    setErrorMsg("");
    setMessage("");
    
    // Pause scanner
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause();
        console.log("✅ Scanner paused");
      } catch (err) {
        console.warn("⚠️ Failed to pause scanner:", err);
      }
    }

    // Stop scanner completely before showing photo prompt
    await stopScanner();
    
    // Store QR data and show photo prompt
    setPendingQrData(qrText);

    console.log("📸 Automatically triggering camera input...");
    fileInputRef.current?.click();
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
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          console.log("📸 [File Input onChange] File selected:", file ? {
            name: file.name,
            size: file.size,
            type: file.type
          } : "null");
          handlePhotoCapture(file);
          // Reset input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
      />

      {/* Photo Prompt Modal */}
      {/* {showPhotoPrompt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: theme.colors.textMain,
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              📸 Ambil Foto
            </div>
            
            <div
              style={{
                fontSize: "14px",
                color: theme.colors.textSecondary,
                marginBottom: "24px",
                textAlign: "center",
                lineHeight: "1.5",
              }}
            >
              Ambil foto untuk verifikasi kehadiran atau lewati jika tidak diperlukan.
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexDirection: "column",
              }}
            >
              <button
                onClick={() => {
                  console.log("📸 Take Photo button clicked");
                  fileInputRef.current?.click();
                }}
                style={{
                  width: "100%",
                  fontSize: "15px",
                  padding: "14px 20px",
                  borderRadius: theme.radius.pill,
                  border: "none",
                  backgroundColor: theme.colors.primary,
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                📸 Ambil Foto
              </button>

              <button
                onClick={handleSkipPhoto}
                style={{
                  width: "100%",
                  fontSize: "15px",
                  padding: "14px 20px",
                  borderRadius: theme.radius.pill,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textMain,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Lewati
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* Loading Overlay */}
      {loadingState.show && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: "24px 32px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: `3px solid ${theme.colors.backgroundSecondary}`,
                borderTop: `3px solid ${theme.colors.primary}`,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            
            <div
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: theme.colors.textMain,
              }}
            >
              Loading...
            </div>
          </div>
        </div>
      )}

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
                  setScanPaused(false);
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
                💡 Tips: Beberapa browser memerlukan HTTPS untuk kamera.
              </div>
            ) : null}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </MobileLayout>
  );
}