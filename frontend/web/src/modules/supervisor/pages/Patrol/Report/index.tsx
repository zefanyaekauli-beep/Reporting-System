// frontend/web/src/modules/supervisor/pages/Patrol/Report/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listPatrolReports, deletePatrolReport, PatrolReportData } from "../../../../../api/patrolApi";
import { listSites, Site, getOfficers, Officer } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

export function PatrolReportPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<PatrolReportData[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [officerId, setOfficerId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string>("");
  const [patrolType, setPatrolType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadSites();
    loadOfficers();
    loadReports();
  }, []);

  useEffect(() => {
    loadReports();
  }, [siteId, officerId, status, patrolType, dateFrom, dateTo]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadOfficers = async () => {
    try {
      const data = await getOfficers();
      setOfficers(data);
    } catch (err) {
      console.error("Failed to load officers:", err);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        date_from: dateFrom,
        date_to: dateTo,
      };
      if (siteId) params.site_id = siteId;
      if (officerId) params.officer_id = officerId;
      if (status) params.status = status;
      if (patrolType) params.patrol_type = patrolType;

      const data = await listPatrolReports(params);
      setReports(data);
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      setError(err.response?.data?.detail || "Failed to load patrol reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    
    try {
      await deletePatrolReport(id);
      await loadReports();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete report");
    }
  };

  const handleExportCSV = () => {
    if (reports.length === 0) {
      alert("No reports to export");
      return;
    }

    const headers = ["ID", "Date", "Shift", "Officer", "Site", "Type", "Area", "Duration (min)", "Status", "Summary"];
    const rows = reports.map(r => [
      r.id,
      format(new Date(r.report_date), "yyyy-MM-dd"),
      r.shift,
      r.officer_name || "",
      r.site_name || "",
      r.patrol_type,
      r.area_covered || "",
      r.duration_minutes || "",
      r.status,
      (r.summary || "").replace(/,/g, ";").replace(/\n/g, " "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `patrol_reports_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "REVIEWED":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPatrolTypeColor = (type: string) => {
    switch (type) {
      case "ROUTINE":
        return "bg-blue-100 text-blue-800";
      case "EMERGENCY":
        return "bg-red-100 text-red-800";
      case "SPECIAL":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate statistics
  const totalReports = reports.length;
  const totalDuration = reports.reduce((sum, r) => sum + (r.duration_minutes || 0), 0);
  const avgDuration = totalReports > 0 ? Math.round(totalDuration / totalReports) : 0;
  const approvedCount = reports.filter((r) => r.status === "APPROVED").length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002B4B]">Patrol Report</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage patrol reports
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            onClick={loadReports}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate("/supervisor/patrol/report/new")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            + New Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard>
          <div className="text-sm text-gray-600">Total Reports</div>
          <div className="text-2xl font-bold text-[#002B4B]">{totalReports}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Avg Duration</div>
          <div className="text-2xl font-bold text-blue-600">
            {getDuration(avgDuration)}
          </div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Total Time</div>
          <div className="text-2xl font-bold text-orange-600">
            {getDuration(totalDuration)}
          </div>
        </DashboardCard>
      </div>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Site</label>
            <select
              value={siteId || ""}
              onChange={(e) => setSiteId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Officer</label>
            <select
              value={officerId || ""}
              onChange={(e) => setOfficerId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Officers</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>{officer.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select
              value={patrolType}
              onChange={(e) => setPatrolType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              <option value="ROUTINE">Routine</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="SPECIAL">Special</option>
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
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Reports Table */}
      <DashboardCard title="Patrol Reports">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No patrol reports found</div>
            <button
              onClick={() => navigate("/supervisor/patrol/report/new")}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Create First Report
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Officer</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Site</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Duration</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-3">
                      <div className="font-medium">{report.officer_name}</div>
                      <div className="text-xs text-gray-500">{report.shift}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div>{report.site_name}</div>
                      <div className="text-xs text-gray-500">{report.area_covered}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div>{format(new Date(report.report_date), "MMM dd, yyyy")}</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(report.start_time), "HH:mm")}
                        {report.end_time && ` - ${format(new Date(report.end_time), "HH:mm")}`}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPatrolTypeColor(report.patrol_type)}`}>
                        {report.patrol_type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {getDuration(report.duration_minutes)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/supervisor/patrol/report/${report.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          View
                        </button>
                        {report.status === "DRAFT" && (
                          <button
                            onClick={() => navigate(`/supervisor/patrol/report/${report.id}/edit`)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Delete
                        </button>
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
