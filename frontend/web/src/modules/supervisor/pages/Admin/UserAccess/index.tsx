// frontend/web/src/modules/supervisor/pages/Admin/UserAccess/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface UserAccess {
  user_id: number;
  username: string;
  role: string;
  division?: string;
  site_id?: number;
  permissions: Record<string, boolean>;
  is_active: boolean;
}

export function AdminUserAccessPage() {
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [role, setRole] = useState<string | undefined>(undefined);
  const [division, setDivision] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [role, division]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (role) params.role = role;
      if (division) params.division = division;

      const response = await api.get("/admin/user-access", { params });
      setUsers(response.data);
    } catch (err: any) {
      console.error("Failed to load user access:", err);
      setError(err.response?.data?.detail || "Failed to load user access");
    } finally {
      setLoading(false);
    }
  };

  const updatePermissions = async (userId: number, permissions: Record<string, boolean>) => {
    try {
      await api.put(`/api/v1/admin/user-access/${userId}/permissions`, { permissions });
      loadUsers();
    } catch (err: any) {
      console.error("Failed to update permissions:", err);
      alert(err.response?.data?.detail || "Failed to update permissions");
    }
  };

  const togglePermission = (userId: number, permission: string) => {
    const user = users.find((u) => u.user_id === userId);
    if (!user) return;

    const newPermissions = {
      ...user.permissions,
      [permission]: !user.permissions[permission],
    };

    updatePermissions(userId, newPermissions);
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[#002B4B]">User Access Matrix</h1>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role || ""}
              onChange={(e) => setRole(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="FIELD">Field</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Division</label>
            <select
              value={division || ""}
              onChange={(e) => setDivision(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Divisions</option>
              <option value="SECURITY">Security</option>
              <option value="CLEANING">Cleaning</option>
              <option value="DRIVER">Driver</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <DashboardCard title="User Permissions">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">User</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Role</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">View Dashboard</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">View Attendance</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">View Reports</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">View Patrol</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Manage Users</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{user.username}</td>
                    <td className="py-2 px-3">{user.role}</td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.permissions.view_dashboard || false}
                        onChange={() => togglePermission(user.user_id, "view_dashboard")}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.permissions.view_attendance || false}
                        onChange={() => togglePermission(user.user_id, "view_attendance")}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.permissions.view_reports || false}
                        onChange={() => togglePermission(user.user_id, "view_reports")}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.permissions.view_patrol || false}
                        onChange={() => togglePermission(user.user_id, "view_patrol")}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.permissions.manage_users || false}
                        onChange={() => togglePermission(user.user_id, "manage_users")}
                        className="w-4 h-4"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

