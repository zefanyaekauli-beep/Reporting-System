// frontend/web/src/modules/shared/components/AttendanceCheckInForm.tsx

import { useState, useEffect } from "react";
import { Card } from "./Card";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "./Toast";
import { useSite } from "../contexts/SiteContext";
import { useAuthStore } from "../../../stores/authStore";
import { checkIn, CheckInRequest } from "../../../api/attendanceApi";
import { theme } from "./theme";

interface AttendanceCheckInFormProps {
  roleType: "SECURITY" | "CLEANING" | "DRIVER";
  onSuccess?: (attendanceId: number) => void;
}

export function AttendanceCheckInForm({
  roleType,
  onSuccess,
}: AttendanceCheckInFormProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { selectedSite } = useSite();
  const { user } = useAuthStore();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function getLocation() {
    if (!navigator.geolocation) {
      showToast("Geolocation tidak didukung browser", "error");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAccuracy(pos.coords.accuracy || null);
        setLoadingLocation(false);
        showToast("Lokasi berhasil diambil", "success");
      },
      (err) => {
        console.error("GPS error:", err);
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

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi tipe file
      if (!file.type.startsWith("image/")) {
        showToast("File harus berupa gambar", "error");
        return;
      }

      setPhotoFile(file);

      // Buat preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedSite) {
      showToast("Pilih site terlebih dahulu", "error");
      return;
    }

    if (!lat || !lng) {
      showToast("Ambil lokasi terlebih dahulu", "error");
      return;
    }

    if (!photoFile) {
      showToast("Ambil foto dari kamera terlebih dahulu", "error");
      return;
    }

    try {
      setSubmitting(true);

      const payload: CheckInRequest = {
        site_id: selectedSite.id,
        role_type: roleType,
        lat,
        lng,
        accuracy: accuracy || undefined,
        photo: photoFile,
      };

      const result = await checkIn(payload);

      showToast(
        `Check-in berhasil. Lokasi ${result.is_valid_location ? "valid" : "tidak valid"}`,
        result.is_valid_location ? "success" : "warning"
      );

      if (onSuccess) {
        onSuccess(result.attendance_id);
      }
    } catch (error: any) {
      console.error("Check-in error:", error);
      showToast(
        error.response?.data?.detail || "Gagal check-in",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: theme.colors.text }}>
          Check-in ({roleType})
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

        {/* Photo Capture */}
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
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            style={{
              width: "100%",
              padding: "10px",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
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
                : theme.colors.success,
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
          {submitting ? "Mengirim..." : "✓ Check-in"}
        </button>
      </form>
    </Card>
  );
}

