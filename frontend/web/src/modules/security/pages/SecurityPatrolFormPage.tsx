// frontend/web/src/modules/security/pages/SecurityPatrolFormPage.tsx

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import {
  EvidencePhoto,
  EvidencePhotoUploader,
} from "../../shared/components/EvidencePhotoUploader";
import { useToast } from "../../shared/components/Toast";
import { useSite } from "../../shared/contexts/SiteContext";
import { createPatrolLog } from "../../../api/securityApi";

export function SecurityPatrolFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { selectedSite, sites } = useSite();

  const [siteId, setSiteId] = useState(selectedSite ? String(selectedSite.id) : "");
  const [areaCovered, setAreaCovered] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(new Date());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!areaCovered.trim() || !siteId) return;

    setSubmitting(true);
    setError(null);

    try {
      await createPatrolLog({
        site_id: parseInt(siteId),
        start_time: startTime.toISOString(),
        end_time: new Date().toISOString(),
        area_text: areaCovered,
        notes: notes || undefined,
        main_photo: photos.length > 0 ? photos[0].file : undefined,
      });
      showToast("Log patroli berhasil dibuat", "success");
      navigate("/security/dashboard");
    } catch (err: any) {
      console.error("Failed to create patrol log:", err);
      const errorMsg = err?.response?.data?.detail || err?.message || "Gagal menyimpan patrol";
      setError(errorMsg);
      showToast(errorMsg, "error");
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title={t("security.patrolTitle")}>
      <form onSubmit={handleSubmit}>
        {/* Site */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {t("security.site")} *
          </label>
          <select
            value={siteId || (selectedSite ? String(selectedSite.id) : "")}
            onChange={(e) => setSiteId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          >
            <option value="">{t("security.selectSite")}</option>
            {sites.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Area Covered */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {t("security.areaCovered")} *
          </label>
          <input
            value={areaCovered}
            onChange={(e) => setAreaCovered(e.target.value)}
            placeholder={t("security.areaCoveredPlaceholder")}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {t("security.patrolNotes")} ({t("common.optional")})
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan observasi..."
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

        {/* Photos */}
        <EvidencePhotoUploader
          label={t("security.patrolPhotos")}
          maxPhotos={1}
          photos={photos}
          onChange={setPhotos}
        />

        {/* Info */}
        <div
          style={{
            fontSize: 11,
            color: theme.colors.textSoft,
            marginBottom: 12,
          }}
        >
          {t("security.startTime")}: {startTime.toLocaleString("id-ID")}
        </div>

        {/* Error */}
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
            disabled={submitting || !areaCovered.trim() || !siteId}
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
              opacity: submitting || !areaCovered.trim() || !siteId ? 0.8 : 1,
            }}
          >
            {submitting ? t("security.saving") : t("security.savePatrol")}
          </button>
        </div>
      </form>
    </MobileLayout>
  );
}

