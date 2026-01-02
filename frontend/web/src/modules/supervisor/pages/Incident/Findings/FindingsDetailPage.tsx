// frontend/web/src/modules/supervisor/pages/Incident/Findings/FindingsDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface FindingsReport {
  id: number;
  incident_number: string;
  incident_date: string;
  title: string;
  description?: string;
  location?: string;
  finding_category?: string;
  severity_level?: string;
  root_cause?: string;
  corrective_action?: string;
  preventive_action?: string;
  responsible_party?: string;
  due_date?: string;
  resolved_date?: string;
  status: string;
  site_id: number;
  site_name?: string;
  created_at: string;
  updated_at: string;
}

export function FindingsDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<FindingsReport | null>(null);
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
      const response = await api.get(`/api/v1/incidents/findings/${id}`);
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

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    const severityColors: Record<string, string> = {
      LOW: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-orange-100 text-orange-800",
      CRITICAL: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded ${
          severityColors[severity] || "bg-gray-100 text-gray-800"
        }`}
      >
        {severity}
      </span>
    );
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    return (
      <span className="px-3 py-1 text-sm font-medium rounded bg-blue-100 text-blue-800">
        {category}
      </span>
    );
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !report?.resolved_date;
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
          onClick={() => navigate("/supervisor/incident/findings")}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back to Findings Reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Findings Report Details</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/supervisor/incident/findings/${id}/edit`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Edit
          </button>
          <button
            onClick={() => navigate("/supervisor/incident/findings")}
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
          {report.location && (
            <div>
              <div className="text-sm text-gray-600">Location</div>
              <div className="text-base font-medium">{report.location}</div>
            </div>
          )}
          {report.finding_category && (
            <div>
              <div className="text-sm text-gray-600">Finding Category</div>
              <div className="mt-2">{getCategoryBadge(report.finding_category)}</div>
            </div>
          )}
          {report.severity_level && (
            <div>
              <div className="text-sm text-gray-600">Severity Level</div>
              <div className="mt-2">{getSeverityBadge(report.severity_level)}</div>
            </div>
          )}
          {report.description && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">Description</div>
              <div className="text-base font-medium mt-1">{report.description}</div>
            </div>
          )}
        </div>
      </DashboardCard>

      {(report.root_cause || report.corrective_action || report.preventive_action) && (
        <DashboardCard title="Analysis & Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.root_cause && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-600">Root Cause</div>
                <div className="text-base font-medium mt-1">{report.root_cause}</div>
              </div>
            )}
            {report.corrective_action && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-600">Corrective Action</div>
                <div className="text-base font-medium mt-1">{report.corrective_action}</div>
              </div>
            )}
            {report.preventive_action && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-600">Preventive Action</div>
                <div className="text-base font-medium mt-1">{report.preventive_action}</div>
              </div>
            )}
            {report.responsible_party && (
              <div>
                <div className="text-sm text-gray-600">Responsible Party</div>
                <div className="text-base font-medium">{report.responsible_party}</div>
              </div>
            )}
            {report.due_date && (
              <div>
                <div className="text-sm text-gray-600">Due Date</div>
                <div className={`text-base font-medium ${isOverdue(report.due_date) ? "text-red-600" : ""}`}>
                  {format(new Date(report.due_date), "MMM dd, yyyy")}
                  {isOverdue(report.due_date) && (
                    <span className="ml-2 text-xs text-red-600">(Overdue)</span>
                  )}
                </div>
              </div>
            )}
            {report.resolved_date && (
              <div>
                <div className="text-sm text-gray-600">Resolved Date</div>
                <div className="text-base font-medium text-green-600">
                  {format(new Date(report.resolved_date), "MMM dd, yyyy")}
                </div>
              </div>
            )}
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

