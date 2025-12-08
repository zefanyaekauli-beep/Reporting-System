/**
 * Supervisor Dashboard - Verolux CCTV AI Style
 * Card-based layout with clear hierarchy
 */

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getOverview, Overview, listReports, ReportRecord, listSites, Site } from "../../../api/supervisorApi";
import { fetchMyAnnouncements, AnnouncementWithState } from "../../../api/announcementApi";
import api from "../../../api/client";
// Design system tokens - using direct Tailwind classes
import { KpiCard } from "../../shared/components/ui/KpiCard";
import { DashboardCard } from "../../shared/components/ui/DashboardCard";
import DivisionPieChart from "../components/DivisionPieChart";
import AttendanceBarChart from "../components/AttendanceBarChart";

interface RecentEvent {
  id: number;
  officer_name: string;
  site_name: string;
  type: "clock_in" | "clock_out" | "patrol" | "inspection";
  time: string;
}

const SupervisorDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recent, setRecent] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  
  // Data
  const [openIssues, setOpenIssues] = useState<ReportRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithState[]>([]);

  // Chart data
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        name: date.toLocaleDateString("id-ID", { weekday: "short" }),
        attendance: Math.floor(Math.random() * 20) + 10,
        onShift: Math.floor(Math.random() * 10) + 5,
        overtime: Math.floor(Math.random() * 5),
      });
    }
    return days;
  }, []);

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const overviewData = await getOverview();
      setOverview(overviewData);
      
      const sitesData = await listSites();
      setSites(sitesData);
      
      try {
        const issues = await listReports({ status: "open", limit: 10 });
        setOpenIssues(issues.slice(0, 10));
      } catch (err) {
        console.error("Failed to load open issues:", err);
        setOpenIssues([]);
      }
      
      try {
        const anns = await fetchMyAnnouncements(false, 5);
        setAnnouncements(anns.filter(a => a.is_active).slice(0, 2));
      } catch (err) {
        console.error("Failed to load announcements:", err);
        setAnnouncements([]);
      }

      try {
        const attRes = await api.get("/supervisor/attendance?limit=10");
        const events: RecentEvent[] = [];
        let attendanceData: any[] = [];
        
        if (attRes.data) {
          if (Array.isArray(attRes.data)) {
            attendanceData = attRes.data;
          } else if (attRes.data.items && Array.isArray(attRes.data.items)) {
            attendanceData = attRes.data.items;
          }
        }

        if (attendanceData.length > 0) {
          attendanceData.forEach((att: any) => {
            if (att.checkin_time) {
              events.push({
                id: att.id * 1000 + 1,
                officer_name: att.user_name || `User #${att.user_id}`,
                site_name: att.site_name || "-",
                type: "clock_in",
                time: att.checkin_time,
              });
            }
            if (att.checkout_time) {
              events.push({
                id: att.id * 1000 + 2,
                officer_name: att.user_name || `User #${att.user_id}`,
                site_name: att.site_name || "-",
                type: "clock_out",
                time: att.checkout_time,
              });
            }
          });
        }

        events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setRecent(events.slice(0, 10));
      } catch (err) {
        console.error("Failed to load recent events:", err);
        setRecent([]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load dashboard data. Please check your network connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatEventType = (t: RecentEvent["type"]) => {
    switch (t) {
      case "clock_in": return "Clock In";
      case "clock_out": return "Clock Out";
      case "patrol": return "Patrol";
      case "inspection": return "Inspection";
      default: return t;
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Supervisor Dashboard
          </h1>
          <p className="text-xs text-slate-600">
            Live attendance, patrol, and cleaning status for your sites.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Site selector */}
          <select
            value={selectedSiteId || ""}
            onChange={(e) => setSelectedSiteId(e.target.value ? parseInt(e.target.value) : null)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">All Sites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
          
          {/* Date info */}
          <div className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700">
            {new Date(selectedDate).toLocaleDateString("id-ID", { 
              day: "numeric", 
              month: "short", 
              year: "numeric" 
            })}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg("")}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="On Duty"
          value={overview?.on_shift_now ?? 0}
          subtitle="Guards checked in"
        />
        <KpiCard
          title="No Show"
          value={overview?.security_attendance?.no_show ?? 0}
          variant="danger"
          subtitle="Expected but absent"
        />
        <KpiCard
          title="Active Patrols"
          value={overview?.patrols_today ?? 0}
          subtitle="Currently in progress"
        />
        <KpiCard
          title="Cleaning Tasks"
          value={overview?.cleaning_tasks?.total_tasks ?? 0}
          subtitle="Due today"
        />
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Attendance & Patrol */}
        <div className="space-y-4 lg:col-span-2">
          <DashboardCard title="Attendance Overview">
            <div className="space-y-3">
              <div className="flex items-baseline gap-4">
                <div>
                  <div className="text-xs text-[#002B4B]">Expected</div>
                  <div className="mt-1 text-3xl font-semibold text-[#002B4B]">
                    {overview?.security_attendance?.expected ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#002B4B]">On Duty</div>
                  <div className="mt-1 text-2xl font-semibold text-[#002B4B]">
                    {overview?.on_shift_now ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#002B4B]">No Show</div>
                  <div className="mt-1 text-2xl font-semibold text-red-600">
                    {overview?.security_attendance?.no_show ?? 0}
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-300">
                <div className="text-xs text-slate-600">
                  Security: {overview?.security_today ?? 0} · 
                  Cleaning: {overview?.cleaning_today ?? 0} · 
                  Parking: {overview?.parking_today ?? 0}
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Patrol & Activity">
            <div className="space-y-2">
              <div className="text-xs text-slate-600">
                Trips planned: {overview?.patrols_today ?? 0} · 
                Active: {overview?.on_shift_now ?? 0} · 
                Missed checkpoints: {overview?.security_tasks?.missed_count ?? 0}
              </div>
              {recent.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-300">
                  <div className="mb-2 text-sm font-semibold text-[#002B4B]">Recent Activity</div>
                  <ul className="space-y-1">
                    {recent.slice(0, 5).map((e) => (
                      <li key={e.id} className="text-xs text-slate-600">
                        [{new Date(e.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}] {e.officer_name} · {formatEventType(e.type)} · {e.site_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Right Column: Cleaning + Pengumuman */}
        <div className="space-y-4">
          <DashboardCard title="Cleaning Status">
            <div className="space-y-2">
              <div className="text-3xl font-semibold text-[#002B4B]">
                {overview?.cleaning_tasks?.completion_percent.toFixed(0) ?? 0}%
              </div>
              <div className="text-xs text-slate-600">
                {overview?.cleaning_tasks?.completed_tasks ?? 0} / {overview?.cleaning_tasks?.total_tasks ?? 0} checklists completed today
              </div>
              {overview?.cleaning_tasks && overview.cleaning_tasks.missed_count > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  ⚠️ {overview.cleaning_tasks.missed_count} overdue
                </div>
              )}
            </div>
          </DashboardCard>

          <DashboardCard title="Pengumuman" headerAction={
            <Link to="/supervisor/announcements" className="text-xs text-blue-600 hover:underline">
              Manage
            </Link>
          }>
            {loading ? (
              <div className="text-xs text-slate-600">Loading…</div>
            ) : announcements.length === 0 ? (
              <div className="text-xs text-slate-600">No active announcements.</div>
            ) : (
              <ul className="space-y-2 text-xs">
                {announcements.map((ann) => (
                  <li key={ann.id} className={`text-slate-700 border-l-2 ${ann.priority === "critical" ? "border-red-500" : ann.priority === "warning" ? "border-amber-500" : "border-blue-500"} pl-3`}>
                    <div className="font-medium text-[#002B4B]">{ann.title}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {ann.message.length > 60 ? ann.message.substring(0, 60) + "..." : ann.message}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>
        </div>
      </section>

      {/* Bottom: Charts + Incidents */}
      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Attendance by Division">
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Loading chart...</div>
            </div>
          ) : (
            <DivisionPieChart
              data={[
                {
                  name: "Security",
                  value: overview?.security_today ?? 0,
                  color: "#3b82f6",
                },
                {
                  name: "Cleaning",
                  value: overview?.cleaning_today ?? 0,
                  color: "#10b981",
                },
                {
                  name: "Parking",
                  value: overview?.parking_today ?? 0,
                  color: "#f59e0b",
                },
              ]}
            />
          )}
        </DashboardCard>

        <DashboardCard 
          title="Latest Security Incidents"
          headerAction={
            <Link to="/supervisor/reports" className="text-xs text-blue-600 hover:underline">
              View all
            </Link>
          }
        >
          {loading ? (
            <div className="text-xs text-slate-600">Loading…</div>
          ) : openIssues.length === 0 ? (
            <div className="text-xs text-slate-600">No open issues at this time.</div>
          ) : (
            <ul className="divide-y divide-slate-300 text-xs">
              {openIssues.map((issue) => (
                <li key={issue.id} className="py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[#002B4B] font-medium truncate">
                        {issue.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {issue.division} · {issue.report_type} · {issue.site_name}
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-1 rounded-lg text-[10px] ${
                      issue.status === "open"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {new Date(issue.created_at).toLocaleString("id-ID")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </section>
    </div>
  );
};

export default SupervisorDashboardPage;
