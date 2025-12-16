// frontend/web/src/modules/supervisor/components/HeatmapChart.tsx

import React, { useMemo } from "react";
import { HeatmapDataPoint } from "../../../api/heatmapApi";
import { theme } from "../../shared/components/theme";

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
  xAxisLabel: string;
  yAxisLabel: string;
  valueLabel: string;
  height?: number;
}

export function HeatmapChart({
  data,
  xAxisLabel,
  yAxisLabel,
  valueLabel,
  height = 400,
}: HeatmapChartProps) {
  // Show message if no data
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          padding: "40px",
          textAlign: "center",
          backgroundColor: theme.colors.background,
          borderRadius: "8px",
          color: theme.colors.textMuted,
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
          No data available
        </div>
        <div style={{ fontSize: "12px" }}>
          No GPS coordinates found for the selected filters. 
          Make sure attendance, patrols, or checklists have GPS data.
        </div>
      </div>
    );
  }
  // Get unique X and Y values
  // For geographic data (lat/lng), sort numerically
  const xValues = useMemo(() => {
    const unique = Array.from(new Set(data.map((d) => d.x)));
    // Check if values are numeric (coordinates)
    const isNumeric = unique.length > 0 && !isNaN(parseFloat(unique[0]));
    return isNumeric 
      ? unique.sort((a, b) => parseFloat(a) - parseFloat(b))
      : unique.sort();
  }, [data]);

  const yValues = useMemo(() => {
    const unique = Array.from(new Set(data.map((d) => d.y)));
    // Check if values are numeric (coordinates)
    const isNumeric = unique.length > 0 && !isNaN(parseFloat(unique[0]));
    return isNumeric 
      ? unique.sort((a, b) => parseFloat(a) - parseFloat(b))
      : unique.sort();
  }, [data]);

  // Create a map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      const key = `${d.x}|${d.y}`;
      map.set(key, d.value);
    });
    return map;
  }, [data]);

  // Calculate min and max values for color scaling
  const minValue = useMemo(() => {
    return data.length > 0 ? Math.min(...data.map((d) => d.value)) : 0;
  }, [data]);

  const maxValue = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;
  }, [data]);

  // Color function: from light blue to dark blue
  const getColor = (value: number): string => {
    if (value === 0) return "#f0f0f0";
    const ratio = (value - minValue) / (maxValue - minValue || 1);
    const intensity = Math.floor(ratio * 255);
    return `rgb(${100}, ${150}, ${200 + intensity * 0.2})`;
  };

  // Adjust cell size based on data type
  const isGeographic = xValues.length > 0 && !isNaN(parseFloat(xValues[0]));
  const cellWidth = isGeographic ? 100 : 80;
  const cellHeight = isGeographic ? 40 : 30;
  const chartWidth = Math.max(xValues.length * cellWidth + 100, 600);
  const chartHeight = Math.max(yValues.length * cellHeight + 60, 400);

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        padding: "16px",
        backgroundColor: theme.colors.background,
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          minWidth: `${chartWidth}px`,
          position: "relative",
        }}
      >
        {/* Y-axis label */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%) rotate(-90deg)",
            transformOrigin: "center",
            fontSize: "12px",
            fontWeight: 600,
            color: theme.colors.text,
            whiteSpace: "nowrap",
          }}
        >
          {yAxisLabel}
        </div>

        {/* Chart */}
        <div
          style={{
            marginLeft: "80px",
            marginTop: "40px",
          }}
        >
          {/* X-axis labels */}
          <div
            style={{
              display: "flex",
              marginBottom: "8px",
            }}
          >
            {xValues.map((x) => (
              <div
                key={x}
                style={{
                  width: `${cellWidth}px`,
                  textAlign: "center",
                  fontSize: "11px",
                  color: theme.colors.textMuted,
                  fontWeight: 500,
                }}
              >
                {x}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div style={{ position: "relative" }}>
            {yValues.map((y, yIdx) => (
              <div
                key={y}
                style={{
                  display: "flex",
                  marginBottom: "2px",
                }}
              >
                {/* Y-axis label */}
                <div
                  style={{
                    width: "80px",
                    fontSize: "11px",
                    color: theme.colors.text,
                    display: "flex",
                    alignItems: "center",
                    paddingRight: "8px",
                    justifyContent: "flex-end",
                  }}
                >
                  {y}
                </div>

                {/* Cells */}
                {xValues.map((x, xIdx) => {
                  const key = `${x}|${y}`;
                  const value = dataMap.get(key) || 0;
                  const color = getColor(value);

                  return (
                    <div
                      key={key}
                      style={{
                        width: `${cellWidth}px`,
                        height: `${cellHeight}px`,
                        backgroundColor: color,
                        border: "1px solid #e0e0e0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: isGeographic ? "9px" : "10px",
                        color: value > (maxValue - minValue) / 2 ? "#fff" : "#333",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "opacity 0.2s",
                      }}
                      title={data.find(d => d.x === x && d.y === y)?.label || `${x} × ${y}: ${value.toFixed(1)} ${valueLabel}`}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      {value > 0 ? value.toFixed(0) : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* X-axis label */}
        <div
          style={{
            marginLeft: "80px",
            marginTop: "8px",
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 600,
            color: theme.colors.text,
          }}
        >
          {xAxisLabel}
        </div>

        {/* Legend */}
        <div
          style={{
            marginLeft: "80px",
            marginTop: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "11px", color: theme.colors.textMuted }}>
            Less
          </span>
          <div
            style={{
              flex: 1,
              height: "20px",
              background: `linear-gradient(to right, rgb(255, 200, 200), rgb(204, 0, 0))`,
              borderRadius: "4px",
            }}
          />
          <span style={{ fontSize: "11px", color: theme.colors.textMuted }}>
            More
          </span>
          <span
            style={{
              marginLeft: "16px",
              fontSize: "11px",
              color: theme.colors.textMuted,
            }}
          >
            {valueLabel}: {minValue.toFixed(0)} - {maxValue.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}

