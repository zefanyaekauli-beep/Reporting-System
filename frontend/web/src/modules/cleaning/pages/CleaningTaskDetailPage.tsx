// frontend/web/src/modules/cleaning/pages/CleaningTaskDetailPage.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { Card } from "../../shared/components/Card";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { getCleaningTaskDetail } from "../../../api/cleaningApi";
import { formatDateTime, formatTime } from "../../../utils/formatDate";
import { StatusBadge } from "../../shared/components/StatusBadge";

interface CleaningTaskDetail {
  id: number;
  user: {
    id: number;
    name: string;
  };
  site: {
    id: number;
    name: string;
  };
  zone: {
    id: number;
    name: string;
    code?: string | null;
  } | null;
  shift_date: string;
  status: string;
  completion: {
    total_items: number;
    completed_items: number;
    completion_percentage: number;
  };
  items: Array<{
    id: number;
    order: number;
    title: string;
    description?: string | null;
    required: boolean;
    evidence_type: string;
    status: string;
    completed_at?: string | null;
    evidence?: Array<{ type: string; path?: string; id?: number }>;
    notes?: string;
    answer?: string;
  }>;
  timeline: Array<{
    time: string;
    type: string;
    description: string;
  }>;
  created_at: string;
  updated_at: string;
}

export function CleaningTaskDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<CleaningTaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    setError(null);
    try {
      if (id) {
        const detail = await getCleaningTaskDetail(Number(id));
        setTask(detail);
      } else {
        setError("ID tugas tidak ditemukan");
      }
    } catch (err: any) {
      console.error("Failed to load task:", err);
      setError(err?.response?.data?.detail || "Gagal memuat detail tugas");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "OPEN":
        return "info";
      case "IN_PROGRESS":
        return "warning";
      default:
        return "info";
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "warning";
      case "NOT_APPLICABLE":
        return "info";
      default:
        return "info";
    }
  };

  if (loading) {
    return (
      <MobileLayout title={t("cleaning.taskDetail") || "Detail Tugas"}>
        <SkeletonCard />
        <SkeletonCard />
      </MobileLayout>
    );
  }

  if (error || !task) {
    return (
      <MobileLayout title={t("cleaning.taskDetail") || "Detail Tugas"}>
        <Card hover={false}>
          <div style={{ textAlign: "center", padding: 40, color: theme.colors.danger }}>
            {error || "Tugas tidak ditemukan"}
          </div>
          <button
            onClick={() => navigate("/cleaning/tasks")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: theme.colors.primary,
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Kembali ke Daftar
          </button>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={t("cleaning.taskDetail") || "Detail Tugas"}>
      {/* Header Card */}
      <Card hover={false}>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 12,
              color: theme.colors.textMuted,
              marginBottom: 4,
            }}
          >
            ID: #{task.id}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            {task.zone?.name || "Tugas Pembersihan"}
          </div>
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={task.status} color={getStatusColor(task.status)} />
          </div>
        </div>
      </Card>

      {/* Completion Card */}
      <Card hover={false}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            color: theme.colors.textMain,
          }}
        >
          Progress Penyelesaian
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Progress
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.primary }}>
              {task.completion.completion_percentage.toFixed(0)}%
            </div>
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  width: "100%",
                  height: 8,
                  backgroundColor: theme.colors.border,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${task.completion.completion_percentage}%`,
                    height: "100%",
                    backgroundColor: theme.colors.primary,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  marginBottom: 4,
                }}
              >
                Selesai
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {task.completion.completed_items} / {task.completion.total_items}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Card */}
      <Card hover={false}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            color: theme.colors.textMain,
          }}
        >
          Detail Tugas
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Zone
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {task.zone?.name || "N/A"}
              {task.zone?.code && ` (${task.zone.code})`}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Site
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{task.site.name}</div>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Petugas
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{task.user.name}</div>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Tanggal Shift
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {formatDateTime(task.shift_date)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Dibuat
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {formatDateTime(task.created_at)}
            </div>
          </div>
        </div>
      </Card>

      {/* Checklist Items */}
      <Card hover={false}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            color: theme.colors.textMain,
          }}
        >
          Item Checklist ({task.items.length})
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {task.items.map((item) => (
            <div
              key={item.id}
              style={{
                padding: 12,
                backgroundColor: theme.colors.bgSecondary,
                borderRadius: 8,
                border: `1px solid ${
                  item.status === "COMPLETED"
                    ? theme.colors.success
                    : theme.colors.border
                }`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {item.order}. {item.title}
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.colors.textMuted,
                        marginBottom: 4,
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
                <StatusBadge
                  status={item.status}
                  color={getItemStatusColor(item.status)}
                />
              </div>
              {item.completed_at && (
                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.textMuted,
                    marginBottom: 4,
                  }}
                >
                  Selesai: {formatTime(item.completed_at)}
                </div>
              )}
              {item.answer && (
                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.textMain,
                    marginTop: 4,
                    padding: 8,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 4,
                  }}
                >
                  <strong>Jawaban:</strong> {item.answer}
                </div>
              )}
              {item.notes && (
                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.textMain,
                    marginTop: 4,
                    padding: 8,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 4,
                  }}
                >
                  <strong>Catatan:</strong> {item.notes}
                </div>
              )}
              {item.evidence && item.evidence.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.colors.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    Bukti:
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {item.evidence.map((ev, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 80,
                          height: 80,
                          backgroundColor: theme.colors.border,
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        {ev.path && (
                          <img
                            src={`http://localhost:8000/${ev.path}`}
                            alt={`Evidence ${idx + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement!.innerHTML =
                                '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 24px;">📷</div>';
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      {task.timeline && task.timeline.length > 0 && (
        <Card hover={false}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
              color: theme.colors.textMain,
            }}
          >
            Timeline
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {task.timeline.map((event, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: 12,
                  paddingLeft: 8,
                  borderLeft: `2px solid ${
                    event.type === "CREATED"
                      ? theme.colors.primary
                      : event.type === "COMPLETED"
                      ? theme.colors.success
                      : theme.colors.info
                  }`,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor:
                      event.type === "CREATED"
                        ? theme.colors.primary
                        : event.type === "COMPLETED"
                        ? theme.colors.success
                        : theme.colors.info,
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 2 }}>
                    {formatTime(event.time)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {event.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => navigate("/cleaning/tasks")}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: "#FFFFFF",
            color: theme.colors.textMain,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Kembali ke Daftar
        </button>
      </div>
    </MobileLayout>
  );
}

