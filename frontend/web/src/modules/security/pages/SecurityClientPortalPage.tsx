// frontend/web/src/modules/security/pages/SecurityClientPortalPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import {
  getClientReports,
  getClientDAR,
  exportDARPDF,
} from "../../../api/securityApi";
import { theme } from "../../shared/components/theme";

export function SecurityClientPortalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [dars, setDars] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"reports" | "dar">("reports");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedSite, activeTab]);

  async function loadData() {
    try {
      setLoading(true);
      if (activeTab === "reports") {
        const { data } = await getClientReports({
          site_id: selectedSite?.id,
        });
        setReports(data);
      } else {
        // Load DARs - you might need a separate endpoint
        const { data } = await getClientReports({
          site_id: selectedSite?.id,
          report_type: "dar",
        });
        setDars(data);
      }
    } catch (error: any) {
      showToast("Error loading reports", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportDAR(darId: number) {
    try {
      const blob = await exportDARPDF(darId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dar_${darId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast(t("security.darExported"), "success");
    } catch (error: any) {
      showToast(t("common.error"), "error");
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <MobileLayout
      title={t("security.clientPortal")}
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
            onClick={() => setActiveTab("reports")}
            style={{
              flex: 1,
              padding: "12px",
              background:
                activeTab === "reports"
                  ? theme.colors.primary
                  : theme.colors.backgroundSecondary,
              color: activeTab === "reports" ? "white" : theme.colors.text,
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t("security.reports")}
          </button>
          <button
            onClick={() => setActiveTab("dar")}
            style={{
              flex: 1,
              padding: "12px",
              background:
                activeTab === "dar"
                  ? theme.colors.primary
                  : theme.colors.backgroundSecondary,
              color: activeTab === "dar" ? "white" : theme.colors.text,
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t("security.dar")}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ color: theme.colors.textSecondary }}>Loading...</div>
          </div>
        ) : activeTab === "reports" ? (
          reports.length === 0 ? (
            <Card>
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ color: theme.colors.textSecondary }}>
                  {t("security.noReportsFound")}
                </div>
              </div>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} style={{ marginBottom: "16px" }}>
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
                      {report.title || report.report_type}
                    </h3>
                    <div
                      style={{
                        fontSize: "14px",
                        color: theme.colors.textSecondary,
                        marginTop: "4px",
                      }}
                    >
                      {formatDate(report.report_date)}
                    </div>
                  </div>
                  <StatusBadge status="completed" />
                </div>

                {report.description && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: theme.colors.textSecondary,
                      marginBottom: "12px",
                    }}
                  >
                    {report.description.substring(0, 100)}
                    {report.description.length > 100 && "..."}
                  </p>
                )}
              </Card>
            ))
          )
        ) : (
          dars.length === 0 ? (
            <Card>
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ color: theme.colors.textSecondary }}>
                  {t("security.noDARs")}
                </div>
              </div>
            </Card>
          ) : (
            dars.map((dar) => (
              <Card key={dar.id} style={{ marginBottom: "16px" }}>
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
                      {dar.report_number || `DAR #${dar.id}`}
                    </h3>
                    <div
                      style={{
                        fontSize: "14px",
                        color: theme.colors.textSecondary,
                        marginTop: "4px",
                      }}
                    >
                      {formatDate(dar.report_date)}
                    </div>
                  </div>
                  <StatusBadge
                    status={dar.status === "finalized" ? "completed" : "pending"}
                  />
                </div>

                <button
                  onClick={() => handleExportDAR(dar.id)}
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
                  {t("security.exportDAR")}
                </button>
              </Card>
            ))
          )
        )}
      </div>
    </MobileLayout>
  );
}

