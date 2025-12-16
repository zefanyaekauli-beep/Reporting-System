// frontend/web/src/modules/supervisor/pages/IncidentPerpetratorPage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import { getIncidentPerpetrators, IncidentPerpetrator, listSites, Site } from "../../../api/supervisorApi";

export function IncidentPerpetratorPage() {
  const [data, setData] = useState<IncidentPerpetrator[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [expandedPerpetrator, setExpandedPerpetrator] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {
        from_date: fromDate,
        to_date: toDate,
      };
      if (selectedSiteId) params.site_id = selectedSiteId;

      const [perpetratorsData, sitesData] = await Promise.all([
        getIncidentPerpetrators(params),
        listSites(),
      ]);

      setData(perpetratorsData);
      setSites(sitesData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to load incident perpetrators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId, fromDate, toDate]);

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "high":
      case "critical":
        return theme.colors.danger;
      case "medium":
        return theme.colors.warning;
      case "low":
        return theme.colors.success;
      default:
        return theme.colors.textMuted;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return theme.colors.danger;
      case "HIGH":
        return theme.colors.warning;
      case "MEDIUM":
        return theme.colors.info;
      case "LOW":
        return theme.colors.success;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
          Incident Perpetrator Tracking
        </h1>
        <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
          Track incidents by perpetrator with statistics and history
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
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
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

        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
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

      {/* Perpetrator List */}
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
          No perpetrator data found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.map((perpetrator, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                padding: 16,
                boxShadow: theme.shadowCard,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textMain, marginBottom: 4 }}>
                    {perpetrator.perpetrator_name}
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>
                    Type: {perpetrator.perpetrator_type}
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: 11, color: theme.colors.textMuted }}>Incidents: </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.danger }}>
                        {perpetrator.incident_count}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: theme.colors.textMuted }}>First: </span>
                      <span style={{ fontSize: 12, color: theme.colors.textMain }}>
                        {new Date(perpetrator.first_incident_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: theme.colors.textMuted }}>Last: </span>
                      <span style={{ fontSize: 12, color: theme.colors.textMain }}>
                        {new Date(perpetrator.last_incident_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedPerpetrator(expandedPerpetrator === idx ? null : idx)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: theme.radius.button,
                    backgroundColor: theme.colors.primary,
                    color: "white",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {expandedPerpetrator === idx ? "Hide" : "View Details"}
                </button>
              </div>

              {expandedPerpetrator === idx && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textMain, marginBottom: 8 }}>
                    Incident History:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {perpetrator.incidents.map((incident) => (
                      <div
                        key={incident.id}
                        style={{
                          padding: 10,
                          backgroundColor: theme.colors.background,
                          borderRadius: theme.radius.input,
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textMain, marginBottom: 4 }}>
                          {incident.title}
                        </div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, color: theme.colors.textMuted }}>
                          <span>Type: {incident.report_type}</span>
                          {incident.severity && (
                            <span style={{ color: getSeverityColor(incident.severity) }}>
                              Severity: {incident.severity}
                            </span>
                          )}
                          {incident.incident_level && (
                            <span style={{ color: getLevelColor(incident.incident_level) }}>
                              Level: {incident.incident_level}
                            </span>
                          )}
                          <span>{new Date(incident.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

