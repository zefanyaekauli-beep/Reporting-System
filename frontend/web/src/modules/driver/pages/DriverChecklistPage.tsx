// frontend/web/src/modules/driver/pages/DriverChecklistPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../../shared/components/Toast";
import api from "../../../api/client";
import { usePullToRefresh } from "../../shared/hooks/usePullToRefresh";

interface Checklist {
  id: number;
  status: "PENDING" | "COMPLETED" | "INCOMPLETE";
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: number;
  title: string;
  description?: string;
  status: "PENDING" | "COMPLETED" | "NOT_APPLICABLE" | "FAILED";
  required: boolean;
  note?: string;
  completed_at?: string;
  _tempNote?: string;
}

export function DriverChecklistPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingItemId, setCompletingItemId] = useState<number | null>(null);

  const loadChecklist = async () => {
    setLoading(true);
    try {
      const res = await api.get("/driver/checklist/today");
      setChecklist(res.data);
    } catch (err: any) {
      console.error("Failed to load checklist:", err);
      if (err?.response?.status === 404) {
        setChecklist(null);
      } else {
        showToast("Gagal memuat checklist", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const { containerRef, isRefreshing } = usePullToRefresh(loadChecklist);

  useEffect(() => {
    loadChecklist();
  }, []);

  const handleCompleteItem = async (
    item: ChecklistItem,
    status: "COMPLETED" | "NOT_APPLICABLE" | "FAILED"
  ) => {
    if (!checklist) return;

    setCompletingItemId(item.id);
    try {
      const response = await api.patch(`/driver/checklist/${checklist.id}/items/${item.id}/complete`, {
        status,
        note: item._tempNote || undefined,
      });
      setChecklist(response.data);
      showToast(
        status === "COMPLETED"
          ? "Tugas selesai"
          : status === "NOT_APPLICABLE"
          ? "Tugas ditandai tidak berlaku"
          : "Tugas ditandai gagal",
        "success"
      );
      await loadChecklist();
    } catch (err: any) {
      console.error("Failed to complete item:", err);
      showToast("Gagal memperbarui tugas", "error");
    } finally {
      setCompletingItemId(null);
    }
  };

  if (loading && !checklist) {
    return (
      <MobileLayout title="Checklist Driver Hari Ini">
        <div
          style={{
            padding: 20,
            textAlign: "center",
            color: theme.colors.textMuted,
          }}
        >
          Memuat checklist...
        </div>
      </MobileLayout>
    );
  }

  if (!checklist) {
    return (
      <MobileLayout title="Checklist Driver Hari Ini">
        <div
          style={{
            padding: 20,
            textAlign: "center",
            color: theme.colors.textMuted,
          }}
        >
          <div style={{ marginBottom: 12, fontSize: 48 }}>📋</div>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>
            Belum ada checklist
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textSoft }}>
            Checklist akan dibuat otomatis saat check-in
          </div>
          <button
            onClick={() => navigate("/driver/trips")}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              backgroundColor: theme.colors.primary,
              color: "#FFFFFF",
              border: "none",
              borderRadius: theme.radius.card,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ke Halaman Perjalanan
          </button>
        </div>
      </MobileLayout>
    );
  }

  const requiredItems = checklist.items.filter((i) => i.required === true);
  const completedRequired = requiredItems.filter(
    (i) => i.status === "COMPLETED"
  );
  const progress = requiredItems.length
    ? Math.round((completedRequired.length / requiredItems.length) * 100)
    : 0;

  const allRequiredDone = completedRequired.length === requiredItems.length;

  return (
    <MobileLayout title="Checklist Driver Hari Ini">
      <div
        ref={containerRef}
        style={{
          position: "relative",
          minHeight: "100%",
        }}
      >
        {isRefreshing && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: 12,
              textAlign: "center",
              fontSize: 12,
              color: theme.colors.textMuted,
              backgroundColor: theme.colors.background,
              zIndex: 100,
            }}
          >
            Memuat ulang...
          </div>
        )}

        {/* Status Card */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 16,
            marginBottom: 12,
            boxShadow: theme.shadowCard,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  marginBottom: 4,
                }}
              >
                Progress Checklist
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: theme.colors.textMain,
                }}
              >
                {completedRequired.length}/{requiredItems.length}
              </div>
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: allRequiredDone
                  ? theme.colors.success
                  : progress >= 50
                  ? theme.colors.warning
                  : theme.colors.danger,
              }}
            >
              {progress}%
            </div>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              height: 8,
              backgroundColor: theme.colors.border,
              borderRadius: theme.radius.pill,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: allRequiredDone
                  ? theme.colors.success
                  : progress >= 50
                  ? theme.colors.warning
                  : theme.colors.danger,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {/* Status Badge */}
          <div style={{ marginTop: 12 }}>
            <span
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: theme.radius.pill,
                backgroundColor:
                  checklist.status === "COMPLETED"
                    ? "#DCFCE7"
                    : checklist.status === "INCOMPLETE"
                    ? "#FEE2E2"
                    : "#FEF3C7",
                color:
                  checklist.status === "COMPLETED"
                    ? theme.colors.success
                    : checklist.status === "INCOMPLETE"
                    ? theme.colors.danger
                    : theme.colors.warning,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {checklist.status === "COMPLETED"
                ? "Selesai"
                : checklist.status === "INCOMPLETE"
                ? "Tidak Lengkap"
                : "Berlangsung"}
            </span>
          </div>
        </div>

        {/* Checklist Items */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
              color: theme.colors.textMain,
            }}
          >
            Daftar Tugas
          </div>

          {checklist.items.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: theme.colors.textMuted,
                fontSize: 13,
              }}
            >
              Tidak ada tugas dalam checklist ini
            </div>
          ) : (
            checklist.items.map((item, idx) => {
              const isCompleted = item.status === "COMPLETED";
              const isNotApplicable = item.status === "NOT_APPLICABLE";
              const isFailed = item.status === "FAILED";
              const isPending = item.status === "PENDING";
              const isRequired = item.required === true;
              const isCompleting = completingItemId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.card,
                    padding: 14,
                    marginBottom: 8,
                    boxShadow: theme.shadowSoft,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    {/* Checkbox/Status Icon */}
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: `2px solid ${
                          isCompleted
                            ? theme.colors.success
                            : isNotApplicable
                            ? theme.colors.textMuted
                            : isFailed
                            ? theme.colors.danger
                            : theme.colors.borderStrong
                        }`,
                        backgroundColor: isCompleted
                          ? theme.colors.success
                          : isNotApplicable
                          ? theme.colors.border
                          : isFailed
                          ? theme.colors.danger
                          : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {isCompleted && (
                        <span style={{ color: "#FFFFFF", fontSize: 14 }}>✓</span>
                      )}
                      {isNotApplicable && (
                        <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                          −
                        </span>
                      )}
                      {isFailed && (
                        <span style={{ color: "#FFFFFF", fontSize: 12 }}>✗</span>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: theme.colors.textMain,
                          }}
                        >
                          {item.title}
                        </div>
                        {isRequired && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: theme.radius.pill,
                              backgroundColor: theme.colors.primarySoft,
                              color: theme.colors.primary,
                              fontWeight: 600,
                            }}
                          >
                            WAJIB
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <div
                          style={{
                            fontSize: 12,
                            color: theme.colors.textMuted,
                            marginBottom: 8,
                          }}
                        >
                          {item.description}
                        </div>
                      )}

                      {/* Note Input */}
                      {isPending && (
                        <div style={{ marginTop: 8 }}>
                          <textarea
                            placeholder="Catatan / penjelasan (opsional)"
                            value={item._tempNote || item.note || ""}
                            onChange={(e) => {
                              setChecklist((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  items: prev.items.map((it) =>
                                    it.id === item.id
                                      ? { ...it, _tempNote: e.target.value }
                                      : it
                                  ),
                                };
                              });
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: `1px solid ${theme.colors.border}`,
                              borderRadius: 8,
                              fontSize: 12,
                              fontFamily: "inherit",
                              resize: "vertical",
                              minHeight: 60,
                            }}
                          />
                        </div>
                      )}

                      {item.note && !isPending && (
                        <div
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSoft,
                            fontStyle: "italic",
                            marginTop: 8,
                            padding: 8,
                            backgroundColor: theme.colors.background,
                            borderRadius: 6,
                          }}
                        >
                          Catatan: {item.note}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {isPending && (
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            marginTop: 8,
                          }}
                        >
                          <button
                            onClick={() => handleCompleteItem(item, "COMPLETED")}
                            disabled={isCompleting}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              backgroundColor: theme.colors.success,
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: isCompleting ? "not-allowed" : "pointer",
                              opacity: isCompleting ? 0.6 : 1,
                            }}
                          >
                            {isCompleting ? "..." : "Selesai"}
                          </button>
                          {isRequired && (
                            <button
                              onClick={() =>
                                handleCompleteItem(item, "NOT_APPLICABLE")
                              }
                              disabled={isCompleting}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.textMain,
                                border: `1px solid ${theme.colors.borderStrong}`,
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: isCompleting ? "not-allowed" : "pointer",
                                opacity: isCompleting ? 0.6 : 1,
                              }}
                            >
                              Tidak Berlaku
                            </button>
                          )}
                        </div>
                      )}

                      {isCompleted && item.completed_at && (
                        <div
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSoft,
                            marginTop: 4,
                          }}
                        >
                          Selesai:{" "}
                          {new Date(item.completed_at).toLocaleTimeString("id-ID")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Warning if incomplete */}
        {checklist.status === "INCOMPLETE" && (
          <div
            style={{
              backgroundColor: "#FEF3C7",
              border: `1px solid ${theme.colors.warning}`,
              borderRadius: theme.radius.card,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: theme.colors.warning,
                marginBottom: 4,
              }}
            >
              ⚠️ Checklist Tidak Lengkap
            </div>
            <div
              style={{
                fontSize: 11,
                color: theme.colors.textMain,
              }}
            >
              Beberapa tugas wajib belum selesai. Checklist akan ditandai tidak
              lengkap saat check-out.
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

