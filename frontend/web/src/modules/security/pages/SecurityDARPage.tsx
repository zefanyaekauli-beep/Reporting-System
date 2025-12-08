// frontend/web/src/modules/security/pages/SecurityDARPage.tsx

import { useState, useEffect } from "react";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../../shared/components/Toast";
import { useSite } from "../../shared/contexts/SiteContext";
import {
  generateDAR,
  listDARReports,
  DailyActivityReport,
} from "../../../api/securityApi";

export function SecurityDARPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { selectedSite } = useSite();
  const siteId = selectedSite?.id || 1;

  const [reports, setReports] = useState<DailyActivityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data } = await listDARReports({
        site_id: siteId,
        shift_date: selectedDate,
      });
      setReports(data);
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      showToast("Gagal memuat DAR reports", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [siteId, selectedDate]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateDAR({
        site_id: siteId,
        shift_date: selectedDate,
      });
      showToast(t("security.darGenerated"), "success");
      await loadReports();
    } catch (err: any) {
      console.error("Failed to generate DAR:", err);
      showToast(t("security.failedToGenerateDAR"), "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <MobileLayout title={t("security.dailyActivityReport")}>
      <div style={{ padding: "12px 0" }}>
        {/* Date Selector & Generate */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 12,
            boxShadow: theme.shadowCard,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 4,
                color: theme.colors.textMain,
              }}
            >
              {t("security.shiftDate")}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: theme.colors.primary,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: generating ? "not-allowed" : "pointer",
              opacity: generating ? 0.6 : 1,
            }}
          >
            {generating ? t("security.generating") : t("security.generateDAR")}
          </button>
        </div>

        {/* Reports List */}
        {loading ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: theme.colors.textMuted,
            }}
          >
            {t("common.loading")}
          </div>
        ) : reports.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: theme.colors.textMuted,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
            <div style={{ marginBottom: 4, fontWeight: 600 }}>
              {t("security.noDARs")}
            </div>
            <div style={{ fontSize: 12 }}>
              {t("security.generateDAR")} {t("security.toViewDailyActivityReport")}
            </div>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                padding: 16,
                marginBottom: 8,
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
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.colors.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    {report.report_number}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: theme.colors.textMain,
                    }}
                  >
                    {report.shift_date} • {report.shift_type || "All Shifts"}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: theme.radius.pill,
                    backgroundColor:
                      report.status === "final"
                        ? "#DCFCE7"
                        : report.status === "sent"
                        ? "#DBEAFE"
                        : "#FEF3C7",
                    color:
                      report.status === "final"
                        ? theme.colors.success
                        : report.status === "sent"
                        ? "#3B82F6"
                        : theme.colors.warning,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {report.status}
                </span>
              </div>

              {/* Summary Data */}
              {report.summary_data && (
                <div
                  style={{
                    backgroundColor: theme.colors.background,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: theme.colors.textMain,
                    }}
                  >
                    Summary
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      fontSize: 11,
                    }}
                  >
                    <div>
                      Check-ins:{" "}
                      <strong>
                        {report.summary_data.check_ins?.length || 0}
                      </strong>
                    </div>
                    <div>
                      Patrols:{" "}
                      <strong>
                        {report.summary_data.patrols?.length || 0}
                      </strong>
                    </div>
                    <div>
                      Incidents:{" "}
                      <strong>
                        {report.summary_data.incidents?.length || 0}
                      </strong>
                    </div>
                    <div>
                      Reports:{" "}
                      <strong>
                        {report.summary_data.reports?.length || 0}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  fontSize: 11,
                  color: theme.colors.textSoft,
                }}
              >
                Generated: {new Date(report.created_at).toLocaleString("id-ID")}
              </div>
            </div>
          ))
        )}
      </div>
    </MobileLayout>
  );
}

