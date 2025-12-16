// frontend/web/src/modules/supervisor/pages/AdminAuditLogsPage.tsx

import React, { useEffect, useState } from "react";
import { getAuditLogs, AuditLog } from "../../../api/adminApi";
import { theme } from "../../shared/components/theme";

const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filters, setFilters] = useState({
    user_id: "",
    resource_type: "",
    action: "",
    from_date: "",
    to_date: "",
    limit: 100,
  });

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {};
      if (filters.user_id) params.user_id = parseInt(filters.user_id);
      if (filters.resource_type) params.resource_type = filters.resource_type;
      if (filters.action) params.action = filters.action;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;
      if (filters.limit) params.limit = filters.limit;

      const data = await getAuditLogs(params);
      setLogs(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    load();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("id-ID");
    } catch {
      return dateString;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: "100%",
        paddingBottom: "2rem",
      }}
      className="overflow-y-auto"
    >
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Audit Logs</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          View system activity logs and user actions for security and compliance.
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          padding: 12,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 8,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>User ID</label>
          <input
            type="number"
            value={filters.user_id}
            onChange={(e) => handleFilterChange("user_id", e.target.value)}
            style={{
              width: "100%",
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Resource Type</label>
          <input
            type="text"
            value={filters.resource_type}
            onChange={(e) => handleFilterChange("resource_type", e.target.value)}
            placeholder="e.g., REPORT, USER"
            style={{
              width: "100%",
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Action</label>
          <input
            type="text"
            value={filters.action}
            onChange={(e) => handleFilterChange("action", e.target.value)}
            placeholder="e.g., CREATE, UPDATE"
            style={{
              width: "100%",
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>From Date</label>
          <input
            type="date"
            value={filters.from_date}
            onChange={(e) => handleFilterChange("from_date", e.target.value)}
            style={{
              width: "100%",
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>To Date</label>
          <input
            type="date"
            value={filters.to_date}
            onChange={(e) => handleFilterChange("to_date", e.target.value)}
            style={{
              width: "100%",
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Limit</label>
          <input
            type="number"
            value={filters.limit}
            onChange={(e) => handleFilterChange("limit", e.target.value)}
            style={{
              width: "100%",
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      <button
        onClick={handleApplyFilters}
        style={{
          padding: "8px 16px",
          fontSize: 12,
          backgroundColor: theme.colors.primary,
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          alignSelf: "flex-start",
        }}
      >
        Apply Filters
      </button>

      {errorMsg && (
        <div
          style={{
            padding: 8,
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
          Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
          No audit logs found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: 12,
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                display: "grid",
                gridTemplateColumns: "200px 150px 150px 1fr 200px",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted }}>User</div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{log.user_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted }}>Action</div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{log.action}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted }}>Resource</div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{log.resource_type}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted }}>Details</div>
                <div style={{ fontSize: 11 }}>{log.details || "-"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted }}>Time</div>
                <div style={{ fontSize: 11 }}>{formatDate(log.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;

