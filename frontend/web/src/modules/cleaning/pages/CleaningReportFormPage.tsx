// frontend/web/src/modules/cleaning/pages/CleaningReportFormPage.tsx

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import { createCleaningReport } from "../../../api/cleaningApi";
import { listCleaningZones, CleaningZone } from "../../../api/cleaningApi";

type ReportType = "daily" | "incident" | "finding" | "CLEANING_ISSUE";
type Severity = "low" | "medium" | "high";

export function CleaningReportFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [zoneId, setZoneId] = useState<string>("");
  const [locationText, setLocationText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [zones, setZones] = useState<CleaningZone[]>([]);

  useEffect(() => {
    const loadZones = async () => {
      if (selectedSite?.id) {
        try {
          const { data } = await listCleaningZones({
            site_id: selectedSite.id,
            is_active: true,
          });
          setZones(data);
        } catch (err) {
          console.error("Failed to load zones:", err);
        }
      }
    };
    loadZones();
  }, [selectedSite]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedSite) return;

    setSubmitting(true);
    try {
      await createCleaningReport({
        report_type: reportType,
        site_id: selectedSite.id,
        zone_id: zoneId ? parseInt(zoneId) : undefined,
        location_text: locationText || undefined,
        title,
        description: description || undefined,
        severity: severity || undefined,
        evidenceFiles: evidenceFiles.length > 0 ? evidenceFiles : undefined,
      });
      showToast("Laporan berhasil dibuat", "success");
      navigate("/cleaning/reports");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Gagal membuat laporan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Buat Laporan Pembersihan">
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
              { value: "CLEANING_ISSUE", label: "Masalah Kebersihan" },
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

        {/* Zone */}
        {zones.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
              Area (Opsional)
            </label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                fontSize: 13,
              }}
            >
              <option value="">Pilih area</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
        )}

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

