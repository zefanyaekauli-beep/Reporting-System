// frontend/web/src/components/RoleBasedAccess.tsx
// Utility component untuk menampilkan konten berdasarkan role/permission

import { ReactNode } from "react";
import { usePermissions } from "../hooks/usePermissions";

interface RoleBasedAccessProps {
  children: ReactNode;
  allowedRoles?: string[];
  allowedDivisions?: string[];
  requiredPermission?: { resource: string; action: string };
  fallback?: ReactNode;
}

/**
 * Component untuk conditional rendering berdasarkan role, division, atau permission
 */
export function RoleBasedAccess({
  children,
  allowedRoles,
  allowedDivisions,
  requiredPermission,
  fallback = null,
}: RoleBasedAccessProps) {
  const { hasRole, isDivision, hasPermission } = usePermissions();

  // Check role
  if (allowedRoles && !hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  // Check division
  if (allowedDivisions && !isDivision(allowedDivisions)) {
    return <>{fallback}</>;
  }

  // Check permission
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

