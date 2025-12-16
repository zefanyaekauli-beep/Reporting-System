// frontend/web/src/modules/supervisor/pages/PatrolTeamsPage.tsx

import React, { useEffect, useState } from "react";
import {
  listPatrolTeams,
  createPatrolTeam,
  PatrolTeam,
  PatrolTeamCreate,
} from "../../../api/patrolApi";
import { listSites, Site, getOfficers, Officer } from "../../../api/supervisorApi";
import { theme } from "../../shared/components/theme";

const PatrolTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<PatrolTeam[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    site_id: "",
    division: "",
    is_active: "",
  });
  const [formData, setFormData] = useState<PatrolTeamCreate>({
    site_id: 0,
    name: "",
    division: "SECURITY",
    team_members: [],
  });

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [teamsData, sitesData, officersData] = await Promise.all([
        listPatrolTeams({
          site_id: filters.site_id ? parseInt(filters.site_id) : undefined,
          division: filters.division || undefined,
          is_active: filters.is_active ? filters.is_active === "true" : undefined,
        }),
        listSites(),
        getOfficers(),
      ]);
      setTeams(teamsData);
      setSites(sitesData);
      setOfficers(officersData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load patrol teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.site_id || formData.site_id <= 0) {
      setErrorMsg("Please select a site");
      return;
    }
    if (!formData.name.trim()) {
      setErrorMsg("Please enter team name");
      return;
    }
    if (formData.team_members.length === 0) {
      setErrorMsg("Please select at least one team member");
      return;
    }
    setSubmitting(true);
    try {
      await createPatrolTeam(formData);
      setShowCreateForm(false);
      setFormData({
        site_id: 0,
        name: "",
        division: "SECURITY",
        team_members: [],
      });
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to create patrol team");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMember = (officerId: number) => {
    const newMembers = [...formData.team_members];
    const index = newMembers.indexOf(officerId);
    if (index > -1) {
      newMembers.splice(index, 1);
    } else {
      newMembers.push(officerId);
    }
    setFormData({ ...formData, team_members: newMembers });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: "100%",
        paddingBottom: "2rem",
      }}
      className="overflow-y-auto"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Patrol Teams</h2>
          <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
            Manage patrol teams and assign members to routes.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: "8px 16px",
            fontSize: 12,
            backgroundColor: theme.colors.primary,
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {showCreateForm ? "Cancel" : "Create Team"}
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          padding: 12,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 8,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Site</label>
          <select
            value={filters.site_id}
            onChange={(e) => setFilters({ ...filters, site_id: e.target.value })}
            style={{
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
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
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Division</label>
          <select
            value={filters.division}
            onChange={(e) => setFilters({ ...filters, division: e.target.value })}
            style={{
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
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
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Status</label>
          <select
            value={filters.is_active}
            onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
            style={{
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={load}
            style={{
              padding: "4px 12px",
              fontSize: 12,
              backgroundColor: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div
          style={{
            padding: 16,
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: 8,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Create Patrol Team</h3>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Site *</label>
              <select
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: parseInt(e.target.value) })}
                required
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  fontSize: 12,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 4,
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
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Team Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  fontSize: 12,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Division *</label>
              <select
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  fontSize: 12,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 4,
                }}
              >
                <option value="SECURITY">Security</option>
                <option value="CLEANING">Cleaning</option>
                <option value="DRIVER">Driver</option>
                <option value="PARKING">Parking</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                Team Members * ({formData.team_members.length} selected)
              </label>
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 4,
                  padding: 8,
                }}
              >
                {officers.map((officer) => (
                  <label
                    key={officer.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: 4,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.team_members.includes(officer.id)}
                      onChange={() => toggleMember(officer.id)}
                    />
                    <span style={{ fontSize: 12 }}>
                      {officer.name} ({officer.division})
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  backgroundColor: theme.colors.primary,
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Creating..." : "Create Team"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  backgroundColor: "transparent",
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: 8,
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
          Loading patrol teams...
        </div>
      ) : teams.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
          No patrol teams found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {teams.map((team) => (
            <div
              key={team.id}
              style={{
                padding: 12,
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{team.name}</div>
                  <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
                    Division: {team.division} • Members: {team.team_members.length}
                  </div>
                  {team.assigned_routes && team.assigned_routes.length > 0 && (
                    <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                      Routes: {team.assigned_routes.length}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: "4px 8px",
                    fontSize: 11,
                    backgroundColor: team.is_active ? "#10B981" : "#EF4444",
                    color: "white",
                    borderRadius: 4,
                    fontWeight: 500,
                  }}
                >
                  {team.is_active ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatrolTeamsPage;

