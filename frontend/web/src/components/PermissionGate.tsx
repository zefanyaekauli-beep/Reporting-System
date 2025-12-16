// frontend/web/src/components/PermissionGate.tsx

import { ReactNode } from "react";
import { usePermissions } from "../hooks/usePermissions";

interface PermissionGateProps {
  children: ReactNode;
  resource: string;
  action: string;
  fallback?: ReactNode;
  /** If true, show children while loading (optimistic rendering) */
  showWhileLoading?: boolean;
  /** If true, use database permissions only (no fallback) */
  strict?: boolean;
}

export function PermissionGate({ 
  children, 
  resource, 
  action, 
  fallback = null,
  showWhileLoading = true,
  strict = false
}: PermissionGateProps) {
  const { hasPermission, loading, role, division, userPermissions } = usePermissions();

  // Admin always has access
  if (role === "admin") {
    return <>{children}</>;
  }

  // While loading, show children if showWhileLoading is true (optimistic)
  // This prevents buttons from disappearing during initial load
  if (loading && showWhileLoading) {
    return <>{children}</>;
  }

  // If loading and not showing while loading, show fallback
  if (loading && !showWhileLoading) {
    return <>{fallback}</>;
  }

  // Check permission
  const hasPerm = hasPermission(resource, action);
  
  // In strict mode, only allow if we have database permissions
  if (strict && userPermissions.length === 0 && !loading) {
    // No database permissions loaded - deny access
    return <>{fallback}</>;
  }
  
  // Debug logging (can be removed in production)
  // Only log in development mode (check if console.debug exists)
  if (!hasPerm && typeof console !== "undefined" && console.debug) {
    console.debug(`PermissionGate: ${role} (${division}) denied for ${resource}.${action}`, {
      userPermissions: userPermissions.length,
      loading,
      strict
    });
  }

  if (!hasPerm) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

