// frontend/web/src/modules/security/pages/SecurityShiftExchangePage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { FormInput } from "../../shared/components/FormInput";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import {
  getMyShifts,
  getOpenShifts,
  createShiftExchange,
  getMyShiftExchanges,
  getOpenShiftExchanges,
  respondToShiftExchange,
  cancelShiftExchange,
  getPendingApprovals,
  approveShiftExchange,
  applyShiftExchange,
  type ShiftSchedule,
  type ShiftExchange,
} from "../../../api/securityApi";
import { useAuthStore } from "../../../stores/authStore";
import { theme } from "../../shared/components/theme";

export function SecurityShiftExchangePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const userRole = useAuthStore((s) => s.user?.role || "guard");
  const isSupervisor = userRole === "supervisor" || userRole === "admin";
  const [activeTab, setActiveTab] = useState<"my" | "open" | "create" | "approval">("my");
  const [myExchanges, setMyExchanges] = useState<ShiftExchange[]>([]);
  const [openExchanges, setOpenExchanges] = useState<ShiftExchange[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ShiftExchange[]>([]);
  const [myShifts, setMyShifts] = useState<ShiftSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create form state
  const [fromShiftId, setFromShiftId] = useState("");
  const [toShiftId, setToShiftId] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedSite, activeTab]);

  async function loadData() {
    try {
      setLoading(true);
      if (activeTab === "my") {
        const { data } = await getMyShiftExchanges();
        setMyExchanges(data);
      } else if (activeTab === "open") {
        const { data } = await getOpenShiftExchanges({
          site_id: selectedSite?.id,
        });
        setOpenExchanges(data);
      } else if (activeTab === "approval" && isSupervisor) {
        const { data } = await getPendingApprovals({
          site_id: selectedSite?.id,
        });
        setPendingApprovals(data);
      } else if (activeTab === "create") {
        const { data } = await getMyShifts({
          start_date: new Date().toISOString().split("T")[0],
        });
        setMyShifts(data.filter((s) => s.status === "confirmed" || s.status === "assigned"));
      }
    } catch (error: any) {
      showToast("Error loading data", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateExchange() {
    if (!fromShiftId || !selectedSite) {
      showToast("Please select a shift to exchange", "error");
      return;
    }

    try {
      setCreating(true);
      await createShiftExchange({
        site_id: selectedSite.id,
        from_shift_id: parseInt(fromShiftId),
        to_shift_id: toShiftId ? parseInt(toShiftId) : null,
        request_message: requestMessage || null,
      });
      showToast("Exchange request created", "success");
      setFromShiftId("");
      setToShiftId("");
      setRequestMessage("");
      setActiveTab("my");
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Error creating exchange", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleRespond(exchangeId: number, accept: boolean) {
    try {
      await respondToShiftExchange(exchangeId, {
        accept,
        response_message: null,
      });
      showToast(
        accept
          ? t("security.exchangeAccepted")
          : t("security.exchangeRejected"),
        "success"
      );
      loadData();
    } catch (error: any) {
      showToast(t("common.error"), "error");
    }
  }

  async function handleApprove(exchangeId: number, approve: boolean) {
    try {
      await approveShiftExchange(exchangeId, {
        approve,
        approval_notes: null,
      });
      showToast(
        approve ? t("security.exchangeApproved") : t("security.exchangeRejectedBySupervisor"),
        "success"
      );
      loadData();
    } catch (error: any) {
      showToast(t("common.error"), "error");
    }
  }

  async function handleApply(exchangeId: number) {
    try {
      await applyShiftExchange(exchangeId);
      showToast(t("security.exchangeApplied"), "success");
      loadData();
    } catch (error: any) {
      showToast(t("common.error"), "error");
    }
  }

  async function handleCancel(exchangeId: number) {
    try {
      await cancelShiftExchange(exchangeId);
      showToast("Exchange cancelled", "success");
      loadData();
    } catch (error: any) {
      showToast("Error cancelling exchange", "error");
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
      case "accepted":
      case "completed":
        return "success";
      case "rejected":
      case "rejected_by_supervisor":
        return "error";
      case "pending":
      case "pending_approval":
        return "warning";
      case "cancelled":
        return "inactive";
      default:
        return "pending";
    }
  };

  return (
    <MobileLayout
      title={t("security.shiftExchange")}
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
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setActiveTab("my")}
            style={{
              flex: 1,
              minWidth: "80px",
              padding: "12px",
              background:
                activeTab === "my"
                  ? theme.colors.primary
                  : theme.colors.backgroundSecondary,
              color: activeTab === "my" ? "white" : theme.colors.text,
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
            >
              {t("security.myRequests")}
            </button>
            <button
              onClick={() => setActiveTab("open")}
              style={{
                flex: 1,
                minWidth: "80px",
                padding: "12px",
                background:
                  activeTab === "open"
                    ? theme.colors.primary
                    : theme.colors.backgroundSecondary,
                color: activeTab === "open" ? "white" : theme.colors.text,
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t("security.openRequests")}
            </button>
            {isSupervisor && (
              <button
                onClick={() => setActiveTab("approval")}
                style={{
                  flex: 1,
                  minWidth: "80px",
                  padding: "12px",
                  background:
                    activeTab === "approval"
                      ? theme.colors.primary
                      : theme.colors.backgroundSecondary,
                  color: activeTab === "approval" ? "white" : theme.colors.text,
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {t("security.approvals")}
                {pendingApprovals.length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "#dc2626",
                      color: "white",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      fontSize: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab("create")}
              style={{
                flex: 1,
                minWidth: "80px",
                padding: "12px",
                background:
                  activeTab === "create"
                    ? theme.colors.primary
                    : theme.colors.backgroundSecondary,
                color: activeTab === "create" ? "white" : theme.colors.text,
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t("security.createExchange")}
            </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ color: theme.colors.textSecondary }}>{t("common.loading")}</div>
          </div>
        ) : activeTab === "create" ? (
          <Card>
            <h3 style={{ margin: "0 0 16px", color: theme.colors.text }}>
              {t("security.createExchangeRequest")}
            </h3>

            <FormInput
              label={t("security.myShiftToExchange")}
              type="select"
              value={fromShiftId}
              onChange={(e) => setFromShiftId(e.target.value)}
              required
            >
              <option value="">{t("security.selectShift")}</option>
              {myShifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {formatDate(shift.shift_date)} - {shift.shift_type === "MORNING" ? t("security.morningShift") :
                   shift.shift_type === "DAY" ? t("security.dayShift") :
                   shift.shift_type === "NIGHT" ? t("security.nightShift") :
                   shift.shift_type} {t("security.shift")}
                </option>
              ))}
            </FormInput>

            <div style={{ marginTop: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 6,
                  color: theme.colors.text,
                }}
              >
                {t("security.requestMessage")} ({t("common.optional")})
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${theme.colors.border}`,
                  fontSize: 14,
                  fontFamily: "inherit",
                  resize: "vertical",
                  minHeight: "80px",
                }}
              />
            </div>

            <button
              onClick={handleCreateExchange}
              disabled={creating || !fromShiftId}
              style={{
                width: "100%",
                marginTop: "24px",
                padding: "14px",
                background:
                  creating || !fromShiftId
                    ? theme.colors.textSecondary
                    : theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: creating || !fromShiftId ? "not-allowed" : "pointer",
              }}
            >
              {creating ? t("common.loading") : t("security.createExchangeRequest")}
            </button>
          </Card>
        ) : activeTab === "my" ? (
          myExchanges.length === 0 ? (
            <Card>
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ color: theme.colors.textSecondary }}>
                  {t("security.noExchangeRequests")}
                </div>
              </div>
            </Card>
          ) : (
            myExchanges.map((exchange) => (
              <Card key={exchange.id} style={{ marginBottom: "16px" }}>
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
                      {t("security.exchangeRequest")} #{exchange.id}
                    </h3>
                    <div
                      style={{
                        fontSize: "14px",
                        color: theme.colors.textSecondary,
                        marginTop: "4px",
                      }}
                    >
                      {formatDate(exchange.requested_at)}
                    </div>
                  </div>
                  <StatusBadge status={getStatusColor(exchange.status)} />
                </div>

                {exchange.request_message && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: theme.colors.textSecondary,
                      marginBottom: "12px",
                    }}
                  >
                    {exchange.request_message}
                  </p>
                )}

                {exchange.status === "pending_approval" && (
                  <div
                    style={{
                      padding: "8px",
                      background: "#fef3c7",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#92400e",
                      marginBottom: "8px",
                    }}
                  >
                    ⏳ {t("security.waitingApproval")}
                  </div>
                )}
                {exchange.status === "accepted" && !exchange.applied_at && (
                  <div
                    style={{
                      padding: "8px",
                      background: "#dbeafe",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#1e40af",
                      marginBottom: "8px",
                    }}
                  >
                    ✅ {t("security.approvedReady")}
                  </div>
                )}
                {exchange.status === "pending" && exchange.from_user_id && (
                  <button
                    onClick={() => handleCancel(exchange.id)}
                    style={{
                      width: "100%",
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
                    {t("security.cancelRequest")}
                  </button>
                )}
              </Card>
            ))
          )
        ) : activeTab === "open" ? (
          openExchanges.length === 0 ? (
            <Card>
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ color: theme.colors.textSecondary }}>
                  No open exchange requests
                </div>
              </div>
            </Card>
          ) : (
            openExchanges.map((exchange) => (
              <Card key={exchange.id} style={{ marginBottom: "16px" }}>
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
                      {t("security.exchangeRequest")} #{exchange.id}
                    </h3>
                    <div
                      style={{
                        fontSize: "14px",
                        color: theme.colors.textSecondary,
                        marginTop: "4px",
                      }}
                    >
                      {formatDate(exchange.requested_at)}
                    </div>
                  </div>
                  <StatusBadge status="warning" />
                </div>

                {exchange.request_message && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: theme.colors.textSecondary,
                      marginBottom: "12px",
                    }}
                  >
                    {exchange.request_message}
                  </p>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleRespond(exchange.id, true)}
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
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(exchange.id, false)}
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
                    Reject
                  </button>
                </div>
              </Card>
            ))
          )
        ) : activeTab === "approval" && isSupervisor ? (
          // Approval Tab (Supervisor only)
          pendingApprovals.length === 0 ? (
            <Card>
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ color: theme.colors.textSecondary }}>
                  No pending approvals
                </div>
              </div>
            </Card>
          ) : (
            pendingApprovals.map((exchange) => (
              <Card key={exchange.id} style={{ marginBottom: "16px" }}>
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
                      {t("security.exchangeRequest")} #{exchange.id}
                    </h3>
                    <div
                      style={{
                        fontSize: "14px",
                        color: theme.colors.textSecondary,
                        marginTop: "4px",
                      }}
                    >
                      {formatDate(exchange.requested_at)}
                    </div>
                  </div>
                  <StatusBadge status="warning" />
                </div>

                {exchange.request_message && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: theme.colors.textSecondary,
                      marginBottom: "12px",
                    }}
                  >
                    {exchange.request_message}
                  </p>
                )}

                <div
                  style={{
                    padding: "12px",
                    background: theme.colors.backgroundSecondary,
                    borderRadius: "6px",
                    marginBottom: "12px",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <strong>{t("security.fromUser")}:</strong> {t("security.guard")} #{exchange.from_user_id}
                  </div>
                  {exchange.to_user_id && (
                    <div style={{ marginTop: "4px" }}>
                      <strong>{t("security.toUser")}:</strong> {t("security.guard")} #{exchange.to_user_id}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleApprove(exchange.id, true)}
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
                    Approve
                  </button>
                  <button
                    onClick={() => handleApprove(exchange.id, false)}
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
                    Reject
                  </button>
                </div>
              </Card>
            ))
          )
        ) : null}
      </div>
    </MobileLayout>
  );
}

