// frontend/web/src/modules/parking/pages/ParkingDashboardPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { SiteSelector, SiteOption } from "../../shared/components/SiteSelector";
import { getTodayParkingAttendance, ParkingAttendance, listParkingReports } from "../../../api/parkingApi";
import { IconActionButton } from "../../shared/components/ui/IconActionButton";
import { AppIcons } from "../../../icons/AppIcons";
import api from "../../../api/client";
import { PengumumanCard } from "../../shared/components/PengumumanCard";


interface ReportsSummary {
  total: number;
  incidents: number;
  daily: number;
}


export function ParkingDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // TODO: replace with real sites from API / auth
  const [sites] = useState<SiteOption[]>([
    { id: 1, name: "Situs A" },
    { id: 2, name: "Situs B" },
  ]);

  const [siteId, setSiteId] = useState<number | null>(
    sites.length ? sites[0].id : null
  );

  const [attendance, setAttendance] = useState<ParkingAttendance | null>(null);
  const [reportsSummary, setReportsSummary] = useState<ReportsSummary | null>(
    null
  );
  const [checklistSummary, setChecklistSummary] = useState<{
    total: number;
    completed: number;
    incomplete: number;
    status: string | null;
  } | null>(null);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const hasCheckIn = !!attendance?.checkin_time;
  const hasCheckOut = !!attendance?.checkout_time;

  useEffect(() => {
    const load = async () => {
      if (!siteId) return;

      setLoading(true);
      try {
        // Attendance
        const { data: att } = await getTodayParkingAttendance(siteId);
        setAttendance(att || null);

        // Reports summary
        try {
          const { data: reports } = await listParkingReports({ site_id: siteId });
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
          const response = await api.get("/parking/me/checklist/today");
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
            // Store items for preview (show pending items first, max 3)
            const pendingItems = checklist.items
              .filter((i: any) => i.status === "PENDING" && i.required)
              .slice(0, 3);
            setChecklistItems(pendingItems);
          } else {
            setChecklistSummary(null);
            setChecklistItems([]);
          }
        } catch (err) {
          // No checklist for today, ignore
          setChecklistSummary(null);
          setChecklistItems([]);
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
      <MobileLayout title={t("parking.title")}>
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
          {/* Pengumuman Card */}
          <PengumumanCard limit={3} />
          
          {/* Site selector */}
          <SiteSelector
        sites={sites}
        value={siteId}
        onChange={(id) => setSiteId(id)}
      />
      {/* Top card: current post & shift status */}
      <section
        style={{
          marginBottom: 12,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          padding: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        {/* Site & date row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
            {t("parking.postSite") || "Lokasi Site"}
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

        {/* Shift status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <div style={{ fontSize: 13 }}>
            <span style={{ color: theme.colors.textMuted }}>
              {t("parking.checkIn") || "Check-in"}:
            </span>{" "}
            <strong>
              {attendance?.checkin_time
                ? new Date(attendance.checkin_time).toLocaleTimeString("id-ID")
                : "-"}
            </strong>
          </div>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: theme.colors.textMuted }}>
              {t("parking.checkOut") || "Check-out"}:
            </span>{" "}
            <strong>
              {attendance?.checkout_time
                ? new Date(attendance.checkout_time).toLocaleTimeString("id-ID")
                : "-"}
            </strong>
          </div>
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
                ? t("parking.shiftCompleted") || "Selesai"
                : t("parking.onDuty") || "Sedang Bekerja"
              : t("parking.notCheckedIn") || "Belum Check-in"}
          </span>
        </div>
      </section>

      {/* KPI tiles like GuardsPro */}
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
              {t("parking.reportsToday") || "Laporan Hari Ini"}
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
              {t("parking.incidents") || "Insiden"} {reportsSummary?.incidents ?? "–"} •{" "}
              {t("parking.daily") || "Harian"} {reportsSummary?.daily ?? "–"}
            </div>
          </div>
          <div
            onClick={() => navigate("/parking/checklist")}
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
              {t("parking.checklist") || "Checklist"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              {checklistSummary
                ? `${checklistSummary.completed}/${checklistSummary.total}`
                : "–"}
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                color: theme.colors.textSoft,
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginBottom: checklistItems.length > 0 ? 6 : 0,
              }}
            >
              {checklistSummary && (
                <span
                  style={{
                    color:
                      checklistSummary.status === "COMPLETED"
                        ? theme.colors.success
                        : checklistSummary.status === "INCOMPLETE"
                        ? theme.colors.danger
                        : theme.colors.warning,
                    fontWeight: 600,
                  }}
                >
                  {checklistSummary.status === "COMPLETED"
                    ? "✓ " + (t("parking.completed") || "Selesai")
                    : checklistSummary.status === "INCOMPLETE"
                    ? "⚠ " + (t("parking.incomplete") || "Belum Selesai")
                    : "○ " + (t("parking.checklistProgress") || "Dalam Proses")}
                </span>
              )}
            </div>
            {/* Preview pending items */}
            {checklistItems.length > 0 && (
              <div
                style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: `1px solid ${theme.colors.border}`,
                }}
              >
                {checklistItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      fontSize: 10,
                      color: theme.colors.textMuted,
                      marginBottom: 3,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 4,
                    }}
                  >
                    <span style={{ color: theme.colors.warning }}>○</span>
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
                {checklistSummary &&
                  checklistSummary.incomplete > checklistItems.length && (
                    <div
                      style={{
                        fontSize: 9,
                        color: theme.colors.textSoft,
                        marginTop: 2,
                        fontStyle: "italic",
                      }}
                    >
                      +{checklistSummary.incomplete - checklistItems.length} lagi...
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick actions grid – Icon buttons */}
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
            onClick={() => navigate("/parking/reports/new")}
            icon={AppIcons.reports()}
            variant="primary"
          />
          <IconActionButton
            label="QR Absen"
            onClick={() => navigate("/parking/attendance/qr")}
            icon={AppIcons.qrAttendance({ className: "w-10 h-10" })}
          />
          <IconActionButton
            label="Checklist"
            onClick={() => navigate("/parking/checklist")}
            icon={AppIcons.checklist()}
          />
          <IconActionButton
            label="Panic"
            onClick={() => navigate("/parking/panic")}
            icon={AppIcons.panic()}
            variant="danger"
          />
          <IconActionButton
            label="Passdown"
            onClick={() => navigate("/parking/passdown")}
            icon={AppIcons.passdown()}
          />
          <IconActionButton
            label="Shift"
            onClick={() => navigate("/parking/shifts")}
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
                  {t("parking.syncingData") || "Menyinkronkan data..."}
                </div>
              )}
      </div>
            </MobileLayout>
          );
        }
