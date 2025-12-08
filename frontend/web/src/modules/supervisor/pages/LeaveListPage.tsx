// frontend/web/src/modules/supervisor/pages/LeaveListPage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import api from "../../../api/client";

interface LeaveRecord {
  id: number;
  user_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  division: string;
}

const LeaveListPage: React.FC = () => {
  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Use supervisor leave requests endpoint
      const response = await api.get("/supervisor/leave-requests");
      const data = response.data || [];
      setRecords(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load leave records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/supervisor/leave-requests/${id}/approve`);
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to approve leave request");
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Reject this leave request?")) return;
    const reason = prompt("Alasan penolakan:");
    if (!reason) return;
    try {
      await api.post(`/supervisor/leave-requests/${id}/reject`, null, {
        params: { reason },
      });
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to reject leave request");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Leave</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          View and approve/reject leave requests from all divisions.
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

      {/* Filters */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          border: `1px solid ${theme.colors.border}`,
          padding: 12,
          boxShadow: theme.shadowCard,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            From date
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{
              borderRadius: 12,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            To date
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{
              borderRadius: 12,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          />
        </div>
        <button
          onClick={load}
          style={{
            padding: "8px 16px",
            borderRadius: theme.radius.pill,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.primary,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Apply
        </button>
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
        ) : records.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.colors.textSoft }}>No leave records.</div>
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
                  <th style={{ padding: "8px", textAlign: "left" }}>Officer</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Start</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>End</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Reason</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Division</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <td style={{ padding: "8px" }}>{r.user_name || `User #${r.id}`}</td>
                    <td style={{ padding: "8px" }}>{r.leave_type}</td>
                    <td style={{ padding: "8px" }}>{new Date(r.start_date).toLocaleDateString()}</td>
                    <td style={{ padding: "8px" }}>{new Date(r.end_date).toLocaleDateString()}</td>
                    <td style={{ padding: "8px", maxWidth: 200 }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.reason}
                      </div>
                    </td>
                    <td style={{ padding: "8px" }}>{r.division || "-"}</td>
                    <td style={{ padding: "8px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: theme.radius.pill,
                          fontSize: 10,
                          backgroundColor:
                            r.status === "approved"
                              ? theme.colors.success + "20"
                              : r.status === "rejected"
                              ? theme.colors.danger + "20"
                              : theme.colors.warning + "20",
                          color:
                            r.status === "approved"
                              ? theme.colors.success
                              : r.status === "rejected"
                              ? theme.colors.danger
                              : theme.colors.warning,
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>
                      {r.status === "pending" ? (
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
                            onClick={() => handleApprove(r.id)}
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
                            onClick={() => handleReject(r.id)}
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

export default LeaveListPage;

