// frontend/web/src/modules/supervisor/pages/Admin/IncidentAccess/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface IncidentAccess {
  user_id: number;
  username: string;
  role: string;
  can_view_lklp: boolean;
  can_create_lklp: boolean;
  can_approve_lklp: boolean;
  can_view_bap: boolean;
  can_create_bap: boolean;
  can_approve_bap: boolean;
  can_view_stplk: boolean;
  can_create_stplk: boolean;
  can_approve_stplk: boolean;
  can_view_findings: boolean;
  can_create_findings: boolean;
  can_approve_findings: boolean;
}

export function AdminIncidentAccessPage() {
  const [users, setUsers] = useState<IncidentAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [role]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (role) params.role = role;

      const response = await api.get("/admin/incident-access", { params });
      setUsers(response.data);
    } catch (err: any) {
      console.error("Failed to load incident access:", err);
      setError(err.response?.data?.detail || "Failed to load incident access");
    } finally {
      setLoading(false);
    }
  };

  const updateAccess = async (userId: number, access: Partial<IncidentAccess>) => {
    try {
      await api.put(`/api/v1/admin/incident-access/${userId}`, access);
      loadUsers();
    } catch (err: any) {
      console.error("Failed to update access:", err);
      alert(err.response?.data?.detail || "Failed to update access");
    }
  };

  const toggleAccess = (userId: number, field: keyof IncidentAccess) => {
    const user = users.find((u) => u.user_id === userId);
    if (!user) return;

    updateAccess(userId, { [field]: !user[field] });
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[#002B4B]">Incident Access Control</h1>

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
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <DashboardCard title="Incident Permissions">
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
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">LK/LP View</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">LK/LP Create</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">LK/LP Approve</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">BAP View</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">BAP Create</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">BAP Approve</th>
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
                        checked={user.can_view_lklp}
                        onChange={() => toggleAccess(user.user_id, "can_view_lklp")}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.can_create_lklp}
                        onChange={() => toggleAccess(user.user_id, "can_create_lklp")}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.can_approve_lklp}
                        onChange={() => toggleAccess(user.user_id, "can_approve_lklp")}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.can_view_bap}
                        onChange={() => toggleAccess(user.user_id, "can_view_bap")}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.can_create_bap}
                        onChange={() => toggleAccess(user.user_id, "can_create_bap")}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={user.can_approve_bap}
                        onChange={() => toggleAccess(user.user_id, "can_approve_bap")}
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

