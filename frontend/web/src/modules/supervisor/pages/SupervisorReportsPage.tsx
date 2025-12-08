// frontend/web/src/modules/supervisor/pages/SupervisorReportsPage.tsx

import { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import {
  listReports,
  ReportRecord,
  listSites,
  Site,
} from "../../../api/supervisorApi";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function SupervisorReportsPage() {
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters
  const [dateFrom, setDateFrom] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [division, setDivision] = useState<string>(""); // SECURITY, CLEANING, DRIVER, PARKING
  const [reportType, setReportType] = useState<string>(""); // SECURITY_INCIDENT, SECURITY_DAR, CLEANING_INCIDENT, VEHICLE_INCIDENT
  const [statusFilter, setStatusFilter] = useState<string>(""); // Open, In Review, Closed
  const [search, setSearch] = useState<string>("");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    loadSites();
    loadReports();
  }, []);

  useEffect(() => {
    loadReports();
  }, [dateFrom, dateTo, siteId, division, reportType, statusFilter, page]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {
        date_from: dateFrom,
        date_to: dateTo,
        page,
        limit,
      };
      if (siteId) params.site_id = siteId;
      if (division) params.division = division;
      if (reportType) params.type = reportType;
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const response = await listReports(params);
      // Handle paginated response
      if (response && Array.isArray(response)) {
        setRecords(response);
        setTotal(response.length);
      } else if (response && response.items && Array.isArray(response.items)) {
        setRecords(response.items);
        setTotal(response.total || 0);
      } else {
        setRecords([]);
        setTotal(0);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal memuat data reports");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadReports();
  };

  const getDivisionColor = (div: string) => {
    switch (div.toUpperCase()) {
      case "SECURITY":
        return theme.colors.primary;
      case "CLEANING":
        return theme.colors.success;
      case "DRIVER":
        return theme.colors.warning;
      case "PARKING":
        return theme.colors.warning;
      default:
        return theme.colors.textMuted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "closed":
      case "completed":
        return theme.colors.success;
      case "in_progress":
      case "in review":
        return theme.colors.warning;
      case "open":
      case "new":
        return theme.colors.primary;
      default:
        return theme.colors.textMuted;
    }
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SECURITY_INCIDENT: "Security Incident",
      SECURITY_DAR: "Daily Activity Report",
      CLEANING_INCIDENT: "Cleaning Incident",
      VEHICLE_INCIDENT: "Vehicle Incident",
      INCIDENT: "Incident",
      DAR: "Daily Activity Report",
    };
    return labels[type] || type;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
          Report / Incident Console
        </h1>
        <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
          Unified console for all reports and incidents across all divisions
        </p>
      </div>

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
              Filters & Search
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
              Filter by date, division, type, status, and site
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

        {/* Search */}
        <div style={{ marginBottom: showFilters ? 12 : 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Search title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                fontSize: 13,
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: theme.colors.primary,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Search
            </button>
          </div>
        </div>

        {showFilters && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
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
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
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
                <option value="PARKING">Parking</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              >
                <option value="">All Types</option>
                <option value="SECURITY_INCIDENT">Security Incident</option>
                <option value="SECURITY_DAR">Daily Activity Report</option>
                <option value="CLEANING_INCIDENT">Cleaning Incident</option>
                <option value="VEHICLE_INCIDENT">Vehicle Incident</option>
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
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="closed">Closed</option>
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

      {/* Desktop Table */}
      {loading ? (
        <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 20 }}>
          Loading...
        </div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 20 }}>
          No reports found
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: theme.colors.surface + "80",
                    borderBottom: `1px solid ${theme.colors.borderStrong}`,
                  }}
                >
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Time
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Division
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Type
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Title
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Site
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Reporter
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Status
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={`${r.division}-${r.id}`}
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
                    <td style={{ padding: "8px 12px", color: theme.colors.textMain, whiteSpace: "nowrap" }}>
                      {format(new Date(r.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: theme.radius.pill,
                          backgroundColor: getDivisionColor(r.division) + "20",
                          color: getDivisionColor(r.division),
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {r.division}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: theme.colors.textMain, fontSize: 10 }}>
                      {getReportTypeLabel(r.report_type)}
                    </td>
                    <td style={{ padding: "8px 12px", color: theme.colors.textMain }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{r.title}</div>
                      {r.description && (
                        <div
                          style={{
                            fontSize: 10,
                            color: theme.colors.textMuted,
                            maxWidth: 300,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "8px 12px", color: theme.colors.textMain, fontSize: 10 }}>
                      {r.site_name}
                    </td>
                    <td style={{ padding: "8px 12px", color: theme.colors.textMain, fontSize: 10 }}>
                      {r.created_by_name || "Unknown"}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: theme.radius.pill,
                          backgroundColor: getStatusColor(r.status) + "20",
                          color: getStatusColor(r.status),
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <button
                        onClick={() => {
                          // TODO: Open report detail modal
                          alert(`Report detail for ${r.title}\nDivision: ${r.division}\nType: ${r.report_type}\nStatus: ${r.status}`);
                        }}
                        style={{
                          padding: "4px 12px",
                          fontSize: 10,
                          borderRadius: 4,
                          border: `1px solid ${theme.colors.primary}`,
                          backgroundColor: "transparent",
                          color: theme.colors.primary,
                          cursor: "pointer",
                        }}
                        title="View details, photos, GPS"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {records.map((r) => (
              <div
                key={`${r.division}-${r.id}`}
                style={{
                  borderRadius: theme.radius.card,
                  border: `1px solid ${theme.colors.borderStrong}`,
                  backgroundColor: theme.colors.surface + "80",
                  padding: 12,
                  fontSize: 11,
                  borderLeft: `4px solid ${getDivisionColor(r.division)}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: theme.colors.textMain }}>{r.title}</div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: theme.radius.pill,
                      backgroundColor: getDivisionColor(r.division) + "20",
                      color: getDivisionColor(r.division),
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {r.division}
                  </span>
                </div>
                {r.description && (
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.colors.textMuted,
                      marginBottom: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {r.description.length > 100 ? r.description.substring(0, 100) + "..." : r.description}
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, fontSize: 10 }}>
                  <div>
                    <span style={{ color: theme.colors.textSoft }}>Type: </span>
                    <span style={{ color: theme.colors.textMain }}>{getReportTypeLabel(r.report_type)}</span>
                  </div>
                  <div>
                    <span style={{ color: theme.colors.textSoft }}>Site: </span>
                    <span style={{ color: theme.colors.textMain }}>{r.site_name}</span>
                  </div>
                  <div>
                    <span style={{ color: theme.colors.textSoft }}>Reporter: </span>
                    <span style={{ color: theme.colors.textMain }}>{r.created_by_name || "Unknown"}</span>
                  </div>
                  <div>
                    <span style={{ color: theme.colors.textSoft }}>Time: </span>
                    <span style={{ color: theme.colors.textMain }}>
                      {format(new Date(r.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: theme.radius.pill,
                      backgroundColor: getStatusColor(r.status) + "20",
                      color: getStatusColor(r.status),
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {r.status}
                  </span>
                  <button
                    onClick={() => {
                      alert(`Report detail for ${r.title}`);
                    }}
                    style={{
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
