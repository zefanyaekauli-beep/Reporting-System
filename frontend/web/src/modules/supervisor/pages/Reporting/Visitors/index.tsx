// frontend/web/src/modules/supervisor/pages/Reporting/Visitors/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Visitor {
  id: number;
  name: string;
  company?: string;
  purpose?: string;
  host_name?: string;
  check_in_time?: string;
  check_out_time?: string;
  status: string;
  site_id: number;
  visit_date: string;
}

interface VisitorStats {
  total_visitors: number;
  current_visitors: number;
  checked_out_today: number;
  visitors_by_purpose: Record<string, number>;
  visitors_by_hour: Record<string, number>;
}

export function VisitorsReportPage() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [currentVisitors, setCurrentVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showCurrentOnly, setShowCurrentOnly] = useState(false);

  useEffect(() => {
    loadSites();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [siteId, status, dateFrom, dateTo, showCurrentOnly]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load visitors - filter out undefined/null values and convert to strings
      const params: any = {
        from_date: dateFrom,
        to_date: dateTo,
      };
      if (siteId !== undefined && siteId !== null) {
        params.site_id = String(siteId);
      }
      if (status) {
        params.status = status;
      }

      // Build params for current visitors, filtering out undefined
      const currentParams: any = {};
      if (siteId !== undefined && siteId !== null) {
        currentParams.site_id = String(siteId);
      }

      const [visitorsRes, currentRes, statsRes] = await Promise.all([
        api.get("/visitors", { params }),
        api.get("/visitors/current", { params: currentParams }),
        api.get("/visitors/stats", { params }),
      ]);

      setVisitors(visitorsRes.data);
      setCurrentVisitors(currentRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      console.error("Failed to load visitors:", err);
      
      // Handle error detail - it might be an array or string
      let errorMessage = "Failed to load visitors";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          // FastAPI validation errors are arrays
          errorMessage = detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
        } else if (typeof detail === "string") {
          errorMessage = detail;
        } else {
          errorMessage = JSON.stringify(detail);
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (visitorId: number) => {
    try {
      await api.post(`/visitors/${visitorId}/check-out`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to check out visitor");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return "bg-gray-100 text-gray-800";
      case "CHECKED_IN":
        return "bg-blue-100 text-blue-800";
      case "CHECKED_OUT":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Prepare chart data
  const purposeData = stats
    ? Object.entries(stats.visitors_by_purpose).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const hourlyData = stats
    ? Object.entries(stats.visitors_by_hour)
        .map(([hour, value]) => ({
          hour: `${hour}:00`,
          visitors: value,
        }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
    : [];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  const displayVisitors = showCurrentOnly ? currentVisitors : visitors;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Daily Visitors Report</h1>
        <button
          onClick={() => navigate("/supervisor/reporting/visitors/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Register Visitor
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardCard>
            <div className="text-sm text-gray-600">Total Visitors</div>
            <div className="text-2xl font-bold text-[#002B4B]">{stats.total_visitors}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Currently On-Site</div>
            <div className="text-2xl font-bold text-blue-600">{stats.current_visitors}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Checked Out Today</div>
            <div className="text-2xl font-bold text-green-600">{stats.checked_out_today}</div>
          </DashboardCard>
          <DashboardCard>
            <div className="text-sm text-gray-600">Active Now</div>
            <div className="text-2xl font-bold text-orange-600">{currentVisitors.length}</div>
          </DashboardCard>
        </div>
      )}

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Site</label>
            <select
              value={siteId || ""}
              onChange={(e) => setSiteId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status || ""}
              onChange={(e) => setStatus(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="REGISTERED">Registered</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCurrentOnly}
                onChange={(e) => setShowCurrentOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Current Only</span>
            </label>
          </div>
        </div>
      </DashboardCard>

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardCard title="Visitors by Purpose">
            {purposeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={purposeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {purposeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">No data</div>
            )}
          </DashboardCard>

          <DashboardCard title="Peak Hours">
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="visitors" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">No data</div>
            )}
          </DashboardCard>
        </div>
      )}

      {/* Current Visitors Widget */}
      {currentVisitors.length > 0 && (
        <DashboardCard title={`Current Visitors (${currentVisitors.length})`}>
          <div className="space-y-2">
            {currentVisitors.map((visitor) => (
              <div key={visitor.id} className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{visitor.name}</div>
                    <div className="text-sm text-gray-600">
                      {visitor.company && `${visitor.company} • `}
                      {visitor.purpose}
                      {visitor.check_in_time && ` • In: ${format(new Date(visitor.check_in_time), "HH:mm")}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCheckout(visitor.id)}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Check Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Visitors Table */}
      <DashboardCard title="Visitors List">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : displayVisitors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No visitors found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Company</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Purpose</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Host</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Check-in</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Check-out</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayVisitors.map((visitor) => (
                  <tr key={visitor.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{visitor.name}</td>
                    <td className="py-2 px-3">{visitor.company || "-"}</td>
                    <td className="py-2 px-3">{visitor.purpose || "-"}</td>
                    <td className="py-2 px-3">{visitor.host_name || "-"}</td>
                    <td className="py-2 px-3">
                      {visitor.check_in_time
                        ? format(new Date(visitor.check_in_time), "MMM dd, HH:mm")
                        : "-"}
                    </td>
                    <td className="py-2 px-3">
                      {visitor.check_out_time
                        ? format(new Date(visitor.check_out_time), "MMM dd, HH:mm")
                        : "-"}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(visitor.status)}`}>
                        {visitor.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/supervisor/reporting/visitors/${visitor.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          View
                        </button>
                        {visitor.status === "CHECKED_IN" && (
                          <button
                            onClick={() => handleCheckout(visitor.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Check Out
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

