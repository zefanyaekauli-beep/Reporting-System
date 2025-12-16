// frontend/web/src/modules/admin/pages/MasterDataVisitorCategoriesPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../shared/components/theme";
import {
  listMasterData,
  createMasterData,
  updateMasterData,
  deleteMasterData,
  MasterData,
  MasterDataCreate,
  MasterDataUpdate,
} from "../../../api/masterDataApi";

const MasterDataVisitorCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MasterDataCreate>({
    category: "VISITOR_CATEGORY",
    code: "",
    name: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await listMasterData({ category: "VISITOR_CATEGORY" });
      setCategories(data || []);
    } catch (err: any) {
      console.error("Error loading visitor categories:", err);
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
      if (editingId) {
        const updatePayload: MasterDataUpdate = {
          name: formData.name,
          description: formData.description,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        };
        await updateMasterData(editingId, updatePayload);
        setSuccessMsg("Visitor category updated successfully");
      } else {
        await createMasterData(formData);
        setSuccessMsg("Visitor category created successfully");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        category: "VISITOR_CATEGORY",
        code: "",
        name: "",
        description: "",
        sort_order: 0,
        is_active: true,
      });
      await load();
    } catch (err: any) {
      setErrorMsg(`Failed to save: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
    }
  };

  const handleEdit = (item: MasterData) => {
    setEditingId(item.id);
    setFormData({
      category: item.category,
      code: item.code,
      name: item.name,
      description: item.description || "",
      sort_order: item.sort_order,
      is_active: item.is_active,
      division: item.division || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this visitor category?")) return;
    try {
      await deleteMasterData(id);
      setSuccessMsg("Visitor category deleted successfully");
      await load();
    } catch (err: any) {
      setErrorMsg(`Failed to delete: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      category: "VISITOR_CATEGORY",
      code: "",
      name: "",
      description: "",
      sort_order: 0,
      is_active: true,
    });
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
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Visitor Categories Management</h2>
          <p style={{ fontSize: 12, color: theme.colors.textMuted }}>Manage visitor categories (Guest, Contractor, Vendor, etc.)</p>
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
            + New Category
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
              {editingId ? "Edit Visitor Category" : "Create Visitor Category"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  disabled={!!editingId}
                  style={{
                    width: "100%",
                    borderRadius: 6,
                    backgroundColor: editingId ? theme.colors.background + "80" : theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                />
              </div>

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
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
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
                  Active
                </label>
                <select
                  value={formData.is_active ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                  style={{
                    width: "100%",
                    borderRadius: 6,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  borderRadius: 6,
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: theme.colors.textMain,
                  resize: "vertical",
                }}
              />
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
      ) : categories.length === 0 ? (
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
          No visitor categories found
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
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Code</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Name</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Sort</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Status</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    backgroundColor: idx % 2 === 0 ? theme.colors.backgroundSecondary : theme.colors.background,
                  }}
                >
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain, fontWeight: 500 }}>{item.code}</td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain }}>{item.name}</td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: 13, color: theme.colors.textMuted }}>{item.sort_order}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: item.is_active ? "#D1FAE5" : "#FEE2E2",
                        color: item.is_active ? "#065F46" : "#DC2626",
                      }}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button
                        onClick={() => handleEdit(item)}
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
                        onClick={() => handleDelete(item.id)}
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

export default MasterDataVisitorCategoriesPage;

