// frontend/web/src/modules/supervisor/pages/AttendanceCorrectionPage.tsx

import React, { useEffect, useState } from "react";
import {
  CorrectionRequest,
  getCorrections,
  approveCorrection,
  rejectCorrection,
} from "../../../api/supervisorApi";
import { theme } from "../../shared/components/theme";

const AttendanceCorrectionPage: React.FC = () => {
  const [items, setItems] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRejectId, setSelectedRejectId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getCorrections();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load correction requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await approveCorrection(id);
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to approve correction");
    }
  };

  const handleReject = async () => {
    if (!selectedRejectId) return;
    if (!rejectReason.trim()) return;
    try {
      await rejectCorrection(selectedRejectId, rejectReason);
      setSelectedRejectId(null);
      setRejectReason("");
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to reject correction");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Attendance Correction</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          Approve or reject late reports, missing clock-in/out corrections, and overtime adjustments across all divisions.
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

      {/* Reject modal inline */}
      {selectedRejectId && (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            border: `1px solid ${theme.colors.warning}`,
            padding: 12,
            boxShadow: theme.shadowCard,
          }}
        >
          <div style={{ fontSize: 11, color: theme.colors.warning, marginBottom: 8 }}>
            Reject correction #{selectedRejectId}
          </div>
          <textarea
            style={{
              width: "100%",
              borderRadius: 12,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 12,
              color: theme.colors.textMain,
              resize: "vertical",
            }}
            rows={3}
            placeholder="Reason for rejection…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              style={{
                padding: "4px 12px",
                borderRadius: theme.radius.pill,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMain,
                fontSize: 12,
                cursor: "pointer",
              }}
              onClick={() => {
                setSelectedRejectId(null);
                setRejectReason("");
              }}
            >
              Cancel
            </button>
            <button
              style={{
                padding: "4px 12px",
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.danger,
                color: "#fff",
                fontSize: 12,
                border: "none",
                cursor: "pointer",
              }}
              onClick={handleReject}
            >
              Confirm Reject
            </button>
          </div>
        </div>
      )}

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
          <div style={{ fontSize: 12, color: theme.colors.textSoft }}>No correction requests.</div>
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
                  <th style={{ padding: "8px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Officer</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Requested Time</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Reason</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Evidence</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <td style={{ padding: "8px" }}>
                      {new Date(c.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "8px" }}>{c.officer_name}</td>
                    <td style={{ padding: "8px" }}>{c.type}</td>
                    <td style={{ padding: "8px" }}>
                      {c.requested_clock_in &&
                        `In: ${new Date(c.requested_clock_in).toLocaleTimeString()}`}
                      {c.requested_clock_out && (
                        <>
                          <br />
                          Out: {new Date(c.requested_clock_out).toLocaleTimeString()}
                        </>
                      )}
                    </td>
                    <td style={{ padding: "8px", maxWidth: 200 }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.reason}
                      </div>
                    </td>
                    <td style={{ padding: "8px" }}>
                      {c.evidence_url ? (
                        <a
                          href={c.evidence_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: theme.colors.primary, textDecoration: "underline" }}
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={{ padding: "8px" }}>{c.status}</td>
                    <td style={{ padding: "8px" }}>
                      {c.status === "pending" ? (
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
                            onClick={() => handleApprove(c.id)}
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
                            onClick={() => {
                              setSelectedRejectId(c.id);
                              setRejectReason("");
                            }}
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

export default AttendanceCorrectionPage;

