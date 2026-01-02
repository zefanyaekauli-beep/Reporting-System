// frontend/web/src/modules/supervisor/pages/Reporting/DAR/index.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listDARs, deleteDAR, submitDAR, approveDAR, rejectDAR, DailyActivityReportList } from "../../../../../services/darService";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

export function DARListPage() {
  const navigate = useNavigate();
  const [dars, setDars] = useState<DailyActivityReportList[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [reportDate, setReportDate] = useState<string | undefined>(undefined);
  const [shift, setShift] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadSites();
    loadDARs();
  }, []);

  useEffect(() => {
    loadDARs();
  }, [siteId, reportDate, shift, status]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadDARs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDARs({
        site_id: siteId,
        report_date: reportDate,
        shift: shift,
        status: status,
      });
      setDars(data);
    } catch (err: any) {
      console.error("Failed to load DARs:", err);
      setError(err.response?.data?.detail || "Failed to load DARs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this DAR?")) {
      return;
    }
    try {
      await deleteDAR(id);
      await loadDARs();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete DAR");
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await submitDAR(id);
      await loadDARs();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit DAR");
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveDAR(id);
      await loadDARs();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to approve DAR");
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await rejectDAR(id, reason);
      await loadDARs();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reject DAR");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Daily Activity Reports (DAR)</h1>
        <button
          onClick={() => navigate("/supervisor/reporting/dar/new")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create DAR
        </button>
      </div>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={reportDate || ""}
              onChange={(e) => setReportDate(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Shift</label>
            <select
              value={shift || ""}
              onChange={(e) => setShift(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Shifts</option>
              <option value="MORNING">Morning</option>
              <option value="AFTERNOON">Afternoon</option>
              <option value="NIGHT">Night</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status || ""}
              onChange={(e) => setStatus(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* DAR Table */}
      <DashboardCard title="DAR List">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : dars.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No DARs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Site</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Shift</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Created By</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Activities</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Personnel</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dars.map((dar) => (
                  <tr key={dar.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{format(new Date(dar.report_date), "MMM dd, yyyy")}</td>
                    <td className="py-2 px-3">{dar.site_name || `Site ${dar.site_id}`}</td>
                    <td className="py-2 px-3">{dar.shift}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(dar.status)}`}>
                        {dar.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">{dar.created_by_name || `User ${dar.created_by}`}</td>
                    <td className="py-2 px-3">{dar.activities_count}</td>
                    <td className="py-2 px-3">{dar.personnel_count}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/supervisor/reporting/dar/${dar.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          View
                        </button>
                        {dar.status === "DRAFT" && (
                          <>
                            <button
                              onClick={() => navigate(`/supervisor/reporting/dar/${dar.id}/edit`)}
                              className="text-green-600 hover:text-green-800 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleSubmit(dar.id)}
                              className="text-orange-600 hover:text-orange-800 text-xs"
                            >
                              Submit
                            </button>
                            <button
                              onClick={() => handleDelete(dar.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {dar.status === "SUBMITTED" && (
                          <>
                            <button
                              onClick={() => handleApprove(dar.id)}
                              className="text-green-600 hover:text-green-800 text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(dar.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Reject
                            </button>
                          </>
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

