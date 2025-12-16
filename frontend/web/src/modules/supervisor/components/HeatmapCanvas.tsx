// frontend/web/src/modules/supervisor/components/HeatmapCanvas.tsx

import React, { useRef, useEffect, useMemo } from "react";
import { HeatmapDataPoint } from "../../../api/heatmapApi";
import { theme } from "../../shared/components/theme";

interface HeatmapCanvasProps {
  data: HeatmapDataPoint[];
  xAxisLabel: string;
  yAxisLabel: string;
  valueLabel: string;
  showMap?: boolean;
  width?: number;
  height?: number;
}

export default function HeatmapCanvas({
  data,
  xAxisLabel,
  yAxisLabel,
  valueLabel,
  showMap = false,
  width = 800,
  height = 600,
}: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  const xValues = useMemo(() => {
    const unique = Array.from(new Set(data.map((d) => d.x)));
    const isNumeric = unique.length > 0 && !isNaN(parseFloat(unique[0]));
    return isNumeric 
      ? unique.sort((a, b) => parseFloat(a) - parseFloat(b))
      : unique.sort();
  }, [data]);

  const yValues = useMemo(() => {
    const unique = Array.from(new Set(data.map((d) => d.y)));
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

  // Red gradient color function
  const getRedColor = (value: number): string => {
    if (value === 0) return "rgb(255, 255, 255)"; // White for zero
    const ratio = (value - minValue) / (maxValue - minValue || 1);
    // Red gradient: from light red (255, 200, 200) to dark red (204, 0, 0)
    const r = Math.floor(255 - (ratio * 51)); // 255 to 204
    const g = Math.floor(200 - (ratio * 200)); // 200 to 0
    const b = Math.floor(200 - (ratio * 200)); // 200 to 0
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Draw heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate dimensions
    const padding = { top: 40, right: 20, bottom: 60, left: 100 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const cellWidth = chartWidth / xValues.length;
    const cellHeight = chartHeight / yValues.length;

    // Draw grid cells
    yValues.forEach((y, yIdx) => {
      xValues.forEach((x, xIdx) => {
        const key = `${x}|${y}`;
        const value = dataMap.get(key) || 0;
        const color = getRedColor(value);

        const xPos = padding.left + xIdx * cellWidth;
        const yPos = padding.top + yIdx * cellHeight;

        // Draw cell
        ctx.fillStyle = color;
        ctx.fillRect(xPos, yPos, cellWidth, cellHeight);

        // Draw border
        ctx.strokeStyle = theme.colors.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(xPos, yPos, cellWidth, cellHeight);

        // Draw value text if value > 0
        if (value > 0) {
          ctx.fillStyle = value > (maxValue - minValue) / 2 ? "#fff" : "#333";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            value.toFixed(0),
            xPos + cellWidth / 2,
            yPos + cellHeight / 2
          );
        }
      });
    });

    // Draw X-axis labels
    ctx.fillStyle = theme.colors.textMain;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    xValues.forEach((x, idx) => {
      const xPos = padding.left + idx * cellWidth + cellWidth / 2;
      ctx.fillText(
        String(x).substring(0, 10), // Truncate long labels
        xPos,
        padding.top + chartHeight + 8
      );
    });

    // Draw Y-axis labels
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    yValues.forEach((y, idx) => {
      const yPos = padding.top + idx * cellHeight + cellHeight / 2;
      ctx.fillText(
        String(y).substring(0, 10), // Truncate long labels
        padding.left - 8,
        yPos
      );
    });

    // Draw X-axis label
    ctx.fillStyle = theme.colors.textMain;
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      xAxisLabel,
      padding.left + chartWidth / 2,
      padding.top + chartHeight + 32
    );

    // Draw Y-axis label (rotated)
    ctx.save();
    ctx.translate(20, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();

    // Draw legend
    const legendY = height - 20;
    const legendX = padding.left;
    const legendWidth = chartWidth;
    const legendHeight = 20;

    // Gradient for legend
    const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY);
    gradient.addColorStop(0, "rgb(255, 200, 200)");
    gradient.addColorStop(1, "rgb(204, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

    // Legend border
    ctx.strokeStyle = theme.colors.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    // Legend labels
    ctx.fillStyle = theme.colors.textMuted;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Less", legendX, legendY + legendHeight + 4);
    
    ctx.textAlign = "right";
    ctx.fillText("More", legendX + legendWidth, legendY + legendHeight + 4);

    // Value range
    ctx.textAlign = "center";
    ctx.fillText(
      `${valueLabel}: ${minValue.toFixed(0)} - ${maxValue.toFixed(0)}`,
      legendX + legendWidth / 2,
      legendY + legendHeight + 4
    );
  }, [data, xValues, yValues, dataMap, minValue, maxValue, width, height, xAxisLabel, yAxisLabel, valueLabel]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: theme.colors.background,
        borderRadius: "8px",
        padding: "16px",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: "4px",
          maxWidth: "100%",
          height: "auto",
        }}
      />
    </div>
  );
}

