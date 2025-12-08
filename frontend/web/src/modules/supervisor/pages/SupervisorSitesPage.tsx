// frontend/web/src/modules/supervisor/pages/SupervisorSitesPage.tsx

import { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import { listSites, createSite, Site, SiteCreate, getSiteQrCodeUrl } from "../../../api/supervisorApi";
import { useToast } from "../../shared/components/Toast";
import api from "../../../api/client";

export function SupervisorSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrImageUrls, setQrImageUrls] = useState<Record<number, string>>({});
  const { showToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<SiteCreate>({
    name: "",
    address: "",
    lat: undefined,
    lng: undefined,
    geofence_radius_m: 100.0,
    qr_code: undefined,
  });

  useEffect(() => {
    loadSites();
  }, []);
  
  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(qrImageUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [qrImageUrls]);

  const loadSites = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await listSites();
      setSites(data);
      
      // Load QR code images for each site
      const qrUrls: Record<number, string> = {};
      for (const site of data) {
        try {
          const response = await api.get(`/supervisor/sites/${site.id}/qr`, {
            responseType: 'blob'
          });
          const blobUrl = URL.createObjectURL(response.data);
          qrUrls[site.id] = blobUrl;
        } catch (err) {
          console.error(`Failed to load QR for site ${site.id}:`, err);
        }
      }
      setQrImageUrls(qrUrls);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal memuat data sites");
      showToast("Gagal memuat data sites", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setErrorMsg("Nama site wajib diisi");
        setSubmitting(false);
        return;
      }

      const newSite = await createSite(formData);
      showToast(`Site "${newSite.name}" berhasil dibuat`, "success");
      setShowAddForm(false);
      setFormData({
        name: "",
        address: "",
        lat: undefined,
        lng: undefined,
        geofence_radius_m: 100.0,
        qr_code: undefined,
      });
      await loadSites(); // Reload sites list
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || "Gagal membuat site";
      setErrorMsg(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          showToast("Koordinat GPS berhasil diambil", "success");
        },
        (error) => {
          console.error("Error getting location:", error);
          showToast("Gagal mengambil koordinat GPS", "error");
        },
        { enableHighAccuracy: true }
      );
    } else {
      showToast("Browser tidak mendukung GPS", "error");
    }
  };

  return (
    <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header with Add Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textMain }}>
            Daftar Site
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: "8px 16px",
              borderRadius: theme.radius.card,
              border: "none",
              backgroundColor: theme.colors.primary,
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>➕</span>
            <span>Tambah Site</span>
          </button>
        </div>

        {errorMsg && !showAddForm && (
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

        {/* Add Site Form Modal */}
        {showAddForm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16,
            }}
            onClick={() => {
              if (!submitting) {
                setShowAddForm(false);
                setErrorMsg("");
              }
            }}
          >
            <div
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                padding: 20,
                maxWidth: 500,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: theme.shadowCard,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textMain }}>
                  Tambah Site Baru
                </h3>
                <button
                  onClick={() => {
                    if (!submitting) {
                      setShowAddForm(false);
                      setErrorMsg("");
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 20,
                    color: theme.colors.textMuted,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                  disabled={submitting}
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div
                  style={{
                    backgroundColor: theme.colors.danger + "20",
                    border: `1px solid ${theme.colors.danger}`,
                    color: theme.colors.danger,
                    fontSize: 12,
                    borderRadius: theme.radius.card,
                    padding: "8px 12px",
                    marginBottom: 16,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Site Name */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: theme.colors.textMain,
                        marginBottom: 6,
                      }}
                    >
                      Nama Site <span style={{ color: theme.colors.danger }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: theme.radius.card,
                        border: `1px solid ${theme.colors.border}`,
                        fontSize: 13,
                        color: theme.colors.textMain,
                      }}
                      placeholder="Contoh: Gedung A, Gate 1"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: theme.colors.textMain,
                        marginBottom: 6,
                      }}
                    >
                      Alamat
                    </label>
                    <textarea
                      value={formData.address || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: theme.radius.card,
                        border: `1px solid ${theme.colors.border}`,
                        fontSize: 13,
                        color: theme.colors.textMain,
                        resize: "vertical",
                      }}
                      placeholder="Alamat lengkap site"
                    />
                  </div>

                  {/* GPS Coordinates */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: theme.colors.textMain,
                        }}
                      >
                        Koordinat GPS
                      </label>
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        style={{
                          padding: "4px 8px",
                          fontSize: 11,
                          borderRadius: theme.radius.pill,
                          border: `1px solid ${theme.colors.border}`,
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.primary,
                          cursor: "pointer",
                        }}
                      >
                        📍 Ambil Lokasi Saat Ini
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 11,
                            color: theme.colors.textMuted,
                            marginBottom: 4,
                          }}
                        >
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.lat || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lat: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: theme.radius.card,
                            border: `1px solid ${theme.colors.border}`,
                            fontSize: 12,
                            color: theme.colors.textMain,
                          }}
                          placeholder="-6.200000"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 11,
                            color: theme.colors.textMuted,
                            marginBottom: 4,
                          }}
                        >
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.lng || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lng: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: theme.radius.card,
                            border: `1px solid ${theme.colors.border}`,
                            fontSize: 12,
                            color: theme.colors.textMain,
                          }}
                          placeholder="106.816666"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Geofence Radius */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: theme.colors.textMain,
                        marginBottom: 6,
                      }}
                    >
                      Radius Geofence (meter)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      step="10"
                      value={formData.geofence_radius_m || 100}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          geofence_radius_m: e.target.value
                            ? parseFloat(e.target.value)
                            : 100.0,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: theme.radius.card,
                        border: `1px solid ${theme.colors.border}`,
                        fontSize: 13,
                        color: theme.colors.textMain,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.colors.textMuted,
                        marginTop: 4,
                      }}
                    >
                      Jarak maksimum dari koordinat untuk validasi check-in (default: 100m)
                    </div>
                  </div>

                  {/* QR Code (Optional - auto-generated if not provided) */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: theme.colors.textMain,
                        marginBottom: 6,
                      }}
                    >
                      QR Code (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.qr_code || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, qr_code: e.target.value || undefined })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: theme.radius.card,
                        border: `1px solid ${theme.colors.border}`,
                        fontSize: 13,
                        color: theme.colors.textMain,
                      }}
                      placeholder="Kosongkan untuk auto-generate"
                    />
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.colors.textMuted,
                        marginTop: 4,
                      }}
                    >
                      QR code akan otomatis dibuat jika dikosongkan
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!submitting) {
                          setShowAddForm(false);
                          setErrorMsg("");
                        }
                      }}
                      disabled={submitting}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: theme.radius.card,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.textMain,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.6 : 1,
                      }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: theme.radius.card,
                        border: "none",
                        backgroundColor: submitting
                          ? theme.colors.textMuted
                          : theme.colors.primary,
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: submitting ? "not-allowed" : "pointer",
                      }}
                    >
                      {submitting ? "Menyimpan..." : "Simpan & Generate QR"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sites List */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              fontSize: 13,
              color: theme.colors.textMuted,
              padding: 40,
            }}
          >
            Memuat data...
          </div>
        ) : sites.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: theme.colors.textMuted,
              fontSize: 13,
            }}
          >
            Tidak ada site. Klik "Tambah Site" untuk menambahkan.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sites.map((site) => (
              <div
                key={site.id}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.card,
                  padding: 16,
                  boxShadow: theme.shadowCard,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: theme.colors.textMain,
                        marginBottom: 4,
                      }}
                    >
                      {site.name}
                    </div>
                    {site.address && (
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.colors.textMuted,
                          marginBottom: 4,
                        }}
                      >
                        📍 {site.address}
                      </div>
                    )}
                    {(site.lat && site.lng) && (
                      <div
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSoft,
                          fontFamily: "monospace",
                          marginBottom: 4,
                        }}
                      >
                        🗺️ {site.lat.toFixed(6)}, {site.lng.toFixed(6)}
                        {site.geofence_radius_m && ` (Radius: ${site.geofence_radius_m}m)`}
                      </div>
                    )}
                    {site.qr_code && (
                      <div
                        style={{
                          fontSize: 11,
                          color: theme.colors.textSoft,
                          fontFamily: "monospace",
                          marginBottom: 8,
                        }}
                      >
                        🔐 QR Code: {site.qr_code}
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Image */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: 12,
                    backgroundColor: theme.colors.background,
                    borderRadius: theme.radius.card,
                    marginBottom: 12,
                  }}
                >
                  {qrImageUrls[site.id] ? (
                    <img
                      src={qrImageUrls[site.id]}
                      alt={`QR Code for ${site.name}`}
                      style={{
                        width: "200px",
                        height: "200px",
                        border: `2px solid ${theme.colors.border}`,
                        borderRadius: 8,
                        padding: 8,
                        backgroundColor: "#fff",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "200px",
                        height: "200px",
                        border: `2px solid ${theme.colors.border}`,
                        borderRadius: 8,
                        padding: 8,
                        backgroundColor: "#fff",
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
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.colors.textMuted,
                      textAlign: "center",
                    }}
                  >
                    Scan QR code ini untuk check-in/check-out di site ini
                  </div>
                </div>

                {/* Download button */}
                {qrImageUrls[site.id] && (
                  <a
                    href={qrImageUrls[site.id]}
                    download={`QR_${site.name.replace(/\s+/g, "_")}.png`}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "10px",
                      borderRadius: theme.radius.card,
                      backgroundColor: theme.colors.primary,
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    📥 Download QR Code
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
