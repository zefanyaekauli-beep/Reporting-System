/**
 * Supervisor Dashboard - Statistics & Analytics Focus
 * Focus on numbers, calculations, and visualizations for management
 */

import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOverview, Overview, listSites, Site } from "../../../api/supervisorApi";
import { KpiCard } from "../../shared/components/ui/KpiCard";
import { DashboardCard } from "../../shared/components/ui/DashboardCard";
import DivisionPieChart from "../components/DivisionPieChart";
import AttendanceBarChart from "../components/AttendanceBarChart";
import { PermissionGate } from "../../../components/PermissionGate";
import { RoleBasedAccess } from "../../../components/RoleBasedAccess";
import { UserRoleBadge } from "../../../components/UserRoleBadge";
import { ActionButton } from "../../../components/ActionButton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from "recharts";
import { theme } from "../../shared/components/theme";
import api from "../../../api/client";
import { useDashboardData, DashboardFilters as DashboardFiltersType } from "./Dashboard/hooks/useDashboardData";

const SupervisorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [sitesData, setSitesData] = useState<any[]>([]);
  const [attendanceBySite, setAttendanceBySite] = useState<any[]>([]);
  const [reportsByType, setReportsByType] = useState<any[]>([]);
  const [incidentsBySeverity, setIncidentsBySeverity] = useState<any[]>([]);
  const [reportsTrend, setReportsTrend] = useState<any[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState<"year" | "month" | "day">("day");
  
  // Enhanced dashboard filters
  const [showEnhancedFilters, setShowEnhancedFilters] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFiltersType>({});
  const [sites, setSites] = useState<Site[]>([]);
  
  // Enhanced dashboard data
  const { data: dashboardData, loading: dashboardLoading } = useDashboardData(dashboardFilters);
  
  // Data per periode
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);

  // Helper function to fetch all paginated data
  const fetchAllPaginated = async (endpoint: string, params: any = {}) => {
    const allItems: any[] = [];
    let page = 1;
    const limit = 100; // Max limit allowed by backend
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await api.get(endpoint, {
          params: { ...params, page, limit }
        });
        
        const data = response.data;
        const items = data?.items || (Array.isArray(data) ? data : []);
        
        if (items.length === 0) {
          hasMore = false;
          break;
        }
        
        allItems.push(...items);
        
        // Check if there are more pages
        hasMore = items.length === limit && (data?.has_next !== false);
        page++;
        
        // Safety limit to prevent infinite loops
        if (page > 100) {
          console.warn(`Reached safety limit for pagination at ${endpoint}`);
          break;
        }
      } catch (err: any) {
        // If it's a validation error, try with smaller limit
        if (err?.response?.status === 422 && limit > 20) {
          console.warn(`Validation error, retrying with smaller limit`);
          // Retry with smaller limit for this page
          const retryResponse = await api.get(endpoint, {
            params: { ...params, page, limit: 20 }
          });
          const retryData = retryResponse.data;
          const retryItems = retryData?.items || (Array.isArray(retryData) ? retryData : []);
          allItems.push(...retryItems);
          hasMore = retryItems.length === 20 && (retryData?.has_next !== false);
          page++;
        } else {
          console.error(`Error fetching ${endpoint}:`, err);
          break;
        }
      }
    }
    
    return allItems;
  };

  // Load data per tahun (12 bulan)
  const loadYearlyData = async (year: number) => {
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      const [reports, attendance] = await Promise.all([
        fetchAllPaginated("/supervisor/reports", { date_from: startDate, date_to: endDate }),
        fetchAllPaginated("/supervisor/attendance", {})
      ]);
      
      // Group by month
      const monthlyStats: Record<number, any> = {};
      for (let month = 1; month <= 12; month++) {
        monthlyStats[month] = {
          month,
          name: new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "short" }),
          reports: 0,
          incidents: 0,
          attendance: 0,
          onDuty: 0,
        };
      }
      
      reports.forEach((r: any) => {
        const reportDate = new Date(r.created_at);
        if (reportDate.getFullYear() === year) {
          const month = reportDate.getMonth() + 1;
          monthlyStats[month].reports++;
          if (r.report_type === "incident") {
            monthlyStats[month].incidents++;
          }
        }
      });
      
      attendance.forEach((a: any) => {
        const checkinDate = new Date(a.checkin_time);
        if (checkinDate.getFullYear() === year) {
          const month = checkinDate.getMonth() + 1;
          monthlyStats[month].attendance++;
          if (a.status === "IN_PROGRESS") {
            monthlyStats[month].onDuty++;
          }
        }
      });
      
      setYearlyData(Object.values(monthlyStats));
    } catch (err) {
      console.error("Failed to load yearly data:", err);
    }
  };

  // Load data per bulan (30 hari)
  const loadMonthlyData = async (year: number, month: number) => {
    try {
      const daysInMonth = new Date(year, month, 0).getDate();
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
      
      const [reports, attendance] = await Promise.all([
        fetchAllPaginated("/supervisor/reports", { date_from: startDate, date_to: endDate }),
        fetchAllPaginated("/supervisor/attendance", {})
      ]);
      
      // Group by day
      const dailyStats: Record<number, any> = {};
      for (let day = 1; day <= daysInMonth; day++) {
        dailyStats[day] = {
          day,
          name: String(day),
          reports: 0,
          incidents: 0,
          attendance: 0,
          onDuty: 0,
        };
      }
      
      reports.forEach((r: any) => {
        const reportDate = new Date(r.created_at);
        if (reportDate.getFullYear() === year && reportDate.getMonth() + 1 === month) {
          const day = reportDate.getDate();
          dailyStats[day].reports++;
          if (r.report_type === "incident") {
            dailyStats[day].incidents++;
          }
        }
      });
      
      attendance.forEach((a: any) => {
        const checkinDate = new Date(a.checkin_time);
        if (checkinDate.getFullYear() === year && checkinDate.getMonth() + 1 === month) {
          const day = checkinDate.getDate();
          dailyStats[day].attendance++;
          if (a.status === "IN_PROGRESS") {
            dailyStats[day].onDuty++;
          }
        }
      });
      
      setMonthlyData(Object.values(dailyStats));
    } catch (err) {
      console.error("Failed to load monthly data:", err);
    }
  };

  // Load data per hari (24 jam)
  const loadDailyData = async (dateStr: string) => {
    try {
      const [reports, attendance] = await Promise.all([
        fetchAllPaginated("/supervisor/reports", { date_from: dateStr, date_to: dateStr }),
        fetchAllPaginated("/supervisor/attendance", {})
      ]);
      
      // Group by hour
      const hourlyStats: Record<number, any> = {};
      for (let hour = 0; hour < 24; hour++) {
        hourlyStats[hour] = {
          hour,
          name: `${String(hour).padStart(2, "0")}:00`,
          reports: 0,
          incidents: 0,
          attendance: 0,
          checkins: 0,
        };
      }
      
      reports.forEach((r: any) => {
        const reportDate = new Date(r.created_at);
        const reportDateStr = reportDate.toISOString().split("T")[0];
        if (reportDateStr === dateStr) {
          const hour = reportDate.getHours();
          hourlyStats[hour].reports++;
          if (r.report_type === "incident") {
            hourlyStats[hour].incidents++;
          }
        }
      });
      
      attendance.forEach((a: any) => {
        const checkinDate = new Date(a.checkin_time);
        const checkinDateStr = checkinDate.toISOString().split("T")[0];
        if (checkinDateStr === dateStr) {
          const hour = checkinDate.getHours();
          hourlyStats[hour].attendance++;
          hourlyStats[hour].checkins++;
        }
      });
      
      setDailyData(Object.values(hourlyStats));
    } catch (err) {
      console.error("Failed to load daily data:", err);
    }
  };

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const overviewData = await getOverview();
      setOverview(overviewData);

      // Load additional data for charts
      try {
        // Get reports data (first page only for initial load)
        const reportsResponse = await api.get("/supervisor/reports", {
          params: { page: 1, limit: 100 }
        });
        const reports = reportsResponse.data?.items || reportsResponse.data || [];
        setReportsData(reports);

        // Get sites data
        const sitesResponse = await api.get("/supervisor/sites");
        const sites = sitesResponse.data || [];
        setSitesData(sites);

        // Process reports by type
        const reportsByTypeMap: Record<string, number> = {};
        reports.forEach((r: any) => {
          const type = r.report_type || "unknown";
          reportsByTypeMap[type] = (reportsByTypeMap[type] || 0) + 1;
        });
        setReportsByType([
          { name: "Incident", value: reportsByTypeMap["incident"] || 0, color: "#ef4444" },
          { name: "Daily", value: reportsByTypeMap["daily"] || 0, color: "#3b82f6" },
          { name: "Finding", value: reportsByTypeMap["finding"] || 0, color: "#10b981" },
          { name: "Other", value: reportsByTypeMap["other"] || 0, color: "#6b7280" },
        ].filter(d => d.value > 0));

        // Process incidents by severity
        const incidents = reports.filter((r: any) => r.report_type === "incident");
        const severityMap: Record<string, number> = {};
        incidents.forEach((r: any) => {
          const severity = r.severity || r.incident_level || "unknown";
          severityMap[severity] = (severityMap[severity] || 0) + 1;
        });
        setIncidentsBySeverity([
          { name: "Kritis", value: severityMap["critical"] || severityMap["CRITICAL"] || 0, color: "#dc2626" },
          { name: "Tinggi", value: severityMap["high"] || severityMap["HIGH"] || 0, color: "#f59e0b" },
          { name: "Sedang", value: severityMap["medium"] || severityMap["MEDIUM"] || 0, color: "#eab308" },
          { name: "Rendah", value: severityMap["low"] || severityMap["LOW"] || 0, color: "#10b981" },
        ].filter(d => d.value > 0));

        // Get attendance by site (first page only for initial load)
        const attendanceResponse = await api.get("/supervisor/attendance", {
          params: { page: 1, limit: 100 }
        });
        const attendance = attendanceResponse.data?.items || attendanceResponse.data || [];
        const siteAttendanceMap: Record<string, number> = {};
        attendance.forEach((a: any) => {
          const siteName = a.site_name || "Unknown";
          siteAttendanceMap[siteName] = (siteAttendanceMap[siteName] || 0) + 1;
        });
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
        setAttendanceBySite(
          Object.entries(siteAttendanceMap)
            .map(([name, value], idx) => ({
              name,
              value,
              color: colors[idx % colors.length]
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 7) // Top 7 sites
        );

        // Generate reports trend (last 7 days)
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          const dayReports = reports.filter((r: any) => {
            const reportDate = new Date(r.created_at).toISOString().split("T")[0];
            return reportDate === dateStr;
          });
          trendData.push({
            name: date.toLocaleDateString("id-ID", { weekday: "short" }),
            date: dateStr,
            reports: dayReports.length,
            incidents: dayReports.filter((r: any) => r.report_type === "incident").length,
            daily: dayReports.filter((r: any) => r.report_type === "daily").length,
          });
        }
        setReportsTrend(trendData);

        // Generate attendance trend (last 7 days)
        const attendanceTrendData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          const dayAttendance = attendance.filter((a: any) => {
            const checkinDate = new Date(a.checkin_time).toISOString().split("T")[0];
            return checkinDate === dateStr;
          });
          attendanceTrendData.push({
            name: date.toLocaleDateString("id-ID", { weekday: "short" }),
            date: dateStr,
            total: dayAttendance.length,
            onDuty: dayAttendance.filter((a: any) => a.status === "IN_PROGRESS").length,
            completed: dayAttendance.filter((a: any) => a.status === "COMPLETED").length,
          });
        }
        setAttendanceTrend(attendanceTrendData);

        // Load data per tahun (12 bulan)
        await loadYearlyData(selectedYear);
        
        // Load data per bulan (30 hari)
        await loadMonthlyData(selectedYear, selectedMonth);
        
        // Load data per hari (24 jam)
        await loadDailyData(selectedDay);
      } catch (err) {
        console.error("Failed to load additional data:", err);
        // Continue even if additional data fails
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal memuat data dashboard. Silakan periksa koneksi jaringan Anda dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Auto-refresh every 30 seconds (like Live Dashboard)
  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (viewMode === "year") {
      loadYearlyData(selectedYear);
    } else if (viewMode === "month") {
      loadMonthlyData(selectedYear, selectedMonth);
    } else {
      loadDailyData(selectedDay);
    }
  }, [viewMode, selectedYear, selectedMonth, selectedDay]);

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
        name: "Kebersihan",
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
        name: "Kebersihan",
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
        name: "Sedang Bertugas",
        value: totalOnDuty,
        color: "#10b981",
      },
      {
        name: "No Show",
        value: totalNoShow,
        color: "#ef4444",
      },
      {
        name: "Terlambat",
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

      {/* Filter Section */}
      <DashboardCard 
        title="Filter Periode"
        headerAction={
          <button
            onClick={() => setShowEnhancedFilters(!showEnhancedFilters)}
            className="px-4 py-2 text-sm font-medium text-[#002B4B] bg-white border border-[#002B4B] rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showEnhancedFilters ? "Hide" : "Show"} Enhanced Filters
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Tampilan
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as "year" | "month" | "day")}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Per Hari</option>
              <option value="month">Per Bulan</option>
              <option value="year">Per Tahun</option>
            </select>
          </div>
          
          {viewMode === "year" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tahun
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                min={2020}
                max={new Date().getFullYear() + 1}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          {viewMode === "month" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tahun
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  min={2020}
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(selectedYear, month - 1, 1).toLocaleDateString("id-ID", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          {viewMode === "day" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Enhanced Filters */}
      {showEnhancedFilters && (
        <DashboardCard title="Enhanced Filters">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date From</label>
              <input
                type="date"
                value={dashboardFilters.date_from || ""}
                onChange={(e) => setDashboardFilters({ ...dashboardFilters, date_from: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date To</label>
              <input
                type="date"
                value={dashboardFilters.date_to || ""}
                onChange={(e) => setDashboardFilters({ ...dashboardFilters, date_to: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Division</label>
              <select
                value={dashboardFilters.division || ""}
                onChange={(e) => setDashboardFilters({ ...dashboardFilters, division: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="">All Divisions</option>
                <option value="SECURITY">Security</option>
                <option value="CLEANING">Cleaning</option>
                <option value="DRIVER">Driver</option>
                <option value="PARKING">Parking</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Shift</label>
              <select
                value={dashboardFilters.shift || ""}
                onChange={(e) => setDashboardFilters({ ...dashboardFilters, shift: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="">All Shifts</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="NIGHT">Night</option>
                <option value="0">Shift 0</option>
                <option value="1">Shift 1</option>
                <option value="2">Shift 2</option>
                <option value="3">Shift 3</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Sites ({dashboardFilters.site_ids?.length || 0} selected)
              </label>
              <select
                multiple
                value={dashboardFilters.site_ids?.map(String) || []}
                onChange={(e) => {
                  const selectedIds = Array.from(e.target.selectedOptions, (option) => parseInt(option.value));
                  setDashboardFilters({ ...dashboardFilters, site_ids: selectedIds });
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                size={4}
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          </div>
        </DashboardCard>
      )}

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
        <div onClick={() => navigate("/supervisor/attendance")} className="cursor-pointer">
          <KpiCard
            title="Tingkat Kehadiran"
            value={`${stats?.overallAttendanceRate ?? 0}%`}
            subtitle="Tingkat kehadiran keseluruhan"
            variant={parseFloat(stats?.overallAttendanceRate || "0") >= 90 ? "success" : parseFloat(stats?.overallAttendanceRate || "0") >= 70 ? "default" : "danger"}
          />
        </div>
        <div onClick={() => navigate("/supervisor/attendance")} className="cursor-pointer">
          <KpiCard
            title="No Show"
            value={(overview?.security_attendance.no_show ?? 0) + 
                   (overview?.cleaning_attendance.no_show ?? 0) + 
                   (overview?.driver_attendance.no_show ?? 0)}
            variant="danger"
            subtitle="Tidak hadir hari ini"
          />
        </div>
        <div onClick={() => navigate("/supervisor/attendance/overtime")} className="cursor-pointer">
          <KpiCard
            title="Lembur"
            value={overview?.overtime_today ?? 0}
            subtitle="Lembur hari ini"
          />
        </div>
        <div onClick={() => navigate("/supervisor/reports")} className="cursor-pointer">
          <KpiCard
            title="Total Reports"
            value={overview?.reports_today ?? 0}
            subtitle="Laporan hari ini"
          />
        </div>
      </section>

      {/* Enhanced Widgets - Attendance, Patrol, Incident, Task */}
      {dashboardData && (
        <>
          {/* Attendance Summary Widget */}
          <section className="grid gap-4">
            <DashboardCard title="Attendance Summary">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div onClick={() => navigate("/supervisor/attendance")} className="cursor-pointer">
                  <KpiCard title="On Duty" value={dashboardData.attendance_summary.total_on_duty} variant="default" />
                </div>
                <div onClick={() => navigate("/supervisor/attendance")} className="cursor-pointer">
                  <KpiCard title="Late" value={dashboardData.attendance_summary.total_late} variant="warning" />
                </div>
                <div onClick={() => navigate("/supervisor/attendance")} className="cursor-pointer">
                  <KpiCard title="Absent" value={dashboardData.attendance_summary.total_absent} variant="danger" />
                </div>
                <div onClick={() => navigate("/supervisor/attendance")} className="cursor-pointer">
                  <KpiCard title="Early Checkout" value={dashboardData.attendance_summary.total_early_checkout} variant="warning" />
                </div>
              </div>
            </DashboardCard>
          </section>

          {/* Patrol & Incident & Task Widgets */}
          <section className="grid gap-4 md:grid-cols-3">
            <DashboardCard title="Patrol Status">
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => navigate("/supervisor/patrol-activity")} className="cursor-pointer">
                  <KpiCard title="Completed" value={dashboardData.patrol_status.routes_completed} variant="success" />
                </div>
                <div onClick={() => navigate("/supervisor/patrol-activity")} className="cursor-pointer">
                  <KpiCard title="In Progress" value={dashboardData.patrol_status.routes_in_progress} variant="default" />
                </div>
                <div onClick={() => navigate("/supervisor/patrol-activity")} className="cursor-pointer">
                  <KpiCard title="Pending" value={dashboardData.patrol_status.routes_pending} variant="warning" />
                </div>
                <div onClick={() => navigate("/supervisor/patrol-activity")} className="cursor-pointer">
                  <KpiCard title="Missed" value={dashboardData.patrol_status.missed_checkpoints} variant="danger" />
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Incident Summary">
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => navigate("/supervisor/reports?division=SECURITY&report_type=incident&status=open")} className="cursor-pointer">
                  <KpiCard title="Open" value={dashboardData.incident_summary.open_incidents} variant="warning" />
                </div>
                <div onClick={() => navigate("/supervisor/reports?division=SECURITY&report_type=incident&status=in_review")} className="cursor-pointer">
                  <KpiCard title="In Review" value={dashboardData.incident_summary.in_review} variant="default" />
                </div>
                <div onClick={() => navigate("/supervisor/reports?division=SECURITY&report_type=incident&status=closed")} className="cursor-pointer">
                  <KpiCard title="Closed Today" value={dashboardData.incident_summary.closed_today} variant="success" />
                </div>
                <div onClick={() => navigate("/supervisor/reports?division=SECURITY&report_type=incident&severity=high")} className="cursor-pointer">
                  <KpiCard title="Critical" value={dashboardData.incident_summary.critical_alerts} variant="danger" />
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Task Completion">
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => navigate("/supervisor/checklists")} className="cursor-pointer">
                  <KpiCard 
                    title="Progress" 
                    value={`${dashboardData.task_completion.checklist_progress.toFixed(1)}%`}
                    variant={dashboardData.task_completion.checklist_progress >= 80 ? "success" : dashboardData.task_completion.checklist_progress >= 50 ? "warning" : "danger"}
                  />
                </div>
                <div onClick={() => navigate("/supervisor/checklists?status=overdue")} className="cursor-pointer">
                  <KpiCard title="Overdue" value={dashboardData.task_completion.overdue_tasks} variant="danger" />
                </div>
                <div onClick={() => navigate("/supervisor/checklists?status=completed")} className="cursor-pointer">
                  <KpiCard title="Completed Today" value={dashboardData.task_completion.completed_today} variant="success" />
                </div>
                <div onClick={() => navigate("/supervisor/checklists")} className="cursor-pointer">
                  <KpiCard title="Total Tasks" value={dashboardData.task_completion.total_tasks} variant="default" />
                </div>
              </div>
            </DashboardCard>
          </section>
        </>
      )}

      {/* Division Breakdown - Row 2 */}
      <section className="grid gap-4 md:grid-cols-3">
        <DashboardCard 
          title="Security Division"
          onClick={() => navigate("/supervisor/attendance?division=SECURITY")}
        >
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
                <div className="text-xs text-slate-600">Penyelesaian Tugas</div>
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
                <div className="text-slate-600">Tidak Hadir</div>
                <div className="font-semibold text-red-600">{overview?.security_attendance.no_show ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-600">Missed</div>
                <div className="font-semibold text-red-600">{overview?.security_tasks.missed_count ?? 0}</div>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard 
          title="Divisi Kebersihan"
          onClick={() => navigate("/supervisor/attendance?division=CLEANING")}
        >
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
                <div className="text-xs text-slate-600">Penyelesaian Tugas</div>
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
                <div className="text-slate-600">Tidak Hadir</div>
                <div className="font-semibold text-red-600">{overview?.cleaning_attendance.no_show ?? 0}</div>
              </div>
              <div>
                <div className="text-slate-600">Missed</div>
                <div className="font-semibold text-red-600">{overview?.cleaning_tasks.missed_count ?? 0}</div>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard 
          title="Divisi Driver"
          onClick={() => navigate("/supervisor/attendance?division=DRIVER")}
        >
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
                <div className="text-xs text-slate-600">Penyelesaian Tugas</div>
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
                <div className="text-slate-600">Tidak Hadir</div>
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
        <DashboardCard 
          title="Attendance by Division"
          onClick={() => navigate("/supervisor/attendance")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
            </div>
          ) : (
            <DivisionPieChart data={divisionAttendanceData} />
          )}
        </DashboardCard>

        <DashboardCard 
          title="Distribusi Status Absensi"
          onClick={() => navigate("/supervisor/attendance")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
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
              <div className="text-sm">Tidak ada data tersedia</div>
            </div>
          )}
        </DashboardCard>
      </section>

      {/* Task Completion Charts - Row 4 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardCard 
          title="Penyelesaian Tugas per Divisi"
          onClick={() => navigate("/supervisor/checklists")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={taskCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10b981" name="Selesai" />
                <Bar dataKey="total" fill="#e5e7eb" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardCard>

        <DashboardCard 
          title="Task Completion Percentage"
          onClick={() => navigate("/supervisor/checklists")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
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
                    {div.value} / {div.total} tugas selesai
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </section>

      {/* Additional Statistics - Row 5 */}
      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard 
          title="Patrols Today"
          onClick={() => navigate("/supervisor/patrol-activity")}
        >
          <div className="text-3xl font-semibold text-[#002B4B]">
            {overview?.patrols_today ?? 0}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Total patrol hari ini
          </div>
        </DashboardCard>

        <DashboardCard 
          title="Laporan Hari Ini"
          onClick={() => navigate("/supervisor/reports")}
        >
          <div className="text-3xl font-semibold text-[#002B4B]">
            {overview?.reports_today ?? 0}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Total laporan hari ini
          </div>
        </DashboardCard>

        <DashboardCard 
          title="Incidents Today"
          onClick={() => navigate("/supervisor/reports?division=SECURITY&report_type=incident")}
        >
          <div className="text-3xl font-semibold text-red-600">
            {overview?.incidents_today ?? 0}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Insiden hari ini
          </div>
        </DashboardCard>

        <DashboardCard 
          title="Guard Unik"
          onClick={() => navigate("/supervisor/attendance")}
        >
          <div className="text-3xl font-semibold text-[#002B4B]">
            {overview?.unique_guards_today ?? 0}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Guard unik hari ini
          </div>
        </DashboardCard>
      </section>

      {/* Additional Pie Charts - Row 6 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardCard 
          title="Reports by Type"
          onClick={() => navigate("/supervisor/reports")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
            </div>
          ) : reportsByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={reportsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Tidak ada data laporan tersedia</div>
            </div>
          )}
        </DashboardCard>

        <DashboardCard 
          title="Insiden per Tingkat Keparahan"
          onClick={() => navigate("/supervisor/reports?division=SECURITY&report_type=incident")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
            </div>
          ) : incidentsBySeverity.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={incidentsBySeverity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incidentsBySeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">No incidents data available</div>
            </div>
          )}
        </DashboardCard>
      </section>

      {/* Attendance by Site - Row 7 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardCard 
          title="Attendance by Site (Top 7)"
          onClick={() => navigate("/supervisor/attendance")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
            </div>
          ) : attendanceBySite.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={attendanceBySite}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceBySite.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Tidak ada data absensi tersedia</div>
            </div>
          )}
        </DashboardCard>

        <DashboardCard 
          title="Perbandingan Kinerja Divisi"
          onClick={() => navigate("/supervisor/attendance")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
            </div>
          ) : divisionAttendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={divisionAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Sedang Bertugas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Tidak ada data tersedia</div>
            </div>
          )}
        </DashboardCard>
      </section>

      {/* Trends Charts - Row 8 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardCard 
          title="Reports Trend (Last 7 Days)"
          onClick={() => navigate("/supervisor/reports")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
            </div>
          ) : reportsTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={reportsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="reports" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Total Laporan" />
                <Area type="monotone" dataKey="incidents" stackId="1" stroke="#ef4444" fill="#ef4444" name="Insiden" />
                <Area type="monotone" dataKey="daily" stackId="1" stroke="#10b981" fill="#10b981" name="Laporan Harian" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">No trend data available</div>
            </div>
          )}
        </DashboardCard>

        <DashboardCard 
          title="Tren Absensi (7 Hari Terakhir)"
          onClick={() => navigate("/supervisor/attendance")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
            </div>
          ) : attendanceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="onDuty" stroke="#10b981" strokeWidth={2} name="On Duty" />
                <Line type="monotone" dataKey="completed" stroke="#6b7280" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-500">
              <div className="text-sm">No trend data available</div>
            </div>
          )}
        </DashboardCard>
      </section>

      {/* Additional Statistics - Row 9 */}
      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard 
          title="Total Reports"
          onClick={() => navigate("/supervisor/reports")}
        >
          <div className="text-3xl font-semibold text-[#002B4B]">
            {reportsData.length}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Semua laporan
          </div>
        </DashboardCard>

        <DashboardCard 
          title="Total Situs"
          onClick={() => navigate("/supervisor/sites")}
        >
          <div className="text-3xl font-semibold text-[#002B4B]">
            {sitesData.length}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Situs aktif
          </div>
        </DashboardCard>

        <DashboardCard 
          title="Total Incidents"
          onClick={() => navigate("/supervisor/reports?division=SECURITY&report_type=incident")}
        >
          <div className="text-3xl font-semibold text-red-600">
            {reportsData.filter((r: any) => r.report_type === "incident").length}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Insiden total
          </div>
        </DashboardCard>

        <DashboardCard 
          title="Laporan Hari Ini"
          onClick={() => navigate("/supervisor/reports")}
        >
          <div className="text-3xl font-semibold text-[#002B4B]">
            {reportsData.filter((r: any) => {
              const reportDate = new Date(r.created_at).toISOString().split("T")[0];
              const today = new Date().toISOString().split("T")[0];
              return reportDate === today;
            }).length}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Laporan hari ini
          </div>
        </DashboardCard>
      </section>

      {/* Reports by Division - Row 10 */}
      <section>
        <DashboardCard 
          title="Laporan per Divisi"
          onClick={() => navigate("/supervisor/reports")}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[200px] text-slate-500">
              <div className="text-sm">Memuat grafik...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                {
                  name: "Keamanan",
                  value: reportsData.filter((r: any) => r.division === "SECURITY").length,
                  color: "#3b82f6"
                },
                {
                  name: "Kebersihan",
                  value: reportsData.filter((r: any) => r.division === "CLEANING").length,
                  color: "#10b981"
                },
                {
                  name: "Parkir",
                  value: reportsData.filter((r: any) => r.division === "PARKING").length,
                  color: "#f59e0b"
                },
                {
                  name: "Driver",
                  value: reportsData.filter((r: any) => r.division === "DRIVER").length,
                  color: "#8b5cf6"
                },
              ].filter(d => d.value > 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Reports" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DashboardCard>
      </section>

      {/* Data Per Tahun (12 Bulan) - Row 11 */}
      {viewMode === "year" && (
        <section className="grid gap-6 lg:grid-cols-2">
          <DashboardCard 
            title={`Data Per Tahun ${selectedYear} - Reports & Incidents`}
            onClick={() => navigate("/supervisor/reports")}
          >
            {loading ? (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Memuat grafik...</div>
              </div>
            ) : yearlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="reports" fill="#3b82f6" name="Laporan" />
                  <Bar dataKey="incidents" fill="#ef4444" name="Insiden" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Tidak ada data tersedia</div>
              </div>
            )}
          </DashboardCard>

          <DashboardCard 
            title={`Data Per Tahun ${selectedYear} - Attendance`}
            onClick={() => navigate("/supervisor/attendance")}
          >
            {loading ? (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Memuat grafik...</div>
              </div>
            ) : yearlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="attendance" stackId="1" stroke="#10b981" fill="#10b981" name="Total Absensi" />
                  <Area type="monotone" dataKey="onDuty" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Sedang Bertugas" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Tidak ada data tersedia</div>
              </div>
            )}
          </DashboardCard>
        </section>
      )}

      {/* Data Per Bulan (30 Hari) - Row 12 */}
      {viewMode === "month" && (
        <section className="grid gap-6 lg:grid-cols-2">
          <DashboardCard 
            title={`Data Per Bulan ${new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })} - Reports & Incidents`}
            onClick={() => navigate("/supervisor/reports")}
          >
            {loading ? (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Memuat grafik...</div>
              </div>
            ) : monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2} name="Reports" />
                  <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} name="Incidents" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Tidak ada data tersedia</div>
              </div>
            )}
          </DashboardCard>

          <DashboardCard 
            title={`Data Per Bulan ${new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })} - Attendance`}
            onClick={() => navigate("/supervisor/attendance")}
          >
            {loading ? (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Memuat grafik...</div>
              </div>
            ) : monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="attendance" stackId="1" stroke="#10b981" fill="#10b981" name="Total Absensi" />
                  <Area type="monotone" dataKey="onDuty" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Sedang Bertugas" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Tidak ada data tersedia</div>
              </div>
            )}
          </DashboardCard>
        </section>
      )}

      {/* Data Per Hari (24 Jam) - Row 13 */}
      {viewMode === "day" && (
        <section className="grid gap-6 lg:grid-cols-2">
          <DashboardCard 
            title={`Data Per Hari ${new Date(selectedDay).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} - Reports & Incidents`}
            onClick={() => navigate("/supervisor/reports")}
          >
            {loading ? (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Memuat grafik...</div>
              </div>
            ) : dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="reports" fill="#3b82f6" name="Laporan" />
                  <Bar dataKey="incidents" fill="#ef4444" name="Insiden" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Tidak ada data tersedia</div>
              </div>
            )}
          </DashboardCard>

          <DashboardCard 
            title={`Data Per Hari ${new Date(selectedDay).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} - Attendance & Check-ins`}
            onClick={() => navigate("/supervisor/attendance")}
          >
            {loading ? (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Memuat grafik...</div>
              </div>
            ) : dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} name="Total Absensi" />
                  <Line type="monotone" dataKey="checkins" stroke="#3b82f6" strokeWidth={2} name="Check-in" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-sm">Tidak ada data tersedia</div>
              </div>
            )}
          </DashboardCard>
        </section>
      )}

      {/* Summary Statistics by Period - Row 14 */}
      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard 
          title={viewMode === "year" ? `Total Laporan ${selectedYear}` : viewMode === "month" ? `Total Laporan Bulan ${selectedMonth}` : `Total Laporan Hari Ini`}
          onClick={() => navigate("/supervisor/reports")}
        >
          <div className="text-3xl font-semibold text-[#002B4B]">
            {viewMode === "year" 
              ? yearlyData.reduce((sum, d) => sum + d.reports, 0)
              : viewMode === "month"
              ? monthlyData.reduce((sum, d) => sum + d.reports, 0)
              : dailyData.reduce((sum, d) => sum + d.reports, 0)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {viewMode === "year" ? "Laporan per tahun" : viewMode === "month" ? "Laporan per bulan" : "Laporan per hari"}
          </div>
        </DashboardCard>

        <DashboardCard 
          title={viewMode === "year" ? `Total Insiden ${selectedYear}` : viewMode === "month" ? `Total Insiden Bulan ${selectedMonth}` : `Total Insiden Hari Ini`}
          onClick={() => navigate("/supervisor/reports?division=SECURITY&report_type=incident")}
        >
          <div className="text-3xl font-semibold text-red-600">
            {viewMode === "year" 
              ? yearlyData.reduce((sum, d) => sum + d.incidents, 0)
              : viewMode === "month"
              ? monthlyData.reduce((sum, d) => sum + d.incidents, 0)
              : dailyData.reduce((sum, d) => sum + d.incidents, 0)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {viewMode === "year" ? "Insiden per tahun" : viewMode === "month" ? "Insiden per bulan" : "Insiden per hari"}
          </div>
        </DashboardCard>

        <DashboardCard 
          title={viewMode === "year" ? `Total Attendance ${selectedYear}` : viewMode === "month" ? `Total Attendance Bulan ${selectedMonth}` : `Total Attendance Hari Ini`}
          onClick={() => navigate("/supervisor/attendance")}
        >
          <div className="text-3xl font-semibold text-[#002B4B]">
            {viewMode === "year" 
              ? yearlyData.reduce((sum, d) => sum + d.attendance, 0)
              : viewMode === "month"
              ? monthlyData.reduce((sum, d) => sum + d.attendance, 0)
              : dailyData.reduce((sum, d) => sum + d.attendance, 0)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {viewMode === "year" ? "Kehadiran per tahun" : viewMode === "month" ? "Kehadiran per bulan" : "Kehadiran per hari"}
          </div>
        </DashboardCard>

        <DashboardCard 
          title={viewMode === "year" ? `Rata-rata Sedang Bertugas ${selectedYear}` : viewMode === "month" ? `Rata-rata Sedang Bertugas Bulan ${selectedMonth}` : `Sedang Bertugas Hari Ini`}
          onClick={() => navigate("/supervisor/attendance")}
        >
          <div className="text-3xl font-semibold text-green-600">
            {viewMode === "year" 
              ? Math.round(yearlyData.reduce((sum, d) => sum + d.onDuty, 0) / (yearlyData.length || 1))
              : viewMode === "month"
              ? Math.round(monthlyData.reduce((sum, d) => sum + d.onDuty, 0) / (monthlyData.length || 1))
              : dailyData.reduce((sum, d) => sum + d.checkins, 0)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {viewMode === "year" ? "Rata-rata on duty" : viewMode === "month" ? "Rata-rata on duty" : "Check-ins hari ini"}
          </div>
        </DashboardCard>
      </section>

    </div>
  );
};

export default SupervisorDashboardPage;

