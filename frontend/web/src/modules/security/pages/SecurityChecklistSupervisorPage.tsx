// frontend/web/src/modules/security/pages/SecurityChecklistSupervisorPage.tsx

import { useState, useEffect } from "react";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { getAdminChecklists, ChecklistSummary } from "../../../api/securityApi";
import { usePullToRefresh } from "../../shared/hooks/usePullToRefresh";

export function SecurityChecklistSupervisorPage() {
  const { t } = useTranslation();
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [siteId, setSiteId] = useState<string>("");
  const [data, setData] = useState<ChecklistSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { date_str: date };
      if (statusFilter) params.status_filter = statusFilter;
      if (siteId) params.site_id = parseInt(siteId);

      const { data: checklists } = await getAdminChecklists(params);
      setData(checklists);
    } catch (err: any) {
      console.error("Failed to load checklists:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const { containerRef, isRefreshing } = usePullToRefresh(loadData);

  useEffect(() => {
    loadData();
  }, [date, statusFilter, siteId]);

  const total = data.length;
  const completed = data.filter((c) => c.status === "COMPLETED").length;
  const incomplete = data.filter((c) => c.status === "INCOMPLETE").length;
  const open = data.filter((c) => c.status === "OPEN").length;

  return (
    <MobileLayout title="Dashboard Checklist Harian">
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

        {/* Filters */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 12,
            boxShadow: theme.shadowCard,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: theme.colors.textMuted,
                  marginBottom: 4,
                  display: "block",
                }}
              >
                Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: theme.colors.textMuted,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  Site ID
                </label>
                <input
                  type="text"
                  placeholder="Semua"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: theme.colors.textMuted,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <option value="">Semua</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="INCOMPLETE">Tidak Lengkap</option>
                  <option value="OPEN">Berlangsung</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <StatCard label="Total" value={total} />
          <StatCard label="Selesai" value={completed} accent="green" />
          <StatCard label="Tidak Lengkap" value={incomplete} accent="red" />
          <StatCard label="Berlangsung" value={open} accent="yellow" />
        </div>

        {/* Table */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            boxShadow: theme.shadowCard,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: theme.colors.textMuted,
              }}
            >
              Memuat...
            </div>
          ) : data.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: theme.colors.textMuted,
              }}
            >
              Tidak ada data
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12 }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: theme.colors.background,
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <th
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: theme.colors.textMain,
                      }}
                    >
                      User
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: theme.colors.textMain,
                      }}
                    >
                      Site
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: theme.colors.textMain,
                      }}
                    >
                      Shift
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: theme.colors.textMain,
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: theme.colors.textMain,
                      }}
                    >
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: theme.colors.textMain,
                          }}
                        >
                          {row.user_name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSoft,
                          }}
                        >
                          ID: {row.user_id}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ color: theme.colors.textMain }}>
                          {row.site_name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSoft,
                          }}
                        >
                          ID: {row.site_id}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div
                          style={{
                            fontSize: 11,
                            color: theme.colors.textMain,
                          }}
                        >
                          {row.shift_date}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSoft,
                          }}
                        >
                          {row.shift_type || "-"}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: theme.colors.textMain,
                          }}
                        >
                          {row.completed_count}/{row.total_required}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSoft,
                          }}
                        >
                          required
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "red" | "yellow";
}) {
  const borderColor =
    accent === "green"
      ? theme.colors.success
      : accent === "red"
      ? theme.colors.danger
      : accent === "yellow"
      ? theme.colors.warning
      : theme.colors.border;

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${borderColor}`,
        borderRadius: theme.radius.card,
        padding: 12,
        boxShadow: theme.shadowSoft,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: theme.colors.textMuted,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: theme.colors.textMain,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let backgroundColor = theme.colors.background;
  let color = theme.colors.textMain;

  if (status === "COMPLETED") {
    backgroundColor = "#DCFCE7";
    color = theme.colors.success;
  } else if (status === "INCOMPLETE") {
    backgroundColor = "#FEE2E2";
    color = theme.colors.danger;
  } else {
    backgroundColor = "#FEF3C7";
    color = theme.colors.warning;
  }

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: theme.radius.pill,
        backgroundColor,
        color,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {status === "COMPLETED"
        ? "Selesai"
        : status === "INCOMPLETE"
        ? "Tidak Lengkap"
        : "Berlangsung"}
    </span>
  );
}

