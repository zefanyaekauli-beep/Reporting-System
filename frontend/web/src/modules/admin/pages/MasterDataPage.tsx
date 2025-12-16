// frontend/web/src/modules/admin/pages/MasterDataPage.tsx

import React, { useEffect, useState } from "react";
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

export function MasterDataPage() {
  const [data, setData] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [formData, setFormData] = useState<MasterDataCreate>({
    category: "",
    code: "",
    name: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });

  const categories = ["INCIDENT_TYPE", "INCIDENT_LEVEL", "REPORT_STATUS", "SITE_TYPE", "ZONE_TYPE", "VEHICLE_TYPE", "OTHER"];

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedDivision) params.division = selectedDivision;

      const result = await listMasterData(params);
      setData(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to load master data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedDivision]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updatePayload: MasterDataUpdate = {
          name: formData.name,
          description: formData.description,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        };
        await updateMasterData(editingId, updatePayload);
      } else {
        await createMasterData(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        category: "",
        code: "",
        name: "",
        description: "",
        sort_order: 0,
        is_active: true,
      });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to save master data");
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
      division: item.division,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this master data?")) return;
    try {
      await deleteMasterData(id);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to delete master data");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      category: "",
      code: "",
      name: "",
      description: "",
      sort_order: 0,
      is_active: true,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
            Master Data Management
          </h1>
          <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
            Manage master data categories and values for dropdowns and forms
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 20px",
            borderRadius: theme.radius.button,
            backgroundColor: theme.colors.primary,
            color: "white",
            border: "none",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + New Master Data
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
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
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
            <option value="PARKING">Parking</option>
          </select>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 16,
            boxShadow: theme.shadowCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain, marginBottom: 8 }}>
              {editingId ? "Edit Master Data" : "Create Master Data"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={!!editingId}
                  style={{
                    width: "100%",
                    borderRadius: theme.radius.input,
                    backgroundColor: editingId ? theme.colors.background + "80" : theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: theme.colors.textMain,
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

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
                    borderRadius: theme.radius.input,
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
                    borderRadius: theme.radius.input,
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
                  Division
                </label>
                <select
                  value={formData.division || ""}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value || undefined })}
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
                  <option value="PARKING">Parking</option>
                </select>
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
                    borderRadius: theme.radius.input,
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
                    borderRadius: theme.radius.input,
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
                  borderRadius: theme.radius.input,
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: theme.colors.textMain,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "8px 16px",
                  borderRadius: theme.radius.button,
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
                  borderRadius: theme.radius.button,
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
          No master data found
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
                  Category
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Code
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Name
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Division
                </th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Sort
                </th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Status
                </th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    backgroundColor: idx % 2 === 0 ? theme.colors.surface : theme.colors.background,
                  }}
                >
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain }}>
                    {item.category}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain, fontWeight: 500 }}>
                    {item.code}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {item.division || "-"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: 13, color: theme.colors.textMuted }}>
                    {item.sort_order}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: theme.radius.badge,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: item.is_active ? theme.colors.success + "20" : theme.colors.danger + "20",
                        color: item.is_active ? theme.colors.success : theme.colors.danger,
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
                          borderRadius: theme.radius.button,
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
                          borderRadius: theme.radius.button,
                          backgroundColor: theme.colors.danger + "20",
                          color: theme.colors.danger,
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
}

