// frontend/web/src/modules/security/pages/SecurityIntelligenceReportListPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../../shared/components/Toast";
import { useSite } from "../../shared/contexts/SiteContext";
import api from "../../../api/client";

interface IntelligenceReport {
  id: number;
  site_id: number;
  site_name?: string;
  report_type: string;
  title: string;
  description?: string | null;
  severity?: string | null;
  location_text?: string | null;
  status?: string | null;
  created_at: string;
  user_name?: string;
  report_attachments?: Array<{
    id: number;
    file_path: string;
    file_type: string;
  }>;
}

type Level = "low" | "medium" | "high" | "critical" | "all";
type Period = "year" | "month" | "week" | "today";

export function SecurityIntelligenceReportListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { selectedSite, sites } = useSite();

  const [siteId, setSiteId] = useState<number | null>(
    selectedSite?.id || (sites.length > 0 ? sites[0].id : null)
  );

  const [level, setLevel] = useState<Level>("all");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("year");
  const [reports, setReports] = useState<IntelligenceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  const loadReports = async (resetPage = false) => {
    if (!siteId) return;

    const currentPage = resetPage ? 1 : page;
    setLoading(true);

    try {
      // Calculate date range based on period
      const now = new Date();
      const start = new Date();

      if (period === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        const day = start.getDay();
        const diff = (day + 6) % 7; // last Monday
        start.setDate(start.getDate() - diff);
        start.setHours(0, 0, 0, 0);
      } else if (period === "month") {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      } else if (period === "year") {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
      }

      const params: any = {
        site_id: siteId,
        report_type: "INTELLIGENCE",
        page: currentPage,
        limit: 20,
        date_from: start.toISOString().split("T")[0],
        date_to: now.toISOString().split("T")[0],
      };

      if (level !== "all") {
        params.severity = level;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get("/security/reports", { params });
      const data = response.data;

      // Handle paginated response
      const items = data?.items || (Array.isArray(data) ? data : []);
      const totalCount = data?.total || items.length;
      const hasNext = data?.has_next !== false && items.length === 20;

      if (resetPage) {
        setReports(items);
        setPage(2);
      } else {
        setReports((prev) => [...prev, ...items]);
        setPage((prev) => prev + 1);
      }

      setTotal(totalCount);
      setHasMore(hasNext);
    } catch (err: any) {
      console.error("Failed to load intelligence reports:", err);
      showToast("Gagal memuat laporan intelligent", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setReports([]);
    loadReports(true);
  }, [siteId, level, period, search]);

  const handleSearch = () => {
    setPage(1);
    setReports([]);
    loadReports(true);
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const levelOptions: { value: Level; label: string; color: string }[] = [
    { value: "all", label: "Semua", color: theme.colors.textMain },
    { value: "low", label: "Rendah", color: theme.colors.success },
    { value: "medium", label: "Sedang", color: theme.colors.warning },
    { value: "high", label: "Tinggi", color: "#f59e0b" },
    { value: "critical", label: "Kritis", color: theme.colors.danger },
  ];

  const periodOptions: { value: Period; label: string }[] = [
    { value: "year", label: "Tahun ini" },
    { value: "month", label: "Bulan ini" },
    { value: "week", label: "Minggu ini" },
    { value: "today", label: "Hari ini" },
  ];

  const severityColor = (sev?: string | null) => {
    if (sev === "critical") return theme.colors.danger;
    if (sev === "high") return "#f59e0b";
    if (sev === "medium") return theme.colors.warning;
    if (sev === "low") return theme.colors.success;
    return theme.colors.textSoft;
  };

  const getStatusColor = (status?: string | null) => {
    if (status === "aman" || status?.includes("aman")) return theme.colors.success;
    if (status === "waspada" || status?.includes("waspada")) return theme.colors.warning;
    if (status === "darurat" || status?.includes("darurat")) return theme.colors.danger;
    return theme.colors.textSoft;
  };

  const getStatusLabel = (status?: string | null) => {
    if (!status) return "-";
    if (status.includes("aman")) return "Aman dan Terkendali";
    if (status.includes("waspada")) return "Waspada";
    if (status.includes("darurat")) return "Darurat";
    return status;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
          Laporan Intelligent
        </h1>
        <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
          Laporan intelijen berbasis situasional untuk memantau perkembangan kondisi wilayah
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          padding: 16,
          marginBottom: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: showFilters ? 16 : 0,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain }}>
              Filters & Search
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
              Filter by level, periode, site, dan search
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/supervisor/intelligence-reports/new")}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                borderRadius: theme.radius.pill,
                border: "none",
                backgroundColor: theme.colors.primary,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              + Add Data
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: "6px 12px",
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
        </div>

        {/* Search */}
        <div style={{ marginBottom: showFilters ? 16 : 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Cari laporan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: "10px 20px",
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
            {/* Site Selector */}
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Site
              </label>
              <select
                value={siteId || ""}
                onChange={(e) => setSiteId(e.target.value ? Number(e.target.value) : null)}
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

            {/* Level Filter */}
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as Level)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              >
                {levelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Filter */}
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Periode
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              >
                {periodOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      {loading && reports.length === 0 ? (
        <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 40 }}>
          Memuat laporan...
        </div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 40 }}>
          Tidak ada laporan intelligent ditemukan
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: theme.colors.surface + "80",
                    borderBottom: `2px solid ${theme.colors.borderStrong}`,
                  }}
                >
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Tanggal & Waktu
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Ringkasan Situasi
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                    Lokasi
                  </th>
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                    Level
                  </th>
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                    Status
                  </th>
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                    Foto
                  </th>
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, idx) => {
                  const photoCount = r.report_attachments?.length || 0;
                  const isExpanded = expandedIds.has(r.id);
                  const descriptionPreview = r.description
                    ? r.description.length > 100
                      ? r.description.substring(0, 100) + "..."
                      : r.description
                    : "-";

                  return (
                    <tr
                      key={r.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? theme.colors.surface : "#FFFFFF",
                        borderBottom: `1px solid ${theme.colors.border}`,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.background;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = idx % 2 === 0 ? theme.colors.surface : "#FFFFFF";
                      }}
                    >
                      <td style={{ padding: "12px", color: theme.colors.textMain }}>
                        <div style={{ fontSize: 11, fontWeight: 500 }}>
                          {new Date(r.created_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 2 }}>
                          {new Date(r.created_at).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td style={{ padding: "12px", color: theme.colors.textMain, maxWidth: 400 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: theme.colors.textSoft, lineHeight: 1.4 }}>
                          {isExpanded ? (
                            <div>
                              {r.description?.split("\n").map((line, i) => (
                                <div key={i} style={{ marginBottom: 2 }}>
                                  {line}
                                </div>
                              ))}
                            </div>
                          ) : (
                            descriptionPreview
                          )}
                          {r.description && r.description.length > 100 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(r.id);
                              }}
                              style={{
                                marginTop: 4,
                                padding: 0,
                                border: "none",
                                background: "none",
                                color: theme.colors.primary,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                            >
                              {isExpanded ? "Sembunyikan" : "Show More"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px", color: theme.colors.textMain }}>
                        <div style={{ fontSize: 12 }}>{r.location_text || "-"}</div>
                        {r.site_name && (
                          <div style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 2 }}>
                            {r.site_name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {r.severity && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "4px 10px",
                              borderRadius: 4,
                              backgroundColor: severityColor(r.severity) + "20",
                              color: severityColor(r.severity),
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            {r.severity}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {r.status && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "4px 10px",
                              borderRadius: 4,
                              backgroundColor: getStatusColor(r.status) + "20",
                              color: getStatusColor(r.status),
                              fontWeight: 600,
                            }}
                          >
                            {getStatusLabel(r.status)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {photoCount > 0 ? (
                          <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                            {Array.from({ length: Math.min(photoCount, 3) }).map((_, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: 10,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  backgroundColor: theme.colors.background,
                                  color: theme.colors.textMuted,
                                }}
                              >
                                Foto {idx + 1}
                              </span>
                            ))}
                            {photoCount > 3 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  backgroundColor: theme.colors.background,
                                  color: theme.colors.textMuted,
                                }}
                              >
                                +{photoCount - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: theme.colors.textMuted }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/supervisor/reports/${r.id}`)}
                          style={{
                            padding: "6px 12px",
                            fontSize: 11,
                            borderRadius: 6,
                            border: `1px solid ${theme.colors.primary}`,
                            backgroundColor: "transparent",
                            color: theme.colors.primary,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View (hidden on desktop) */}
          <div className="md:hidden">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reports.map((r) => {
                const photoCount = r.report_attachments?.length || 0;
                const isExpanded = expandedIds.has(r.id);

                return (
                  <div
                    key={r.id}
                    style={{
                      borderRadius: theme.radius.card,
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.surface,
                      padding: 16,
                      boxShadow: theme.shadowSoft,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                          {new Date(r.created_at).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textMain, marginBottom: 4 }}>
                          {r.title}
                        </div>
                        {r.location_text && (
                          <div style={{ fontSize: 12, color: theme.colors.textSoft, marginBottom: 4 }}>
                            📍 {r.location_text}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        {r.severity && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "4px 8px",
                              borderRadius: 4,
                              backgroundColor: severityColor(r.severity) + "20",
                              color: severityColor(r.severity),
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            {r.severity}
                          </span>
                        )}
                        {r.status && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "4px 8px",
                              borderRadius: 4,
                              backgroundColor: getStatusColor(r.status) + "20",
                              color: getStatusColor(r.status),
                              fontWeight: 600,
                            }}
                          >
                            {getStatusLabel(r.status)}
                          </span>
                        )}
                      </div>
                    </div>

                    {r.description && (
                      <div style={{ fontSize: 13, color: theme.colors.textMain, lineHeight: 1.5, marginBottom: 8 }}>
                        {isExpanded ? (
                          <div>
                            {r.description.split("\n").map((line, idx) => (
                              <div key={idx} style={{ marginBottom: 4 }}>
                                {line}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            {r.description.length > 150
                              ? r.description.substring(0, 150) + "..."
                              : r.description}
                          </div>
                        )}
                        {r.description.length > 150 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(r.id)}
                            style={{
                              marginTop: 4,
                              padding: 0,
                              border: "none",
                              background: "none",
                              color: theme.colors.primary,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            {isExpanded ? "Sembunyikan" : "Show More"}
                          </button>
                        )}
                      </div>
                    )}

                    {photoCount > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                        {Array.from({ length: photoCount }).map((_, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: 11,
                              padding: "4px 8px",
                              borderRadius: 4,
                              backgroundColor: theme.colors.background,
                              color: theme.colors.textMuted,
                              fontWeight: 500,
                            }}
                          >
                            Foto {idx + 1}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/supervisor/reports/${r.id}`)}
                      style={{
                        marginTop: 12,
                        width: "100%",
                        padding: "8px",
                        borderRadius: 8,
                        border: `1px solid ${theme.colors.primary}`,
                        backgroundColor: "transparent",
                        color: theme.colors.primary,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Lihat Detail
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {hasMore && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button
                type="button"
                onClick={() => loadReports(false)}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: loading ? theme.colors.border : "#FFFFFF",
                  color: theme.colors.textMain,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Memuat..." : `Muat Lebih Banyak (${total} total)`}
              </button>
            </div>
          )}

          {!hasMore && reports.length > 0 && (
            <div
              style={{
                marginTop: 16,
                textAlign: "center",
                fontSize: 12,
                color: theme.colors.textMuted,
              }}
            >
              Semua laporan telah dimuat ({total} total)
            </div>
          )}
        </>
      )}
    </div>
  );
}
