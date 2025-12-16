// frontend/web/src/modules/admin/pages/MasterDataSitesPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../shared/components/theme";
import { listSites, createSite, updateSite, deleteSite, Site } from "../../../api/supervisorApi";

const MasterDataSitesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    geofence_radius_m: "100",
  });

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await listSites();
      setSites(data || []);
    } catch (err: any) {
      console.error("Error loading sites:", err);
      setErrorMsg(`Failed to load: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg("");
      setSuccessMsg("");
      const payload = {
        name: formData.name,
        address: formData.address || undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        geofence_radius_m: formData.geofence_radius_m ? parseFloat(formData.geofence_radius_m) : undefined,
      };

      if (editingId) {
        await updateSite(editingId, payload);
        setSuccessMsg("Site updated successfully");
      } else {
        await createSite(payload);
        setSuccessMsg("Site created successfully");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", address: "", lat: "", lng: "", geofence_radius_m: "100" });
      await load();
    } catch (err: any) {
      setErrorMsg(`Failed to save: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
    }
  };

  const handleEdit = (site: Site) => {
    setEditingId(site.id);
    setFormData({
      name: site.name,
      address: site.address || "",
      lat: site.lat?.toString() || "",
      lng: site.lng?.toString() || "",
      geofence_radius_m: site.geofence_radius_m?.toString() || "100",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this site?")) return;
    try {
      await deleteSite(id);
      setSuccessMsg("Site deleted successfully");
      await load();
    } catch (err: any) {
      setErrorMsg(`Failed to delete: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", address: "", lat: "", lng: "", geofence_radius_m: "100" });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: "100%",
        padding: "16px",
        paddingBottom: "2rem",
        backgroundColor: theme.colors.background,
      }}
      className="overflow-y-auto"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <button
          onClick={() => navigate("/supervisor/admin/master-data")}
          style={{
            padding: "8px 12px",
            backgroundColor: theme.colors.backgroundSecondary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Sites Management</h2>
          <p style={{ fontSize: 12, color: theme.colors.textMuted }}>Manage sites and locations</p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            + New Site
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: 12,
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: 12,
            backgroundColor: "#D1FAE5",
            color: "#065F46",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            padding: 16,
            borderRadius: 8,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain, marginBottom: 8 }}>
              {editingId ? "Edit Site" : "Create Site"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: 6,
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
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: 6,
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
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: 6,
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
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: 6,
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
                  Geofence Radius (meters)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.geofence_radius_m}
                  onChange={(e) => setFormData({ ...formData, geofence_radius_m: e.target.value })}
                  style={{
                    width: "100%",
                    borderRadius: 6,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.textMain,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  backgroundColor: theme.colors.primary,
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>Loading...</div>
      ) : sites.length === 0 ? (
        <div
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: 8,
            padding: 40,
            textAlign: "center",
            color: theme.colors.textMuted,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          No sites found
        </div>
      ) : (
        <div
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: 8,
            overflow: "hidden",
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: theme.colors.background, borderBottom: `1px solid ${theme.colors.border}` }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Address</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Coordinates</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Geofence</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site, idx) => (
                <tr
                  key={site.id}
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    backgroundColor: idx % 2 === 0 ? theme.colors.backgroundSecondary : theme.colors.background,
                  }}
                >
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain, fontWeight: 500 }}>{site.name}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain }}>{site.address || "-"}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {site.lat && site.lng ? `${site.lat}, ${site.lng}` : "-"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: 13, color: theme.colors.textMuted }}>
                    {site.geofence_radius_m ? `${site.geofence_radius_m}m` : "-"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button
                        onClick={() => handleEdit(site)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          backgroundColor: theme.colors.primary + "20",
                          color: theme.colors.primary,
                          border: "none",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(site.id)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          backgroundColor: "#FEE2E2",
                          color: "#DC2626",
                          border: "none",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MasterDataSitesPage;

