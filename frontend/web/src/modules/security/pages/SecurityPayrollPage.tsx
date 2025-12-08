// frontend/web/src/modules/security/pages/SecurityPayrollPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { FormInput } from "../../shared/components/FormInput";
import { useTranslation } from "../../../i18n/useTranslation";
import { useSite } from "../../shared/contexts/SiteContext";
import { useToast } from "../../shared/components/Toast";
import { exportPayroll } from "../../../api/securityApi";
import { theme } from "../../shared/components/theme";

export function SecurityPayrollPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const { showToast } = useToast();
  // Set default dates (current month)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(lastDay.toISOString().split("T")[0]);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!startDate || !endDate) {
      showToast(t("security.selectDateRange"), "error");
      return;
    }

    try {
      setExporting(true);
      const blob = await exportPayroll({
        start_date: startDate,
        end_date: endDate,
        site_id: selectedSite?.id,
      });

      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll_export_${startDate}_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(t("security.exportDownloaded"), "success");
    } catch (error: any) {
      showToast(t("common.error"), "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <MobileLayout
      title={t("security.payroll")}
      showBack
      onBackClick={() => navigate("/security")}
    >
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        <Card>
          <h3 style={{ margin: "0 0 16px", color: theme.colors.text }}>
            {t("security.payrollExport")}
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: theme.colors.textSecondary,
              marginBottom: "20px",
            }}
          >
            {t("security.exportPayrollDescription")}
          </p>

          <FormInput
            label={t("security.startDate")}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <FormInput
            label={t("security.endDate")}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            style={{ marginTop: "16px" }}
          />

          <button
            onClick={handleExport}
            disabled={exporting || !startDate || !endDate}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "14px",
              background:
                exporting || !startDate || !endDate
                  ? theme.colors.textSecondary
                  : theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              cursor:
                exporting || !startDate || !endDate
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {exporting ? t("security.exporting") : t("security.exportToCSV")}
          </button>
        </Card>

        <Card style={{ marginTop: "16px" }}>
          <h4 style={{ margin: "0 0 12px", color: theme.colors.text }}>
            {t("security.exportIncludes")}:
          </h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: "20px",
              color: theme.colors.textSecondary,
              fontSize: "14px",
              lineHeight: "1.8",
            }}
          >
            <li>{t("security.employeeID")} {t("common.and")} {t("security.employeeName")}</li>
            <li>{t("security.checkInTime")} {t("common.and")} {t("security.checkOutTime")}</li>
            <li>{t("security.hoursWorked")}</li>
            <li>{t("security.site")} {t("security.location")}</li>
            <li>{t("security.status")} {t("security.attendance")}</li>
          </ul>
        </Card>
      </div>
    </MobileLayout>
  );
}

