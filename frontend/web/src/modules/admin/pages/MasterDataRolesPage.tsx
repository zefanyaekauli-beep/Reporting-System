// frontend/web/src/modules/admin/pages/MasterDataRolesPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../shared/components/theme";
import {
  listRoles,
  listPermissions,
  updateRolePermissions,
  getRolePermissions,
  listUsers,
  updateUserRole,
  Role,
  Permission,
  User,
} from "../../../api/adminApi";

const MasterDataRolesPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showUserRoleForm, setShowUserRoleForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [rolesData, usersData, permsData] = await Promise.all([
        listRoles(),
        listUsers(),
        listPermissions(true),
      ]);
      setRoles(rolesData || []);
      setUsers(usersData || []);
      setPermissions(permsData || []);
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
    setSuccessMsg("");
    setRolePermissions(new Set());
    try {
      const rolePerms = await getRolePermissions(role.id);
      setRolePermissions(new Set(rolePerms.map((p) => p.id)));
    } catch (err: any) {
      console.error("Failed to load role permissions:", err);
      setErrorMsg(`Failed to load permissions: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
      setRolePermissions(new Set());
    }
  };

  const handleAssignRoleToUser = async (userId: number, roleId: number) => {
    try {
      setSaving(true);
      await updateUserRole(userId, { role_id: roleId });
      setSuccessMsg("Role assigned to user successfully");
      await load();
    } catch (err: any) {
      setErrorMsg(`Failed to assign role: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
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
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await updateRolePermissions(selectedRole.id, Array.from(rolePermissions));
      setSuccessMsg(`Permissions updated successfully for ${selectedRole.display_name || selectedRole.name}`);
      await handleSelectRole(selectedRole);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to update: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
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
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Roles Management</h2>
          <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
            Manage roles and assign them to users. Configure role permissions.
          </p>
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

      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>Loading...</div>
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
              maxHeight: "80vh",
              overflowY: "auto",
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
                  borderRadius: 6,
                  cursor: "pointer",
                  border: `1px solid ${selectedRole?.id === role.id ? theme.colors.primary : theme.colors.border}`,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500 }}>{role.display_name || role.name}</div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{role.name}</div>
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

          {/* Role Details & Permissions */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {selectedRole ? (
              <>
                {/* Permissions Editor */}
                <div
                  style={{
                    backgroundColor: theme.colors.backgroundSecondary,
                    padding: 16,
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                    Permissions for: {selectedRole.display_name || selectedRole.name}
                  </h3>
                  <p style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 16 }}>
                    Select permissions to assign to this role ({rolePermissions.size} selected)
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "50vh", overflowY: "auto" }}>
                    {Object.entries(permissionsByResource).map(([resource, perms]) => (
                      <div key={resource} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>{resource}</div>
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
                                <div style={{ fontSize: 12, fontWeight: 500 }}>{perm.action.toUpperCase()}</div>
                                {perm.description && (
                                  <div style={{ fontSize: 10, color: theme.colors.textMuted }}>{perm.description}</div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button
                      onClick={handleSavePermissions}
                      disabled={saving}
                      style={{
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 500,
                        backgroundColor: theme.colors.primary,
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {saving ? "Saving..." : "Save Permissions"}
                    </button>
                  </div>
                </div>

                {/* Users with this Role */}
                <div
                  style={{
                    backgroundColor: theme.colors.backgroundSecondary,
                    padding: 16,
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Users with this Role</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "30vh", overflowY: "auto" }}>
                    {users
                      .filter((u) => u.role_id === selectedRole.id)
                      .map((user) => (
                        <div
                          key={user.id}
                          style={{
                            padding: 12,
                            backgroundColor: theme.colors.background,
                            borderRadius: 6,
                            border: `1px solid ${theme.colors.border}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{user.username}</div>
                            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{user.division || "N/A"}</div>
                          </div>
                        </div>
                      ))}
                    {users.filter((u) => u.role_id === selectedRole.id).length === 0 && (
                      <div style={{ padding: 16, textAlign: "center", color: theme.colors.textMuted, fontSize: 12 }}>
                        No users assigned to this role
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
                Select a role to manage its permissions and view assigned users
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDataRolesPage;

