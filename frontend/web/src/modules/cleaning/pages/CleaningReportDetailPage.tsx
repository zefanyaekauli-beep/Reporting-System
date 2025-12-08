// frontend/web/src/modules/cleaning/pages/CleaningReportDetailPage.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../../shared/components/Toast";
import { getCleaningReport, exportCleaningReportPDF, CleaningReport } from "../../../api/cleaningApi";

export function CleaningReportDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [report, setReport] = useState<CleaningReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await getCleaningReport(parseInt(id));
        setReport(data);
      } catch (err: any) {
        showToast(err.response?.data?.detail || "Gagal memuat laporan", "error");
        navigate("/cleaning/reports");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, showToast]);

  const handleExportPDF = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const blob = await exportCleaningReportPDF(parseInt(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cleaning_Report_${id}_${new Date().toISOString().split("T")[0]}.pdf`;
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

  if (loading) {
    return (
      <MobileLayout title="Detail Laporan">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ color: theme.colors.textSecondary }}>Memuat...</div>
        </div>
      </MobileLayout>
    );
  }

  if (!report) {
    return (
      <MobileLayout title="Detail Laporan">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ color: theme.colors.textSecondary }}>Laporan tidak ditemukan</div>
        </div>
      </MobileLayout>
    );
  }

  const severityColor = (sev?: string | null) => {
    if (sev === "high") return theme.colors.danger;
    if (sev === "medium") return theme.colors.warning;
    if (sev === "low") return theme.colors.success;
    return theme.colors.textSoft;
  };

  return (
    <MobileLayout title="Detail Laporan">
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        <Card>
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  color: theme.colors.textMuted,
                  letterSpacing: 0.4,
                }}
              >
                {report.report_type}
              </span>
              {report.severity && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: severityColor(report.severity),
                    padding: "4px 8px",
                    borderRadius: theme.radius.pill,
                    backgroundColor: severityColor(report.severity) + "20",
                  }}
                >
                  {report.severity.toUpperCase()}
                </span>
              )}
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                marginBottom: 8,
                color: theme.colors.textMain,
              }}
            >
              {report.title}
            </h2>
            {report.location_text && (
              <div
                style={{
                  fontSize: 13,
                  color: theme.colors.textSoft,
                  marginBottom: 8,
                }}
              >
                📍 {report.location_text}
              </div>
            )}
            {report.description && (
              <div
                style={{
                  fontSize: 14,
                  color: theme.colors.textMain,
                  lineHeight: 1.6,
                  marginTop: 12,
                }}
              >
                {report.description}
              </div>
            )}
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: `1px solid ${theme.colors.border}`,
                fontSize: 12,
                color: theme.colors.textSoft,
              }}
            >
              Dibuat: {new Date(report.created_at).toLocaleString("id-ID")}
            </div>
          </div>
        </Card>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exporting}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: theme.radius.pill,
              border: "none",
              backgroundColor: exporting
                ? theme.colors.textSoft
                : theme.colors.success,
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              cursor: exporting ? "not-allowed" : "pointer",
            }}
          >
            {exporting ? "Mengekspor..." : "📄 Ekspor PDF"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: theme.radius.pill,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: "#FFFFFF",
              color: theme.colors.textMain,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Kembali
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}

