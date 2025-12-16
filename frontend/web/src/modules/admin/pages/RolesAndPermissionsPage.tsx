// frontend/web/src/modules/admin/pages/RolesAndPermissionsPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  listRoles, 
  listPermissions, 
  updateRolePermissions, 
  getRolePermissions, 
  Role, 
  Permission 
} from "../../../api/adminApi";
import { theme } from "../../shared/components/theme";
import { usePermissions } from "../../../hooks/usePermissions";
import { PermissionGate } from "../../../components/PermissionGate";

const RolesAndPermissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [searchRole, setSearchRole] = useState("");
  const [searchPermission, setSearchPermission] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/supervisor/dashboard");
    }
  }, [isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const [rolesData, permsData] = await Promise.all([
        listRoles(),
        listPermissions(true), // Only active permissions
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
    setSuccessMsg("");
    setRolePermissions(new Set());
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

  const handleSelectAll = (resource: string) => {
    const resourcePerms = permissionsByResource[resource] || [];
    const allSelected = resourcePerms.every(p => rolePermissions.has(p.id));
    
    const newSet = new Set(rolePermissions);
    if (allSelected) {
      // Deselect all
      resourcePerms.forEach(p => newSet.delete(p.id));
    } else {
      // Select all
      resourcePerms.forEach(p => newSet.add(p.id));
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
      // Reload permissions to reflect changes
      await handleSelectRole(selectedRole);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to update: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Filter roles
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchRole.toLowerCase()) ||
    (role.display_name || "").toLowerCase().includes(searchRole.toLowerCase())
  );

  // Filter permissions
  const filteredResources = Object.keys(permissionsByResource).filter(resource =>
    resource.toLowerCase().includes(searchPermission.toLowerCase()) ||
    permissionsByResource[resource].some(p => 
      p.name.toLowerCase().includes(searchPermission.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchPermission.toLowerCase())
    )
  );

  if (!isAdmin) {
    return null; // Will redirect
  }

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
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Role & Permission Management</h2>
        <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
          Manage roles and assign permissions from database. Select a role to view and edit its permissions.
        </p>
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
        <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
          Loading...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
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
            <input
              type="text"
              placeholder="Search roles..."
              value={searchRole}
              onChange={(e) => setSearchRole(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: 12,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 4,
                backgroundColor: theme.colors.background,
                marginBottom: 8,
              }}
            />
            {filteredRoles.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: theme.colors.textMuted, fontSize: 12 }}>
                No roles found
              </div>
            ) : (
              filteredRoles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  style={{
                    padding: 12,
                    backgroundColor: selectedRole?.id === role.id ? theme.colors.primary + "20" : "transparent",
                    borderRadius: 6,
                    cursor: "pointer",
                    border: `1px solid ${selectedRole?.id === role.id ? theme.colors.primary : theme.colors.border}`,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRole?.id !== role.id) {
                      e.currentTarget.style.backgroundColor = theme.colors.background;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRole?.id !== role.id) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                    {role.display_name || role.name}
                  </div>
                  <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                    {role.name}
                  </div>
                  {role.description && (
                    <div style={{ fontSize: 10, color: theme.colors.textMuted, marginBottom: 4 }}>
                      {role.description}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 10,
                      color: role.is_active ? "#10B981" : "#EF4444",
                      fontWeight: 500,
                    }}
                  >
                    {role.is_active ? "✓ Active" : "✗ Inactive"}
                  </div>
                </div>
              ))
            )}
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
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            {selectedRole ? (
              <>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    Permissions for: {selectedRole.display_name || selectedRole.name}
                  </h3>
                  <p style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>
                    Select permissions to assign to this role ({rolePermissions.size} selected)
                  </p>
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={searchPermission}
                    onChange={(e) => setSearchPermission(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      fontSize: 12,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 4,
                      backgroundColor: theme.colors.background,
                      width: "100%",
                    }}
                  />
                </div>

                {permissions.length === 0 ? (
                  <div style={{ padding: 16, textAlign: "center", color: theme.colors.textMuted }}>
                    <div style={{ marginBottom: 8, fontSize: 13 }}>No permissions available.</div>
                    <div style={{ fontSize: 11 }}>
                      Please run: <code style={{ backgroundColor: theme.colors.background, padding: "2px 6px", borderRadius: 3 }}>python backend/scripts/create_default_permissions.py</code>
                    </div>
                  </div>
                ) : filteredResources.length === 0 ? (
                  <div style={{ padding: 16, textAlign: "center", color: theme.colors.textMuted, fontSize: 12 }}>
                    No permissions match your search.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {filteredResources.map((resource) => {
                      const resourcePerms = permissionsByResource[resource];
                      const allSelected = resourcePerms.every(p => rolePermissions.has(p.id));
                      const someSelected = resourcePerms.some(p => rolePermissions.has(p.id));
                      
                      return (
                        <div key={resource} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 8,
                            padding: "8px 12px",
                            backgroundColor: theme.colors.background,
                            borderRadius: 4,
                          }}>
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(input) => {
                                if (input) input.indeterminate = someSelected && !allSelected;
                              }}
                              onChange={() => handleSelectAll(resource)}
                              style={{ cursor: "pointer" }}
                            />
                            <div style={{ 
                              fontSize: 13, 
                              fontWeight: 600, 
                              textTransform: "uppercase",
                              flex: 1,
                            }}>
                              {resource}
                            </div>
                            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                              {resourcePerms.filter(p => rolePermissions.has(p.id)).length} / {resourcePerms.length}
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 24 }}>
                            {resourcePerms.map((perm) => (
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
                                  border: rolePermissions.has(perm.id) ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={rolePermissions.has(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                  style={{ cursor: "pointer" }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 500 }}>
                                    {perm.action.toUpperCase()}
                                  </div>
                                  {perm.description && (
                                    <div style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 2 }}>
                                      {perm.description}
                                    </div>
                                  )}
                                  <div style={{ fontSize: 9, color: theme.colors.textMuted, marginTop: 2 }}>
                                    {perm.name}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {permissions.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.colors.border}` }}>
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
                        transition: "opacity 0.2s",
                      }}
                    >
                      {saving ? "Saving..." : "Save Permissions"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRole(null);
                        setRolePermissions(new Set());
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      style={{
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 500,
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
                <div style={{ fontSize: 14, marginBottom: 8 }}>Select a role to manage its permissions</div>
                <div style={{ fontSize: 12 }}>
                  Permissions are loaded from the database (role_permissions table)
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesAndPermissionsPage;

