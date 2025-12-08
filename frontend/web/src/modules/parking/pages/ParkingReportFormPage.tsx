// frontend/web/src/modules/parking/pages/ParkingReportFormPage.tsx

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import { createParkingReport } from "../../../api/parkingApi";

type ReportType = "daily" | "incident" | "finding";
type Severity = "low" | "medium" | "high";

export function ParkingReportFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [locationText, setLocationText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedSite) return;

    setSubmitting(true);
    try {
      await createParkingReport({
        report_type: reportType,
        site_id: selectedSite.id,
        location_text: locationText || undefined,
        title,
        description: description || undefined,
        severity: severity || undefined,
        evidenceFiles: evidenceFiles.length > 0 ? evidenceFiles : undefined,
      });
      showToast("Laporan berhasil dibuat", "success");
      navigate("/parking/reports");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Gagal membuat laporan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Buat Laporan Parkir">
      <form onSubmit={handleSubmit} style={{ padding: "16px", paddingBottom: "80px" }}>
        {/* Report Type */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            Tipe Laporan *
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { value: "daily", label: "Harian" },
              { value: "incident", label: "Insiden" },
              { value: "finding", label: "Temuan" },
            ].map((opt) => {
              const active = reportType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReportType(opt.value as ReportType)}
                  style={{
                    flex: 1,
                    minWidth: "80px",
                    padding: "8px 4px",
                    borderRadius: 9999,
                    border: `1px solid ${
                      active ? theme.colors.primary : theme.colors.border
                    }`,
                    backgroundColor: active
                      ? theme.colors.primary
                      : "#FFFFFF",
                    color: active ? "#FFFFFF" : theme.colors.textMain,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Text */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            Lokasi
          </label>
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="Masukkan lokasi"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          />
        </div>

        {/* Title */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            Judul *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masukkan judul laporan"
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            Deskripsi
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Masukkan deskripsi laporan"
            rows={4}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
              resize: "vertical",
            }}
          />
        </div>

        {/* Severity */}
        {reportType === "incident" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
              Tingkat Keparahan
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "low", label: "Rendah" },
                { value: "medium", label: "Sedang" },
                { value: "high", label: "Tinggi" },
              ].map((opt) => {
                const active = severity === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value as Severity)}
                    style={{
                      flex: 1,
                      padding: "8px 4px",
                      borderRadius: 9999,
                      border: `1px solid ${
                        active ? theme.colors.primary : theme.colors.border
                      }`,
                      backgroundColor: active
                        ? theme.colors.primary
                        : "#FFFFFF",
                      color: active ? "#FFFFFF" : theme.colors.textMain,
                      fontSize: 12,
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Evidence Files */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            Foto Bukti
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                setEvidenceFiles(Array.from(e.target.files));
              }
            }}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          />
          {evidenceFiles.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 11, color: theme.colors.textSoft }}>
              {evidenceFiles.length} file dipilih
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 9999,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: "#FFFFFF",
              color: theme.colors.textMain,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 9999,
              border: "none",
              backgroundColor: submitting
                ? "#9CA3AF"
                : theme.colors.primary,
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              opacity: submitting || !title.trim() ? 0.8 : 1,
            }}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </MobileLayout>
  );
}

