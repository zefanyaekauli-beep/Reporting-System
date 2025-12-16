/**
 * Security Dashboard - Statistics Focus
 * Focus on numbers and metrics for field officers
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { useTranslation } from "../../../i18n/useTranslation";
import { SiteSelector, SiteOption } from "../../shared/components/SiteSelector";
import { getTodayAttendance, getTodayChecklist } from "../../../api/securityApi";
import { PengumumanCard } from "../../shared/components/PengumumanCard";
import { DashboardCard } from "../../shared/components/ui/DashboardCard";
import { IconActionButton } from "../../shared/components/ui/IconActionButton";
import { KpiCard } from "../../shared/components/ui/KpiCard";
import { AppIcons } from "../../../icons/AppIcons";
import api from "../../../api/client";
import { PermissionGate } from "../../../components/PermissionGate";
import { RoleBasedAccess } from "../../../components/RoleBasedAccess";
import { UserRoleBadge } from "../../../components/UserRoleBadge";

interface Attendance {
  id: number;
  site_id: number;
  shift_date: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
}

interface ReportsSummary {
  total: number;
  incidents: number;
  daily: number;
}

export function SecurityDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [sites] = useState<SiteOption[]>([
    { id: 1, name: "Situs A" },
    { id: 2, name: "Situs B" },
  ]);

  const [siteId, setSiteId] = useState<number | null>(
    sites.length ? sites[0].id : null
  );

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [reportsSummary, setReportsSummary] = useState<ReportsSummary | null>(null);
  const [checklistSummary, setChecklistSummary] = useState<{
    total: number;
    completed: number;
    incomplete: number;
    status: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const hasCheckIn = !!attendance?.check_in_time;
  const hasCheckOut = !!attendance?.check_out_time;

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 19) return "Selamat Sore";
    return "Selamat Malam";
  };

  // Calculate shift duration
  const shiftDuration = () => {
    if (!attendance?.check_in_time) return null;
    const checkIn = new Date(attendance.check_in_time);
    const checkOut = attendance?.check_out_time ? new Date(attendance.check_out_time) : new Date();
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
        const { data: att } = await getTodayAttendance(siteId);
        setAttendance(att || null);

        // Reports summary
        const { data: reports } = await api.get(
          `/security/reports?site_id=${siteId}`
        );
        const total = reports?.length ?? 0;
        const incidents = reports?.filter(
          (r: any) => r.report_type === "incident"
        ).length ?? 0;
        const daily = reports?.filter(
          (r: any) => r.report_type === "daily"
        ).length ?? 0;
        setReportsSummary({ total, incidents, daily });

        // Checklist summary
        try {
          const { data: checklist } = await getTodayChecklist();
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
        } catch (err: any) {
          if (err?.response?.status === 404) {
            setChecklistSummary(null);
          } else {
            console.error("Failed to load checklist:", err);
            setChecklistSummary(null);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [siteId]);

  const currentSite = sites.find((s) => s.id === siteId);

  return (
    <MobileLayout title={t("security.title")}>
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {getGreeting()}, Security
            </h1>
            <UserRoleBadge />
          </div>
          <p className="text-xs text-slate-400">
            {currentSite?.name ?? "–"} · {new Date().toLocaleDateString("id-ID")}
          </p>
        </div>

        {/* Check-in Status Card */}
        <DashboardCard title="Status Shift">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-slate-400">Check In</div>
                  <div className="mt-1 text-sm font-medium text-slate-50">
                    {attendance?.check_in_time
                      ? new Date(attendance.check_in_time).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Belum check in"}
                  </div>
                </div>
                {attendance?.check_out_time && (
                  <div>
                    <div className="text-xs text-slate-400">Check Out</div>
                    <div className="mt-1 text-sm font-medium text-slate-50">
                      {new Date(attendance.check_out_time).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                )}
                {shiftDuration() && (
                  <div>
                    <div className="text-xs text-slate-400">Durasi Shift</div>
                    <div className="mt-1 text-sm font-medium text-slate-50">
                      {shiftDuration()}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase ${
                    hasCheckIn
                      ? hasCheckOut
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {hasCheckIn
                    ? hasCheckOut
                      ? t("security.shiftCompleted")
                      : t("security.onDuty")
                    : t("security.notCheckedIn")}
                </span>
              </div>
            </div>
            {!hasCheckIn && (
              <button
                onClick={() => navigate("/security/attendance/qr")}
                className="mt-2 inline-flex items-center gap-2 justify-center rounded-xl bg-blue-500 hover:bg-blue-600 px-4 py-2 text-xs font-medium text-white md:mt-0"
              >
                <span className="w-7 h-7">{AppIcons.qrAttendance({ className: "w-7 h-7" })}</span>
                QR Attendance
              </button>
            )}
          </div>
        </DashboardCard>

        <PengumumanCard />

        {/* Statistics Cards - Focus on Numbers */}
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            title={t("security.reportsToday")}
            value={reportsSummary?.total ?? 0}
            subtitle={`Insiden: ${reportsSummary?.incidents ?? 0} · Harian: ${reportsSummary?.daily ?? 0}`}
          />
          <div
            onClick={() => navigate("/security/checklist")}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <KpiCard
              title={t("security.checklist")}
              value={`${checklistPercent}%`}
              subtitle={
                checklistSummary
                  ? `${checklistSummary.completed}/${checklistSummary.total} selesai`
                  : "No checklist"
              }
              variant={checklistSummary?.status === "COMPLETED" ? "success" : checklistSummary?.status === "INCOMPLETE" ? "danger" : "default"}
            />
          </div>
          <KpiCard
            title="Durasi Shift"
            value={shiftDuration() || "–"}
            subtitle={hasCheckIn ? (hasCheckOut ? "Shift selesai" : "Masih berlangsung") : "Belum check in"}
          />
        </div>

        {/* Quick Actions - Icon Buttons */}
        <DashboardCard title={t("dashboard.quickActions")}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <IconActionButton
              label="Laporan"
              onClick={() => navigate("/security/reports/new")}
              icon={AppIcons.reports()}
              variant="primary"
            />
            <IconActionButton
              label="QR Absen"
              onClick={() => navigate("/security/attendance/qr")}
              icon={AppIcons.qrAttendance({ className: "w-10 h-10" })}
            />
            <IconActionButton
              label="Mulai Patrol"
              onClick={() => navigate("/security/patrol/new")}
              icon={AppIcons.patrol()}
            />
            <IconActionButton
              label="Checklist"
              onClick={() => navigate("/security/checklist")}
              icon={AppIcons.checklist()}
            />
            <RoleBasedAccess allowedDivisions={["security"]}>
              <IconActionButton
                label="Panic"
                onClick={() => navigate("/security/panic")}
                icon={AppIcons.panic()}
                variant="danger"
              />
            </RoleBasedAccess>
            <RoleBasedAccess allowedDivisions={["security"]}>
              <IconActionButton
                label="Passdown"
                onClick={() => navigate("/security/passdown")}
                icon={AppIcons.passdown()}
              />
            </RoleBasedAccess>
            {/* <RoleBasedAccess allowedDivisions={["security"]}>
              <IconActionButton
                label="DAR"
                onClick={() => navigate("/security/dar")}
                icon={AppIcons.dar()}
              />
            </RoleBasedAccess> */}
            <IconActionButton
              label="Shift"
              onClick={() => navigate("/security/shifts")}
              icon={AppIcons.shifts()}
            />
          </div>
        </DashboardCard>

        {loading && (
          <div className="text-center text-xs text-slate-400">
            {t("security.syncingData")}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
