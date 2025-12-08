// frontend/web/src/modules/cleaning/pages/CleaningReportsListPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { SiteSelector, SiteOption } from "../../shared/components/SiteSelector";
import { usePullToRefresh } from "../../shared/hooks/usePullToRefresh";
import { listCleaningReports, exportCleaningReportsSummaryPDF, CleaningReport } from "../../../api/cleaningApi";
import { useToast } from "../../shared/components/Toast";

type Period = "today" | "week" | "month";

export function CleaningReportsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [sites] = useState<SiteOption[]>([
    { id: 1, name: "Situs A" },
    { id: 2, name: "Situs B" },
  ]);

  const [siteId, setSiteId] = useState<number | null>(
    sites.length ? sites[0].id : null
  );

  const [period, setPeriod] = useState<Period>("today");
  const [reports, setReports] = useState<CleaningReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadReports = async () => {
    if (!siteId) return;

    setLoading(true);
    try {
      const now = new Date();
      const start = new Date();

      if (period === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        const day = start.getDay();
        const diff = (day + 6) % 7;
        start.setDate(start.getDate() - diff);
        start.setHours(0, 0, 0, 0);
      } else if (period === "month") {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      }

      const fromDate = start.toISOString().split("T")[0];
      const toDate = now.toISOString().split("T")[0];

      const { data } = await listCleaningReports({
        site_id: siteId,
        from_date: fromDate,
        to_date: toDate,
      });

      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [siteId, period]);

  const { isRefreshing, pullProgress } = usePullToRefresh({
    onRefresh: loadReports,
    enabled: !loading,
  });

  const handleExportPDF = async () => {
    if (!siteId) return;
    setExporting(true);
    try {
      const now = new Date();
      const start = new Date();

      if (period === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        const day = start.getDay();
        const diff = (day + 6) % 7;
        start.setDate(start.getDate() - diff);
        start.setHours(0, 0, 0, 0);
      } else if (period === "month") {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      }

      const fromDate = start.toISOString().split("T")[0];
      const toDate = now.toISOString().split("T")[0];

      const blob = await exportCleaningReportsSummaryPDF({
        site_id: siteId,
        from_date: fromDate,
        to_date: toDate,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cleaning_Reports_${fromDate}_${toDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("PDF berhasil diekspor", "success");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Gagal mengekspor PDF", "error");
    } finally {
      setExporting(false);
    }
  };

  const periodOptions: { value: Period; label: string }[] = [
    { value: "today", label: t("common.today") },
    { value: "week", label: t("common.thisWeek") },
    { value: "month", label: t("common.thisMonth") },
  ];

  const severityColor = (sev?: string | null) => {
    if (sev === "high") return theme.colors.danger;
    if (sev === "medium") return theme.colors.warning;
    if (sev === "low") return theme.colors.success;
    return theme.colors.textSoft;
  };

  return (
    <MobileLayout title="Laporan Pembersihan">
      <SiteSelector
        sites={sites}
        value={siteId}
        onChange={(id) => setSiteId(id)}
      />

      {/* Filter period and export */}
      <div style={{ marginBottom: 8, display: "flex", gap: 6 }}>
        {periodOptions.map((opt) => {
          const active = period === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              style={{
                flex: 1,
                padding: "6px 4px",
                borderRadius: theme.radius.pill,
                border: `1px solid ${
                  active ? theme.colors.primary : theme.colors.border
                }`,
                backgroundColor: active
                  ? theme.colors.primary
                  : theme.colors.surface,
                color: active ? "#FFFFFF" : theme.colors.textMain,
                fontSize: 11,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={exporting || reports.length === 0}
          style={{
            padding: "6px 12px",
            borderRadius: theme.radius.pill,
            border: "none",
            backgroundColor: exporting
              ? theme.colors.textSoft
              : theme.colors.success,
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: 600,
            cursor: exporting ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {exporting ? "..." : "📄 PDF"}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ color: theme.colors.textSecondary }}>Memuat...</div>
        </div>
      ) : reports.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: theme.colors.textSecondary,
          }}
        >
          Tidak ada laporan
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {reports.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => navigate(`/cleaning/reports/${r.id}`)}
              style={{
                width: "100%",
                textAlign: "left",
                borderRadius: theme.radius.card,
                border: "none",
                backgroundColor: theme.colors.surface,
                padding: 10,
                boxShadow: theme.shadowSoft,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 11,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    textTransform: "uppercase",
                    color: theme.colors.textMuted,
                    letterSpacing: 0.4,
                  }}
                >
                  {r.report_type}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: severityColor(r.severity),
                  }}
                >
                  {r.severity ? r.severity.toUpperCase() : "N/A"}
                </span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: theme.colors.textMain,
                }}
              >
                {r.title}
              </div>
              {r.location_text && (
                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.textSoft,
                  }}
                >
                  {r.location_text}
                </div>
              )}
              <div
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: theme.colors.textSoft,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{new Date(r.created_at).toLocaleString("id-ID")}</span>
                <span style={{ fontSize: 14, color: theme.colors.textSoft }}>
                  ›
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => navigate("/cleaning/reports/new")}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: theme.radius.pill,
            border: "none",
            backgroundColor: theme.colors.primary,
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Buat Laporan Baru
        </button>
      </div>
    </MobileLayout>
  );
}

