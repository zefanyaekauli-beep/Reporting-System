// frontend/web/src/modules/supervisor/pages/InspectPointListPage.tsx

import React, { useEffect, useState } from "react";
import {
  InspectPoint,
  getInspectPoints,
  createInspectPoint,
  updateInspectPoint,
  deleteInspectPoint,
  getInspectPointQrUrl,
  listSites,
  Site,
} from "../../../api/supervisorApi";
import { theme } from "../../shared/components/theme";
import api from "../../../api/client";

const InspectPointListPage: React.FC = () => {
  const [items, setItems] = useState<InspectPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [creating, setCreating] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [newPoint, setNewPoint] = useState<Partial<InspectPoint>>({
    name: "",
    code: "",
    site_name: "",
    description: "",
    is_active: true,
  });
  const [qrPreview, setQrPreview] = useState<InspectPoint | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getInspectPoints();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load inspect points");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err: any) {
      console.error("Failed to load sites:", err);
    }
  };

  // Cleanup blob URLs when component unmounts or qrImageUrl changes
  useEffect(() => {
    return () => {
      if (qrImageUrl) {
        URL.revokeObjectURL(qrImageUrl);
      }
    };
  }, [qrImageUrl]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newPoint,
        code: newPoint.code || newPoint.name?.toUpperCase().replace(/\s+/g, "_"),
      };
      const createdPoint = await createInspectPoint(payload);
      setCreating(false);
      setNewPoint({
        name: "",
        code: "",
        site_name: "",
        description: "",
        is_active: true,
      });
      load();
      
      // Automatically show QR code after creation
      if (createdPoint && createdPoint.id) {
        setQrPreview(createdPoint);
        setQrImageUrl(null);
        setQrError(null);
        setQrLoading(true);
        try {
          const response = await api.get(`/supervisor/inspectpoints/${createdPoint.id}/qr`, {
            responseType: 'blob'
          });
          if (response.data && response.data.size > 0) {
            const blobUrl = URL.createObjectURL(response.data);
            setQrImageUrl(blobUrl);
            setQrError(null);
          } else {
            setQrError('QR code is empty or invalid.');
          }
        } catch (err: any) {
          console.error('Failed to load QR code:', err);
          setQrError(err?.response?.data?.detail || err?.message || 'Failed to load QR code');
        } finally {
          setQrLoading(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      const errorDetail = err?.response?.data?.detail || err?.message || "Unknown error";
      setErrorMsg(`Failed to create inspect point: ${errorDetail}`);
    }
  };

  const handleToggleActive = async (p: InspectPoint) => {
    try {
      await updateInspectPoint(p.id, { is_active: !p.is_active });
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this inspect point?")) return;
    try {
      await deleteInspectPoint(id);
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to delete inspect point");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Inspect Points</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          Define inspection checkpoints (QR-coded) and use them in patrol / inspection reports across all divisions.
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

      {/* Create form */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          border: `1px solid ${theme.colors.border}`,
          padding: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        <button
          onClick={() => setCreating((v) => !v)}
          style={{
            fontSize: 12,
            padding: "4px 12px",
            borderRadius: theme.radius.pill,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.surface,
            color: theme.colors.textMain,
            cursor: "pointer",
          }}
        >
          {creating ? "Cancel" : "Add Inspect Point"}
        </button>
        {creating && (
          <form
            onSubmit={handleCreate}
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 8,
            }}
          >
            <input
              style={{
                borderRadius: 12,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                padding: "8px 12px",
                fontSize: 13,
                color: theme.colors.textMain,
              }}
              placeholder="Name (e.g. Gate 1 Barrier)"
              value={newPoint.name || ""}
              onChange={(e) => setNewPoint((p) => ({ ...p, name: e.target.value }))}
            />
            <select
              style={{
                borderRadius: 12,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                padding: "8px 12px",
                fontSize: 13,
                color: theme.colors.textMain,
              }}
              value={newPoint.site_name || ""}
              onChange={(e) => setNewPoint((p) => ({ ...p, site_name: e.target.value }))}
              required
            >
              <option value="">Select Site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.name}>
                  {site.name}
                </option>
              ))}
            </select>
            <input
              style={{
                borderRadius: 12,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                padding: "8px 12px",
                fontSize: 13,
                color: theme.colors.textMain,
                fontFamily: "monospace",
              }}
              placeholder="Code (QR content)"
              value={newPoint.code || ""}
              onChange={(e) => setNewPoint((p) => ({ ...p, code: e.target.value }))}
            />
            <button
              type="submit"
              style={{
                borderRadius: 12,
                backgroundColor: theme.colors.primary,
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 12px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <textarea
              style={{
                gridColumn: "1 / -1",
                borderRadius: 12,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                padding: "8px 12px",
                fontSize: 13,
                color: theme.colors.textMain,
                resize: "vertical",
              }}
              placeholder="Description / instruction (optional)"
              rows={2}
              value={newPoint.description || ""}
              onChange={(e) => setNewPoint((p) => ({ ...p, description: e.target.value }))}
            />
          </form>
        )}
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
        ) : items.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.colors.textSoft }}>No inspect points.</div>
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
                  <th style={{ padding: "8px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Site</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Code</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>QR</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <td style={{ padding: "8px" }}>{p.name}</td>
                    <td style={{ padding: "8px" }}>{p.site_name}</td>
                    <td style={{ padding: "8px", fontFamily: "monospace" }}>{p.code}</td>
                    <td style={{ padding: "8px" }}>
                      <button
                        onClick={() => handleToggleActive(p)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: theme.radius.pill,
                          fontSize: 10,
                          backgroundColor: p.is_active
                            ? theme.colors.success + "20"
                            : theme.colors.border + "40",
                          color: p.is_active ? theme.colors.success : theme.colors.textMain,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <button
                        style={{
                          padding: "4px 8px",
                          borderRadius: theme.radius.pill,
                          border: `1px solid ${theme.colors.border}`,
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.textMain,
                          fontSize: 10,
                          cursor: "pointer",
                        }}
                        onClick={async () => {
                          console.log('Opening QR preview for inspect point:', p.id, p.code);
                          setQrPreview(p);
                          setQrImageUrl(null);
                          setQrError(null);
                          setQrLoading(true);
                          try {
                            console.log('Fetching QR code from:', `/supervisor/inspectpoints/${p.id}/qr`);
                            const response = await api.get(`/supervisor/inspectpoints/${p.id}/qr`, {
                              responseType: 'blob'
                            });
                            console.log('QR code response:', response.status, response.data?.size);
                            if (response.data && response.data.size > 0) {
                              const blobUrl = URL.createObjectURL(response.data);
                              console.log('Created blob URL:', blobUrl);
                              setQrImageUrl(blobUrl);
                              setQrError(null);
                            } else {
                              console.error('QR code blob is empty');
                              setQrError('QR code is empty');
                            }
                          } catch (err: any) {
                            console.error('Failed to load QR code:', err);
                            console.error('Error details:', err?.response?.data, err?.response?.status);
                            setQrError(err?.response?.data?.detail || err?.message || 'Failed to load QR code');
                            setQrImageUrl(null);
                          } finally {
                            setQrLoading(false);
                          }
                        }}
                      >
                        View QR
                      </button>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: theme.radius.pill,
                          border: `1px solid ${theme.colors.danger}`,
                          color: theme.colors.danger,
                          fontSize: 10,
                          backgroundColor: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        Delete
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
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => {
            setQrPreview(null);
            if (qrImageUrl) {
              URL.revokeObjectURL(qrImageUrl);
              setQrImageUrl(null);
            }
            setQrError(null);
            setQrLoading(false);
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
                <div style={{ fontSize: 14, fontWeight: 600 }}>{qrPreview.name}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: theme.colors.textMuted,
                    fontFamily: "monospace",
                  }}
                >
                  {qrPreview.code}
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
                  setQrError(null);
                  setQrLoading(false);
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
                minHeight: 216,
                alignItems: "center",
              }}
            >
              {qrLoading ? (
                <div
                  style={{
                    width: 192,
                    height: 192,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.colors.textMuted,
                    fontSize: 12,
                    gap: 8,
                  }}
                >
                  <div>Memuat QR code...</div>
                </div>
              ) : qrError ? (
                <div
                  style={{
                    width: 192,
                    height: 192,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.colors.danger,
                    fontSize: 11,
                    textAlign: "center",
                    padding: 12,
                  }}
                >
                  <div style={{ marginBottom: 8 }}>⚠️</div>
                  <div>{qrError}</div>
                  <button
                    onClick={async () => {
                      if (!qrPreview) return;
                      setQrLoading(true);
                      setQrError(null);
                      try {
                        const response = await api.get(`/supervisor/inspectpoints/${qrPreview.id}/qr`, {
                          responseType: 'blob'
                        });
                        if (response.data && response.data.size > 0) {
                          const blobUrl = URL.createObjectURL(response.data);
                          setQrImageUrl(blobUrl);
                          setQrError(null);
                        } else {
                          setQrError('QR code is empty');
                        }
                      } catch (err: any) {
                        console.error('Failed to load QR code:', err);
                        setQrError(err?.response?.data?.detail || err?.message || 'Failed to load QR code');
                      } finally {
                        setQrLoading(false);
                      }
                    }}
                    style={{
                      marginTop: 8,
                      padding: "4px 12px",
                      borderRadius: theme.radius.pill,
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.textMain,
                      fontSize: 10,
                      cursor: "pointer",
                    }}
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="QR"
                  style={{ width: 192, height: 192, objectFit: "contain" }}
                  onError={() => {
                    setQrError('Failed to display QR code image');
                    setQrImageUrl(null);
                  }}
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
                  Klik "View QR" untuk melihat QR code
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
                    download={`${qrPreview.code}.png`}
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

export default InspectPointListPage;

