// frontend/web/src/modules/supervisor/pages/PatrolTargetsPage.tsx

import React, { useEffect, useState } from "react";
import {
  listPatrolTargets,
  createPatrolTarget,
  PatrolTarget,
  PatrolTargetCreate,
} from "../../../api/patrolApi";
import { listSites, Site } from "../../../api/supervisorApi";
import { theme } from "../../shared/components/theme";

const PatrolTargetsPage: React.FC = () => {
  const [targets, setTargets] = useState<PatrolTarget[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    site_id: "",
    target_date: new Date().toISOString().split("T")[0],
    status: "",
  });
  const [formData, setFormData] = useState<PatrolTargetCreate>({
    site_id: 0,
    target_date: new Date().toISOString().split("T")[0],
    target_checkpoints: 10,
    target_patrols: 1,
  });

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [targetsData, sitesData] = await Promise.all([
        listPatrolTargets({
          site_id: filters.site_id ? parseInt(filters.site_id) : undefined,
          target_date: filters.target_date,
          status: filters.status || undefined,
        }),
        listSites(),
      ]);
      setTargets(targetsData);
      setSites(sitesData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load patrol targets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.target_date]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.site_id || formData.site_id <= 0) {
      setErrorMsg("Please select a site");
      return;
    }
    setSubmitting(true);
    try {
      await createPatrolTarget(formData);
      setShowCreateForm(false);
      setFormData({
        site_id: 0,
        target_date: new Date().toISOString().split("T")[0],
        target_checkpoints: 10,
        target_patrols: 1,
      });
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to create patrol target");
    } finally {
      setSubmitting(false);
    }
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
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Patrol Targets</h2>
          <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
            Manage daily patrol targets and track completion metrics.
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
          {showCreateForm ? "Cancel" : "Create Target"}
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
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Date</label>
          <input
            type="date"
            value={filters.target_date}
            onChange={(e) => setFilters({ ...filters, target_date: e.target.value })}
            style={{
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
          </select>
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
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Create Patrol Target</h3>
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
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Target Date *</label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
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
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                Target Checkpoints *
              </label>
              <input
                type="number"
                value={formData.target_checkpoints}
                onChange={(e) =>
                  setFormData({ ...formData, target_checkpoints: parseInt(e.target.value) })
                }
                required
                min={1}
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
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                Target Patrols
              </label>
              <input
                type="number"
                value={formData.target_patrols}
                onChange={(e) =>
                  setFormData({ ...formData, target_patrols: parseInt(e.target.value) || 1 })
                }
                min={1}
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
              <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                Target Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.target_duration_minutes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_duration_minutes: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  fontSize: 12,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 4,
                }}
              />
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
                {submitting ? "Creating..." : "Create Target"}
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
          Loading patrol targets...
        </div>
      ) : targets.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
          No patrol targets found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {targets.map((target) => (
            <div
              key={target.id}
              style={{
                padding: 12,
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {target.site_name} - {new Date(target.target_date).toLocaleDateString("id-ID")}
                  </div>
                  <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
                    Checkpoints: {target.completed_checkpoints} / {target.target_checkpoints} (
                    {target.completion_percentage.toFixed(1)}%)
                  </div>
                  {target.zone_name && (
                    <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                      Zone: {target.zone_name}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: "4px 8px",
                    fontSize: 11,
                    backgroundColor:
                      target.status === "COMPLETED"
                        ? "#10B981"
                        : target.status === "IN_PROGRESS"
                        ? "#F59E0B"
                        : "#EF4444",
                    color: "white",
                    borderRadius: 4,
                    fontWeight: 500,
                  }}
                >
                  {target.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatrolTargetsPage;

