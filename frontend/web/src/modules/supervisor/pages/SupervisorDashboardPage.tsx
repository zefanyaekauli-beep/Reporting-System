/**
 * Supervisor Dashboard - Statistics & Analytics Focus
 * Focus on numbers, calculations, and visualizations for management
 */

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getOverview, Overview } from "../../../api/supervisorApi";
import { KpiCard } from "../../shared/components/ui/KpiCard";
import { DashboardCard } from "../../shared/components/ui/DashboardCard";
import DivisionPieChart from "../components/DivisionPieChart";
import AttendanceBarChart from "../components/AttendanceBarChart";
import { PermissionGate } from "../../../components/PermissionGate";
import { RoleBasedAccess } from "../../../components/RoleBasedAccess";
import { UserRoleBadge } from "../../../components/UserRoleBadge";
import { ActionButton } from "../../../components/ActionButton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { theme } from "../../shared/components/theme";

const SupervisorDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const overviewData = await getOverview();
      setOverview(overviewData);
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

  // Calculate statistics
  const stats = useMemo(() => {
    if (!overview) return null;

    const attendanceRate = overview.security_attendance.expected > 0
      ? ((overview.security_attendance.on_duty / overview.security_attendance.expected) * 100).toFixed(1)
      : "0";

    const cleaningCompletion = overview.cleaning_tasks.completion_percent.toFixed(1);
    const securityCompletion = overview.security_tasks.completion_percent.toFixed(1);

    const totalExpected = overview.security_attendance.expected + 
                         overview.cleaning_attendance.expected + 
                         overview.driver_attendance.expected;
    
    const totalOnDuty = overview.security_attendance.on_duty + 
                       overview.cleaning_attendance.on_duty + 
                       overview.driver_attendance.on_duty;

    const overallAttendanceRate = totalExpected > 0
      ? ((totalOnDuty / totalExpected) * 100).toFixed(1)
      : "0";

    return {
      attendanceRate,
      cleaningCompletion,
      securityCompletion,
      overallAttendanceRate,
      totalExpected,
      totalOnDuty,
    };
  }, [overview]);

  // Attendance by division pie chart data
  const divisionAttendanceData = useMemo(() => {
    if (!overview) return [];
    return [
      {
        name: "Security",
        value: overview.security_attendance.on_duty,
        color: "#3b82f6",
      },
      {
        name: "Cleaning",
        value: overview.cleaning_attendance.on_duty,
        color: "#10b981",
      },
      {
        name: "Driver",
        value: overview.driver_attendance.on_duty,
        color: "#f59e0b",
      },
    ].filter(d => d.value > 0);
  }, [overview]);

  // Task completion pie chart data
  const taskCompletionData = useMemo(() => {
    if (!overview) return [];
    return [
      {
        name: "Security",
        value: overview.security_tasks.completed_tasks,
        total: overview.security_tasks.total_tasks,
        percent: overview.security_tasks.completion_percent,
        color: "#3b82f6",
      },
      {
        name: "Cleaning",
        value: overview.cleaning_tasks.completed_tasks,
        total: overview.cleaning_tasks.total_tasks,
        percent: overview.cleaning_tasks.completion_percent,
        color: "#10b981",
      },
      {
        name: "Driver",
        value: overview.driver_tasks.completed_tasks,
        total: overview.driver_tasks.total_tasks,
        percent: overview.driver_tasks.completion_percent,
        color: "#f59e0b",
      },
    ];
  }, [overview]);

  // Attendance status pie chart (On Duty vs No Show)
  const attendanceStatusData = useMemo(() => {
    if (!overview) return [];
    const totalOnDuty = overview.security_attendance.on_duty + 
                       overview.cleaning_attendance.on_duty + 
                       overview.driver_attendance.on_duty;
    const totalNoShow = overview.security_attendance.no_show + 
                       overview.cleaning_attendance.no_show + 
                       overview.driver_attendance.no_show;
    
    return [
      {
        name: "On Duty",
        value: totalOnDuty,
        color: "#10b981",
      },
      {
        name: "No Show",
        value: totalNoShow,
        color: "#ef4444",
      },
      {
        name: "Late",
        value: overview.security_attendance.late + 
               overview.cleaning_attendance.late + 
               overview.driver_attendance.late,
        color: "#f59e0b",
      },
    ].filter(d => d.value > 0);
  }, [overview]);

  // Attendance trend (last 7 days) - simplified mock data
  const attendanceTrendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        name: date.toLocaleDateString("id-ID", { weekday: "short" }),
        expected: overview?.security_attendance.expected || 0,
        onDuty: Math.floor((overview?.security_attendance.on_duty || 0) * (0.8 + Math.random() * 0.2)),
        noShow: Math.floor((overview?.security_attendance.no_show || 0) * (0.5 + Math.random() * 0.5)),
      });
    }
    return days;
  }, [overview]);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Supervisor Dashboard
            </h1>
            <UserRoleBadge />
          </div>
          <p className="text-xs text-slate-600">
            Statistik dan analitik operasional untuk manajemen
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700">
            {new Date().toLocaleDateString("id-ID", { 
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

      {/* Main KPI Cards - Row 1 */}
      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Total On Duty"
          value={stats?.totalOnDuty ?? 0}
          subtitle={`Dari ${stats?.totalExpected ?? 0} yang diharapkan`}
        />
        <KpiCard
          title="Attendance Rate"
          value={`${stats?.overallAttendanceRate ?? 0}%`}
          subtitle="Tingkat kehadiran keseluruhan"
          variant={parseFloat(stats?.overallAttendanceRate || "0") >= 90 ? "success" : parseFloat(stats?.overallAttendanceRate || "0") >= 70 ? "default" : "danger"}
        />
        <KpiCard
          title="No Show"
          value={(overview?.security_attendance.no_show ?? 0) + 
                 (overview?.cleaning_attendance.no_show ?? 0) + 
                 (overview?.driver_attendance.no_show ?? 0)}
          variant="danger"
          subtitle="Tidak hadir hari ini"
        />
        <KpiCard
          title="Overtime"
          value={overview?.overtime_today ?? 0}
          subtitle="Lembur hari ini"
        />
      </section>

      {/* Division Breakdown - Row 2 */}
      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Security Division">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-600">On Duty</div>
                <div className="mt-1 text-2xl font-semibold text-[#002B4B]">
                  {overview?.security_attendance.on_duty ?? 0}
                </div>
                <div className="text-xs text-slate-500">
                  dari {overview?.security_attendance.expected ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600">Task Completion</div>
                <div className="mt-1 text-2xl font-semibold text-[#002B4B]">
                  {overview?.security_tasks.completion_percent.toFixed(0) ?? 0}%
                </div>
                <div className="text-xs text-slate-500">
                  {overview?.security_tasks.completed_tasks ?? 0} / {overview?.security_tasks.total_tasks ?? 0}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-300 grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-slate-600">Late</div>
                <div className="font-semibold text-amber-600">{overview?.security_attendance.late ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-600">No Show</div>
                <div className="font-semibold text-red-600">{overview?.security_attendance.no_show ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-600">Missed</div>
                <div className="font-semibold text-red-600">{overview?.security_tasks.missed_count ?? 0}</div>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Cleaning Division">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-600">On Duty</div>
                <div className="mt-1 text-2xl font-semibold text-[#002B4B]">
                  {overview?.cleaning_attendance.on_duty ?? 0}
                </div>
                <div className="text-xs text-slate-500">
                  dari {overview?.cleaning_attendance.expected ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600">Task Completion</div>
                <div className="mt-1 text-2xl font-semibold text-[#002B4B]">
                  {overview?.cleaning_tasks.completion_percent.toFixed(0) ?? 0}%
                </div>
                <div className="text-xs text-slate-500">
                  {overview?.cleaning_tasks.completed_tasks ?? 0} / {overview?.cleaning_tasks.total_tasks ?? 0}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-300 grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-slate-600">Late</div>
                <div className="font-semibold text-amber-600">{overview?.cleaning_attendance.late ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-600">No Show</div>
                <div className="font-semibold text-red-600">{overview?.cleaning_attendance.no_show ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-600">Missed</div>
                <div className="font-semibold text-red-600">{overview?.cleaning_tasks.missed_count ?? 0}</div>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Driver Division">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-600">On Duty</div>
                <div className="mt-1 text-2xl font-semibold text-[#002B4B]">
                  {overview?.driver_attendance.on_duty ?? 0}
                </div>
                <div className="text-xs text-slate-500">
                  dari {overview?.driver_attendance.expected ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600">Task Completion</div>
                <div className="mt-1 text-2xl font-semibold text-[#002B4B]">
                  {overview?.driver_tasks.completion_percent.toFixed(0) ?? 0}%
                </div>
                <div className="text-xs text-slate-500">
                  {overview?.driver_tasks.completed_tasks ?? 0} / {overview?.driver_tasks.total_tasks ?? 0}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-300 grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-slate-600">Late</div>
                <div className="font-semibold text-amber-600">{overview?.driver_attendance.late ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-600">No Show</div>
                <div className="font-semibold text-red-600">{overview?.driver_attendance.no_show ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-600">Missed</div>
                <div className="font-semibold text-red-600">{overview?.driver_tasks.missed_count ?? 0}</div>
              </div>
            </div>
          </div>
        </DashboardCard>
      </section>

      {/* Charts Section - Row 3 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Attendance by Division">
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Loading chart...</div>
            </div>
          ) : (
            <DivisionPieChart data={divisionAttendanceData} />
          )}
        </DashboardCard>

        <DashboardCard title="Attendance Status Distribution">
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Loading chart...</div>
            </div>
          ) : attendanceStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={attendanceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">No data available</div>
            </div>
          )}
        </DashboardCard>
      </section>

      {/* Task Completion Charts - Row 4 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Task Completion by Division">
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Loading chart...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={taskCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10b981" name="Completed" />
                <Bar dataKey="total" fill="#e5e7eb" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardCard>

        <DashboardCard title="Task Completion Percentage">
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Loading chart...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {taskCompletionData.map((div, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{div.name}</span>
                    <span className="font-semibold">{div.percent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full`}
                      style={{
                        width: `${div.percent}%`,
                        backgroundColor: div.color,
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-600">
                    {div.value} / {div.total} tasks completed
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </section>

      {/* Additional Statistics - Row 5 */}
      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard title="Patrols Today">
          <div className="text-3xl font-semibold text-[#002B4B]">
            {overview?.patrols_today ?? 0}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Total patrol hari ini
          </div>
        </DashboardCard>

        <DashboardCard title="Reports Today">
          <div className="text-3xl font-semibold text-[#002B4B]">
            {overview?.reports_today ?? 0}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Total laporan hari ini
          </div>
        </DashboardCard>

        <DashboardCard title="Incidents Today">
          <div className="text-3xl font-semibold text-red-600">
            {overview?.incidents_today ?? 0}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Insiden hari ini
          </div>
        </DashboardCard>

        <DashboardCard title="Unique Guards">
          <div className="text-3xl font-semibold text-[#002B4B]">
            {overview?.unique_guards_today ?? 0}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Guard unik hari ini
          </div>
        </DashboardCard>
      </section>

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PermissionGate resource="control_center" action="read">
          <ActionButton
            to="/supervisor/control-center"
            variant="primary"
            size="md"
          >
            🎛️ Control Center
          </ActionButton>
        </PermissionGate>
        
        <PermissionGate resource="manpower" action="read">
          <ActionButton
            to="/supervisor/manpower"
            variant="secondary"
            size="md"
          >
            👥 Manpower
          </ActionButton>
        </PermissionGate>
        
        <PermissionGate resource="incidents" action="read">
          <ActionButton
            to="/supervisor/incidents/perpetrators"
            variant="secondary"
            size="md"
          >
            ⚠️ Incident Perpetrators
          </ActionButton>
        </PermissionGate>
        
        <PermissionGate resource="patrol_targets" action="read">
          <ActionButton
            to="/supervisor/patrol/targets/manage"
            variant="secondary"
            size="md"
          >
            🎯 Patrol Targets
          </ActionButton>
        </PermissionGate>
      </section>
    </div>
  );
};

export default SupervisorDashboardPage;

