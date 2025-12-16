// frontend/web/src/modules/supervisor/pages/PatrolTeamManagementPage.tsx

import React, { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import { listPatrolTeams, createPatrolTeam, PatrolTeam, PatrolTeamCreate } from "../../../api/patrolApi";
import { listSites, Site } from "../../../api/supervisorApi";
import { getOfficers, Officer } from "../../../api/supervisorApi";

export function PatrolTeamManagementPage() {
  const [teams, setTeams] = useState<PatrolTeam[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [formData, setFormData] = useState<PatrolTeamCreate>({
    site_id: 0,
    name: "",
    division: "SECURITY",
    team_members: [],
    assigned_routes: [],
    team_leader_id: undefined,
    description: "",
  });

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {};
      if (selectedSiteId) params.site_id = selectedSiteId;
      if (selectedDivision) params.division = selectedDivision;

      const [teamsData, sitesData, officersData] = await Promise.all([
        listPatrolTeams(params),
        listSites(),
        getOfficers(),
      ]);

      setTeams(teamsData);
      setSites(sitesData);
      setOfficers(officersData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to load patrol teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSiteId, selectedDivision]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPatrolTeam(formData);
      setShowForm(false);
      setFormData({
        site_id: 0,
        name: "",
        division: "SECURITY",
        team_members: [],
        assigned_routes: [],
        team_leader_id: undefined,
        description: "",
      });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to create patrol team");
    }
  };

  const toggleTeamMember = (officerId: number) => {
    const current = formData.team_members || [];
    if (current.includes(officerId)) {
      setFormData({ ...formData, team_members: current.filter((id) => id !== officerId) });
    } else {
      setFormData({ ...formData, team_members: [...current, officerId] });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
            Patrol Team Management
          </h1>
          <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
            Create and manage patrol teams with route assignments
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
          + New Team
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
          </select>
        </div>
      </div>

      {/* Create Form */}
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
              Create Patrol Team
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
                  Team Name *
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
                  Division *
                </label>
                <select
                  required
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
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
                  <option value="SECURITY">Security</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="DRIVER">Driver</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                  Team Leader
                </label>
                <select
                  value={formData.team_leader_id || ""}
                  onChange={(e) => setFormData({ ...formData, team_leader_id: e.target.value ? parseInt(e.target.value) : undefined })}
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
                  <option value="">Select Leader</option>
                  {officers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                Team Members *
              </label>
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.input,
                  padding: 8,
                  backgroundColor: theme.colors.background,
                }}
              >
                {officers.map((officer) => (
                  <label
                    key={officer.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(formData.team_members || []).includes(officer.id)}
                      onChange={() => toggleTeamMember(officer.id)}
                    />
                    <span style={{ fontSize: 12, color: theme.colors.textMain }}>{officer.name}</span>
                  </label>
                ))}
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
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    site_id: 0,
                    name: "",
                    division: "SECURITY",
                    team_members: [],
                    assigned_routes: [],
                    team_leader_id: undefined,
                    description: "",
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
                Create Team
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: theme.colors.textMuted }}>
          Loading...
        </div>
      ) : teams.length === 0 ? (
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
          No patrol teams found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {teams.map((team) => (
            <div
              key={team.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                padding: 16,
                boxShadow: theme.shadowCard,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textMain, marginBottom: 4 }}>
                    {team.name}
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>
                    Division: {team.division} | Members: {team.team_members.length}
                  </div>
                  <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                    Created: {new Date(team.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 8px",
                    borderRadius: theme.radius.badge,
                    fontSize: 11,
                    fontWeight: 500,
                    backgroundColor: team.is_active ? theme.colors.success + "20" : theme.colors.danger + "20",
                    color: team.is_active ? theme.colors.success : theme.colors.danger,
                  }}
                >
                  {team.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {team.team_members.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.colors.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textMain, marginBottom: 8 }}>
                    Team Members:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {team.team_members.map((memberId) => {
                      const officer = officers.find((o) => o.id === memberId);
                      return (
                        <span
                          key={memberId}
                          style={{
                            padding: "4px 8px",
                            borderRadius: theme.radius.badge,
                            fontSize: 11,
                            backgroundColor: theme.colors.background,
                            color: theme.colors.textMain,
                            border: `1px solid ${theme.colors.border}`,
                          }}
                        >
                          {officer?.name || `User ${memberId}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

