// frontend/web/src/modules/supervisor/pages/AdminRolesPage.tsx

import React, { useEffect, useState } from "react";
import { listRoles, listPermissions, updateRolePermissions, getRolePermissions, Role, Permission } from "../../../api/adminApi";
import { theme } from "../../shared/components/theme";

const AdminRolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [rolesData, permsData] = await Promise.all([
        listRoles(),
        listPermissions(),
      ]);
      console.log("Loaded roles:", rolesData);
      console.log("Loaded permissions:", permsData);
      setRoles(rolesData || []);
      setPermissions(permsData || []);
      
      if (!permsData || permsData.length === 0) {
        setErrorMsg("No permissions found. Please run the script to create default permissions: python backend/scripts/create_default_permissions.py");
      }
    } catch (err: any) {
      console.error("Error loading data:", err);
      setErrorMsg(`Failed to load: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelectRole = async (role: Role) => {
    setSelectedRole(role);
    setErrorMsg("");
    try {
      const rolePerms = await getRolePermissions(role.id);
      console.log("Loaded role permissions:", rolePerms);
      setRolePermissions(new Set(rolePerms.map(p => p.id)));
    } catch (err: any) {
      console.error("Failed to load role permissions:", err);
      setErrorMsg(`Failed to load permissions: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
      setRolePermissions(new Set());
    }
  };

  const togglePermission = (permId: number) => {
    const newSet = new Set(rolePermissions);
    if (newSet.has(permId)) {
      newSet.delete(permId);
    } else {
      newSet.add(permId);
    }
    setRolePermissions(newSet);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await updateRolePermissions(selectedRole.id, Array.from(rolePermissions));
      setErrorMsg("");
      alert("Permissions updated successfully");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to update role permissions");
    } finally {
      setSaving(false);
    }
  };

  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

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
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Role & Permission Management</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          Manage roles and assign permissions. Select a role to view and edit its permissions.
        </p>
      </div>

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
          Loading...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
          {/* Roles List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              backgroundColor: theme.colors.backgroundSecondary,
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Roles</h3>
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => handleSelectRole(role)}
                style={{
                  padding: 12,
                  backgroundColor: selectedRole?.id === role.id ? theme.colors.primary + "20" : "transparent",
                  borderRadius: 4,
                  cursor: "pointer",
                  border: `1px solid ${selectedRole?.id === role.id ? theme.colors.primary : theme.colors.border}`,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500 }}>{role.display_name || role.name}</div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{role.name}</div>
                {role.description && (
                  <div style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 4 }}>
                    {role.description}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 10,
                    color: role.is_active ? "#10B981" : "#EF4444",
                    marginTop: 4,
                  }}
                >
                  {role.is_active ? "Active" : "Inactive"}
                </div>
              </div>
            ))}
          </div>

          {/* Permissions Editor */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              backgroundColor: theme.colors.backgroundSecondary,
              padding: 16,
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            {selectedRole ? (
              <>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                    Permissions for: {selectedRole.display_name || selectedRole.name}
                  </h3>
                  <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
                    Select permissions to assign to this role ({rolePermissions.size} selected)
                  </p>
                </div>

                {permissions.length === 0 ? (
                  <div style={{ padding: 16, textAlign: "center", color: theme.colors.textMuted }}>
                    <div style={{ marginBottom: 8 }}>No permissions available.</div>
                    <div style={{ fontSize: 10 }}>
                      Please run: <code>python backend/scripts/create_default_permissions.py</code>
                    </div>
                  </div>
                ) : Object.keys(permissionsByResource).length === 0 ? (
                  <div style={{ padding: 16, textAlign: "center", color: theme.colors.textMuted }}>
                    No permissions grouped by resource. Check console for details.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "60vh", overflowY: "auto" }}>
                    {Object.entries(permissionsByResource).map(([resource, perms]) => (
                    <div key={resource} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                        {resource}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: 8,
                              backgroundColor: theme.colors.background,
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={rolePermissions.has(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 500 }}>
                                {perm.action.toUpperCase()}
                              </div>
                              {perm.description && (
                                <div style={{ fontSize: 10, color: theme.colors.textMuted }}>
                                  {perm.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  </div>
                )}
                
                {permissions.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={handleSavePermissions}
                    disabled={saving}
                    style={{
                      padding: "8px 16px",
                      fontSize: 12,
                      backgroundColor: theme.colors.primary,
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? "Saving..." : "Save Permissions"}
                  </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
                Select a role to manage its permissions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRolesPage;

