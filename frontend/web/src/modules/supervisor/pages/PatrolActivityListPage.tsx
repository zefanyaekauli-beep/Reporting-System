// frontend/web/src/modules/supervisor/pages/PatrolActivityListPage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import api from "../../../api/client";

interface PatrolActivity {
  id: number;
  officer_name: string;
  site_name: string;
  start_time: string;
  end_time: string | null;
  area_text: string;
  notes: string;
  division: string;
}

const PatrolActivityListPage: React.FC = () => {
  const [activities, setActivities] = useState<PatrolActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [qrPreview, setQrPreview] = useState<PatrolActivity | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Get patrol logs from supervisor endpoint
      const params: any = {};
      if (from) params.date_from = from;
      if (to) params.date_to = to;
      const response = await api.get("/supervisor/patrol-activity", { params });
      const data = response.data || [];
      setActivities(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load patrol activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Patrol & Activity</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          View patrol logs and activity records from Security division. (Cleaning and Parking activities can be added later.)
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
          border: `1px solid ${theme.colors.border}`,
          padding: 12,
          boxShadow: theme.shadowCard,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            From date
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{
              borderRadius: 12,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
            To date
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{
              borderRadius: 12,
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              padding: "8px 12px",
              fontSize: 13,
              color: theme.colors.textMain,
            }}
          />
        </div>
        <button
          onClick={load}
          style={{
            padding: "8px 16px",
            borderRadius: theme.radius.pill,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.primary,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          border: `1px solid ${theme.colors.border}`,
          padding: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        {loading ? (
          <div style={{ fontSize: 12, color: theme.colors.textMuted }}>Loading…</div>
        ) : activities.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.colors.textSoft }}>No patrol activities.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.background,
                  }}
                >
                  <th style={{ padding: "8px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Officer</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Site</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Area</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Start</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>End</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Notes</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>QR</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <td style={{ padding: "8px" }}>
                      {new Date(activity.start_time).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "8px" }}>{activity.officer_name || `User #${activity.id}`}</td>
                    <td style={{ padding: "8px" }}>{activity.site_name}</td>
                    <td style={{ padding: "8px" }}>{activity.area_text || "-"}</td>
                    <td style={{ padding: "8px" }}>
                      {new Date(activity.start_time).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "8px" }}>
                      {activity.end_time ? new Date(activity.end_time).toLocaleTimeString() : "Ongoing"}
                    </td>
                    <td style={{ padding: "8px", maxWidth: 200 }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {activity.notes || "-"}
                      </div>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <button
                        onClick={async () => {
                          setQrPreview(activity);
                          try {
                            const response = await api.get(`/supervisor/patrol-activity/${activity.id}/qr`, {
                              responseType: 'blob'
                            });
                            const blobUrl = URL.createObjectURL(response.data);
                            setQrImageUrl(blobUrl);
                          } catch (err) {
                            console.error('Failed to load QR code:', err);
                            setQrImageUrl(null);
                          }
                        }}
                        style={{
                          padding: "4px 8px",
                          borderRadius: theme.radius.pill,
                          border: `1px solid ${theme.colors.border}`,
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.textMain,
                          fontSize: 10,
                          cursor: "pointer",
                        }}
                      >
                        View QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Preview Modal */}
      {qrPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setQrPreview(null);
            if (qrImageUrl) {
              URL.revokeObjectURL(qrImageUrl);
              setQrImageUrl(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.card,
              padding: 16,
              maxWidth: 400,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Patrol Activity #{qrPreview.id}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: theme.colors.textMuted,
                  }}
                >
                  {qrPreview.officer_name} · {qrPreview.site_name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: theme.colors.textSoft,
                    marginTop: 4,
                  }}
                >
                  {new Date(qrPreview.start_time).toLocaleString()}
                </div>
              </div>
              <button
                style={{
                  fontSize: 11,
                  padding: "4px 12px",
                  borderRadius: theme.radius.pill,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textMain,
                  cursor: "pointer",
                }}
                onClick={() => {
                  setQrPreview(null);
                  if (qrImageUrl) {
                    URL.revokeObjectURL(qrImageUrl);
                    setQrImageUrl(null);
                  }
                }}
              >
                Close
              </button>
            </div>
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                justifyContent: "center",
              }}
            >
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="QR"
                  style={{ width: 192, height: 192, objectFit: "contain" }}
                />
              ) : (
                <div
                  style={{
                    width: 192,
                    height: 192,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.colors.textMuted,
                    fontSize: 12,
                  }}
                >
                  Memuat QR code...
                </div>
              )}
            </div>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 11,
              }}
            >
              {qrImageUrl && (
                <>
                  <a
                    href={qrImageUrl}
                    download={`Patrol_${qrPreview.id}.png`}
                    style={{
                      padding: "4px 12px",
                      borderRadius: theme.radius.pill,
                      backgroundColor: theme.colors.primary,
                      color: "#fff",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Download PNG
                  </a>
                  <a
                    href={qrImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "4px 12px",
                      borderRadius: theme.radius.pill,
                      border: `1px solid ${theme.colors.border}`,
                      color: theme.colors.textMain,
                      textDecoration: "none",
                    }}
                  >
                    Open for Print
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatrolActivityListPage;

