// frontend/web/src/modules/supervisor/pages/ManpowerPage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import { getManpower, ManpowerData, listSites, Site } from "../../../api/supervisorApi";

export function ManpowerPage() {
  const [data, setData] = useState<ManpowerData[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {
        date_filter: dateFilter,
      };
      if (selectedSiteId) params.site_id = selectedSiteId;
      if (selectedDivision) params.division = selectedDivision;

      const [manpowerData, sitesData] = await Promise.all([
        getManpower(params),
        listSites(),
      ]);

      setData(manpowerData);
      setSites(sitesData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to load manpower data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId, selectedDivision, dateFilter]);

  const getDivisionColor = (div: string | null) => {
    if (!div) return theme.colors.textMuted;
    switch (div.toUpperCase()) {
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
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
          Manpower per Area
        </h1>
        <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
          View manpower count per area/zone with active and scheduled personnel
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
          padding: 12,
          boxShadow: theme.shadowCard,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            Site
          </label>
          <select
            value={selectedSiteId || ""}
            onChange={(e) => setSelectedSiteId(e.target.value ? parseInt(e.target.value) : null)}
            style={{
              width: "100%",
              borderRadius: theme.radius.input,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
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

        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            Division
          </label>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            style={{
              width: "100%",
              borderRadius: theme.radius.input,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          >
            <option value="">All Divisions</option>
            <option value="SECURITY">Security</option>
            <option value="CLEANING">Cleaning</option>
            <option value="DRIVER">Driver</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            Date
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              width: "100%",
              borderRadius: theme.radius.input,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 40,
            textAlign: "center",
            color: theme.colors.textMuted,
            boxShadow: theme.shadowCard,
          }}
        >
          No manpower data found
        </div>
      ) : (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            overflow: "hidden",
            boxShadow: theme.shadowCard,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: theme.colors.background, borderBottom: `1px solid ${theme.colors.border}` }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Area
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Type
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Division
                </th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Scheduled
                </th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Active
                </th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    backgroundColor: idx % 2 === 0 ? theme.colors.surface : theme.colors.background,
                  }}
                >
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain, fontWeight: 500 }}>
                    {item.area_name}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {item.area_type}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {item.division && (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: theme.radius.badge,
                          fontSize: 11,
                          fontWeight: 500,
                          backgroundColor: getDivisionColor(item.division) + "20",
                          color: getDivisionColor(item.division),
                        }}
                      >
                        {item.division}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: 13, color: theme.colors.textMain, fontWeight: 600 }}>
                    {item.scheduled_manpower}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: 13, color: theme.colors.success, fontWeight: 600 }}>
                    {item.active_manpower}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: 13, color: theme.colors.textMain, fontWeight: 600 }}>
                    {item.total_manpower}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

