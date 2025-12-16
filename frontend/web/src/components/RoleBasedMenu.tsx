// frontend/web/src/components/RoleBasedMenu.tsx

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { useAuthStore } from "../stores/authStore";
import { theme } from "../modules/shared/components/theme";

interface MenuItem {
  label: string;
  path: string;
  icon?: string;
  roles?: string[];
  divisions?: string[];
  permissions?: { resource: string; action: string };
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  // Dashboard
  {
    label: "Dashboard",
    path: "/supervisor/dashboard",
    icon: "📊",
    roles: ["supervisor", "admin"],
  },
  {
    label: "Dashboard",
    path: "/security/dashboard",
    icon: "📊",
    divisions: ["security"],
  },
  {
    label: "Dashboard",
    path: "/cleaning/dashboard",
    icon: "📊",
    divisions: ["cleaning"],
  },
  {
    label: "Dashboard",
    path: "/driver/trips",
    icon: "📊",
    divisions: ["driver"],
  },
  {
    label: "Dashboard",
    path: "/parking/dashboard",
    icon: "📊",
    divisions: ["parking"],
  },

  // Control Center (Supervisor only)
  {
    label: "Control Center",
    path: "/supervisor/control-center",
    icon: "🎛️",
    roles: ["supervisor", "admin"],
    permissions: { resource: "control_center", action: "read" },
  },

  // Attendance
  {
    label: "Attendance",
    path: "/supervisor/attendance",
    icon: "⏰",
    roles: ["supervisor", "admin"],
  },
  {
    label: "Attendance",
    path: "/security/attendance",
    icon: "⏰",
    divisions: ["security"],
  },
  {
    label: "Attendance",
    path: "/cleaning/attendance",
    icon: "⏰",
    divisions: ["cleaning"],
  },

  // Reports
  {
    label: "Reports",
    path: "/supervisor/reports",
    icon: "📝",
    roles: ["supervisor", "admin"],
  },
  {
    label: "Reports",
    path: "/security/reports",
    icon: "📝",
    divisions: ["security"],
  },
  {
    label: "Reports",
    path: "/cleaning/reports",
    icon: "📝",
    divisions: ["cleaning"],
  },

  // Patrol (Security)
  {
    label: "Patrol",
    path: "/security/patrol",
    icon: "🚶",
    divisions: ["security"],
    children: [
      { label: "Patrol List", path: "/security/patrol" },
      { label: "Patrol Map", path: "/security/patrol/map" },
      { label: "New Patrol", path: "/security/patrol/new" },
    ],
  },

  // Patrol Management (Supervisor)
  {
    label: "Patrol Management",
    path: "/supervisor/patrol/targets/manage",
    icon: "🎯",
    roles: ["supervisor", "admin"],
    children: [
      { label: "Patrol Targets", path: "/supervisor/patrol/targets/manage" },
      { label: "Patrol Teams", path: "/supervisor/patrol/teams/manage" },
      { label: "Patrol Activity", path: "/supervisor/patrol-activity" },
    ],
  },

  // Checklists
  {
    label: "Checklists",
    path: "/supervisor/checklists",
    icon: "✅",
    roles: ["supervisor", "admin"],
  },
  {
    label: "Checklist",
    path: "/security/checklist",
    icon: "✅",
    divisions: ["security"],
  },
  {
    label: "Checklist",
    path: "/cleaning/checklist",
    icon: "✅",
    divisions: ["cleaning"],
  },

  // Incidents
  {
    label: "Incidents",
    path: "/supervisor/incidents/perpetrators",
    icon: "⚠️",
    roles: ["supervisor", "admin"],
  },

  // Visitors (Security & Supervisor)
  {
    label: "Visitors",
    path: "/security/visitors/manage",
    icon: "👤",
    divisions: ["security"],
    roles: ["supervisor", "admin"],
  },

  // Training (Supervisor)
  {
    label: "Training",
    path: "/supervisor/training",
    icon: "🎓",
    roles: ["supervisor", "admin"],
  },

  // Manpower (Supervisor)
  {
    label: "Manpower",
    path: "/supervisor/manpower",
    icon: "👥",
    roles: ["supervisor", "admin"],
  },

  // Master Data (Admin)
  {
    label: "Master Data",
    path: "/supervisor/admin/master-data",
    icon: "📋",
    roles: ["admin"],
  },

  // Employees (Admin)
  {
    label: "Employees",
    path: "/supervisor/admin/employees",
    icon: "👔",
    roles: ["admin"],
  },

  // KTA Management (Supervisor)
  {
    label: "KTA Management",
    path: "/supervisor/kta",
    icon: "🪪",
    roles: ["supervisor", "admin"],
  },

  // Sites (Supervisor)
  {
    label: "Sites",
    path: "/supervisor/sites",
    icon: "🏢",
    roles: ["supervisor", "admin"],
  },

  // Calendar (Supervisor)
  {
    label: "Calendar",
    path: "/supervisor/calendar",
    icon: "📅",
    roles: ["supervisor", "admin"],
  },

  // Security-specific features
  {
    label: "Panic Button",
    path: "/security/panic",
    icon: "🚨",
    divisions: ["security"],
  },
  {
    label: "Dispatch",
    path: "/security/dispatch",
    icon: "📞",
    divisions: ["security"],
  },
  {
    label: "DAR",
    path: "/security/dar",
    icon: "📄",
    divisions: ["security"],
  },
  {
    label: "Passdown",
    path: "/security/passdown",
    icon: "📋",
    divisions: ["security"],
  },
];

export function RoleBasedMenu() {
  const { hasPermission, canAccess, hasRole, isDivision, role, division } = usePermissions();
  const location = useLocation();

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

  const filteredItems = filterMenuItems(menuItems);

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {filteredItems.map((item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
        const hasChildren = item.children && item.children.length > 0;

        return (
          <div key={item.path}>
            <Link
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: theme.radius.input,
                backgroundColor: isActive ? theme.colors.primary + "20" : "transparent",
                color: isActive ? theme.colors.primary : theme.colors.textMain,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.2s",
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </Link>
            {hasChildren && (
              <div style={{ marginLeft: 24, marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                {item.children?.map((child) => {
                  const isChildActive = location.pathname === child.path;
                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        borderRadius: theme.radius.input,
                        backgroundColor: isChildActive ? theme.colors.primary + "10" : "transparent",
                        color: isChildActive ? theme.colors.primary : theme.colors.textMuted,
                        textDecoration: "none",
                        fontSize: 12,
                        fontWeight: isChildActive ? 500 : 400,
                      }}
                    >
                      <span>•</span>
                      <span>{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

