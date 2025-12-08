// frontend/web/src/modules/security/pages/SecurityReportFormPage.tsx

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
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

type Severity = "low" | "medium" | "high";

export function SecurityReportFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { selectedSite, sites } = useSite();

  const [site, setSite] = useState(selectedSite ? String(selectedSite.id) : "");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    site?: string;
    title?: string;
  }>({});

  const validate = () => {
    const errors: typeof fieldErrors = {};
    if (!site) errors.site = t("common.required");
    if (!title.trim()) errors.title = t("common.required");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      await createSecurityReport({
        report_type: category || "incident",
        site_id: Number(site),
        location_text: location || undefined,
        title,
        description: description || undefined,
        severity: severity || undefined,
        evidenceFiles: photos.map((p) => p.file),
      });
      showToast("Laporan berhasil dibuat", "success");
      navigate("/security/dashboard");
    } catch (err: any) {
      console.error("Failed to create report:", err);
      const errorMsg = err?.response?.data?.detail || err?.message || "Gagal menyimpan laporan";
      setError(errorMsg);
      showToast(errorMsg, "error");
      setSubmitting(false);
    }
  };

  const severityOptions: { value: Severity; label: string; color: string }[] = [
    { value: "low", label: t("security.low"), color: theme.colors.success },
    { value: "medium", label: t("security.medium"), color: theme.colors.warning },
    { value: "high", label: t("security.high"), color: theme.colors.danger },
  ];

  return (
    <MobileLayout title={t("security.newReportTitle")}>
      <form onSubmit={handleSubmit}>
        {/* Site */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            {t("security.site")} <span style={{ color: theme.colors.danger }}>*</span>
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
            }}
          >
            <option value="">{t("security.selectSite")}</option>
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

        {/* Category / Type */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {t("security.reportType")}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          >
            <option value="incident">{t("security.incident")}</option>
            <option value="daily">{t("security.dailySummary")}</option>
            <option value="finding">{t("security.finding")}</option>
          </select>
        </div>

        {/* Severity */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            {t("security.severity")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {severityOptions.map((opt) => {
              const active = severity === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverity(opt.value)}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    borderRadius: 9999,
                    border: `1px solid ${
                      active ? opt.color : theme.colors.border
                    }`,
                    backgroundColor: active ? opt.color : "#FFFFFF",
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

        {/* Title */}
        <FormInput
          label={t("security.title")}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (fieldErrors.title) {
              setFieldErrors({ ...fieldErrors, title: undefined });
            }
          }}
          placeholder="Deskripsi singkat"
          required
          error={fieldErrors.title}
        />

        {/* Location */}
        <FormInput
          label={`${t("security.location")} (${t("common.optional")})`}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="contoh: Gerbang Gudang"
        />

        {/* Description */}
        <FormTextarea
          label={t("security.description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Jelaskan apa yang terjadi..."
          rows={4}
        />

        {/* Evidence photos */}
        <EvidencePhotoUploader
          label={t("security.evidencePhotos")}
          maxPhotos={5}
          photos={photos}
          onChange={setPhotos}
        />

        {/* Error message */}
        {error && (
          <div
            style={{
              marginBottom: 12,
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

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
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
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !site}
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
            {submitting ? t("security.saving") : t("common.save")}
          </button>
        </div>
      </form>
    </MobileLayout>
  );
}
