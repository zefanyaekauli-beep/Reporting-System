// frontend/web/src/modules/security/pages/VisitorManagementPage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import {
  listVisitors,
  createVisitor,
  updateVisitor,
  deleteVisitor,
  checkInVisitor,
  checkOutVisitor,
  Visitor,
  VisitorCreate,
} from "../../../api/visitorApi";
import { listSites, Site } from "../../../api/supervisorApi";

export function VisitorManagementPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [formData, setFormData] = useState<VisitorCreate>({
    site_id: 0,
    name: "",
    company: "",
    id_card_number: "",
    id_card_type: "KTP",
    phone: "",
    email: "",
    purpose: "",
    category: "GUEST",
    visit_date: new Date().toISOString(),
    expected_duration_minutes: 60,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idCardPhotoFile, setIdCardPhotoFile] = useState<File | null>(null);

  const categories = ["GUEST", "CONTRACTOR", "VENDOR", "CLIENT", "OTHER"];

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {
        from_date: fromDate,
        to_date: toDate,
      };
      if (selectedSiteId) params.site_id = selectedSiteId;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const [visitorsData, sitesData] = await Promise.all([
        listVisitors(params),
        listSites(),
      ]);

      setVisitors(visitorsData);
      setSites(sitesData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to load visitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId, selectedCategory, selectedStatus, fromDate, toDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateVisitor(editingId, formData, photoFile || undefined, idCardPhotoFile || undefined);
      } else {
        await createVisitor(formData, photoFile || undefined, idCardPhotoFile || undefined);
      }
      setShowForm(false);
      setEditingId(null);
      setPhotoFile(null);
      setIdCardPhotoFile(null);
      setFormData({
        site_id: 0,
        name: "",
        company: "",
        id_card_number: "",
        id_card_type: "KTP",
        phone: "",
        email: "",
        purpose: "",
        category: "GUEST",
        visit_date: new Date().toISOString(),
        expected_duration_minutes: 60,
      });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to save visitor");
    }
  };

  const handleEdit = (visitor: Visitor) => {
    setEditingId(visitor.id);
    setFormData({
      site_id: visitor.site_id,
      name: visitor.name,
      company: visitor.company || "",
      id_card_number: visitor.id_card_number || "",
      id_card_type: visitor.id_card_type || "KTP",
      phone: visitor.phone || "",
      email: visitor.email || "",
      purpose: visitor.purpose || "",
      category: visitor.category || "GUEST",
      visit_date: visitor.visit_date,
      expected_duration_minutes: visitor.expected_duration_minutes || 60,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this visitor?")) return;
    try {
      await deleteVisitor(id);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to delete visitor");
    }
  };

  const handleCheckIn = async (id: number) => {
    try {
      await checkInVisitor(id);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to check in visitor");
    }
  };

  const handleCheckOut = async (id: number) => {
    try {
      await checkOutVisitor(id);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to check out visitor");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CHECKED_IN":
        return theme.colors.success;
      case "CHECKED_OUT":
        return theme.colors.info;
      case "REGISTERED":
        return theme.colors.warning;
      case "CANCELLED":
        return theme.colors.danger;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
            Visitor Management
          </h1>
          <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
            Register and manage visitors with check-in/check-out tracking
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
          + New Visitor
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
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
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
            <option value="">All Status</option>
            <option value="REGISTERED">Registered</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="CANCELLED">Cancelled</option>
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
              {editingId ? "Edit Visitor" : "Register Visitor"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Site *
                </label>
                <select
                  required
                  value={formData.site_id}
                  onChange={(e) => setFormData({ ...formData, site_id: parseInt(e.target.value) })}
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
                  <option value={0}>Select Site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
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
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company || ""}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
                  ID Card Number
                </label>
                <input
                  type="text"
                  value={formData.id_card_number || ""}
                  onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
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
                  ID Card Type
                </label>
                <select
                  value={formData.id_card_type || "KTP"}
                  onChange={(e) => setFormData({ ...formData, id_card_type: e.target.value })}
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
                  <option value="KTP">KTP</option>
                  <option value="SIM">SIM</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  Category
                </label>
                <select
                  value={formData.category || "GUEST"}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Visit Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.visit_date ? new Date(formData.visit_date).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setFormData({ ...formData, visit_date: new Date(e.target.value).toISOString() })}
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
                  Expected Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.expected_duration_minutes || 60}
                  onChange={(e) => setFormData({ ...formData, expected_duration_minutes: parseInt(e.target.value) || 60 })}
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

            <div>
              <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                Purpose
              </label>
              <textarea
                value={formData.purpose || ""}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
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

            {!editingId && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                    Visitor Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
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
                    ID Card Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIdCardPhotoFile(e.target.files?.[0] || null)}
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
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setPhotoFile(null);
                  setIdCardPhotoFile(null);
                  setFormData({
                    site_id: 0,
                    name: "",
                    company: "",
                    id_card_number: "",
                    id_card_type: "KTP",
                    phone: "",
                    email: "",
                    purpose: "",
                    category: "GUEST",
                    visit_date: new Date().toISOString(),
                    expected_duration_minutes: 60,
                  });
                }}
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
                {editingId ? "Update" : "Register"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visitors List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
          Loading...
        </div>
      ) : visitors.length === 0 ? (
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
          No visitors found
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
                  Name
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Company
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Category
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Visit Date
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Check In
                </th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textMuted }}>
                  Check Out
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
              {visitors.map((visitor, idx) => (
                <tr
                  key={visitor.id}
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    backgroundColor: idx % 2 === 0 ? theme.colors.surface : theme.colors.background,
                  }}
                >
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMain, fontWeight: 500 }}>
                    {visitor.name}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {visitor.company || "-"}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {visitor.category || "-"}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {new Date(visitor.visit_date).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {visitor.check_in_time ? new Date(visitor.check_in_time).toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: theme.colors.textMuted }}>
                    {visitor.check_out_time ? new Date(visitor.check_out_time).toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: theme.radius.badge,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: getStatusColor(visitor.status) + "20",
                        color: getStatusColor(visitor.status),
                      }}
                    >
                      {visitor.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                      {!visitor.is_checked_in && visitor.status === "REGISTERED" && (
                        <button
                          onClick={() => handleCheckIn(visitor.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: theme.radius.button,
                            backgroundColor: theme.colors.success + "20",
                            color: theme.colors.success,
                            border: "none",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          Check In
                        </button>
                      )}
                      {visitor.is_checked_in && !visitor.check_out_time && (
                        <button
                          onClick={() => handleCheckOut(visitor.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: theme.radius.button,
                            backgroundColor: theme.colors.info + "20",
                            color: theme.colors.info,
                            border: "none",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          Check Out
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(visitor)}
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
                        onClick={() => handleDelete(visitor.id)}
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

