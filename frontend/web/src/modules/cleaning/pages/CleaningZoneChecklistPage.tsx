// frontend/web/src/modules/cleaning/pages/CleaningZoneChecklistPage.tsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import {
  getZoneChecklist,
  completeChecklistItem,
  ChecklistItem,
  ZoneChecklist,
} from "../../../api/cleaningApi";
import { theme } from "../../shared/components/theme";
import { EvidencePhotoUploader, EvidencePhoto } from "../../shared/components/EvidencePhotoUploader";
import { getGPSWithDetection, saveOfflineEvent, isOnline } from "../../../utils/offlineStorage";
import { useAuthStore } from "../../../stores/authStore";

export function CleaningZoneChecklistPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { zoneId } = useParams<{ zoneId: string }>();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [checklist, setChecklist] = useState<ZoneChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [itemAnswers, setItemAnswers] = useState<Record<number, any>>({});
  const [itemPhotos, setItemPhotos] = useState<Record<number, EvidencePhoto[]>>({});

  useEffect(() => {
    if (zoneId) {
      loadChecklist();
    }
  }, [zoneId]);

  async function loadChecklist() {
    if (!zoneId) return;
    try {
      setLoading(true);
      const { data } = await getZoneChecklist(parseInt(zoneId));
      setChecklist(data);
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Gagal memuat checklist",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteItem(
    item: ChecklistItem,
    answer?: any
  ) {
    if (!checklist) return;

    // Validate photo requirement
    if (item.photo_required && (!itemPhotos[item.id] || itemPhotos[item.id].length === 0)) {
      showToast("Foto wajib diunggah untuk item ini", "error");
      return;
    }

    try {
      setCompleting(item.id);
      
      // Get GPS
      let gps: any = null;
      try {
        const gpsData = await getGPSWithDetection();
        gps = {
          lat: gpsData.latitude,
          lng: gpsData.longitude,
          accuracy: gpsData.accuracy,
          mock_location: gpsData.mock_location,
        };
      } catch (gpsError) {
        console.warn("GPS not available:", gpsError);
      }

      const eventTime = new Date().toISOString();
      const answerValue = answer !== undefined ? answer : itemAnswers[item.id];

      // Prepare KPI answer
      const kpiAnswer: any = {
        item_id: item.id,
        kpi_key: item.kpi_key,
        value: answerValue,
      };

      // Save offline event
      await saveOfflineEvent({
        type: "CLEANING_CHECK",
        event_time: eventTime,
        payload: {
          zone_id: parseInt(zoneId!),
          user_id: user?.id,
          checklist_id: checklist.id,
          kpi_answers: [kpiAnswer],
          gps: gps,
          photo_local_ids: itemPhotos[item.id]?.map((p) => p.id) || [],
        },
      });

      // If online, also sync immediately
      if (isOnline()) {
        try {
          const answerValue = answer !== undefined ? answer : itemAnswers[item.id];
          
          // Prepare KPI payload based on answer_type
          const kpiPayload: any = {
            status: "COMPLETED",
            note: null,
            evidence_id: itemPhotos[item.id]?.[0]?.id || null,
          };
          
          if (item.answer_type === "BOOLEAN") {
            kpiPayload.answer_bool = answerValue;
          } else if (item.answer_type === "SCORE") {
            kpiPayload.answer_int = answerValue;
          } else if (item.answer_type === "CHOICE" || item.answer_type === "TEXT") {
            kpiPayload.answer_text = answerValue;
          }
          
          // Add GPS if available
          if (gps) {
            kpiPayload.gps_lat = parseFloat(gps.lat);
            kpiPayload.gps_lng = parseFloat(gps.lng);
            kpiPayload.gps_accuracy = gps.accuracy;
            kpiPayload.mock_location = gps.mock_location || false;
          }
          
          await completeChecklistItem(checklist.id, item.id, kpiPayload);
        } catch (syncError) {
          console.warn("Failed to sync immediately:", syncError);
          // Event is saved offline, will sync later
        }
      }

      showToast("Tugas disimpan" + (isOnline() ? "" : " (offline)"), "success");
      await loadChecklist();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Gagal menyimpan tugas",
        "error"
      );
    } finally {
      setCompleting(null);
    }
  }

  if (loading) {
    return (
      <MobileLayout title="Checklist Zona">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ color: theme.colors.textSecondary }}>
            {t("common.loading")}
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!checklist) {
    return (
      <MobileLayout title="Checklist Zona">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ color: theme.colors.textSecondary }}>
            Checklist tidak ditemukan
          </div>
        </div>
      </MobileLayout>
    );
  }

  const completedCount = checklist.items.filter(
    (item) => item.status === "COMPLETED" || item.status === "NOT_APPLICABLE"
  ).length;
  const totalCount = checklist.items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <MobileLayout title="Checklist Zona">
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {/* Progress Bar */}
        <Card style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 500 }}>
              Progress: {completedCount} / {totalCount}
            </div>
            <div style={{ fontSize: "14px", color: theme.colors.primary }}>
              {Math.round(progress)}%
            </div>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: theme.colors.backgroundSecondary,
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: theme.colors.primary,
                transition: "width 0.3s",
              }}
            />
          </div>
        </Card>

        {/* Checklist Items */}
        {checklist.items.map((item) => (
          <Card key={item.id} style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: theme.colors.text }}>
                  {item.title}
                </h3>
                {item.description && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: theme.colors.textSecondary,
                      marginTop: "4px",
                    }}
                  >
                    {item.description}
                  </div>
                )}
              </div>
              {item.status === "COMPLETED" && (
                <div
                  style={{
                    padding: "4px 8px",
                    background: theme.colors.success,
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  ✓
                </div>
              )}
            </div>

            {/* KPI Answer Inputs */}
            {item.status !== "COMPLETED" && item.answer_type && (
              <div style={{ marginBottom: "12px" }}>
                {item.answer_type === "BOOLEAN" && (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`item-${item.id}`}
                        checked={itemAnswers[item.id] === true}
                        onChange={() => {
                          setItemAnswers((prev) => ({ ...prev, [item.id]: true }));
                        }}
                      />
                      <span>Ya</span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`item-${item.id}`}
                        checked={itemAnswers[item.id] === false}
                        onChange={() => {
                          setItemAnswers((prev) => ({ ...prev, [item.id]: false }));
                        }}
                      />
                      <span>Tidak</span>
                    </label>
                  </div>
                )}
                {item.answer_type === "CHOICE" && (
                  <select
                    value={itemAnswers[item.id] || ""}
                    onChange={(e) => {
                      setItemAnswers((prev) => ({ ...prev, [item.id]: e.target.value }));
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: "14px",
                    }}
                  >
                    <option value="">Pilih...</option>
                    {item.kpi_key === "TISSUE_STOCK" && (
                      <>
                        <option value="FULL">Penuh</option>
                        <option value="OK">Cukup</option>
                        <option value="LOW">Kurang</option>
                        <option value="NONE">Habis</option>
                      </>
                    )}
                    {item.kpi_key === "SOAP_STOCK" && (
                      <>
                        <option value="FULL">Penuh</option>
                        <option value="OK">Cukup</option>
                        <option value="LOW">Kurang</option>
                        <option value="NONE">Habis</option>
                      </>
                    )}
                    {!["TISSUE_STOCK", "SOAP_STOCK"].includes(item.kpi_key || "") && (
                      <>
                        <option value="OK">OK</option>
                        <option value="NEEDS_ATTENTION">Perlu Perhatian</option>
                        <option value="FAIL">Gagal</option>
                      </>
                    )}
                  </select>
                )}
                {item.answer_type === "SCORE" && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "14px" }}>Skor:</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={itemAnswers[item.id] || ""}
                      onChange={(e) => {
                        setItemAnswers((prev) => ({ ...prev, [item.id]: parseInt(e.target.value) || null }));
                      }}
                      style={{
                        width: "80px",
                        padding: "8px",
                        borderRadius: "6px",
                        border: `1px solid ${theme.colors.border}`,
                        fontSize: "14px",
                      }}
                    />
                    <span style={{ fontSize: "12px", color: theme.colors.textSecondary }}>
                      (1-5)
                    </span>
                  </div>
                )}
                {item.answer_type === "TEXT" && (
                  <textarea
                    value={itemAnswers[item.id] || ""}
                    onChange={(e) => {
                      setItemAnswers((prev) => ({ ...prev, [item.id]: e.target.value }));
                    }}
                    placeholder="Masukkan catatan..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                )}
              </div>
            )}

            {/* Photo Upload for items with photo_required */}
            {item.photo_required && item.status !== "COMPLETED" && (
              <div style={{ marginBottom: "12px" }}>
                <EvidencePhotoUploader
                  label="Foto Wajib"
                  maxPhotos={3}
                  photos={itemPhotos[item.id] || []}
                  onChange={(photos) => {
                    setItemPhotos((prev) => ({ ...prev, [item.id]: photos }));
                  }}
                />
              </div>
            )}

            {/* Action Buttons */}
            {item.status !== "COMPLETED" && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    // Validate answer if required
                    if (item.answer_type && itemAnswers[item.id] === undefined) {
                      showToast("Harap isi jawaban terlebih dahulu", "error");
                      return;
                    }
                    handleCompleteItem(item, itemAnswers[item.id]);
                  }}
                  disabled={completing === item.id}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: theme.colors.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: completing === item.id ? "not-allowed" : "pointer",
                    opacity: completing === item.id ? 0.6 : 1,
                  }}
                >
                  {completing === item.id ? "Menyimpan..." : "Selesai"}
                </button>
                {!item.required && (
                  <button
                    onClick={() => handleCompleteItem(item, "NOT_APPLICABLE")}
                    disabled={completing === item.id}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: theme.colors.backgroundSecondary,
                      color: theme.colors.text,
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor:
                        completing === item.id ? "not-allowed" : "pointer",
                      opacity: completing === item.id ? 0.6 : 1,
                    }}
                  >
                    Tidak Berlaku
                  </button>
                )}
              </div>
            )}

            {/* Show completed answer */}
            {item.status === "COMPLETED" && item.answer_type && (
              <div style={{ marginTop: "12px", padding: "8px", background: theme.colors.backgroundSecondary, borderRadius: "6px" }}>
                <div style={{ fontSize: "12px", color: theme.colors.textSecondary, marginBottom: "4px" }}>
                  Jawaban:
                </div>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>
                  {item.answer_type === "BOOLEAN" && (item.answer_bool ? "Ya" : "Tidak")}
                  {item.answer_type === "CHOICE" && item.answer_text}
                  {item.answer_type === "SCORE" && `${item.answer_int}/5`}
                  {item.answer_type === "TEXT" && item.answer_text}
                </div>
              </div>
            )}

            {item.evidence_type === "photo" && item.status === "COMPLETED" && (
              <div style={{ marginTop: "12px" }}>
                {item.evidence_id && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Foto: {item.evidence_id}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </MobileLayout>
  );
}

