// frontend/web/src/modules/supervisor/pages/Incident/STPLK/STPLKDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface STPLKReport {
  id: number;
  incident_number: string;
  incident_date: string;
  title: string;
  lost_item_description: string;
  lost_item_value?: string;
  lost_date?: string;
  lost_location?: string;
  owner_name?: string;
  owner_contact?: string;
  police_report_number?: string;
  description?: string;
  status: string;
  site_id: number;
  site_name?: string;
  created_at: string;
  updated_at: string;
}

export function STPLKDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<STPLKReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  const loadReport = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/incidents/stplk/${id}`);
      setReport(response.data);
    } catch (err: any) {
      console.error("Failed to load report:", err);
      setError(err.response?.data?.detail || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      SUBMITTED: "bg-blue-100 text-blue-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-gray-500">Loading report details...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || "Report not found"}
        </div>
        <button
          onClick={() => navigate("/supervisor/incident/stplk")}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back to STPLK Reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">STPLK Report Details</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/supervisor/incident/stplk/${id}/edit`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Edit
          </button>
          <button
            onClick={() => navigate("/supervisor/incident/stplk")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard>
          <div className="text-sm text-gray-600">Report Number</div>
          <div className="text-lg font-bold text-[#002B4B]">
            {report.incident_number}
          </div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Status</div>
          <div className="mt-2">{getStatusBadge(report.status)}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Incident Date</div>
          <div className="text-lg font-bold text-[#002B4B]">
            {format(new Date(report.incident_date), "MMM dd, yyyy")}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Title</div>
            <div className="text-base font-medium">{report.title}</div>
          </div>
          {report.description && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">Description</div>
              <div className="text-base font-medium mt-1">{report.description}</div>
            </div>
          )}
        </div>
      </DashboardCard>

      <DashboardCard title="Lost Item Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <div className="text-sm text-gray-600">Lost Item Description</div>
            <div className="text-base font-medium mt-1">{report.lost_item_description}</div>
          </div>
          {report.lost_item_value && (
            <div>
              <div className="text-sm text-gray-600">Lost Item Value</div>
              <div className="text-base font-medium">{report.lost_item_value}</div>
            </div>
          )}
          {report.lost_date && (
            <div>
              <div className="text-sm text-gray-600">Lost Date</div>
              <div className="text-base font-medium">
                {format(new Date(report.lost_date), "MMM dd, yyyy")}
              </div>
            </div>
          )}
          {report.lost_location && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">Lost Location</div>
              <div className="text-base font-medium">{report.lost_location}</div>
            </div>
          )}
        </div>
      </DashboardCard>

      {(report.owner_name || report.owner_contact) && (
        <DashboardCard title="Owner Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.owner_name && (
              <div>
                <div className="text-sm text-gray-600">Owner Name</div>
                <div className="text-base font-medium">{report.owner_name}</div>
              </div>
            )}
            {report.owner_contact && (
              <div>
                <div className="text-sm text-gray-600">Owner Contact</div>
                <div className="text-base font-medium">{report.owner_contact}</div>
              </div>
            )}
          </div>
        </DashboardCard>
      )}

      {report.police_report_number && (
        <DashboardCard title="Police Report Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Police Report Number</div>
              <div className="text-base font-medium">
                {report.police_report_number}
              </div>
            </div>
          </div>
        </DashboardCard>
      )}

      <DashboardCard title="Metadata">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Created At</div>
            <div className="text-base font-medium">
              {format(new Date(report.created_at), "MMM dd, yyyy HH:mm")}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Last Updated</div>
            <div className="text-base font-medium">
              {format(new Date(report.updated_at), "MMM dd, yyyy HH:mm")}
            </div>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

