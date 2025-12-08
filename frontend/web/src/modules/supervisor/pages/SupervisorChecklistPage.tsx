// frontend/web/src/modules/supervisor/pages/SupervisorChecklistPage.tsx

import { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import {
  listChecklists,
  ChecklistTask,
  listSites,
  Site,
} from "../../../api/supervisorApi";

export function SupervisorChecklistPage() {
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [division, setDivision] = useState<string>(""); // SECURITY, CLEANING, DRIVER (empty = all)
  const [contextType, setContextType] = useState<string>(""); // SECURITY_PATROL, CLEANING_ZONE, DRIVER_PRE_TRIP, DRIVER_POST_TRIP
  const [statusFilter, setStatusFilter] = useState<string>(""); // OPEN, COMPLETED, INCOMPLETE
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    loadSites();
    loadChecklists();
  }, []);

  useEffect(() => {
    loadChecklists();
  }, [selectedDate, siteId, division, contextType, statusFilter, page]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadChecklists = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {
        date: selectedDate,
        page,
        limit,
      };
      if (siteId) params.site_id = siteId;
      if (division) params.division = division;
      if (contextType) params.context_type = contextType;
      if (statusFilter) params.status = statusFilter;

      const response = await listChecklists(params);
      setTasks(response.items || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal memuat data checklist");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getContextTypeLabel = (contextType: string | null | undefined) => {
    if (!contextType) return "-";
    const labels: Record<string, string> = {
      SECURITY_PATROL: "Patrol",
      CLEANING_ZONE: "Cleaning Zone",
      DRIVER_PRE_TRIP: "Pre-trip",
      DRIVER_POST_TRIP: "Post-trip",
    };
    return labels[contextType] || contextType;
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return theme.colors.success;
      case "OPEN":
        return theme.colors.warning;
      case "INCOMPLETE":
        return theme.colors.danger;
      default:
        return theme.colors.textMuted;
    }
  };

  const getDivisionColor = (division: string) => {
    switch (division) {
      case "SECURITY":
        return theme.colors.primary;
      case "CLEANING":
        return theme.colors.success;
      case "DRIVER":
        return theme.colors.warning;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      {/* Filters */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          padding: 12,
          marginBottom: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: showFilters ? 12 : 0,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain }}>
              Task / Checklist Console
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
              Unified console for all divisions (Security, Cleaning, Driver)
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: "4px 12px",
              fontSize: 12,
              borderRadius: theme.radius.pill,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMain,
              cursor: "pointer",
            }}
          >
            {showFilters ? "Hide" : "Show"} Filters
          </button>
        </div>

        {showFilters && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Site
              </label>
              <select
                value={siteId || ""}
                onChange={(e) => setSiteId(e.target.value ? Number(e.target.value) : undefined)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              >
                <option value="">All Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              >
                <option value="">All Divisions</option>
                <option value="SECURITY">Security</option>
                <option value="CLEANING">Cleaning</option>
                <option value="DRIVER">Driver</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Context Type
              </label>
              <select
                value={contextType}
                onChange={(e) => setContextType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              >
                <option value="">All Contexts</option>
                <option value="SECURITY_PATROL">Patrol</option>
                <option value="CLEANING_ZONE">Cleaning Zone</option>
                <option value="DRIVER_PRE_TRIP">Pre-trip</option>
                <option value="DRIVER_POST_TRIP">Post-trip</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              >
                <option value="">All Status</option>
                <option value="OPEN">Not Started</option>
                <option value="COMPLETED">Completed</option>
                <option value="INCOMPLETE">Incomplete</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: theme.colors.danger + "20",
            border: `1px solid ${theme.colors.danger}`,
            color: theme.colors.danger,
            fontSize: 13,
            borderRadius: theme.radius.card,
            padding: "10px 12px",
            marginBottom: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Desktop table */}
      {loading ? (
        <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 20 }}>
          Loading...
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 20 }}>
          No checklist tasks found
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: theme.colors.surface + "80",
                    borderBottom: `1px solid ${theme.colors.borderStrong}`,
                  }}
                >
                  <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Template Name
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Division
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Context
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Site / Zone / Vehicle
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Assigned User
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                    Completion %
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                    Evidence
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Status
                  </th>
                  <th style={{ padding: "4px 8px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.borderStrong}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.surface + "60";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ padding: "4px 8px", color: theme.colors.textMain }}>
                      {task.template_name || "Untitled"}
                    </td>
                    <td style={{ padding: "4px 8px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: theme.radius.pill,
                          backgroundColor: getDivisionColor(task.division) + "20",
                          color: getDivisionColor(task.division),
                        }}
                      >
                        {task.division}
                      </span>
                    </td>
                    <td style={{ padding: "4px 8px", color: theme.colors.textMain, fontSize: 10 }}>
                      {getContextTypeLabel(task.context_type)}
                    </td>
                    <td style={{ padding: "4px 8px", color: theme.colors.textMain }}>
                      <div style={{ fontSize: 10 }}>{task.site_name}</div>
                      {task.zone_or_vehicle && (
                        <div style={{ fontSize: 9, color: theme.colors.textMuted }}>
                          {task.zone_or_vehicle}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "4px 8px", color: theme.colors.textMain, fontSize: 10 }}>
                      {task.assigned_user_name || "-"}
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            task.completion_percent === 100
                              ? theme.colors.success
                              : task.completion_percent > 50
                              ? theme.colors.warning
                              : theme.colors.danger,
                        }}
                      >
                        {task.completion_percent.toFixed(0)}%
                      </div>
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      {task.evidence_available ? (
                        <span style={{ color: theme.colors.success, fontSize: 12 }}>✓ Yes</span>
                      ) : (
                        <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>✗ No</span>
                      )}
                    </td>
                    <td style={{ padding: "4px 8px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: theme.radius.pill,
                          backgroundColor: getStatusColor(task.status) + "20",
                          color: getStatusColor(task.status),
                        }}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <button
                        onClick={() => {
                          // TODO: Open checklist detail modal
                          alert(`Checklist detail for ${task.template_name}\nDivision: ${task.division}\nCompletion: ${task.completion_percent}%`);
                        }}
                        style={{
                          padding: "4px 8px",
                          fontSize: 10,
                          borderRadius: 4,
                          border: `1px solid ${theme.colors.primary}`,
                          backgroundColor: "transparent",
                          color: theme.colors.primary,
                          cursor: "pointer",
                        }}
                        title="View details (tasks, answers, photos)"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  borderRadius: theme.radius.card,
                  border: `1px solid ${theme.colors.borderStrong}`,
                  backgroundColor: theme.colors.surface + "80",
                  padding: 8,
                  fontSize: 11,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, color: theme.colors.textMain }}>
                    {task.template_name || "Untitled"}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: theme.radius.pill,
                      backgroundColor: getDivisionColor(task.division) + "20",
                      color: getDivisionColor(task.division),
                    }}
                  >
                    {task.division}
                  </span>
                </div>
                <div style={{ color: theme.colors.textMuted, marginBottom: 2 }}>
                  {task.site_name} {task.zone_or_vehicle && `• ${task.zone_or_vehicle}`}
                </div>
                <div style={{ marginTop: 4, marginBottom: 2 }}>
                  <span style={{ color: theme.colors.textSoft }}>User: </span>
                  <span style={{ color: theme.colors.textMain }}>{task.assigned_user_name || "-"}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 10 }}>
                  <div>
                    <span style={{ color: theme.colors.textSoft }}>Completion: </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          task.completion_percent === 100
                            ? theme.colors.success
                            : task.completion_percent > 50
                            ? theme.colors.warning
                            : theme.colors.danger,
                      }}
                    >
                      {task.completion_percent.toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: theme.colors.textSoft }}>Evidence: </span>
                    {task.evidence_available ? (
                      <span style={{ color: theme.colors.success }}>✓ Yes</span>
                    ) : (
                      <span style={{ color: theme.colors.textMuted }}>✗ No</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: theme.colors.textSoft }}>Status: </span>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: theme.radius.pill,
                        backgroundColor: getStatusColor(task.status) + "20",
                        color: getStatusColor(task.status),
                      }}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => {
                      alert(`Checklist detail for ${task.template_name}`);
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 12px",
                      fontSize: 11,
                      borderRadius: 4,
                      border: `1px solid ${theme.colors.primary}`,
                      backgroundColor: "transparent",
                      color: theme.colors.primary,
                      cursor: "pointer",
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  borderRadius: 4,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: page === 1 ? theme.colors.surface : "transparent",
                  color: page === 1 ? theme.colors.textMuted : theme.colors.textMain,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
                disabled={page >= Math.ceil(total / limit)}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  borderRadius: 4,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: page >= Math.ceil(total / limit) ? theme.colors.surface : "transparent",
                  color: page >= Math.ceil(total / limit) ? theme.colors.textMuted : theme.colors.textMain,
                  cursor: page >= Math.ceil(total / limit) ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

