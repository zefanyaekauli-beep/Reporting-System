// frontend/web/src/api/adminApi.ts

import api from "./client";

export interface Role {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
  is_active: boolean;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: string;
  ip_address?: string;
  created_at: string;
}

/**
 * List all roles
 */
export async function listRoles(isActive?: boolean): Promise<Role[]> {
  const params: any = {};
  if (isActive !== undefined) {
    params.is_active = isActive;
  }
  const response = await api.get("/admin/roles", { params });
  return response.data;
}

/**
 * List all permissions
 */
export async function listPermissions(
  resource?: string,
  action?: string,
  isActive?: boolean
): Promise<Permission[]> {
  const params: any = {};
  if (resource) params.resource = resource;
  if (action) params.action = action;
  if (isActive !== undefined) params.is_active = isActive;
  const response = await api.get("/admin/permissions", { params });
  return response.data;
}

/**
 * Update user permissions
 */
export async function updateUserPermissions(
  userId: number,
  permissionIds: number[]
): Promise<{ message: string; user_id: number; permission_count: number }> {
  const response = await api.post(`/admin/users/${userId}/permissions`, {
    user_id: userId,
    permission_ids: permissionIds,
  });
  return response.data;
}

/**
 * Get role permissions
 */
export async function getRolePermissions(roleId: number): Promise<Permission[]> {
  const response = await api.get(`/admin/roles/${roleId}/permissions`);
  return response.data;
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(
  roleId: number,
  permissionIds: number[]
): Promise<{ message: string; role_id: number; permission_count: number }> {
  const response = await api.post(`/admin/roles/${roleId}/permissions`, {
    permission_ids: permissionIds,
  });
  return response.data;
}

/**
 * Get audit logs
 */
export async function getAuditLogs(params?: {
  user_id?: number;
  resource_type?: string;
  action?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const response = await api.get("/admin/audit-logs", { params });
  return response.data;
}

/**
 * List all users
 */
export async function listUsers(params?: {
  role?: string;
  division?: string;
  is_active?: boolean;
}): Promise<User[]> {
  const response = await api.get("/admin/users", { params });
  return response.data;
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: number,
  data: {
    role_id?: number;
    role?: string;
    division?: string;
  }
): Promise<User> {
  const response = await api.patch(`/admin/users/${userId}`, data);
  return response.data;
}

export interface User {
  id: number;
  username: string;
  role: string;
  role_id?: number;
  division?: string;
  company_id?: number;
  site_id?: number;
}

