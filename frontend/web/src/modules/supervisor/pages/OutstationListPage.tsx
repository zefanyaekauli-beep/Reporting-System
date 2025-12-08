// frontend/web/src/modules/supervisor/pages/OutstationListPage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";

interface OutstationRecord {
  id: number;
  officer_name: string;
  site_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "completed";
}

const OutstationListPage: React.FC = () => {
  const [records, setRecords] = useState<OutstationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // TODO: Connect to real API endpoint
      // const data = await getOutstationRecords();
      // setRecords(data);
      setRecords([]); // Placeholder
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load outstation records");
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
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Outstation</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          Manage outstation assignments and travel records for officers across all divisions.
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
          <div style={{ fontSize: 12, color: theme.colors.textSoft }}>
            No outstation records. API endpoint not yet implemented.
          </div>
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
                  <th style={{ padding: "8px", textAlign: "left" }}>Site</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Destination</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Start Date</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>End Date</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Purpose</th>
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
                    <td style={{ padding: "8px" }}>{r.officer_name}</td>
                    <td style={{ padding: "8px" }}>{r.site_name}</td>
                    <td style={{ padding: "8px" }}>{r.destination}</td>
                    <td style={{ padding: "8px" }}>{new Date(r.start_date).toLocaleDateString()}</td>
                    <td style={{ padding: "8px" }}>{new Date(r.end_date).toLocaleDateString()}</td>
                    <td style={{ padding: "8px" }}>{r.purpose}</td>
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

export default OutstationListPage;

