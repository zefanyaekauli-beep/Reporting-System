// frontend/web/src/modules/supervisor/pages/Reporting/Visitors/VisitorDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface Visitor {
  id: number;
  site_id: number;
  site_name?: string;
  name: string;
  company?: string;
  id_card_number?: string;
  id_card_type?: string;
  phone?: string;
  email?: string;
  purpose?: string;
  category?: string;
  visit_date: string;
  check_in_time?: string;
  check_out_time?: string;
  is_checked_in: boolean;
  host_user_id?: number;
  host_name?: string;
  status: string;
  badge_number?: string;
  photo_path?: string;
  id_card_photo_path?: string;
  expected_duration_minutes?: number;
  notes?: string;
  created_at: string;
}

export function VisitorDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadVisitor();
    }
  }, [id]);

  const loadVisitor = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/visitors/${id}`);
      setVisitor(response.data);
    } catch (err: any) {
      console.error("Failed to load visitor:", err);
      setError(err.response?.data?.detail || "Failed to load visitor");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.post(`/visitors/${id}/check-in`);
      await loadVisitor();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to check in visitor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.post(`/visitors/${id}/check-out`);
      await loadVisitor();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to check out visitor");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      REGISTERED: "bg-gray-100 text-gray-800",
      CHECKED_IN: "bg-blue-100 text-blue-800",
      CHECKED_OUT: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const getDuration = () => {
    if (!visitor?.check_in_time || !visitor?.check_out_time) return null;
    const start = new Date(visitor.check_in_time).getTime();
    const end = new Date(visitor.check_out_time).getTime();
    const minutes = Math.floor((end - start) / 60000);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-gray-500">Loading visitor details...</div>
      </div>
    );
  }

  if (error || !visitor) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || "Visitor not found"}
        </div>
        <button
          onClick={() => navigate("/supervisor/reporting/visitors")}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back to Visitors
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">Visitor Details</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/supervisor/reporting/visitors/${id}/edit`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Edit
          </button>
          <button
            onClick={() => navigate("/supervisor/reporting/visitors")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard>
          <div className="text-sm text-gray-600">Status</div>
          <div className="mt-2">{getStatusBadge(visitor.status)}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Badge Number</div>
          <div className="text-lg font-bold text-[#002B4B]">
            {visitor.badge_number || "N/A"}
          </div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Visit Date</div>
          <div className="text-lg font-bold text-[#002B4B]">
            {format(new Date(visitor.visit_date), "MMM dd, yyyy")}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Visitor Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Name</div>
            <div className="text-base font-medium">{visitor.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Company/Organization</div>
            <div className="text-base font-medium">{visitor.company || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">ID Card Type</div>
            <div className="text-base font-medium">{visitor.id_card_type || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">ID Card Number</div>
            <div className="text-base font-medium">{visitor.id_card_number || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Phone</div>
            <div className="text-base font-medium">{visitor.phone || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Email</div>
            <div className="text-base font-medium">{visitor.email || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Category</div>
            <div className="text-base font-medium">{visitor.category || "-"}</div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Visit Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Purpose</div>
            <div className="text-base font-medium">{visitor.purpose || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Host</div>
            <div className="text-base font-medium">{visitor.host_name || "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Expected Duration</div>
            <div className="text-base font-medium">
              {visitor.expected_duration_minutes
                ? `${visitor.expected_duration_minutes} minutes`
                : "-"}
            </div>
          </div>
          {visitor.check_in_time && (
            <div>
              <div className="text-sm text-gray-600">Check-in Time</div>
              <div className="text-base font-medium">
                {format(new Date(visitor.check_in_time), "MMM dd, yyyy HH:mm")}
              </div>
            </div>
          )}
          {visitor.check_out_time && (
            <div>
              <div className="text-sm text-gray-600">Check-out Time</div>
              <div className="text-base font-medium">
                {format(new Date(visitor.check_out_time), "MMM dd, yyyy HH:mm")}
              </div>
            </div>
          )}
          {getDuration() && (
            <div>
              <div className="text-sm text-gray-600">Actual Duration</div>
              <div className="text-base font-medium">{getDuration()}</div>
            </div>
          )}
        </div>
        {visitor.notes && (
          <div className="mt-4">
            <div className="text-sm text-gray-600">Notes</div>
            <div className="text-base font-medium mt-1">{visitor.notes}</div>
          </div>
        )}
      </DashboardCard>

      {(visitor.photo_path || visitor.id_card_photo_path) && (
        <DashboardCard title="Photos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visitor.photo_path && (
              <div>
                <div className="text-sm text-gray-600 mb-2">Visitor Photo</div>
                <img
                  src={visitor.photo_path}
                  alt="Visitor"
                  className="w-full max-w-md rounded-lg"
                />
              </div>
            )}
            {visitor.id_card_photo_path && (
              <div>
                <div className="text-sm text-gray-600 mb-2">ID Card Photo</div>
                <img
                  src={visitor.id_card_photo_path}
                  alt="ID Card"
                  className="w-full max-w-md rounded-lg"
                />
              </div>
            )}
          </div>
        </DashboardCard>
      )}

      <DashboardCard title="Actions">
        <div className="flex gap-4">
          {!visitor.is_checked_in && visitor.status === "REGISTERED" && (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Check In"}
            </button>
          )}
          {visitor.is_checked_in && visitor.status === "CHECKED_IN" && (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Check Out"}
            </button>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}

