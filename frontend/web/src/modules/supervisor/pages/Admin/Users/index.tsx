// frontend/web/src/modules/supervisor/pages/Admin/Users/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface User {
  id: number;
  username: string;
  role: string;
  role_id?: number;
  division?: string;
  company_id: number;
  site_id?: number;
  site_name?: string;
  is_active?: boolean;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [divisionFilter, setDivisionFilter] = useState<string | undefined>(
    undefined
  );
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  // Create/Edit form
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "FIELD",
    division: "",
    site_id: undefined as number | undefined,
  });

  useEffect(() => {
    loadSites();
    loadUsers();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, divisionFilter, statusFilter]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (divisionFilter) params.division = divisionFilter;
      if (statusFilter !== undefined) {
        params.is_active = statusFilter === "active";
      }

      const response = await api.get("/admin/users", { params });
      let data: User[] = response.data || [];

      // Enrich with site names
      const usersWithSites = await Promise.all(
        data.map(async (user) => {
          if (user.site_id) {
            const site = sites.find((s) => s.id === user.site_id);
            return {
              ...user,
              site_name: site?.name || `Site #${user.site_id}`,
            };
          }
          return user;
        })
      );

      setUsers(usersWithSites);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(err.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Note: Create user endpoint might be in auth_routes
      // For now, we'll show an alert
      alert(
        "User creation endpoint needs to be implemented. Please use the auth/register endpoint or contact admin."
      );
      setShowCreateModal(false);
      setFormData({
        username: "",
        password: "",
        role: "FIELD",
        division: "",
        site_id: undefined,
      });
    } catch (err: any) {
      console.error("Failed to create user:", err);
      alert(err.response?.data?.detail || "Failed to create user");
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "", // Don't pre-fill password
      role: user.role || "FIELD",
      division: user.division || "",
      site_id: user.site_id,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const payload: any = {
        role: formData.role,
      };
      if (formData.division) payload.division = formData.division;
      if (formData.site_id) payload.site_id = formData.site_id;

      await api.patch(`/admin/users/${selectedUser.id}`, payload);
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({
        username: "",
        password: "",
        role: "FIELD",
        division: "",
        site_id: undefined,
      });
      loadUsers();
    } catch (err: any) {
      console.error("Failed to update user:", err);
      alert(err.response?.data?.detail || "Failed to update user");
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (
      !window.confirm(
        `Are you sure you want to ${
          user.is_active ? "deactivate" : "activate"
        } user ${user.username}?`
      )
    ) {
      return;
    }

    try {
      // Note: This might need a separate endpoint for toggling is_active
      // For now, we'll use the update endpoint
      await api.patch(`/admin/users/${user.id}`, {
        is_active: !user.is_active,
      });
      loadUsers();
    } catch (err: any) {
      console.error("Failed to toggle user status:", err);
      alert(err.response?.data?.detail || "Failed to update user status");
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-red-100 text-red-800",
      SUPERVISOR: "bg-blue-100 text-blue-800",
      FIELD: "bg-green-100 text-green-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded ${
          colors[role] || "bg-gray-100 text-gray-800"
        }`}
      >
        {role}
      </span>
    );
  };

  const getDivisionBadge = (division?: string) => {
    if (!division) return <span className="text-gray-400">-</span>;
    return (
      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
        {division.toUpperCase()}
      </span>
    );
  };

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active !== false).length;
  const adminUsers = users.filter((u) => u.role === "ADMIN").length;
  const supervisorUsers = users.filter((u) => u.role === "SUPERVISOR").length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">User Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Create User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard>
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-2xl font-bold text-[#002B4B]">{totalUsers}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Active Users</div>
          <div className="text-2xl font-bold text-green-600">
            {activeUsers}
          </div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Admins</div>
          <div className="text-2xl font-bold text-red-600">{adminUsers}</div>
        </DashboardCard>
        <DashboardCard>
          <div className="text-sm text-gray-600">Supervisors</div>
          <div className="text-2xl font-bold text-blue-600">
            {supervisorUsers}
          </div>
        </DashboardCard>
      </div>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={roleFilter || ""}
              onChange={(e) =>
                setRoleFilter(e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="FIELD">Field</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Division
            </label>
            <select
              value={divisionFilter || ""}
              onChange={(e) =>
                setDivisionFilter(e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Divisions</option>
              <option value="security">Security</option>
              <option value="cleaning">Cleaning</option>
              <option value="driver">Driver</option>
              <option value="parking">Parking</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter || ""}
              onChange={(e) =>
                setStatusFilter(e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <DashboardCard title="Users">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Username
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Division
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Site
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 px-3 font-medium">{user.username}</td>
                    <td className="py-2 px-3">{getRoleBadge(user.role)}</td>
                    <td className="py-2 px-3">
                      {getDivisionBadge(user.division)}
                    </td>
                    <td className="py-2 px-3">
                      {user.site_name || (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {user.is_active !== false ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="text-orange-600 hover:text-orange-800 text-xs"
                        >
                          {user.is_active !== false ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="FIELD">Field</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Division
                </label>
                <select
                  value={formData.division}
                  onChange={(e) =>
                    setFormData({ ...formData, division: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">No Division</option>
                  <option value="security">Security</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="driver">Driver</option>
                  <option value="parking">Parking</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site
                </label>
                <select
                  value={formData.site_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      site_id: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">No Site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="FIELD">Field</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Division
                </label>
                <select
                  value={formData.division}
                  onChange={(e) =>
                    setFormData({ ...formData, division: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">No Division</option>
                  <option value="security">Security</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="driver">Driver</option>
                  <option value="parking">Parking</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site
                </label>
                <select
                  value={formData.site_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      site_id: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">No Site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

