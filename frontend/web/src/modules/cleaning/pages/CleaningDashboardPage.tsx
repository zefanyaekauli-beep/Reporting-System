// frontend/web/src/modules/cleaning/pages/CleaningDashboardPage.tsx
// Statistics-focused dashboard for cleaning division

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { SiteSelector, SiteOption } from "../../shared/components/SiteSelector";
import { getTodayCleaningAttendance, CleaningAttendance, listCleaningReports } from "../../../api/cleaningApi";
import { PengumumanCard } from "../../shared/components/PengumumanCard";
import { IconActionButton } from "../../shared/components/ui/IconActionButton";
import { AppIcons } from "../../../icons/AppIcons";
import api from "../../../api/client";

interface ReportsSummary {
  total: number;
  incidents: number;
  daily: number;
}

export function CleaningDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [sites] = useState<SiteOption[]>([
    { id: 1, name: "Situs A" },
    { id: 2, name: "Situs B" },
  ]);

  const [siteId, setSiteId] = useState<number | null>(
    sites.length ? sites[0].id : null
  );

  const [attendance, setAttendance] = useState<CleaningAttendance | null>(null);
  const [reportsSummary, setReportsSummary] = useState<ReportsSummary | null>(null);
  const [checklistSummary, setChecklistSummary] = useState<{
    total: number;
    completed: number;
    incomplete: number;
    status: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const hasCheckIn = !!attendance?.checkin_time;
  const hasCheckOut = !!attendance?.checkout_time;

  // Calculate shift duration
  const shiftDuration = () => {
    if (!attendance?.checkin_time) return null;
    const checkIn = new Date(attendance.checkin_time);
    const checkOut = attendance?.checkout_time ? new Date(attendance.checkout_time) : new Date();
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}j ${diffMinutes}m`;
  };

  // Calculate checklist completion percentage
  const checklistPercent = checklistSummary && checklistSummary.total > 0
    ? ((checklistSummary.completed / checklistSummary.total) * 100).toFixed(0)
    : "0";

  useEffect(() => {
    const load = async () => {
      if (!siteId) return;

      setLoading(true);
      try {
        // Attendance
        const { data: att } = await getTodayCleaningAttendance(siteId);
        setAttendance(att || null);

        // Reports summary
        try {
          const { data: reports } = await listCleaningReports({ site_id: siteId });
          const total = reports?.length ?? 0;
          const incidents = reports?.filter(
            (r: any) => r.report_type === "incident"
          ).length ?? 0;
          const daily = reports?.filter(
            (r: any) => r.report_type === "daily"
          ).length ?? 0;
          setReportsSummary({ total, incidents, daily });
        } catch (err) {
          setReportsSummary({ total: 0, incidents: 0, daily: 0 });
        }

        // Checklist summary
        try {
          const response = await api.get("/cleaning/me/checklist/today");
          const checklist = response.data;
          if (checklist) {
            const required = checklist.items.filter((i: any) => i.required === true);
            const completed = required.filter((i: any) => i.status === "COMPLETED");
            setChecklistSummary({
              total: required.length,
              completed: completed.length,
              incomplete: required.length - completed.length,
              status: checklist.status,
            });
          } else {
            setChecklistSummary(null);
          }
        } catch (err) {
          setChecklistSummary(null);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [siteId]);

  return (
    <MobileLayout title={t("cleaning.title") || "Pembersihan"}>
      <SiteSelector
        sites={sites}
        value={siteId}
        onChange={(id) => setSiteId(id)}
      />

      {/* Status Card */}
      <section
        style={{
          marginBottom: 12,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          padding: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
            {t("cleaning.postSite") || "Lokasi Site"}
          </div>
          <div style={{ fontSize: 11, color: theme.colors.textSoft }}>
            {new Date().toLocaleDateString("id-ID")}
          </div>
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 8,
            color: theme.colors.textMain,
          }}
        >
          {sites.find((s) => s.id === siteId)?.name ?? "–"}
        </div>

        {/* Shift info grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
              {t("cleaning.checkIn") || "Check-in"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
              {attendance?.checkin_time
                ? new Date(attendance.checkin_time).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
              {t("cleaning.checkOut") || "Check-out"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
              {attendance?.checkout_time
                ? new Date(attendance.checkout_time).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </div>
          </div>
          {shiftDuration() && (
            <div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                Durasi
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                {shiftDuration()}
              </div>
            </div>
          )}
        </div>

        {/* Status pill */}
        <div style={{ marginTop: 4 }}>
          <span
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: theme.radius.pill,
              backgroundColor: hasCheckIn
                ? hasCheckOut
                  ? theme.colors.primarySoft
                  : "#DCFCE7"
                : "#FEE2E2",
              color: hasCheckIn
                ? hasCheckOut
                  ? theme.colors.primary
                  : theme.colors.success
                : theme.colors.danger,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {hasCheckIn
              ? hasCheckOut
                ? t("cleaning.shiftCompleted") || "Selesai"
                : t("cleaning.onDuty") || "Sedang Bekerja"
              : t("cleaning.notCheckedIn") || "Belum Check-in"}
          </span>
        </div>
      </section>

      <PengumumanCard />

      {/* Statistics Cards - Focus on Numbers */}
      <section style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: 10,
              boxShadow: theme.shadowSoft,
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: 4,
                letterSpacing: 0.4,
              }}
            >
              {t("cleaning.reportsToday") || "Laporan Hari Ini"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {reportsSummary?.total ?? "–"}
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                color: theme.colors.textSoft,
              }}
            >
              {t("cleaning.incidents") || "Insiden"} {reportsSummary?.incidents ?? "–"} •{" "}
              {t("cleaning.daily") || "Harian"} {reportsSummary?.daily ?? "–"}
            </div>
          </div>
          <div
            onClick={() => navigate("/cleaning/checklist")}
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: 10,
              boxShadow: theme.shadowSoft,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = theme.shadowCard;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = theme.shadowSoft;
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: 4,
                letterSpacing: 0.4,
              }}
            >
              {t("cleaning.checklist") || "Checklist"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              {checklistPercent}%
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                color: theme.colors.textSoft,
              }}
            >
              {checklistSummary
                ? `${checklistSummary.completed}/${checklistSummary.total} selesai`
                : "No checklist"}
            </div>
          </div>
          {shiftDuration() && (
            <div
              style={{
                flex: 1,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                padding: 10,
                boxShadow: theme.shadowSoft,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  color: theme.colors.textMuted,
                  marginBottom: 4,
                  letterSpacing: 0.4,
                }}
              >
                Durasi Shift
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {shiftDuration()}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: theme.colors.textSoft,
                }}
              >
                {hasCheckIn ? (hasCheckOut ? "Shift selesai" : "Masih berlangsung") : "Belum check in"}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick actions grid */}
      <section>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {t("dashboard.quickActions") || "Aksi Cepat"}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}
        >
          <IconActionButton
            label="Laporan"
            onClick={() => navigate("/cleaning/reports/new")}
            icon={AppIcons.reports()}
            variant="primary"
          />
          <IconActionButton
            label="QR Absen"
            onClick={() => navigate("/cleaning/attendance/qr")}
            icon={AppIcons.qrAttendance({ className: "w-10 h-10" })}
          />
          <IconActionButton
            label="Checklist"
            onClick={() => navigate("/cleaning/checklist")}
            icon={AppIcons.checklist()}
          />
          <IconActionButton
            label="Panic"
            onClick={() => navigate("/cleaning/panic")}
            icon={AppIcons.panic()}
            variant="danger"
          />
          <IconActionButton
            label="Passdown"
            onClick={() => navigate("/cleaning/passdown")}
            icon={AppIcons.passdown()}
          />
          <IconActionButton
            label="Shift"
            onClick={() => navigate("/cleaning/shifts")}
            icon={AppIcons.shifts()}
          />
        </div>
      </section>

      {loading && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: theme.colors.textMuted,
          }}
        >
          {t("cleaning.syncingData") || "Menyinkronkan data..."}
        </div>
      )}
    </MobileLayout>
  );
}
