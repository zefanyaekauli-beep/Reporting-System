// frontend/web/src/modules/supervisor/pages/OfficerListPage.tsx

import React, { useEffect, useState } from "react";
import {
  Officer,
  getOfficers,
  createOfficer,
  updateOfficer,
  deleteOfficer,
} from "../../../api/supervisorApi";
import { theme } from "../../shared/components/theme";

const OfficerListPage: React.FC = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [creating, setCreating] = useState(false);
  const [divisionFilter, setDivisionFilter] = useState<string>(""); // Filter by division
  const [newOfficer, setNewOfficer] = useState<Partial<Officer>>({
    name: "",
    badge_id: "",
    position: "",
    division: "",
    status: "active",
  });

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {};
      if (divisionFilter) params.division = divisionFilter;
      const data = await getOfficers(params);
      setOfficers(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load officers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [divisionFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOfficer(newOfficer);
      setNewOfficer({
        name: "",
        badge_id: "",
        position: "",
        division: "",
        status: "active",
      });
      setCreating(false);
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to create officer");
    }
  };

  const handleStatusToggle = async (officer: Officer) => {
    try {
      await updateOfficer(officer.id, {
        status: officer.status === "active" ? "inactive" : "active",
      });
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this officer?")) return;
    try {
      await deleteOfficer(id);
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to delete officer");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Officer Management</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          List of all officers that can clock in/out, patrol, and do inspection across Security, Cleaning, and Parking divisions.
        </p>
      </div>

      {/* Division Filter */}
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          border: `1px solid ${theme.colors.border}`,
          padding: 12,
          boxShadow: theme.shadowCard,
        }}
      >
        <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
          Filter by Division
        </label>
        <select
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 300,
            borderRadius: 12,
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            padding: "8px 12px",
            fontSize: 13,
            color: theme.colors.textMain,
          }}
        >
          <option value="">All Divisions</option>
          <option value="security">Security</option>
          <option value="cleaning">Cleaning</option>
          <option value="parking">Parking</option>
          <option value="driver">Driver</option>
        </select>
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
          {creating ? "Cancel" : "Add Officer"}
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
              placeholder="Name"
              value={newOfficer.name || ""}
              onChange={(e) => setNewOfficer((o) => ({ ...o, name: e.target.value }))}
            />
            <input
              style={{
                borderRadius: 12,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                padding: "8px 12px",
                fontSize: 13,
                color: theme.colors.textMain,
              }}
              placeholder="Badge ID"
              value={newOfficer.badge_id || ""}
              onChange={(e) => setNewOfficer((o) => ({ ...o, badge_id: e.target.value }))}
            />
            <input
              style={{
                borderRadius: 12,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                padding: "8px 12px",
                fontSize: 13,
                color: theme.colors.textMain,
              }}
              placeholder="Position"
              value={newOfficer.position || ""}
              onChange={(e) => setNewOfficer((o) => ({ ...o, position: e.target.value }))}
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
              value={newOfficer.division || ""}
              onChange={(e) => setNewOfficer((o) => ({ ...o, division: e.target.value }))}
            >
              <option value="">Select Division</option>
              <option value="security">Security</option>
              <option value="cleaning">Cleaning</option>
              <option value="parking">Parking</option>
            </select>
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
        ) : officers.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.colors.textSoft }}>No officers yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.background,
                  }}
                >
                  <th style={{ padding: "8px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Badge</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Position</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Division</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((o) => (
                  <tr
                    key={o.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <td style={{ padding: "8px" }}>{o.name}</td>
                    <td style={{ padding: "8px" }}>{o.badge_id}</td>
                    <td style={{ padding: "8px" }}>{o.position}</td>
                    <td style={{ padding: "8px" }}>{o.division}</td>
                    <td style={{ padding: "8px" }}>
                      <button
                        onClick={() => handleStatusToggle(o)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: theme.radius.pill,
                          fontSize: 10,
                          backgroundColor:
                            o.status === "active"
                              ? theme.colors.success + "20"
                              : theme.colors.border + "40",
                          color:
                            o.status === "active" ? theme.colors.success : theme.colors.textMain,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {o.status}
                      </button>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <button
                        onClick={() => handleDelete(o.id)}
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
    </div>
  );
};

export default OfficerListPage;

