// frontend/web/src/modules/security/pages/SecurityShiftsPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import {
  getMyShifts,
  getOpenShifts,
  confirmShift,
  type ShiftSchedule,
} from "../../../api/securityApi";
import { theme } from "../../shared/components/theme";

export function SecurityShiftsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const [myShifts, setMyShifts] = useState<ShiftSchedule[]>([]);
  const [openShifts, setOpenShifts] = useState<ShiftSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "open">("my");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedSite, activeTab]);

  async function loadData() {
    try {
      setLoading(true);
      if (activeTab === "my") {
        const { data } = await getMyShifts({
          start_date: new Date().toISOString().split("T")[0],
        });
        setMyShifts(data);
      } else {
        const { data } = await getOpenShifts({
          site_id: selectedSite?.id,
        });
        setOpenShifts(data);
      }
    } catch (error: any) {
      showToast("Error loading shifts", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(shiftId: number, confirmed: boolean) {
    try {
      await confirmShift(shiftId, { confirmed, notes: null });
      showToast(
        confirmed ? t("security.confirmed") : t("security.declineShift"),
        "success"
      );
      loadData();
    } catch (error: any) {
      showToast(t("common.error"), "error");
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success";
      case "assigned":
        return "warning";
      case "completed":
        return "completed";
      case "cancelled":
        return "error";
      default:
        return "pending";
    }
  };

  return (
    <MobileLayout
      title={t("security.shifts")}
      showBack
      onBackClick={() => navigate("/security")}
    >
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={() => setActiveTab("my")}
            style={{
              flex: 1,
              padding: "12px",
              background:
                activeTab === "my"
                  ? theme.colors.primary
                  : theme.colors.backgroundSecondary,
              color:
                activeTab === "my" ? "white" : theme.colors.text,
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            My Shifts
          </button>
          <button
            onClick={() => setActiveTab("open")}
            style={{
              flex: 1,
              padding: "12px",
              background:
                activeTab === "open"
                  ? theme.colors.primary
                  : theme.colors.backgroundSecondary,
              color:
                activeTab === "open" ? "white" : theme.colors.text,
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Open Shifts
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ color: theme.colors.textSecondary }}>{t("common.loading")}</div>
          </div>
        ) : activeTab === "my" ? (
          myShifts.length === 0 ? (
            <Card>
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ color: theme.colors.textSecondary }}>
                  {t("security.noShiftsScheduled")}
                </div>
              </div>
            </Card>
          ) : (
            myShifts.map((shift) => (
              <Card key={shift.id} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: theme.colors.text }}>
                      {formatDate(shift.shift_date)}
                    </h3>
                    <div
                      style={{
                        fontSize: "14px",
                        color: theme.colors.textSecondary,
                        marginTop: "4px",
                      }}
                    >
                      {shift.shift_type} Shift
                      {shift.start_time && shift.end_time && (
                        <span>
                          {" "}
                          • {shift.start_time} - {shift.end_time}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={getStatusColor(shift.status)} />
                </div>

                {shift.status === "assigned" && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleConfirm(shift.id, true)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: theme.colors.primary,
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {t("security.confirmShift")}
                    </button>
                    <button
                      onClick={() => handleConfirm(shift.id, false)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: theme.colors.backgroundSecondary,
                        color: theme.colors.text,
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {t("security.declineShift")}
                    </button>
                  </div>
                )}
              </Card>
            ))
          )
          ) : (
            openShifts.length === 0 ? (
              <Card>
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ color: theme.colors.textSecondary }}>
                    {t("security.noOpenShifts")}
                  </div>
                </div>
              </Card>
            ) : (
              openShifts.map((shift) => (
                <Card key={shift.id} style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, color: theme.colors.text }}>
                        {formatDate(shift.shift_date)}
                      </h3>
                      <div
                        style={{
                          fontSize: "14px",
                          color: theme.colors.textSecondary,
                          marginTop: "4px",
                        }}
                      >
                        {shift.shift_type === "MORNING" ? t("security.morningShift") :
                         shift.shift_type === "DAY" ? t("security.dayShift") :
                         shift.shift_type === "NIGHT" ? t("security.nightShift") :
                         shift.shift_type} {t("security.shift")}
                        {shift.start_time && shift.end_time && (
                          <span>
                            {" "}
                            • {shift.start_time} - {shift.end_time}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status="warning" />
                  </div>

                  <button
                    onClick={() => handleConfirm(shift.id, true)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: theme.colors.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {t("security.acceptShift")}
                  </button>
                </Card>
              ))
            )
          )}
      </div>
    </MobileLayout>
  );
}

