// frontend/web/src/modules/supervisor/pages/ApprovalListPage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import api from "../../../api/client";

interface ApprovalItem {
  id: number;
  type: "leave" | "overtime" | "shift_exchange" | "attendance_correction" | "outstation";
  requester_name: string;
  title: string;
  description: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  division: string;
}

const ApprovalListPage: React.FC = () => {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterType, setFilterType] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Aggregate approvals from different sources
      const approvals: ApprovalItem[] = [];

      // Get leave requests
      try {
        const leaveRes = await api.get("/supervisor/leave-requests");
        const leaveData = leaveRes.data || [];
        leaveData.forEach((item: any) => {
          if (item.status === "pending") {
            approvals.push({
              id: item.id,
              type: "leave",
              requester_name: item.user_name || `User #${item.id}`,
              title: `${item.leave_type} Leave`,
              description: item.reason,
              created_at: item.start_date || new Date().toISOString(),
              status: item.status,
              division: item.division || "security",
            });
          }
        });
      } catch (err) {
        // Ignore if endpoint doesn't exist
      }

      // Get attendance corrections
      try {
        const correctionRes = await api.get("/supervisor/attendance/corrections");
        const correctionData = correctionRes.data || [];
        correctionData.forEach((item: any) => {
          if (item.status === "pending") {
            approvals.push({
              id: item.id,
              type: "attendance_correction",
              requester_name: item.officer_name,
              title: `Attendance Correction: ${item.type}`,
              description: item.reason,
              created_at: item.date || new Date().toISOString(),
              status: item.status,
              division: "all",
            });
          }
        });
      } catch (err) {
        // Ignore if endpoint doesn't exist
      }

      // Filter by type if selected
      const filtered = filterType
        ? approvals.filter((a) => a.type === filterType)
        : approvals;

      setItems(filtered);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterType]);

  const handleApprove = async (item: ApprovalItem) => {
    try {
      if (item.type === "leave") {
        await api.post(`/supervisor/leave-requests/${item.id}/approve`);
      } else if (item.type === "attendance_correction") {
        await api.post(`/supervisor/attendance/corrections/${item.id}/approve`);
      }
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to approve");
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    if (!confirm("Reject this request?")) return;
    const reason = prompt("Alasan penolakan:") || "Rejected by supervisor";
    try {
      if (item.type === "leave") {
        await api.post(`/supervisor/leave-requests/${item.id}/reject`, null, {
          params: { reason },
        });
      } else if (item.type === "attendance_correction") {
        await api.post(`/supervisor/attendance/corrections/${item.id}/reject`, null, {
          params: { reason },
        });
      }
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to reject");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Approval</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          Centralized approval queue for leave requests, overtime, shift exchanges, attendance corrections, and outstation assignments.
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: theme.colors.danger + "20",
            border: `1px solid ${theme.colors.danger}`,
            color: theme.colors.danger,
            fontSize: 12,
            borderRadius: theme.radius.card,
            padding: "10px 12px",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Filter */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          border: `1px solid ${theme.colors.border}`,
          padding: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
          Filter by Type
        </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            borderRadius: 12,
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            padding: "8px 12px",
            fontSize: 13,
            color: theme.colors.textMain,
          }}
        >
          <option value="">All Types</option>
          <option value="leave">Leave</option>
          <option value="overtime">Overtime</option>
          <option value="shift_exchange">Shift Exchange</option>
          <option value="attendance_correction">Attendance Correction</option>
          <option value="outstation">Outstation</option>
        </select>
      </div>

      {/* Summary */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          border: `1px solid ${theme.colors.border}`,
          padding: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Pending Approvals</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.warning }}>
          {items.filter((i) => i.status === "pending").length}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          border: `1px solid ${theme.colors.border}`,
          padding: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        {loading ? (
          <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.colors.textSoft }}>No pending approvals.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.background,
                  }}
                >
                  <th style={{ padding: "8px", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Requester</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Title</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Description</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Division</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <td style={{ padding: "8px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: theme.radius.pill,
                          fontSize: 10,
                          backgroundColor: theme.colors.primary + "20",
                          color: theme.colors.primary,
                        }}
                      >
                        {item.type.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>{item.requester_name}</td>
                    <td style={{ padding: "8px" }}>{item.title}</td>
                    <td style={{ padding: "8px", maxWidth: 200 }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.description}
                      </div>
                    </td>
                    <td style={{ padding: "8px" }}>{item.division}</td>
                    <td style={{ padding: "8px" }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: theme.radius.pill,
                          fontSize: 10,
                          backgroundColor:
                            item.status === "approved"
                              ? theme.colors.success + "20"
                              : item.status === "rejected"
                              ? theme.colors.danger + "20"
                              : theme.colors.warning + "20",
                          color:
                            item.status === "approved"
                              ? theme.colors.success
                              : item.status === "rejected"
                              ? theme.colors.danger
                              : theme.colors.warning,
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>
                      {item.status === "pending" ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            style={{
                              padding: "4px 8px",
                              borderRadius: theme.radius.pill,
                              backgroundColor: theme.colors.success,
                              color: "#fff",
                              fontSize: 10,
                              border: "none",
                              cursor: "pointer",
                            }}
                            onClick={() => handleApprove(item)}
                          >
                            Approve
                          </button>
                          <button
                            style={{
                              padding: "4px 8px",
                              borderRadius: theme.radius.pill,
                              backgroundColor: theme.colors.danger,
                              color: "#fff",
                              fontSize: 10,
                              border: "none",
                              cursor: "pointer",
                            }}
                            onClick={() => handleReject(item)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalListPage;

