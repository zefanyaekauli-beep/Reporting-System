// frontend/web/src/modules/supervisor/pages/SupervisorChecklistTemplatePage.tsx

import { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import {
  listChecklistTemplates,
  createChecklistTemplate,
  updateChecklistTemplate,
  deleteChecklistTemplate,
  ChecklistTemplate,
  ChecklistTemplateItemCreate,
  listSites,
  Site,
} from "../../../api/supervisorApi";

export function SupervisorChecklistTemplatePage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);

  // Filters
  const [divisionFilter, setDivisionFilter] = useState<string>("");
  const [siteIdFilter, setSiteIdFilter] = useState<number | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    site_id: undefined as number | undefined,
    division: "SECURITY",
    role: "",
    shift_type: "",
    is_active: true,
    items: [] as ChecklistTemplateItemCreate[],
  });

  useEffect(() => {
    loadSites();
    loadTemplates();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [divisionFilter, siteIdFilter, activeFilter]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {};
      if (divisionFilter) params.division = divisionFilter;
      if (siteIdFilter) params.site_id = siteIdFilter;
      if (activeFilter !== undefined) params.is_active = activeFilter;

      const data = await listChecklistTemplates(params);
      setTemplates(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal memuat data templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      site_id: undefined,
      division: "SECURITY",
      role: "",
      shift_type: "",
      is_active: true,
      items: [],
    });
    setShowModal(true);
  };

  const handleEdit = (template: ChecklistTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      site_id: template.site_id || undefined,
      division: template.division,
      role: template.role || "",
      shift_type: template.shift_type || "",
      is_active: template.is_active,
      items: template.items.map((item) => ({
        order: item.order,
        title: item.title,
        description: item.description || "",
        required: item.required,
        evidence_type: item.evidence_type,
        kpi_key: item.kpi_key || "",
        answer_type: item.answer_type || "",
        photo_required: item.photo_required,
      })),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus template ini?")) {
      return;
    }

    try {
      await deleteChecklistTemplate(id);
      await loadTemplates();
      setErrorMsg("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal menghapus template");
    }
  };

  const handleSave = async () => {
    try {
      // Clean up empty strings to null/undefined for optional fields
      const cleanedItems = formData.items
        .filter((item) => item.title.trim() !== "")
        .map((item) => ({
          ...item,
          description: item.description?.trim() || null,
          kpi_key: item.kpi_key?.trim() || null,
          answer_type: item.answer_type?.trim() || null,
        }));

      const payload = {
        name: formData.name,
        site_id: formData.site_id || null,
        division: formData.division,
        role: formData.role?.trim() || null,
        shift_type: formData.shift_type?.trim() || null,
        is_active: formData.is_active,
        items: cleanedItems,
      };

      if (editingTemplate) {
        await updateChecklistTemplate(editingTemplate.id, payload);
      } else {
        await createChecklistTemplate(payload);
      }

      setShowModal(false);
      await loadTemplates();
      setErrorMsg("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.detail || "Gagal menyimpan template");
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          order: formData.items.length + 1,
          title: "",
          description: "",
          required: true,
          evidence_type: "none",
          kpi_key: "",
          answer_type: "",
          photo_required: false,
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    // Reorder items
    newItems.forEach((item, i) => {
      item.order = i + 1;
    });
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const getDivisionColor = (div: string) => {
    switch (div.toUpperCase()) {
      case "SECURITY":
        return theme.colors.primary;
      case "CLEANING":
        return theme.colors.success;
      case "DRIVER":
        return theme.colors.warning;
      case "PARKING":
        return theme.colors.warning;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
          Checklist Template Management
        </h1>
        <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
          Kelola template checklist untuk semua divisi (Security, Cleaning, Driver, Parking)
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          padding: 12,
          marginBottom: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: showFilters ? 12 : 0,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain }}>
              Filters
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleCreate}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                borderRadius: theme.radius.pill,
                border: `1px solid ${theme.colors.success}`,
                backgroundColor: theme.colors.success,
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              ➕ Create Template
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                borderRadius: theme.radius.pill,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMain,
                cursor: "pointer",
              }}
            >
              {showFilters ? "Hide" : "Show"} Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Division
              </label>
              <select
                value={divisionFilter}
                onChange={(e) => setDivisionFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
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
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Site
              </label>
              <select
                value={siteIdFilter || ""}
                onChange={(e) => setSiteIdFilter(e.target.value ? Number(e.target.value) : undefined)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              >
                <option value="">All Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                Status
              </label>
              <select
                value={activeFilter === undefined ? "" : activeFilter ? "true" : "false"}
                onChange={(e) => setActiveFilter(e.target.value === "" ? undefined : e.target.value === "true")}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
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

      {/* Templates List */}
      {loading ? (
        <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 20 }}>
          Loading...
        </div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 20 }}>
          No templates found
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                border: `1px solid ${theme.colors.borderStrong}`,
                padding: 16,
                boxShadow: theme.shadowCard,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain, marginBottom: 4 }}>
                    {template.name}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: theme.radius.pill,
                        backgroundColor: getDivisionColor(template.division) + "20",
                        color: getDivisionColor(template.division),
                        fontWeight: 600,
                      }}
                    >
                      {template.division}
                    </span>
                    {template.is_active ? (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: theme.radius.pill,
                          backgroundColor: theme.colors.success + "20",
                          color: theme.colors.success,
                        }}
                      >
                        Active
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: theme.radius.pill,
                          backgroundColor: theme.colors.textMuted + "20",
                          color: theme.colors.textMuted,
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 8 }}>
                <div>Site: {template.site_name || "Global"}</div>
                {template.role && <div>Role: {template.role}</div>}
                {template.shift_type && <div>Shift: {template.shift_type}</div>}
                <div>Items: {template.items.length}</div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => handleEdit(template)}
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    fontSize: 11,
                    borderRadius: 4,
                    border: `1px solid ${theme.colors.primary}`,
                    backgroundColor: "transparent",
                    color: theme.colors.primary,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    fontSize: 11,
                    borderRadius: 4,
                    border: `1px solid ${theme.colors.danger}`,
                    backgroundColor: "transparent",
                    color: theme.colors.danger,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: 24,
              maxWidth: 800,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                    Division *
                  </label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 8,
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: 13,
                    }}
                  >
                    <option value="SECURITY">Security</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="DRIVER">Driver</option>
                    <option value="PARKING">Parking</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                    Site (optional)
                  </label>
                  <select
                    value={formData.site_id || ""}
                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value ? Number(e.target.value) : undefined })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 8,
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: 13,
                    }}
                  >
                    <option value="">Global (All Sites)</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                    Role (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="guard, cleaner, driver"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 8,
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                    Shift Type (optional)
                  </label>
                  <select
                    value={formData.shift_type}
                    onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 8,
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: 13,
                    }}
                  >
                    <option value="">All Shifts</option>
                    <option value="MORNING">Morning</option>
                    <option value="NIGHT">Night</option>
                    <option value="DAY">Day</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 11, color: theme.colors.textMuted }}>
                    Checklist Items *
                  </label>
                  <button
                    onClick={addItem}
                    style={{
                      padding: "4px 8px",
                      fontSize: 11,
                      borderRadius: 4,
                      border: `1px solid ${theme.colors.success}`,
                      backgroundColor: theme.colors.success,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    ➕ Add Item
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflow: "auto" }}>
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: 8,
                        padding: 12,
                        backgroundColor: theme.colors.background,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: theme.colors.textMuted }}>Item #{item.order}</span>
                        <button
                          onClick={() => removeItem(index)}
                          style={{
                            padding: "2px 6px",
                            fontSize: 10,
                            borderRadius: 4,
                            border: `1px solid ${theme.colors.danger}`,
                            backgroundColor: "transparent",
                            color: theme.colors.danger,
                            cursor: "pointer",
                          }}
                        >
                          ✕ Remove
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input
                          type="text"
                          placeholder="Item title *"
                          value={item.title}
                          onChange={(e) => updateItem(index, "title", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: 4,
                            border: `1px solid ${theme.colors.border}`,
                            fontSize: 12,
                          }}
                        />
                        <textarea
                          placeholder="Description (optional)"
                          value={item.description || ""}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: 4,
                            border: `1px solid ${theme.colors.border}`,
                            fontSize: 12,
                            minHeight: 60,
                          }}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <select
                            value={item.evidence_type}
                            onChange={(e) => updateItem(index, "evidence_type", e.target.value)}
                            style={{
                              padding: "6px",
                              borderRadius: 4,
                              border: `1px solid ${theme.colors.border}`,
                              fontSize: 12,
                            }}
                          >
                            <option value="none">No Evidence</option>
                            <option value="photo">Photo</option>
                            <option value="note">Note</option>
                            <option value="patrol_log">Patrol Log</option>
                            <option value="asset_scan">Asset Scan</option>
                          </select>
                          <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                            <input
                              type="checkbox"
                              checked={item.required}
                              onChange={(e) => updateItem(index, "required", e.target.checked)}
                            />
                            Required
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || formData.items.length === 0}
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: !formData.name || formData.items.length === 0 ? theme.colors.border : theme.colors.success,
                    color: "#fff",
                    cursor: !formData.name || formData.items.length === 0 ? "not-allowed" : "pointer",
                    opacity: !formData.name || formData.items.length === 0 ? 0.6 : 1,
                  }}
                >
                  {editingTemplate ? "Update" : "Create"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontSize: 13,
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textMain,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

