// frontend/web/src/components/RoleBasedRoute.tsx

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { useAuthStore } from "../stores/authStore";

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  allowedDivisions?: string[];
  requiredPermission?: { resource: string; action: string };
  fallbackPath?: string;
}

export function RoleBasedRoute({
  children,
  allowedRoles,
  allowedDivisions,
  requiredPermission,
  fallbackPath,
}: RoleBasedRouteProps) {
  const token = useAuthStore((s) => s.token);
  const { hasRole, isDivision, hasPermission, role, division } = usePermissions();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check role
  if (allowedRoles && !hasRole(allowedRoles)) {
    const redirectPath = fallbackPath || getDefaultRedirect(role, division);
    return <Navigate to={redirectPath} replace />;
  }

  // Check division
  if (allowedDivisions && !isDivision(allowedDivisions)) {
    const redirectPath = fallbackPath || getDefaultRedirect(role, division);
    return <Navigate to={redirectPath} replace />;
  }

  // Check permission
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    const redirectPath = fallbackPath || getDefaultRedirect(role, division);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

function getDefaultRedirect(role: string, division: string): string {
  if (role === "admin" || role === "supervisor") {
    return "/supervisor/dashboard";
  }
  return `/${division}/dashboard`;
}

