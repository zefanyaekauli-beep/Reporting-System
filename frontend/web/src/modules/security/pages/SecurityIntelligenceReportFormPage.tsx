// frontend/web/src/modules/security/pages/SecurityIntelligenceReportFormPage.tsx

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import {
  EvidencePhoto,
  EvidencePhotoUploader,
} from "../../shared/components/EvidencePhotoUploader";
import { FormInput, FormTextarea } from "../../shared/components/FormInput";
import { useToast } from "../../shared/components/Toast";
import { useSite } from "../../shared/contexts/SiteContext";
import { createSecurityReport } from "../../../api/securityApi";

type Level = "low" | "medium" | "high" | "critical";
type SituationStatus = "aman" | "waspada" | "darurat";

export function SecurityIntelligenceReportFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { selectedSite, sites } = useSite();

  const [site, setSite] = useState(selectedSite ? String(selectedSite.id) : "");
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [incidentTime, setIncidentTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [level, setLevel] = useState<Level>("medium");
  const [situationStatus, setSituationStatus] = useState<SituationStatus>("aman");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [chronologicalDetails, setChronologicalDetails] = useState("");
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    site?: string;
    title?: string;
    incidentDate?: string;
  }>({});

  const validate = () => {
    const errors: typeof fieldErrors = {};
    if (!site) errors.site = t("common.required");
    if (!title.trim()) errors.title = t("common.required");
    if (!incidentDate) errors.incidentDate = t("common.required");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      const siteId = Number(site);
      if (isNaN(siteId) || siteId <= 0) {
        throw new Error("Site harus dipilih");
      }

      // Combine date and time
      const incidentDateTime = `${incidentDate}T${incidentTime}:00`;

      // Build description with chronological details if provided
      let fullDescription = description.trim();
      if (chronologicalDetails.trim()) {
        fullDescription += `\n\nKronologi:\n${chronologicalDetails.trim()}`;
      }

      // Create payload with report_type="INTELLIGENCE"
      const payload = {
        report_type: "INTELLIGENCE",
        site_id: siteId,
        title: title.trim(),
        description: fullDescription || undefined,
        location_text: location.trim() || undefined,
        severity: level, // Use severity field for level
        // Store situation status in description or use status field
        evidenceFiles: photos.length > 0 ? photos.map((p) => p.file).filter(Boolean) : undefined,
      };

      await createSecurityReport(payload);
      showToast("Laporan Intelligent berhasil dibuat", "success");
      navigate("/supervisor/intelligence-reports");
    } catch (err: any) {
      console.error("Failed to create intelligence report:", err);
      
      let errorMsg: string = "Gagal menyimpan laporan";
      
      try {
        if (err?.response?.data?.detail) {
          const detail = err.response.data.detail;
          
          if (Array.isArray(detail)) {
            const errorMessages: string[] = [];
            detail.forEach((e: any) => {
              try {
                const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : 'unknown';
                const msg = typeof e.msg === 'string' ? e.msg : 'Invalid value';
                const fieldName = String(field).replace(/_/g, ' ');
                errorMessages.push(`${fieldName}: ${msg}`);
              } catch (parseErr) {
                console.warn("Error parsing validation error:", parseErr);
              }
            });
            errorMsg = errorMessages.length > 0 
              ? errorMessages.join('; ') 
              : "Terjadi kesalahan validasi";
          } else if (typeof detail === 'string') {
            errorMsg = detail;
          }
        } else if (err?.message && typeof err.message === 'string') {
          errorMsg = err.message;
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        errorMsg = "Terjadi kesalahan saat memproses error";
      }
      
      setError(String(errorMsg || "Gagal menyimpan laporan"));
      showToast(String(errorMsg || "Gagal menyimpan laporan"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const levelOptions: { value: Level; label: string; color: string }[] = [
    { value: "low", label: "Rendah", color: theme.colors.success },
    { value: "medium", label: "Sedang", color: theme.colors.warning },
    { value: "high", label: "Tinggi", color: "#f59e0b" },
    { value: "critical", label: "Kritis", color: theme.colors.danger },
  ];

  const statusOptions: { value: SituationStatus; label: string; color: string }[] = [
    { value: "aman", label: "Aman dan Terkendali", color: theme.colors.success },
    { value: "waspada", label: "Waspada", color: theme.colors.warning },
    { value: "darurat", label: "Darurat", color: theme.colors.danger },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
          Input Laporan Intelligent
        </h1>
        <p style={{ fontSize: 13, color: theme.colors.textMuted }}>
          Laporan intelijen berbasis situasional untuk memantau perkembangan kondisi wilayah
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 24,
            boxShadow: theme.shadowCard,
          }}
        >
          {/* Error message */}
          {error && (
            <div
              style={{
                marginBottom: 20,
                padding: 12,
                backgroundColor: "#FEE2E2",
                borderRadius: 8,
                fontSize: 13,
                color: theme.colors.danger,
              }}
            >
              {error}
            </div>
          )}

          {/* Grid Layout for Desktop */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {/* Site */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: theme.colors.textMain,
                }}
              >
                Lokasi / Area Pemantauan <span style={{ color: theme.colors.danger }}>*</span>
              </label>
              <select
                value={site || (selectedSite ? String(selectedSite.id) : "")}
                onChange={(e) => {
                  setSite(e.target.value);
                  if (fieldErrors.site) {
                    setFieldErrors({ ...fieldErrors, site: undefined });
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${
                    fieldErrors.site ? theme.colors.danger : theme.colors.border
                  }`,
                  fontSize: 14,
                  transition: "all 0.2s",
                  outline: "none",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <option value="">Pilih Site</option>
                {sites.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
              {fieldErrors.site && (
                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.danger,
                    marginTop: 4,
                  }}
                >
                  {fieldErrors.site}
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: theme.colors.textMain,
                }}
              >
                Tanggal Kejadian <span style={{ color: theme.colors.danger }}>*</span>
              </label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => {
                  setIncidentDate(e.target.value);
                  if (fieldErrors.incidentDate) {
                    setFieldErrors({ ...fieldErrors, incidentDate: undefined });
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${
                    fieldErrors.incidentDate ? theme.colors.danger : theme.colors.border
                  }`,
                  fontSize: 14,
                  outline: "none",
                  backgroundColor: "#FFFFFF",
                }}
              />
              {fieldErrors.incidentDate && (
                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.danger,
                    marginTop: 4,
                  }}
                >
                  {fieldErrors.incidentDate}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: theme.colors.textMain,
                }}
              >
                Waktu Kejadian
              </label>
              <input
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 14,
                  outline: "none",
                  backgroundColor: "#FFFFFF",
                }}
              />
            </div>
          </div>

          {/* Level & Status in one row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginTop: 20 }}>
            {/* Level */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: theme.colors.textMain,
                }}
              >
                Level
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {levelOptions.map((opt) => {
                  const active = level === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLevel(opt.value)}
                      style={{
                        flex: 1,
                        minWidth: "80px",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: `1.5px solid ${
                          active ? opt.color : theme.colors.border
                        }`,
                        backgroundColor: active ? opt.color : "#FFFFFF",
                        color: active ? "#FFFFFF" : theme.colors.textMain,
                        fontSize: 12,
                        fontWeight: active ? 600 : 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Situation Status */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: theme.colors.textMain,
                }}
              >
                Status Kondisi
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {statusOptions.map((opt) => {
                  const active = situationStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSituationStatus(opt.value)}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: `1.5px solid ${
                          active ? opt.color : theme.colors.border
                        }`,
                        backgroundColor: active ? opt.color : "#FFFFFF",
                        color: active ? "#FFFFFF" : theme.colors.textMain,
                        fontSize: 12,
                        fontWeight: active ? 600 : 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Title / Ringkasan Situasi - Full Width */}
          <div style={{ marginTop: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: theme.colors.textMain,
              }}
            >
              Ringkasan Perkembangan Situasi / Kondisi Wilayah <span style={{ color: theme.colors.danger }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors({ ...fieldErrors, title: undefined });
                }
              }}
              placeholder="Contoh: Peningkatan aktivitas mencurigakan di area parkir"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: `1.5px solid ${
                  fieldErrors.title ? theme.colors.danger : theme.colors.border
                }`,
                fontSize: 14,
                outline: "none",
                backgroundColor: "#FFFFFF",
              }}
            />
            {fieldErrors.title && (
              <div
                style={{
                  fontSize: 12,
                  color: theme.colors.danger,
                  marginTop: 4,
                }}
              >
                {fieldErrors.title}
              </div>
            )}
          </div>

          {/* Location Text - Full Width */}
          <div style={{ marginTop: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: theme.colors.textMain,
              }}
            >
              Lokasi / Area Pemantauan (opsional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Area Parkir Utara, Gerbang Selatan"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                fontSize: 14,
                outline: "none",
                backgroundColor: "#FFFFFF",
              }}
            />
          </div>

          {/* Description / Detail Kronologis - Full Width */}
          <div style={{ marginTop: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: theme.colors.textMain,
              }}
            >
              Detail Kronologis
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan perkembangan situasi secara detail..."
              rows={6}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                fontSize: 14,
                outline: "none",
                backgroundColor: "#FFFFFF",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* Additional Chronological Details - Full Width */}
          <div style={{ marginTop: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: theme.colors.textMain,
              }}
            >
              Kronologi Tambahan (opsional)
            </label>
            <textarea
              value={chronologicalDetails}
              onChange={(e) => setChronologicalDetails(e.target.value)}
              placeholder="Tambahkan detail kronologis jika diperlukan..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                fontSize: 14,
                outline: "none",
                backgroundColor: "#FFFFFF",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* Evidence photos - Full Width */}
          <div style={{ marginTop: 20 }}>
            <EvidencePhotoUploader
              label="Foto Bukti Visual"
              maxPhotos={10}
              photos={photos}
              onChange={setPhotos}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: "#FFFFFF",
                color: theme.colors.textMain,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !site || !incidentDate}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                backgroundColor: submitting
                  ? "#9CA3AF"
                  : theme.colors.primary,
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                opacity: submitting || !title.trim() || !site || !incidentDate ? 0.8 : 1,
                cursor: submitting || !title.trim() || !site || !incidentDate ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {submitting ? "Menyimpan..." : "Simpan Laporan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
