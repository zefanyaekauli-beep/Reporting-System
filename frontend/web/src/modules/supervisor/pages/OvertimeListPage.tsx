// frontend/web/src/modules/supervisor/pages/OvertimeListPage.tsx

import React, { useEffect, useState } from "react";
import { listAttendance, AttendanceRecord } from "../../../api/supervisorApi";
import { theme } from "../../shared/components/theme";

const OvertimeListPage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {};
      if (from) params.date_from = from;
      if (to) params.date_to = to;

      const data = await listAttendance(params);
      // Filter only overtime records
      const overtimeRecords = data.filter((r) => r.is_overtime === true);
      setRecords(overtimeRecords);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load overtime records");
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
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Overtime</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          View and manage overtime records across all divisions.
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
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Summary</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.warning }}>
          {records.length} Overtime Records
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
        ) : records.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.colors.textSoft }}>No overtime records.</div>
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
                  <th style={{ padding: "8px", textAlign: "left" }}>Clock In</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Clock Out</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const checkIn = new Date(r.checkin_time);
                  const checkOut = r.checkout_time ? new Date(r.checkout_time) : null;
                  const duration = checkOut
                    ? Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60))
                    : null;

                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      <td style={{ padding: "8px" }}>{checkIn.toLocaleDateString()}</td>
                      <td style={{ padding: "8px" }}>{r.user_name || `User #${r.user_id}`}</td>
                      <td style={{ padding: "8px" }}>{r.site_name}</td>
                      <td style={{ padding: "8px" }}>{r.role_type}</td>
                      <td style={{ padding: "8px" }}>{checkIn.toLocaleTimeString()}</td>
                      <td style={{ padding: "8px" }}>
                        {checkOut ? checkOut.toLocaleTimeString() : "-"}
                      </td>
                      <td style={{ padding: "8px" }}>
                        {duration !== null ? `${duration} hours` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OvertimeListPage;

