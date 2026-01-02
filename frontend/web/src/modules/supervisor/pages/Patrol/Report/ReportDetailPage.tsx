// frontend/web/src/modules/supervisor/pages/Patrol/Report/ReportDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  getPatrolReport, 
  updatePatrolReport, 
  submitPatrolReport,
  approvePatrolReport,
  deletePatrolReport,
  PatrolReportData 
} from "../../../../../api/patrolApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

export function ReportDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<PatrolReportData | null>(null);
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
      const data = await getPatrolReport(parseInt(id));
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load patrol report");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await submitPatrolReport(parseInt(id));
      await loadReport();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit report");
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approvePatrolReport(parseInt(id));
      await loadReport();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to approve report");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    
    try {
      await deletePatrolReport(parseInt(id));
      navigate("/supervisor/patrol/report");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete report");
    }
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

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-gray-500">Loading...</div>
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
          onClick={() => navigate("/supervisor/patrol/report")}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002B4B]">Patrol Report #{report.id}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {report.site_name} • {format(new Date(report.report_date), "MMM dd, yyyy")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {report.status === "DRAFT" && (
            <>
              <button
                onClick={() => navigate(`/supervisor/patrol/report/${report.id}/edit`)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Edit
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Submit
              </button>
            </>
          )}
          {report.status === "SUBMITTED" && (
            <button
              onClick={handleApprove}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Approve
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
          >
            Delete
          </button>
          <button
            onClick={() => navigate("/supervisor/patrol/report")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
          {report.status}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPatrolTypeColor(report.patrol_type)}`}>
          {report.patrol_type}
        </span>
        <span className="text-sm text-gray-600">
          Shift: <strong>{report.shift}</strong>
        </span>
      </div>

      {/* Report Info */}
      <DashboardCard title="Report Information">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600">Officer</div>
            <div className="text-sm font-medium">{report.officer_name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Date</div>
            <div className="text-sm font-medium">
              {format(new Date(report.report_date), "MMM dd, yyyy")}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Start Time</div>
            <div className="text-sm font-medium">
              {format(new Date(report.start_time), "HH:mm")}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">End Time</div>
            <div className="text-sm font-medium">
              {report.end_time 
                ? format(new Date(report.end_time), "HH:mm")
                : "Not ended"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Duration</div>
            <div className="text-sm font-medium">
              {report.duration_minutes 
                ? `${Math.floor(report.duration_minutes / 60)}h ${report.duration_minutes % 60}m`
                : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Area Covered</div>
            <div className="text-sm font-medium">{report.area_covered || "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Created At</div>
            <div className="text-sm font-medium">
              {format(new Date(report.created_at), "MMM dd, HH:mm")}
            </div>
          </div>
          {report.reviewed_at && (
            <div>
              <div className="text-xs text-gray-600">Reviewed At</div>
              <div className="text-sm font-medium">
                {format(new Date(report.reviewed_at), "MMM dd, HH:mm")}
              </div>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Summary */}
      {report.summary && (
        <DashboardCard title="Summary">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.summary}</p>
        </DashboardCard>
      )}

      {/* Findings */}
      {report.findings && (
        <DashboardCard title="Findings">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.findings}</p>
        </DashboardCard>
      )}

      {/* Recommendations */}
      {report.recommendations && (
        <DashboardCard title="Recommendations">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.recommendations}</p>
        </DashboardCard>
      )}

      {/* Photos */}
      {report.photos && report.photos.length > 0 && (
        <DashboardCard title={`Photos (${report.photos.length})`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {report.photos.map((photo, idx) => (
              <a
                key={idx}
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
              >
                <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* Incidents */}
      {report.incidents && report.incidents.length > 0 && (
        <DashboardCard title={`Incidents (${report.incidents.length})`}>
          <div className="space-y-2">
            {report.incidents.map((incident: any, idx: number) => (
              <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm font-medium text-red-800">
                  {incident.title || `Incident ${idx + 1}`}
                </div>
                {incident.description && (
                  <div className="text-sm text-red-700 mt-1">{incident.description}</div>
                )}
              </div>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}

