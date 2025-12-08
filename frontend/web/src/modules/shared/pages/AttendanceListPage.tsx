// frontend/web/src/modules/shared/pages/AttendanceListPage.tsx

import { useEffect, useState } from "react";
import { MobileLayout } from "../components/MobileLayout";
import { Card } from "../components/Card";
import { theme } from "../components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../components/Toast";
import { listMyAttendance } from "../../../api/attendanceApi";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

type RoleType = "SECURITY" | "CLEANING" | "DRIVER" | "PARKING" | undefined;

interface AttendanceListPageProps {
  roleType?: RoleType;
}

interface AttendanceRecord {
  id: number;
  site_id: number;
  site_name: string;
  role_type: string;
  checkin_time: string | null;
  checkout_time: string | null;
  checkin_lat: number | null;
  checkin_lng: number | null;
  checkout_lat: number | null;
  checkout_lng: number | null;
  status: string;
  is_valid_location: boolean;
}

const formatDateTime = (str: string | null): string => {
  if (!str) return "-";
  const d = new Date(str);
  return d.toLocaleString("id-ID");
};

export function AttendanceListPage({ roleType }: AttendanceListPageProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await listMyAttendance(roleType);
      setRecords(data);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Gagal memuat attendance";
      setErrorMsg(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleType]);

  const { containerRef, isRefreshing } = usePullToRefresh(loadData);

  const getRoleLabel = () => {
    switch (roleType) {
      case "SECURITY":
        return "Security";
      case "CLEANING":
        return "Pembersihan";
      case "DRIVER":
        return "Driver";
      case "PARKING":
        return "Parkir";
      default:
        return "Semua";
    }
  };

  return (
    <MobileLayout title={`Riwayat Attendance - ${getRoleLabel()}`}>
      <div
        ref={containerRef}
        style={{
          padding: "16px",
          paddingBottom: "80px",
          position: "relative",
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

        {loading && !isRefreshing ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ color: theme.colors.textSecondary }}>Memuat...</div>
          </div>
        ) : errorMsg ? (
          <Card>
            <div
              style={{
                backgroundColor: theme.colors.danger + "20",
                border: `1px solid ${theme.colors.danger}`,
                color: theme.colors.danger,
                fontSize: 13,
                borderRadius: theme.radius.card,
                padding: "10px 12px",
              }}
            >
              {errorMsg}
            </div>
          </Card>
        ) : records.length === 0 ? (
          <Card>
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: theme.colors.textSecondary,
              }}
            >
              Belum ada attendance
            </div>
          </Card>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {records.map((r) => (
              <Card key={r.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: theme.colors.textMain,
                        marginBottom: 4,
                      }}
                    >
                      {r.site_name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        color: theme.colors.textMuted,
                        marginBottom: 8,
                      }}
                    >
                      {r.role_type}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      padding: "4px 8px",
                      borderRadius: theme.radius.pill,
                      backgroundColor:
                        r.status === "COMPLETED"
                          ? theme.colors.success + "20"
                          : theme.colors.warning + "20",
                      color:
                        r.status === "COMPLETED"
                          ? theme.colors.success
                          : theme.colors.warning,
                      fontWeight: 600,
                    }}
                  >
                    {r.status === "COMPLETED" ? "Selesai" : "Berlangsung"}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.textMain,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: theme.colors.textMuted }}>Clock In:</span>{" "}
                  {formatDateTime(r.checkin_time)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.textMain,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ color: theme.colors.textMuted }}>Clock Out:</span>{" "}
                  {formatDateTime(r.checkout_time)}
                </div>

                {!r.is_valid_location && (
                  <div
                    style={{
                      fontSize: 10,
                      color: theme.colors.danger,
                      marginTop: 4,
                      fontStyle: "italic",
                    }}
                  >
                    ⚠️ Lokasi tidak valid
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

