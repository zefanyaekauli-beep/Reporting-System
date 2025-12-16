// frontend/web/src/modules/supervisor/pages/HeatmapPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import { HeatmapChart } from "../components/HeatmapChart";
import HeatmapCanvas from "../components/HeatmapCanvas";
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

export default function HeatmapPage() {
  console.log("HeatmapPage component rendered");
  
  const [heatmapType, setHeatmapType] = useState<
    "attendance" | "activity" | "site-performance" | "user-activity"
  >("attendance");
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
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]); // Default Jakarta
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    loadHeatmap();
  }, [heatmapType, startDate, endDate, division, siteId, activityType]);

  // Convert heatmap data to map markers (for geographic heatmaps)
  const mapMarkers = useMemo(() => {
    if (!data || !data.data || data.data.length === 0) return [];
    
    // Only create markers for geographic heatmaps (attendance and activity)
    if (heatmapType !== "attendance" && heatmapType !== "activity") return [];
    
    const minValue = Math.min(...data.data.map(d => d.value));
    const maxValue = Math.max(...data.data.map(d => d.value));
    
    return data.data
      .filter((point: HeatmapDataPoint) => {
        // Check if x and y are numeric (coordinates)
        const xNum = parseFloat(point.x);
        const yNum = parseFloat(point.y);
        return !isNaN(xNum) && !isNaN(yNum) && xNum !== 0 && yNum !== 0;
      })
      .map((point: HeatmapDataPoint) => {
        const lat = parseFloat(point.x);
        const lng = parseFloat(point.y);
        const value = point.value;
        
        // Calculate red intensity based on value
        const ratio = (value - minValue) / (maxValue - minValue || 1);
        const r = Math.floor(255 - (ratio * 100)); // 255 to 155
        const g = Math.floor(200 - (ratio * 200)); // 200 to 0
        const b = Math.floor(200 - (ratio * 200)); // 200 to 0
        const color = `rgb(${r}, ${g}, ${b})`;
        
        return {
          id: `${lat}-${lng}`,
          position: [lat, lng] as [number, number],
          label: point.label || `${value} ${data.value_label}`,
          color: color,
          value: value,
        };
      });
  }, [data, heatmapType]);

  // Update map center when markers change
  useEffect(() => {
    if (mapMarkers.length > 0) {
      const lats = mapMarkers.map(m => m.position[0]);
      const lngs = mapMarkers.map(m => m.position[1]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      setMapCenter([centerLat, centerLng]);
      setMapZoom(13);
    }
  }, [mapMarkers]);

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
    setData(null); // Clear previous data
    try {
      const params: HeatmapParams = {
        start_date: startDate,
        end_date: endDate,
      };

      if (division) params.division = division;
      if (siteId) params.site_id = siteId;
      if (activityType) params.activity_type = activityType;

      console.log("Loading heatmap with params:", params);
      console.log("Heatmap type:", heatmapType);

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
          response = await getAttendanceHeatmap(params);
      }

      console.log("Heatmap response:", response);
      console.log("Heatmap data points:", response.data);
      console.log("Data length:", response.data?.length);
      console.log("Is array?", Array.isArray(response.data));
      
      if (response && response.data) {
        console.log("First data point:", response.data[0]);
      }
      
      setData(response);
    } catch (err: any) {
      console.error("Failed to load heatmap:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError(err.message || "Failed to load heatmap data");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>
        Activity Heatmap
      </h1>
        <p
          style={{
            fontSize: "14px",
            color: theme.colors.textMuted,
            marginBottom: "24px",
          }}
        >
          Visualize activity patterns, attendance trends, and performance metrics
          across time, locations, and divisions.
        </p>

        {/* Controls */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            alignItems: "flex-end",
          }}
        >
          {/* Heatmap Type */}
          <div style={{ flex: "1 1 200px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "4px",
                color: theme.colors.textMain,
              }}
            >
              Heatmap Type
            </label>
            <select
              value={heatmapType}
              onChange={(e) =>
                setHeatmapType(
                  e.target.value as
                    | "attendance"
                    | "activity"
                    | "site-performance"
                    | "user-activity"
                )
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: `1px solid ${theme.colors.border}`,
                fontSize: "14px",
                backgroundColor: theme.colors.background,
                color: theme.colors.textMain,
              }}
            >
              <option value="attendance">Attendance Heatmap</option>
              <option value="activity">Activity Heatmap</option>
              <option value="site-performance">Site Performance</option>
              <option value="user-activity">User Activity</option>
            </select>
          </div>

          {/* Date Range */}
          <div style={{ flex: "1 1 150px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "4px",
                color: theme.colors.textMain,
              }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: `1px solid ${theme.colors.border}`,
                fontSize: "14px",
                backgroundColor: theme.colors.background,
                color: theme.colors.textMain,
              }}
            />
          </div>

          <div style={{ flex: "1 1 150px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "4px",
                color: theme.colors.textMain,
              }}
            >
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: `1px solid ${theme.colors.border}`,
                fontSize: "14px",
                backgroundColor: theme.colors.background,
                color: theme.colors.textMain,
              }}
            />
          </div>

          {/* Division Filter */}
          {heatmapType !== "site-performance" && (
            <div style={{ flex: "1 1 150px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "4px",
                  color: theme.colors.textMain,
                }}
              >
                Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: "14px",
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textMain,
                }}
              >
                <option value="">All Divisions</option>
                <option value="SECURITY">Security</option>
                <option value="CLEANING">Cleaning</option>
                <option value="DRIVER">Driver</option>
                <option value="PARKING">Parking</option>
              </select>
            </div>
          )}

          {/* Site Filter */}
          {heatmapType !== "site-performance" && (
            <div style={{ flex: "1 1 150px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "4px",
                  color: theme.colors.textMain,
                }}
              >
                Site
              </label>
              <select
                value={siteId || ""}
                onChange={(e) =>
                  setSiteId(e.target.value ? parseInt(e.target.value) : undefined)
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: "14px",
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textMain,
                }}
              >
                <option value="">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Activity Type Filter (for activity heatmap) */}
          {heatmapType === "activity" && (
            <div style={{ flex: "1 1 150px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "4px",
                  color: theme.colors.textMain,
                }}
              >
                Activity Type
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: "14px",
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textMain,
                }}
              >
                <option value="">All Activities</option>
                <option value="patrol">Patrols</option>
                <option value="report">Reports</option>
                <option value="checklist">Checklists</option>
              </select>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadHeatmap}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: theme.colors.primary,
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fee",
              color: "#c33",
              borderRadius: "6px",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {/* Heatmap Chart */}
        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: theme.colors.textMuted,
            }}
          >
            Loading heatmap data...
          </div>
        ) : data && data.data && Array.isArray(data.data) && data.data.length > 0 ? (
          <div>
            <div
              style={{
                backgroundColor: theme.colors.surface,
                padding: "24px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              {data.date_range && (
                <div
                  style={{
                    marginBottom: "16px",
                    fontSize: "12px",
                    color: theme.colors.textMuted,
                  }}
                >
                  Date Range: {data.date_range}
                </div>
              )}
              <div style={{ marginBottom: "8px", fontSize: "12px", color: theme.colors.textMuted }}>
                Found {data.data.length} data points
              </div>
            </div>

            {/* Map View for Geographic Heatmaps */}
            {(heatmapType === "attendance" || heatmapType === "activity") && mapMarkers.length > 0 && (
              <div
                style={{
                  backgroundColor: theme.colors.surface,
                  padding: "24px",
                  borderRadius: "8px",
                  marginBottom: "24px",
                }}
              >
                <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                  Geographic Heatmap (Red Intensity)
                </h2>
                <MapView
                  center={mapCenter}
                  zoom={mapZoom}
                  markers={mapMarkers.map(m => ({
                    id: m.id,
                    position: m.position,
                    label: m.label,
                    color: m.color,
                  }))}
                  height="500px"
                />
                <div style={{ marginTop: "12px", fontSize: "12px", color: theme.colors.textMuted }}>
                  Red intensity indicates activity level. Darker red = higher activity.
                </div>
              </div>
            )}

            {/* Canvas Heatmap View */}
            <div
              style={{
                backgroundColor: theme.colors.surface,
                padding: "24px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                Canvas Heatmap (Red Gradient)
              </h2>
              <HeatmapCanvas
                data={data.data}
                xAxisLabel={data.x_axis_label || "X Axis"}
                yAxisLabel={data.y_axis_label || "Y Axis"}
                valueLabel={data.value_label || "Value"}
                showMap={false}
                width={800}
                height={600}
              />
            </div>

            {/* Chart View */}
            <div
              style={{
                backgroundColor: theme.colors.surface,
                padding: "24px",
                borderRadius: "8px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                Grid Heatmap Chart (Red Gradient)
              </h2>
              <HeatmapChart
                data={data.data}
                xAxisLabel={data.x_axis_label || "X Axis"}
                yAxisLabel={data.y_axis_label || "Y Axis"}
                valueLabel={data.value_label || "Value"}
              />
            </div>
          </div>
        ) : data && data.data && Array.isArray(data.data) && data.data.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: theme.colors.textMuted,
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
              No data available
            </div>
            <div style={{ fontSize: "12px" }}>
              No GPS coordinates found for the selected filters.
              <br />
              Try adjusting the date range or filters.
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: theme.colors.textMuted,
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
              No data loaded
            </div>
            <div style={{ fontSize: "12px" }}>
              {error || "Please select filters and click Refresh to load data."}
            </div>
            {data && (
              <div style={{ marginTop: "16px", fontSize: "11px", color: theme.colors.textMuted }}>
                Debug: data = {JSON.stringify(data, null, 2).substring(0, 200)}...
              </div>
            )}
          </div>
        )}
    </div>
  );
}

