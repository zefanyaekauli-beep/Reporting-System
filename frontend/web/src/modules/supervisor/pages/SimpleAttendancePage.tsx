// frontend/web/src/modules/supervisor/pages/SimpleAttendancePage.tsx

import React, { useEffect, useState } from "react";
import { listAttendance, AttendanceRecord } from "../../../api/supervisorApi";
import { theme } from "../../shared/components/theme";

const SimpleAttendancePage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [roleType, setRoleType] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {};
      if (from) params.date_from = from;
      if (to) params.date_to = to;
      if (roleType) params.role_type = roleType;

      const data = await listAttendance(params);
      setRecords(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Simple Attendance</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          Simplified view of all clock-in/clock-out records across Security, Cleaning, and Parking divisions.
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
        <div>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            Division
          </label>
          <select
            value={roleType}
            onChange={(e) => setRoleType(e.target.value)}
            style={{
              borderRadius: 12,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          >
            <option value="">All</option>
            <option value="SECURITY">Security</option>
            <option value="CLEANING">Cleaning</option>
            <option value="PARKING">Parking</option>
          </select>
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
          <div style={{ fontSize: 12, color: theme.colors.textSoft }}>No records.</div>
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
                  <th style={{ padding: "8px", textAlign: "left" }}>Site</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Division</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Shift</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>In</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Out</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>OT</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
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
                    <td style={{ padding: "8px" }}>
                      {new Date(r.checkin_time).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "8px" }}>{r.user_name || `User #${r.user_id}`}</td>
                    <td style={{ padding: "8px" }}>{r.site_name}</td>
                    <td style={{ padding: "8px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: theme.radius.pill,
                          fontSize: 10,
                          backgroundColor:
                            r.role_type === "SECURITY"
                              ? theme.colors.primary + "20"
                              : r.role_type === "CLEANING"
                              ? theme.colors.success + "20"
                              : theme.colors.warning + "20",
                          color:
                            r.role_type === "SECURITY"
                              ? theme.colors.primary
                              : r.role_type === "CLEANING"
                              ? theme.colors.success
                              : theme.colors.warning,
                        }}
                      >
                        {r.role_type}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>{r.shift || "-"}</td>
                    <td style={{ padding: "8px" }}>
                      {new Date(r.checkin_time).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "8px" }}>
                      {r.checkout_time ? new Date(r.checkout_time).toLocaleTimeString() : "-"}
                    </td>
                    <td style={{ padding: "8px" }}>
                      {r.is_overtime ? (
                        <span style={{ color: theme.colors.warning }}>Yes</span>
                      ) : (
                        "No"
                      )}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: theme.radius.pill,
                          fontSize: 10,
                          backgroundColor:
                            r.status === "COMPLETED"
                              ? theme.colors.success + "20"
                              : theme.colors.warning + "20",
                          color:
                            r.status === "COMPLETED" ? theme.colors.success : theme.colors.warning,
                        }}
                      >
                        {r.status}
                      </span>
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

export default SimpleAttendancePage;

