// frontend/web/src/modules/security/pages/LeaveRequestListPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import api from "../../../api/client";

interface LeaveRequest {
  id: number;
  request_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  rejection_reason: string | null;
}

export function LeaveRequestListPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== "all") {
        params.status = filterStatus;
      }
      const { data } = await api.get("/security/leave-requests", { params });
      setRequests(data);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "approved") return theme.colors.success;
    if (status === "rejected") return theme.colors.danger;
    return theme.colors.warning;
  };

  return (
    <MobileLayout title="Leave Requests">
      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: `1px solid ${theme.colors.border}`,
            fontSize: 13,
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* New Request Button */}
      <button
        onClick={() => navigate("/security/leave-requests/new")}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 9999,
          border: "none",
          backgroundColor: theme.colors.primary,
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        + New Leave Request
      </button>

      {/* Requests List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}>Loading...</div>
      ) : requests.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: theme.colors.textMuted,
          }}
        >
          No requests found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 12,
                boxShadow: theme.shadowSoft,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: 4,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {request.request_type.replace("_", " ").toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: getStatusColor(request.status),
                  }}
                >
                  {request.status.toUpperCase()}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  marginBottom: 4,
                }}
              >
                {new Date(request.start_date).toLocaleDateString()} -{" "}
                {new Date(request.end_date).toLocaleDateString()}
              </div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                {request.reason}
              </div>
              {request.rejection_reason && (
                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.danger,
                    marginTop: 4,
                    padding: 8,
                    backgroundColor: "#FEE2E2",
                    borderRadius: 6,
                  }}
                >
                  Rejection: {request.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </MobileLayout>
  );
}

