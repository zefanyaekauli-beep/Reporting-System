// frontend/web/src/modules/supervisor/pages/HeatmapPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import { MapView } from "../../shared/components/MapView";
import {
  getAttendanceHeatmap,
  getActivityHeatmap,
  getSitePerformanceHeatmap,
  getUserActivityHeatmap,
  HeatmapResponse,
  HeatmapParams,
  HeatmapDataPoint,
} from "../../../api/heatmapApi";
import { theme } from "../../shared/components/theme";
import { listSites, Site } from "../../../api/supervisorApi";

type HeatmapType = "attendance" | "activity" | "site-performance" | "user-activity";

const HEATMAP_TYPES = [
  { value: "activity", label: "Activity", icon: "📊", color: "#0d9488" },
  { value: "attendance", label: "Attendance", icon: "👤", color: "#8b5cf6" },
  { value: "site-performance", label: "Site Performance", icon: "🏢", color: "#f59e0b" },
  { value: "user-activity", label: "User Activity", icon: "👥", color: "#ef4444" },
];

export default function HeatmapPage() {
  const [heatmapType, setHeatmapType] = useState<HeatmapType>("activity");
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [division, setDivision] = useState<string>("");
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [activityType, setActivityType] = useState<string>("");

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    loadHeatmap();
  }, [heatmapType, startDate, endDate, division, siteId, activityType]);

  const loadSites = async () => {
    try {
      const sitesData = await listSites();
      setSites(sitesData);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadHeatmap = async () => {
    setLoading(true);
    setError("");
    try {
      const params: HeatmapParams = {
        start_date: startDate,
        end_date: endDate,
      };
      if (division) params.division = division;
      if (siteId) params.site_id = siteId;
      if (activityType) params.activity_type = activityType;

      let response: HeatmapResponse;
      switch (heatmapType) {
        case "attendance":
          response = await getAttendanceHeatmap(params);
          break;
        case "activity":
          response = await getActivityHeatmap(params);
          break;
        case "site-performance":
          response = await getSitePerformanceHeatmap(params);
          break;
        case "user-activity":
          response = await getUserActivityHeatmap(params);
          break;
        default:
          response = await getActivityHeatmap(params);
      }

      setData(response);
    } catch (err: any) {
      setError(err.message || "Failed to load heatmap data");
      console.error("Heatmap load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getColorByValue = (value: number, min: number, max: number): string => {
    if (max === min) return "#0d9488";
    const ratio = (value - min) / (max - min);
    if (ratio < 0.25) return "#06b6d4";
    if (ratio < 0.5) return "#0d9488";
    if (ratio < 0.75) return "#f59e0b";
    return "#ef4444";
  };

  const getSizeByValue = (value: number, min: number, max: number): number => {
    if (max === min) return 16;
    const ratio = (value - min) / (max - min);
    return 12 + ratio * 16;
  };

  const mapMarkers = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return [];
    
    const minValue = Math.min(...data.data.map(d => d.value));
    const maxValue = Math.max(...data.data.map(d => d.value));
    
    const validatedPoints = data.data.filter((point: HeatmapDataPoint) => {
        const xNum = parseFloat(point.x);
        const yNum = parseFloat(point.y);
      if (isNaN(xNum) || isNaN(yNum) || xNum === 0 || yNum === 0) return false;
      if (xNum < -11 || xNum > 6 || yNum < 95 || yNum > 141) return false;
      return true;
    });

    if (validatedPoints.length === 0) return [];

    const typeConfig = HEATMAP_TYPES.find(t => t.value === heatmapType);

    return validatedPoints.map((point: HeatmapDataPoint) => {
        const lat = parseFloat(point.x);
        const lng = parseFloat(point.y);
        const value = point.value;
        
        return {
          id: `${lat}-${lng}-${point.label || ''}`,
          position: [lat, lng] as [number, number],
        color: getColorByValue(value, minValue, maxValue),
        value: value,
        size: getSizeByValue(value, minValue, maxValue),
        metadata: {
          title: `${typeConfig?.icon || '📍'} ${point.label || 'Location'}`,
          value: value,
          valueLabel: data.value_label || 'Activities',
          timestamp: point.timestamp,
          location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          activity: typeConfig?.label || 'Activity',
        }
        };
      });
  }, [data, heatmapType]);

  const computedMapCenter = useMemo((): [number, number] => {
    if (mapMarkers.length === 0) return [-6.2088, 106.8456];
      const lats = mapMarkers.map(m => m.position[0]);
      const lngs = mapMarkers.map(m => m.position[1]);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2
    ];
  }, [mapMarkers]);

  const stats = useMemo(() => {
    if (!data || !data.data) return null;
    const values = data.data.map(d => d.value);
    return {
      total: Math.round(values.reduce((a, b) => a + b, 0)),
      average: values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0,
      max: Math.round(Math.max(...values, 0)),
      min: Math.round(Math.min(...values, 0)),
      locations: data.data.length,
      validLocations: mapMarkers.length,
    };
  }, [data, mapMarkers]);

  const currentTypeConfig = HEATMAP_TYPES.find(t => t.value === heatmapType);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerIcon}>🗺️</div>
          <div>
        <h1 style={styles.title}>Activity Heatmap</h1>
            <p style={styles.subtitle}>Real-time visualization of field activities across all locations</p>
          </div>
        </div>
        <div style={styles.headerBadge}>
          <span style={styles.badgeDot}></span>
          Live Data
        </div>
      </div>

      {/* Heatmap Type Selector */}
      <div style={styles.typeSelector}>
        {HEATMAP_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setHeatmapType(type.value as HeatmapType)}
            style={{
              ...styles.typeButton,
              background: heatmapType === type.value ? `linear-gradient(135deg, ${type.color}15, ${type.color}08)` : "white",
              borderColor: heatmapType === type.value ? type.color : "#e5e7eb",
              color: heatmapType === type.value ? type.color : "#6b7280",
            }}
          >
            <span style={styles.typeIcon}>{type.icon}</span>
            <span style={styles.typeLabel}>{type.label}</span>
            {heatmapType === type.value && <span style={{...styles.typeIndicator, background: type.color}}></span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.filtersCard}>
        <div style={styles.filtersHeader}>
          <span style={styles.filtersIcon}>⚙️</span>
          <span style={styles.filtersTitle}>Filters</span>
        </div>
        <div style={styles.filtersGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Division</label>
            <select value={division} onChange={(e) => setDivision(e.target.value)} style={styles.select}>
              <option value="">All Divisions</option>
              <option value="security">Security</option>
              <option value="cleaning">Cleaning</option>
              <option value="driver">Driver</option>
              <option value="parking">Parking</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Site</label>
            <select
              value={siteId || ""}
              onChange={(e) => setSiteId(e.target.value ? parseInt(e.target.value) : undefined)}
              style={styles.select}
            >
              <option value="">All Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={loadHeatmap} style={styles.refreshButton} disabled={loading}>
          {loading ? (
            <>
              <span className="btn-spinner"></span>
              Loading...
            </>
          ) : (
            <>🔄 Refresh Data</>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
          <div style={styles.statsGrid}>
          <div style={{...styles.statCard, borderTop: `4px solid ${currentTypeConfig?.color || '#0d9488'}`}}>
            <div style={styles.statIcon}>📍</div>
            <div style={styles.statContent}>
              <div style={{...styles.statValue, color: currentTypeConfig?.color}}>{stats.validLocations}</div>
              <div style={styles.statLabel}>Active Locations</div>
            </div>
            </div>
          <div style={{...styles.statCard, borderTop: "4px solid #8b5cf6"}}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statContent}>
              <div style={{...styles.statValue, color: "#8b5cf6"}}>{stats.total}</div>
              <div style={styles.statLabel}>Total Activities</div>
            </div>
          </div>
          <div style={{...styles.statCard, borderTop: "4px solid #f59e0b"}}>
            <div style={styles.statIcon}>📈</div>
            <div style={styles.statContent}>
              <div style={{...styles.statValue, color: "#f59e0b"}}>{stats.average}</div>
              <div style={styles.statLabel}>Average / Location</div>
            </div>
            </div>
          <div style={{...styles.statCard, borderTop: "4px solid #ef4444"}}>
            <div style={styles.statIcon}>🔥</div>
            <div style={styles.statContent}>
              <div style={{...styles.statValue, color: "#ef4444"}}>{stats.max}</div>
              <div style={styles.statLabel}>Peak Activity</div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={styles.legendCard}>
        <div style={styles.legendRow}>
          <div style={styles.legendSection}>
            <span style={styles.legendTitle}>Intensity Scale</span>
            <div style={styles.gradientBar}></div>
            <div style={styles.gradientLabels}>
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
          </div>
          <div style={styles.legendDivider}></div>
          <div style={styles.legendSection}>
            <span style={styles.legendTitle}>Marker Size</span>
            <div style={styles.sizeIndicators}>
              <div style={styles.sizeItem}>
                <div style={{...styles.sizeCircle, width: 12, height: 12}}></div>
                <span>Low</span>
              </div>
              <div style={styles.sizeItem}>
                <div style={{...styles.sizeCircle, width: 20, height: 20}}></div>
                <span>Medium</span>
              </div>
              <div style={styles.sizeItem}>
                <div style={{...styles.sizeCircle, width: 28, height: 28}}></div>
                <span>High</span>
              </div>
            </div>
        </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorCard}>
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={loadHeatmap} style={styles.retryBtn}>Retry</button>
        </div>
      )}

      {/* Map */}
      <div style={styles.mapCard}>
        {loading ? (
          <div style={styles.loadingState}>
            <div className="map-loading-spinner"></div>
            <p>Loading heatmap data...</p>
          </div>
        ) : mapMarkers.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🗺️</div>
            <h3 style={styles.emptyTitle}>No Location Data Available</h3>
            <p style={styles.emptyText}>
              {data && data.data && data.data.length > 0
                ? `Found ${data.data.length} records, but none have valid GPS coordinates.`
                : "No data found for the selected filters. Try expanding the date range or removing filters."}
            </p>
            <button onClick={loadHeatmap} style={styles.emptyBtn}>🔄 Refresh</button>
          </div>
        ) : (
          <MapView
            key={`map-${heatmapType}-${data?.type || 'none'}-${mapMarkers.length}`}
            center={computedMapCenter}
            zoom={12}
            markers={mapMarkers}
            height="650px"
            onMarkerClick={(markerId) => setSelectedMarker(markerId.toString())}
          />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "28px",
    maxWidth: "1500px",
    margin: "0 auto",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    padding: "24px 28px",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    borderRadius: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },
  headerIcon: {
    fontSize: "42px",
    background: "linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)",
    borderRadius: "16px",
    width: "70px",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(13, 148, 136, 0.25)",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "4px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#64748b",
    fontWeight: "500",
  },
  headerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#15803d",
  },
  badgeDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
    animation: "pulse-dot 2s infinite",
  },
  typeSelector: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    overflowX: "auto",
    paddingBottom: "4px",
  },
  typeButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 22px",
    borderRadius: "14px",
    border: "2px solid",
    cursor: "pointer",
    transition: "all 0.25s ease",
    fontWeight: "600",
    fontSize: "14px",
    position: "relative" as const,
    minWidth: "fit-content",
  },
  typeIcon: {
    fontSize: "20px",
  },
  typeLabel: {
    whiteSpace: "nowrap" as const,
  },
  typeIndicator: {
    position: "absolute" as const,
    bottom: "-2px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "30px",
    height: "4px",
    borderRadius: "4px",
  },
  filtersCard: {
    background: "white",
    borderRadius: "18px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  filtersHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
    paddingBottom: "14px",
    borderBottom: "1px solid #f1f5f9",
  },
  filtersIcon: {
    fontSize: "20px",
  },
  filtersTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "18px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  input: {
    padding: "12px 14px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
    background: "#f8fafc",
  },
  select: {
    padding: "12px 14px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    background: "#f8fafc",
    cursor: "pointer",
    outline: "none",
  },
  refreshButton: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 4px 16px rgba(13, 148, 136, 0.3)",
    transition: "all 0.25s ease",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  statCard: {
    background: "white",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.03)",
  },
  statIcon: {
    fontSize: "28px",
    background: "#f8fafc",
    borderRadius: "12px",
    width: "56px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statContent: {},
  statValue: {
    fontSize: "30px",
    fontWeight: "800",
    marginBottom: "2px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  },
  legendCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px 24px",
    marginBottom: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.03)",
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
    flexWrap: "wrap" as const,
  },
  legendSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  legendTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  gradientBar: {
    width: "180px",
    height: "12px",
    borderRadius: "6px",
    background: "linear-gradient(to right, #06b6d4, #0d9488, #f59e0b, #ef4444)",
  },
  gradientLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  legendDivider: {
    width: "1px",
    height: "50px",
    background: "#e2e8f0",
  },
  sizeIndicators: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  sizeItem: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  sizeCircle: {
    borderRadius: "50%",
    background: "#0d9488",
    border: "2px solid white",
    boxShadow: "0 2px 8px rgba(13, 148, 136, 0.3)",
  },
  errorCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 20px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    marginBottom: "24px",
    color: "#b91c1c",
    fontSize: "14px",
  },
  retryBtn: {
    marginLeft: "auto",
    padding: "8px 16px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  mapCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.04)",
    minHeight: "650px",
    overflow: "hidden",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "650px",
    gap: "20px",
    color: "#64748b",
    fontSize: "15px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "650px",
    textAlign: "center" as const,
    gap: "16px",
  },
  emptyIcon: {
    fontSize: "72px",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  emptyText: {
    fontSize: "15px",
    color: "#64748b",
    maxWidth: "400px",
    lineHeight: 1.6,
    margin: 0,
  },
  emptyBtn: {
    marginTop: "8px",
    padding: "12px 24px",
    background: "#0d9488",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

// Add global styles
if (typeof document !== 'undefined' && !document.getElementById('heatmap-page-v2-styles')) {
const styleSheet = document.createElement("style");
  styleSheet.id = 'heatmap-page-v2-styles';
styleSheet.textContent = `
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.9); }
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .map-loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #0d9488;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

  @keyframes spin {
      to { transform: rotate(360deg); }
    }

    input:focus, select:focus {
      border-color: #0d9488 !important;
      box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1) !important;
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(13, 148, 136, 0.35) !important;
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
  }
`;
document.head.appendChild(styleSheet);
}
