// frontend/web/src/components/RoleBasedMenuItems.tsx
// Component untuk generate menu items berdasarkan role

import { usePermissions } from "../hooks/usePermissions";

export interface MenuItem {
  label: string;
  path: string;
  icon?: string;
  roles?: string[];
  divisions?: string[];
  permissions?: { resource: string; action: string };
  children?: MenuItem[];
}

export function useRoleBasedMenuItems(): MenuItem[] {
  const { hasRole, isDivision, hasPermission } = usePermissions();

  const allMenuItems: MenuItem[] = [
    // Supervisor/Admin Menu
    {
      label: "Control Center",
      path: "/supervisor/control-center",
      icon: "🎛️",
      roles: ["supervisor", "admin"],
      permissions: { resource: "control_center", action: "read" },
    },
    {
      label: "Manpower",
      path: "/supervisor/manpower",
      icon: "👥",
      roles: ["supervisor", "admin"],
    },
    {
      label: "Incident Perpetrators",
      path: "/supervisor/incidents/perpetrators",
      icon: "⚠️",
      roles: ["supervisor", "admin"],
    },
    {
      label: "Patrol Targets",
      path: "/supervisor/patrol/targets/manage",
      icon: "🎯",
      roles: ["supervisor", "admin"],
    },
    {
      label: "Patrol Teams",
      path: "/supervisor/patrol/teams/manage",
      icon: "👥",
      roles: ["supervisor", "admin"],
    },
    {
      label: "Training",
      path: "/supervisor/training",
      icon: "🎓",
      roles: ["supervisor", "admin"],
    },
    {
      label: "Calendar",
      path: "/supervisor/calendar",
      icon: "📅",
      roles: ["supervisor", "admin"],
    },
    // Admin Only
    {
      label: "Master Data",
      path: "/supervisor/admin/master-data",
      icon: "📋",
      roles: ["admin"],
    },
    {
      label: "Employees",
      path: "/supervisor/admin/employees",
      icon: "👔",
      roles: ["admin"],
    },
    {
      label: "Roles & Permissions",
      path: "/supervisor/admin/roles",
      icon: "🔐",
      roles: ["admin"],
    },
    {
      label: "Audit Logs",
      path: "/supervisor/admin/audit-logs",
      icon: "📜",
      roles: ["admin"],
    },
    // Security Division
    {
      label: "Patrol Map",
      path: "/security/patrol/map",
      icon: "🗺️",
      divisions: ["security"],
      roles: ["supervisor", "admin"],
    },
    {
      label: "Visitor Management",
      path: "/security/visitors/manage",
      icon: "👤",
      divisions: ["security"],
      roles: ["supervisor", "admin"],
    },
  ];

  // Filter menu items based on role, division, and permissions
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter((item) => {
        // Check role
        if (item.roles && !hasRole(item.roles)) {
          return false;
        }

        // Check division
        if (item.divisions && !isDivision(item.divisions)) {
          return false;
        }

        // Check permissions
        if (item.permissions) {
          if (!hasPermission(item.permissions.resource, item.permissions.action)) {
            return false;
          }
        }

        return true;
      })
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: filterMenuItems(item.children),
          };
        }
        return item;
      })
      .filter((item) => {
        // Remove items with empty children
        if (item.children && item.children.length === 0) {
          return false;
        }
        return true;
      });
  };

  return filterMenuItems(allMenuItems);
}

