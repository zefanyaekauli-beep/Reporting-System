// frontend/web/src/modules/shared/components/AttendanceCheckOutForm.tsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "./Card";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "./Toast";
import { checkOut, CheckOutRequest, getCurrentAttendance } from "../../../api/attendanceApi";
import { theme } from "./theme";

interface AttendanceCheckOutFormProps {
  attendanceId?: number;
  onSuccess?: () => void;
}
export function AttendanceCheckOutForm({
  attendanceId: propAttendanceId,
  onSuccess,
}: AttendanceCheckOutFormProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const [attendanceId, setAttendanceId] = useState<number | null>(
    propAttendanceId || null
  );
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("📱 [AttendanceCheckOutForm] Component mounted");
    
    // Load current attendance if not provided
    if (!propAttendanceId) {
      loadCurrentAttendance();
    } else {
      setLoading(false);
    }

    // Cleanup function: Stop all camera streams when component unmounts
    return () => {
      console.log("🧹 [AttendanceCheckOutForm] Component unmounting, cleaning up camera...");
      cleanupCamera();
    };
  }, [propAttendanceId]);

  const cleanupCamera = () => {
    if (mediaStreamRef.current) {
      console.log("📷 [cleanupCamera] Stopping all camera tracks...");
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("⏹️ [cleanupCamera] Track stopped:", track.kind, track.label);
      });
      mediaStreamRef.current = null;
      console.log("✅ [cleanupCamera] Camera cleanup completed");
    } else {
      console.log("ℹ️ [cleanupCamera] No active camera stream to cleanup");
    }
  };

  async function loadCurrentAttendance() {
    console.log("🔄 [loadCurrentAttendance] Loading current attendance...");
    try {
      const result = await getCurrentAttendance();
      if (result.attendance) {
        console.log("✅ [loadCurrentAttendance] Attendance found:", result.attendance.id);
        setAttendanceId(result.attendance.id);
      } else {
        console.warn("⚠️ [loadCurrentAttendance] No active attendance");
        showToast("Tidak ada attendance aktif", "warning");
      }
    } catch (error: any) {
      console.error("❌ [loadCurrentAttendance] Error:", error);
      showToast("Gagal memuat attendance", "error");
    } finally {
      setLoading(false);
    }
  }

  function getLocation() {
    console.log("📍 [getLocation] Requesting GPS location...");
    
    if (!navigator.geolocation) {
      console.error("❌ [getLocation] Geolocation not supported");
      showToast("Geolocation tidak didukung browser", "error");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("✅ [getLocation] GPS location obtained:", {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAccuracy(pos.coords.accuracy || null);
        setLoadingLocation(false);
        showToast("Lokasi berhasil diambil", "success");
      },
      (err) => {
        console.error("❌ [getLocation] GPS error:", {
          code: err.code,
          message: err.message
        });
        showToast(`Gagal mengambil lokasi: ${err.message}`, "error");
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function handleFileInputClick() {
    console.log("📷 [handleFileInputClick] Opening camera input...");
    
    // Cleanup any previous camera stream before opening new one
    cleanupCamera();
    
    // Trigger file input
    fileInputRef.current?.click();
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    console.log("📸 [handlePhotoChange] Photo input changed");
    
    const file = e.target.files?.[0];
    if (file) {
      console.log("📸 [handlePhotoChange] File selected:", {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      if (!file.type.startsWith("image/")) {
        console.error("❌ [handlePhotoChange] Invalid file type:", file.type);
        showToast("File harus berupa gambar", "error");
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("✅ [handlePhotoChange] Photo preview created");
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Important: Cleanup camera after photo is taken
      // Wait a bit to ensure the file is fully processed
      setTimeout(() => {
        console.log("🧹 [handlePhotoChange] Cleaning up camera after photo taken");
        cleanupCamera();
      }, 500);
    } else {
      console.warn("⚠️ [handlePhotoChange] No file selected");
    }
    
    // Reset input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    console.log("📤 [handleSubmit] === Starting Check-out ===");
    console.log("📤 [handleSubmit] Data:", {
      attendanceId,
      lat,
      lng,
      accuracy,
      hasPhoto: !!photoFile
    });

    if (!attendanceId) {
      console.error("❌ [handleSubmit] No attendance ID");
      showToast("Attendance ID tidak ditemukan", "error");
      return;
    }

    if (!lat || !lng) {
      console.error("❌ [handleSubmit] No GPS location");
      showToast("Ambil lokasi terlebih dahulu", "error");
      return;
    }

    if (!photoFile) {
      console.error("❌ [handleSubmit] No photo");
      showToast("Ambil foto dari kamera terlebih dahulu", "error");
      return;
    }

    try {
      setSubmitting(true);
      console.log("🚀 [handleSubmit] Submitting check-out...");

      const payload: CheckOutRequest = {
        attendance_id: attendanceId,
        lat,
        lng,
        accuracy: accuracy || undefined,
        photo: photoFile,
      };

      console.log("📤 [handleSubmit] Payload:", {
        attendance_id: payload.attendance_id,
        lat: payload.lat,
        lng: payload.lng,
        accuracy: payload.accuracy,
        photoName: photoFile.name,
        photoSize: photoFile.size
      });

      const result = await checkOut(payload);
      
      console.log("✅ [handleSubmit] Check-out successful:", result);

      showToast(
        `Check-out berhasil. Lokasi ${result.is_valid_location ? "valid" : "tidak valid"}`,
        result.is_valid_location ? "success" : "warning");
      if (onSuccess) {
        console.log("🎉 [handleSubmit] Calling onSuccess callback");
        onSuccess();
      }
      navigate("/security/passdown");
    } catch (error: any) {
      console.error("❌ [handleSubmit] Error:", {
        message: error?.message,
        response: error?.response,
        responseData: error?.response?.data
      });
      
      showToast(
        error.response?.data?.detail || "Gagal check-out",
        "error"
      );
    } finally {
      setSubmitting(false);
      console.log("🏁 [handleSubmit] Check-out process completed");
    }
  }

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ color: theme.colors.textSecondary }}>
            Memuat attendance...
          </div>
        </div>
      </Card>
    );
  }

  if (!attendanceId) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ color: theme.colors.textSecondary }}>
            Tidak ada attendance aktif untuk check-out
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: theme.colors.text }}>
          Check-out
        </h3>

        {/* GPS Location */}
        <div>
          <button
            type="button"
            onClick={getLocation}
            disabled={loadingLocation}
            style={{
              width: "100%",
              padding: "12px",
              background: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: loadingLocation ? "not-allowed" : "pointer",
              opacity: loadingLocation ? 0.6 : 1,
            }}
          >
            {loadingLocation ? "Mengambil lokasi..." : "📍 Ambil Lokasi GPS"}
          </button>
          {(lat !== null || lng !== null) && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: theme.colors.textSecondary,
              }}
            >
              Lat: {lat?.toFixed(6) || "-"} | Lng: {lng?.toFixed(6) || "-"}
              {accuracy && ` | Akurasi: ${Math.round(accuracy)}m`}
            </div>
          )}
        </div>

        {/* Photo Capture - Hidden Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          style={{ display: "none" }}
        />

        {/* Photo Capture Button */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "8px",
              color: theme.colors.text,
            }}
          >
            📷 Foto (Kamera, Bukan Gallery)
          </label>
          <button
            type="button"
            onClick={handleFileInputClick}
            style={{
              width: "100%",
              padding: "12px",
              background: photoFile ? theme.colors.success : theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {photoFile ? "✓ Foto Terambil - Ambil Ulang?" : "📸 Ambil Foto dari Kamera"}
          </button>
          <div
            style={{
              fontSize: "11px",
              color: theme.colors.textSecondary,
              marginTop: "4px",
            }}
          >
            ⚠️ Gunakan kamera langsung, bukan pilih dari gallery
          </div>
        </div>

        {/* Photo Preview */}
        {photoPreview && (
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "8px",
                color: theme.colors.text,
              }}
            >
              Preview Foto:
            </div>
            <img
              src={photoPreview}
              alt="Preview"
              style={{
                width: "100%",
                maxHeight: "200px",
                objectFit: "contain",
                borderRadius: "8px",
                border: `1px solid ${theme.colors.border}`,
              }}
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !lat || !lng || !photoFile}
          style={{
            width: "100%",
            padding: "14px",
            background:
              submitting || !lat || !lng || !photoFile
                ? theme.colors.textSecondary
                : "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor:
              submitting || !lat || !lng || !photoFile
                ? "not-allowed"
                : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Mengirim..." : "✓ Check-out"}
        </button>
      </form>
    </Card>
  );
}