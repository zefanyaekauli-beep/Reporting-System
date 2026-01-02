/**
 * Security Dashboard - Statistics Focus
 * Focus on numbers and metrics for field officers
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { useTranslation } from "../../../i18n/useTranslation";
import { SiteSelector, SiteOption } from "../../shared/components/SiteSelector";
import { getTodayChecklist } from "../../../api/securityApi";
import { getAttendanceStatus, listMyAttendance } from "../../../api/attendanceApi";
import { PengumumanCard } from "../../shared/components/PengumumanCard";
import { DashboardCard } from "../../shared/components/ui/DashboardCard";
import { IconActionButton } from "../../shared/components/ui/IconActionButton";
import { KpiCard } from "../../shared/components/ui/KpiCard";
import { AppIcons } from "../../../icons/AppIcons";
import api from "../../../api/client";
import { PermissionGate } from "../../../components/PermissionGate";
import { RoleBasedAccess } from "../../../components/RoleBasedAccess";
import { UserRoleBadge } from "../../../components/UserRoleBadge";
import { useAuthStore } from "../../../stores/authStore";

interface Attendance {
  id: number;
  site_id: number;
  site_name?: string;
  checkin_time: string | null;
  checkout_time: string | null;
  status: string;
  shift: string | null;
  is_overtime: boolean;
  is_backup: boolean;
  is_valid_location: boolean;
}

interface ReportsSummary {
  total: number;
  incidents: number;
  daily: number;
}

export function SecurityDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

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

  const hasCheckIn = !!attendance?.checkin_time;
  const hasCheckOut = !!attendance?.checkout_time;

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
    if (!attendance?.checkin_time) return null;
    const checkIn = new Date(attendance.checkin_time);
    const checkOut = attendance?.checkout_time ? new Date(attendance.checkout_time) : new Date();
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}j ${diffMinutes}m`;
  };

  // Get shift info text
  const getShiftInfo = () => {
    if (!attendance) return null;
    const parts: string[] = [];
    if (attendance.shift) {
      parts.push(`Shift ${attendance.shift}`);
    }
    if (attendance.is_overtime) {
      parts.push("Lembur");
    }
    if (attendance.is_backup) {
      parts.push("Cadangan");
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  // Format time with date if needed
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    const date = new Date(timeStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Calculate checklist completion percentage
  const checklistPercent = checklistSummary && checklistSummary.total > 0
    ? ((checklistSummary.completed / checklistSummary.total) * 100).toFixed(0)
    : "0";

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Get today's attendance for current user
        // Get attendance list and find today's record
        try {
          const myAttendance = await listMyAttendance("SECURITY");
          const today = new Date().toISOString().split("T")[0];
          
          // Find today's attendance (most recent if multiple)
          const todayAttendance = myAttendance
            .filter((att) => {
              if (!att.checkin_time) return false;
              const attDate = new Date(att.checkin_time).toISOString().split("T")[0];
              return attDate === today;
            })
            .sort((a, b) => {
              // Sort by checkin_time descending (most recent first)
              if (!a.checkin_time || !b.checkin_time) return 0;
              return new Date(b.checkin_time).getTime() - new Date(a.checkin_time).getTime();
            })[0]; // Get the most recent one
          
          if (todayAttendance) {
            setAttendance({
              id: todayAttendance.id,
              site_id: todayAttendance.site_id,
              site_name: todayAttendance.site_name,
              checkin_time: todayAttendance.checkin_time,
              checkout_time: todayAttendance.checkout_time,
              status: todayAttendance.status,
              shift: todayAttendance.shift || null,
              is_overtime: todayAttendance.is_overtime || false,
              is_backup: todayAttendance.is_backup || false,
              is_valid_location: todayAttendance.is_valid_location !== false,
            });
            
            // Update siteId from attendance if available
            if (todayAttendance.site_id && !siteId) {
              setSiteId(todayAttendance.site_id);
            }
          } else {
            setAttendance(null);
          }
        } catch (err) {
          console.error("Gagal memuat absensi:", err);
          setAttendance(null);
        }

        // Reports summary - get reports for current user (today only)
        try {
          const today = new Date().toISOString().split("T")[0];
        const { data: reports } = await api.get(
            `/security/reports`,
            { params: { from_date: today, to_date: today } }
          );
          
          // Filter reports by current user
          const userReports = (reports || []).filter((r: any) => r.user_id === user.id);
          
          const total = userReports.length;
          const incidents = userReports.filter(
          (r: any) => r.report_type === "incident"
          ).length;
          const daily = userReports.filter(
          (r: any) => r.report_type === "daily"
          ).length;
        setReportsSummary({ total, incidents, daily });
        } catch (err) {
          console.error("Failed to load reports:", err);
          setReportsSummary({ total: 0, incidents: 0, daily: 0 });
        }

        // Checklist summary
        try {
          const { data: checklist } = await getTodayChecklist();
          if (checklist && checklist.items) {
            const required = checklist.items.filter((i: any) => i.required === true);
            const completed = required.filter((i: any) => i.status === "COMPLETED");
            setChecklistSummary({
              total: required.length,
              completed: completed.length,
              incomplete: required.length - completed.length,
              status: checklist.status,
            });
          } else {
            // No checklist for today (user hasn't checked in yet) - this is normal
            setChecklistSummary(null);
          }
        } catch (err: any) {
          // Any other error - log but don't break the dashboard
            console.error("Gagal memuat checklist:", err);
            setChecklistSummary(null);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

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
            {attendance?.site_name ?? currentSite?.name ?? "–"} · {new Date().toLocaleDateString("id-ID")}
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
                    {attendance?.checkin_time
                      ? formatTime(attendance.checkin_time) || "–"
                      : "Belum check in"}
                  </div>
                  {attendance?.checkin_time && !attendance.is_valid_location && (
                    <div className="text-[10px] text-red-400 mt-1">⚠ Lokasi tidak valid</div>
                  )}
                </div>
                {attendance?.checkout_time && (
                  <div>
                    <div className="text-xs text-slate-400">Check Out</div>
                    <div className="mt-1 text-sm font-medium text-slate-50">
                      {formatTime(attendance.checkout_time) || "–"}
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
                {getShiftInfo() && (
                  <div>
                    <div className="text-xs text-slate-400">Info Shift</div>
                    <div className="mt-1 text-sm font-medium text-slate-50">
                      {getShiftInfo()}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
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
                {attendance?.is_overtime && (
                  <span className="inline-block px-2 py-1 rounded-full text-[10px] font-medium bg-orange-500/10 text-orange-400">
                    Lembur
                  </span>
                )}
                {attendance?.is_backup && (
                  <span className="inline-block px-2 py-1 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400">
                    Cadangan
                  </span>
                )}
              </div>
            </div>
            {!hasCheckIn && (
              <button
                onClick={() => navigate("/security/attendance/qr")}
                className="mt-2 inline-flex items-center gap-2 justify-center rounded-xl bg-blue-500 hover:bg-blue-600 px-4 py-2 text-xs font-medium text-white md:mt-0"
              >
                <span className="w-7 h-7">{AppIcons.qrAttendance({ className: "w-7 h-7" })}</span>
                QR Absensi
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
                  : "Tidak ada checklist"
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
