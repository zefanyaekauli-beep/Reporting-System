// frontend/web/src/modules/supervisor/pages/Incident/BAP/BAPDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface BAPReport {
  id: number;
  incident_number: string;
  incident_date: string;
  title: string;
  description?: string;
  location?: string;
  status: string;
  site_id: number;
  investigation_date?: string;
  investigator_name?: string;
  subject_name?: string;
  subject_id_number?: string;
  investigation_findings?: string;
  recommendations?: string;
  related_incident_id?: number;
  created_at: string;
  updated_at: string;
}

export function BAPDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<BAPReport | null>(null);
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
      const response = await api.get(`/api/v1/incidents/bap/${id}`);
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
          onClick={() => navigate("/supervisor/incident/bap")}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back to BAP Reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">BAP Report Details</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/supervisor/incident/bap/${id}/edit`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Edit
          </button>
          <button
            onClick={() => navigate("/supervisor/incident/bap")}
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
          <div>
            <div className="text-sm text-gray-600">Location</div>
            <div className="text-base font-medium">{report.location || "-"}</div>
          </div>
          {report.description && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">Description</div>
              <div className="text-base font-medium mt-1">{report.description}</div>
            </div>
          )}
        </div>
      </DashboardCard>

      {report.investigation_date && (
        <DashboardCard title="Investigation Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Investigation Date</div>
              <div className="text-base font-medium">
                {format(new Date(report.investigation_date), "MMM dd, yyyy")}
              </div>
            </div>
            {report.investigator_name && (
              <div>
                <div className="text-sm text-gray-600">Investigator</div>
                <div className="text-base font-medium">{report.investigator_name}</div>
              </div>
            )}
          </div>
        </DashboardCard>
      )}

      {report.subject_name && (
        <DashboardCard title="Subject Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Subject Name</div>
              <div className="text-base font-medium">{report.subject_name}</div>
            </div>
            {report.subject_id_number && (
              <div>
                <div className="text-sm text-gray-600">ID Number</div>
                <div className="text-base font-medium">{report.subject_id_number}</div>
              </div>
            )}
          </div>
        </DashboardCard>
      )}

      {report.investigation_findings && (
        <DashboardCard title="Investigation Findings">
          <div className="text-base font-medium">{report.investigation_findings}</div>
        </DashboardCard>
      )}

      {report.recommendations && (
        <DashboardCard title="Recommendations">
          <div className="text-base font-medium">{report.recommendations}</div>
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

