// frontend/web/src/hooks/usePermissions.ts

import { useAuthStore } from "../stores/authStore";
import { useEffect, useState } from "react";
import api from "../api/client";

export interface Permission {
  resource: string;
  action: string;
}

/**
 * Hook untuk mengecek permissions berdasarkan role dan API
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role?.toLowerCase() || "";
  const division = user?.division?.toLowerCase() || "";
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user permissions from API
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get("/auth/me");
        if (response.data?.permissions) {
          setUserPermissions(response.data.permissions);
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        // Fallback to empty array
        setUserPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPermissions();
    }
  }, [user]);

  /**
   * Check if user has permission for a resource and action
   */
  const hasPermission = (resource: string, action: string): boolean => {
    // Admin has all permissions
    if (role === "admin") {
      return true;
    }

    // Check permissions from API first (database permissions from role_permissions)
    // Only use fallback if API hasn't loaded yet or returned empty
    if (!loading) {
      if (userPermissions.length > 0) {
        // We have permissions from database - use them exclusively
        const hasPerm = userPermissions.some(
          (p) => p.resource === resource && p.action === action
        );
        return hasPerm;
      } else {
        // API loaded but returned empty permissions - use fallback
        // This means user has no permissions assigned in database
        // Fall through to fallback logic below
      }
    } else {
      // Still loading - use fallback temporarily (optimistic)
      // This prevents UI flickering during initial load
    }

    // Fallback: Supervisor permissions (only if no database permissions)
    if (role === "supervisor" || role === "super_admin") {
      const supervisorPermissions: Record<string, string[]> = {
        dashboard: ["read"],
        attendance: ["read", "write"],
        reports: ["read", "write"],
        checklists: ["read", "write"],
        patrols: ["read", "write"],
        incidents: ["read", "write"],
        visitors: ["read", "write"],
        training: ["read", "write"],
        employees: ["read", "write"],
        payroll: ["read"],
        master_data: ["read", "write"],
        sites: ["read", "write"],
        announcements: ["read", "write"],
        shifts: ["read", "write"],
        control_center: ["read"],
        manpower: ["read"],
        patrol_targets: ["read", "write"],
        patrol_teams: ["read", "write"],
        kta: ["read", "write"],
        calendar: ["read"],
      };
      return supervisorPermissions[resource]?.includes(action) ?? false;
    }

    // Fallback: Field user permissions (division-specific)
    // Handle both "field" and "guard" roles
    if (role === "field" || role === "guard" || role === "cleaner" || role === "driver") {
      const fieldPermissions: Record<string, string[]> = {
        dashboard: ["read"],
        attendance: ["read", "write"],
        reports: ["read", "write"],
        checklists: ["read", "write"],
        patrols: ["read", "write"],
        incidents: ["read", "write"],
        visitors: ["read", "write"], // Security only
        panic: ["read", "write"], // Security only
        dispatch: ["read", "write"], // Security only
        dar: ["read", "write"], // Security only
        passdown: ["read", "write"], // Security only
        shifts: ["read", "write"], // Added shifts permission
        profile: ["read", "write"],
      };

      // Division-specific restrictions
      if (resource === "visitors" && division !== "security") {
        return false;
      }
      if (resource === "panic" && division !== "security") {
        return false;
      }
      if (resource === "dispatch" && division !== "security") {
        return false;
      }
      if (resource === "dar" && division !== "security") {
        return false;
      }
      if (resource === "passdown" && division !== "security") {
        return false;
      }

      return fieldPermissions[resource]?.includes(action) ?? false;
    }

    // Default: deny if no match
    return false;
  };

  /**
   * Check if user can access a route
   */
  const canAccess = (route: string): boolean => {
    // Admin can access everything
    if (role === "admin") {
      return true;
    }

    // Supervisor routes
    if (route.startsWith("/supervisor")) {
      return role === "supervisor" || role === "admin";
    }

    // Admin-only routes
    if (route.includes("/admin/")) {
      return role === "admin";
    }

    // Division routes
    if (route.startsWith("/security")) {
      return division === "security" || role === "supervisor" || role === "admin";
    }
    if (route.startsWith("/cleaning")) {
      return division === "cleaning" || role === "supervisor" || role === "admin";
    }
    if (route.startsWith("/driver")) {
      return division === "driver" || role === "supervisor" || role === "admin";
    }
    if (route.startsWith("/parking")) {
      return division === "parking" || role === "supervisor" || role === "admin";
    }

    // Public routes
    if (route === "/login" || route === "/profile") {
      return true;
    }

    return false;
  };

  /**
   * Check if user has role
   */
  const hasRole = (roles: string[]): boolean => {
    return roles.includes(role);
  };

  /**
   * Check if user is in division
   */
  const isDivision = (divisions: string[]): boolean => {
    return divisions.includes(division);
  };

  return {
    hasPermission,
    canAccess,
    hasRole,
    isDivision,
    role,
    division,
    isAdmin: role === "admin",
    isSupervisor: role === "supervisor" || role === "admin",
    isField: role === "field",
    loading,
    userPermissions,
  };
}

