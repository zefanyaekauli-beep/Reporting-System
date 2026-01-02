/**
 * Supervisor Layout - Verolux CCTV AI Style
 * Clean, grouped sidebar with parent and sub menu dropdown
 * Enhanced design for better visual appeal
 */

import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";
import ThemeToggle from "../../shared/components/ui/ThemeToggle";
import { AppIcons, IconKey } from "../../../icons/AppIcons";
import { usePermissions } from "../../../hooks/usePermissions";

import { UserRoleBadge } from "../../../components/UserRoleBadge";
import { useRoleBasedMenuItems } from "../../../components/RoleBasedMenuItems";

// Menu item types
interface MenuItem {
  label: string;
  to?: string;
  icon?: IconKey;
  children?: MenuItem[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

// Menu structure with parent and sub menus - SRM Structure
const menuGroups: MenuGroup[] = [
  {
    label: "📊 LIVE DASHBOARD",
    items: [
      { label: "Dashboard", to: "/supervisor", icon: "dashboard" as IconKey },
    ],
  },
  {
    label: "📝 REPORTING",
    items: [
      {
        label: "Reporting",
        children: [
          { label: "Daily Activity Report (DAR)", to: "/supervisor/reporting/dar", icon: "dar" as IconKey },
          { label: "Daily Visitors Report", to: "/supervisor/reporting/visitors", icon: "reports" as IconKey },
          { label: "Laporan Intelligent", to: "/supervisor/reporting/intelligent", icon: "reports" as IconKey },
          { label: "Compliance And Auditor", to: "/supervisor/reporting/compliance", icon: "reports" as IconKey },
          { label: "All Reports", to: "/supervisor/reports", icon: "reports" as IconKey },
        ],
      },
    ],
  },
  {
    label: "🚶 PATROL",
    items: [
      {
        label: "Patrol",
        children: [
          { label: "Patrol Schedule", to: "/supervisor/patrol/schedule", icon: "patrol" as IconKey },
          { label: "Patrol Assignment", to: "/supervisor/patrol/assignment", icon: "patrol" as IconKey },
          { label: "Security Patrol", to: "/supervisor/patrol/security", icon: "patrol" as IconKey },
          { label: "Joint Patrol", to: "/supervisor/patrol/joint", icon: "patrol" as IconKey },
          { label: "Patrol Report", to: "/supervisor/patrol/report", icon: "patrol" as IconKey },
          { label: "Patrol & Activity", to: "/supervisor/patrol-activity", icon: "patrol" as IconKey },
          { label: "Inspect Points", to: "/supervisor/inspectpoints", icon: "patrol" as IconKey },
        ],
      },
    ],
  },
  {
    label: "⚠️ INCIDENT",
    items: [
      {
        label: "Incident",
        children: [
          { label: "LK dan LP (Laporan Kejadian)", to: "/supervisor/incident/lk-lp", icon: "reports" as IconKey },
          { label: "BAP (Berita Acara Pemeriksaan)", to: "/supervisor/incident/bap", icon: "reports" as IconKey },
          { label: "NO STPLK (Surat Tanda Laporan Kehilangan)", to: "/supervisor/incident/stplk", icon: "reports" as IconKey },
          { label: "Findings Report", to: "/supervisor/incident/findings", icon: "reports" as IconKey },
          { label: "Incident Recap", to: "/supervisor/incident/recap", icon: "reports" as IconKey },
          { label: "All Incidents", to: "/supervisor/reports?report_type=incident", icon: "reports" as IconKey },
        ],
      },
    ],
  },
  {
    label: "📚 TRAINING",
    items: [
      {
        label: "Training",
        children: [
          { label: "Training Plan", to: "/supervisor/training/plan", icon: "tasks" as IconKey },
          { label: "Training Participant", to: "/supervisor/training/participant", icon: "tasks" as IconKey },
        ],
      },
    ],
  },
  {
    label: "📈 KPI",
    items: [
      {
        label: "KPI",
        children: [
          { label: "KPI Patrol", to: "/supervisor/kpi/patrol", icon: "dashboard" as IconKey },
          { label: "KPI Report", to: "/supervisor/kpi/report", icon: "dashboard" as IconKey },
          { label: "KPI CCTV", to: "/supervisor/kpi/cctv", icon: "dashboard" as IconKey },
          { label: "KPI Training", to: "/supervisor/kpi/training", icon: "dashboard" as IconKey },
        ],
      },
    ],
  },
  {
    label: "📄 INFORMATION DATA",
    items: [
      {
        label: "Information Data",
        children: [
          { label: "Document Control", to: "/supervisor/information/document", icon: "reports" as IconKey },
          { label: "CCTV Status", to: "/supervisor/information/cctv", icon: "dashboard" as IconKey },
          { label: "Notification", to: "/supervisor/information/notification", icon: "announcements" as IconKey },
        ],
      },
    ],
  },
  {
    label: "🗃️ MASTER DATA",
    items: [
      {
        label: "Master Data",
        children: [
          { label: "Worker Data", to: "/supervisor/master/worker", icon: "officers" as IconKey },
          { label: "Business Unit", to: "/supervisor/master/business-unit", icon: "dashboard" as IconKey },
          { label: "Department", to: "/supervisor/master/department", icon: "dashboard" as IconKey },
          { label: "Patrol and Guard Points", to: "/supervisor/master/patrol-points", icon: "patrol" as IconKey },
          { label: "Job Position", to: "/supervisor/master/job-position", icon: "officers" as IconKey },
          { label: "Asset Management", to: "/supervisor/master/asset", icon: "dashboard" as IconKey },
          { label: "Asset Category", to: "/supervisor/master/asset-category", icon: "dashboard" as IconKey },
          { label: "CCTV Zone", to: "/supervisor/master/cctv-zone", icon: "dashboard" as IconKey },
          { label: "Sites", to: "/supervisor/sites", icon: "dashboard" as IconKey },
        ],
      },
    ],
  },
  {
    label: "⚙️ ADMINISTRATOR",
    items: [
      {
        label: "Administrator",
        children: [
          { label: "User Management", to: "/supervisor/admin/users", icon: "officers" as IconKey },
          { label: "User Access", to: "/supervisor/admin/user-access", icon: "officers" as IconKey },
          { label: "Incident User Access", to: "/supervisor/admin/incident-access", icon: "officers" as IconKey },
          { label: "Translation (i18n)", to: "/supervisor/admin/translation", icon: "dashboard" as IconKey },
          { label: "Roles & Permissions", to: "/supervisor/admin/roles", icon: "officers" as IconKey },
          { label: "Audit Logs", to: "/supervisor/admin/audit-logs", icon: "reports" as IconKey },
        ],
      },
    ],
  },
  // Legacy menu items (kept for backward compatibility)
  {
    label: "Legacy",
    items: [
      {
        label: "Attendance",
        children: [
          { label: "Attendance", to: "/supervisor/attendance", icon: "attendance" as IconKey },
          { label: "Simple Attendance", to: "/supervisor/attendance/simple", icon: "attendance" as IconKey },
          { label: "Attendance Correction", to: "/supervisor/attendance/correction", icon: "attendance" as IconKey },
          { label: "Overtime", to: "/supervisor/attendance/overtime", icon: "attendance" as IconKey },
          { label: "Outstation", to: "/supervisor/attendance/outstation", icon: "attendance" as IconKey },
          { label: "Leave", to: "/supervisor/attendance/leave", icon: "attendance" as IconKey },
          { label: "Approval", to: "/supervisor/attendance/approval", icon: "attendance" as IconKey },
        ],
      },
      {
        label: "Tasks & Checklists",
        children: [
          { label: "Tasks & Checklists", to: "/supervisor/checklists", icon: "tasks" as IconKey },
          { label: "Checklist Templates", to: "/supervisor/checklist-templates", icon: "tasks" as IconKey },
        ],
      },
      {
        label: "Cleaning",
        children: [
          { label: "Cleaning Dashboard", to: "/supervisor/cleaning/dashboard", icon: "cleaning" as IconKey },
        ],
      },
      {
        label: "Shift & Announcements",
        children: [
          { label: "Shift Calendar", to: "/supervisor/shifts", icon: "shifts" as IconKey },
          { label: "Pengumuman", to: "/supervisor/announcements", icon: "announcements" as IconKey },
        ],
      },
      { label: "Officer List", to: "/supervisor/officers", icon: "officers" as IconKey },
      { label: "Activity Heatmap", to: "/supervisor/heatmap", icon: "dashboard" as IconKey },
    ],
  },
];

const SupervisorLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clear: clearAuth } = useAuthStore();
  const { role, isAdmin } = usePermissions();
  const roleBasedMenuItems = useRoleBasedMenuItems();
  const userName = user?.username || "Supervisor";
  
  const isDashboard = location.pathname === "/supervisor" || location.pathname === "/supervisor/";

  // Find active menu item based on current path
  const getActiveMenuInfo = (): { title: string; subtitle: string; icon?: string } => {
    const path = location.pathname;
    
    // Check if on dashboard
    if (path === "/supervisor" || path === "/supervisor/") {
      return {
        title: isAdmin ? "Admin Dashboard" : "Supervisor Dashboard",
        subtitle: "Overview, attendance & patrol control",
        icon: "📊"
      };
    }

    // Search through menu groups
    for (const group of menuGroups) {
      for (const item of group.items) {
        // Check direct link items
        if (item.to && (path === item.to || path.startsWith(item.to + "/"))) {
          return {
            title: item.label,
            subtitle: group.label.replace(/^[^\s]+\s/, ''), // Remove emoji prefix
            icon: group.label.split(' ')[0] // Get emoji
          };
        }
        
        // Check children
        if (item.children) {
          for (const child of item.children) {
            if (child.to && (path === child.to || path.startsWith(child.to + "/"))) {
              return {
                title: child.label,
                subtitle: `${item.label} - ${group.label.replace(/^[^\s]+\s/, '')}`,
                icon: group.label.split(' ')[0]
              };
            }
          }
        }
      }
    }

    // Check role-based menu items
    for (const item of roleBasedMenuItems) {
      if (path === item.path || path.startsWith(item.path + "/")) {
        return {
          title: item.label,
          subtitle: "Additional Features",
          icon: "⚡"
        };
      }
    }

    // Default fallback
    return {
      title: isAdmin ? "Admin Dashboard" : "Supervisor Dashboard",
      subtitle: "Overview, attendance & patrol control",
      icon: "📊"
    };
  };

  const activeMenuInfo = getActiveMenuInfo();

  // Auto-expand parent menu if child is active
  useEffect(() => {
    const activeMenus = new Set<string>();
    menuGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => {
            if (child.to) {
              return location.pathname === child.to || location.pathname.startsWith(child.to + "/");
            }
            return false;
          });
          if (hasActiveChild) {
            activeMenus.add(`${group.label}-${item.label}`);
          }
        }
      });
    });
    setExpandedMenus(activeMenus);
  }, [location.pathname]);

  const toggleMenu = (groupLabel: string, itemLabel: string) => {
    const key = `${groupLabel}-${itemLabel}`;
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isMenuExpanded = (groupLabel: string, itemLabel: string) => {
    return expandedMenus.has(`${groupLabel}-${itemLabel}`);
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      clearAuth();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-white to-slate-50/30">
      {/* Header - Enhanced */}
      <div className="shrink-0 mb-4 px-4 pt-6 pb-4 border-b border-slate-200/80 bg-gradient-to-r from-blue-50/50 to-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">
              Verolux Management
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {isAdmin ? "Admin Panel" : "Supervisor Panel"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - Enhanced Scrollable */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-2 text-sm min-h-0 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <ul className="space-y-0.5 mb-2">
              {group.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = hasChildren ? isMenuExpanded(group.label, item.label) : false;
                const isActive = item.to ? (location.pathname === item.to || location.pathname.startsWith(item.to + "/")) : false;
                
                // Check if any child is active (exact match only)
                const hasActiveChild = hasChildren && item.children!.some((child) => {
                  if (child.to) {
                    // Exact match only, or if current path starts with child.to + "/" (for nested routes)
                    return location.pathname === child.to || 
                           (location.pathname.startsWith(child.to + "/") && location.pathname.length > child.to.length + 1);
                  }
                  return false;
                });

                if (hasChildren) {
                  // Parent menu with dropdown (no icon on parent) - Enhanced
                  return (
                    <li key={`${group.label}-${item.label}`} className="mb-1">
                      <button
                        type="button"
                        onClick={() => toggleMenu(group.label, item.label)}
                        className={`w-full flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 transition-all duration-200 ${
                          hasActiveChild
                            ? `bg-gradient-to-r from-blue-50 to-blue-50/80 text-blue-700 shadow-sm shadow-blue-500/10 border-l-3 border-blue-500`
                            : `text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 hover:shadow-sm`
                        }`}
                      >
                        <span className={`font-semibold text-sm ${hasActiveChild ? "text-blue-700" : "text-slate-800"}`}>
                          {item.label}
                        </span>
                        <svg
                          className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                            isExpanded ? "rotate-180 text-blue-600" : "text-slate-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {/* Sub menu - Enhanced */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${
                          isExpanded ? "max-h-[500px] opacity-100 mt-1.5" : "max-h-0 opacity-0"
                        }`}
                      >
                        <ul className="ml-2 space-y-0.5 border-l-2 border-slate-200/60 pl-4 py-1">
                          {item.children!.map((child, childIdx) => {
                            const ChildIcon = child.icon ? AppIcons[child.icon] : null;

                            return (
                              <li key={child.to || child.label} className={childIdx > 0 ? "mt-0.5" : ""}>
                                <NavLink
                                  to={child.to || "#"}
                                  onClick={() => setMobileOpen(false)}
                                  end={true}
                                  className={({ isActive: navIsActive }) =>
                                    `group flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all duration-200 ${
                                      navIsActive
                                        ? `bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 font-semibold shadow-sm shadow-blue-500/5`
                                        : `text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-0.5`
                                    }`
                                  }
                                >
                                  {({ isActive: navIsActive }) => (
                                    <>
                                      {ChildIcon && (
                                        <span className={`text-base flex-shrink-0 transition-transform duration-200 ${
                                          navIsActive ? "text-blue-600 scale-110" : "text-slate-500 group-hover:text-slate-700 group-hover:scale-105"
                                        }`}>
                                          {ChildIcon()}
                                        </span>
                                      )}
                                      <span className="truncate flex-1">{child.label}</span>
                                      {navIsActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                                      )}
                                    </>
                                  )}
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </li>
                  );
                } else {
                  // Direct link menu item (with icon) - Enhanced
                  const Icon = item.icon ? AppIcons[item.icon] : null;
                  return (
                    <li key={item.to || item.label} className="mb-1">
                      <NavLink
                        to={item.to || "#"}
                        onClick={() => setMobileOpen(false)}
                        end={item.to === "/supervisor" || item.to === "/supervisor/"}
                        className={({ isActive: navIsActive }) =>
                          `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-200 ${
                            navIsActive
                              ? `bg-gradient-to-r from-blue-50 to-blue-50/80 text-blue-700 shadow-sm shadow-blue-500/10 border-l-3 border-blue-500 font-semibold`
                              : `text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 hover:shadow-sm`
                          }`
                        }
                      >
                        {({ isActive: navIsActive }) => (
                          <>
                            {Icon && (
                              <span className={`text-base flex-shrink-0 transition-transform duration-200 ${
                                navIsActive ? "text-blue-600 scale-110" : "text-slate-500 group-hover:text-slate-700 group-hover:scale-105"
                              }`}>
                                {Icon()}
                              </span>
                            )}
                            <span className={`text-sm flex-1 ${navIsActive ? "font-semibold" : "font-medium"}`}>
                              {item.label}
                            </span>
                            {navIsActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse"></span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                }
              })}
            </ul>
          </div>
        ))}
        
        {/* Role-based Additional Menu Items - Enhanced */}
        {roleBasedMenuItems.length > 0 && (
          <div className="pt-2 border-t border-slate-200/60 mt-2">
            <ul className="space-y-0.5">
              {roleBasedMenuItems.map((item) => {
                return (
                  <li key={item.path} className="mb-1">
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      end={true}
                      className={({ isActive: navIsActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-200 ${
                          navIsActive
                            ? `bg-gradient-to-r from-blue-50 to-blue-50/80 text-blue-700 shadow-sm shadow-blue-500/10 border-l-3 border-blue-500 font-semibold`
                            : `text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 hover:shadow-sm`
                        }`
                      }
                    >
                      {({ isActive: navIsActive }) => (
                        <>
                          {item.icon && (
                            <span className={`text-base flex-shrink-0 transition-transform duration-200 ${
                              navIsActive ? "text-blue-600 scale-110" : "text-slate-500 group-hover:text-slate-700 group-hover:scale-105"
                            }`}>
                              {item.icon}
                            </span>
                          )}
                          <span className={`text-sm flex-1 ${navIsActive ? "font-semibold" : "font-medium"}`}>
                            {item.label}
                          </span>
                          {navIsActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse"></span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* User Profile & Logout - Enhanced */}
      <div className="shrink-0 mt-auto border-t border-slate-200/80 px-4 py-4 bg-gradient-to-b from-white to-slate-50/50">
        <div className="mb-3 flex items-center gap-3 p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/30 ring-2 ring-blue-500/20">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate text-slate-900">{userName}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <UserRoleBadge />
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar - Enhanced */}
      <aside className="hidden w-64 shrink-0 bg-white border-r border-slate-200/80 md:flex md:flex-col shadow-lg shadow-slate-200/50 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="flex h-screen w-64 flex-col bg-white border-r border-slate-200 shadow-xl">
            {sidebarContent}
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Bar - Enhanced */}
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-sm px-4 py-3 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <button
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {!isDashboard && (
              <button
                onClick={() => navigate("/supervisor")}
                className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              >
                <span>←</span>
                <span>Dashboard</span>
              </button>
            )}
            
            <div className="flex items-center gap-3">
              <span className="text-xl">{activeMenuInfo.icon}</span>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {activeMenuInfo.title}
                </div>
                <div className="text-xs text-slate-400">
                  {activeMenuInfo.subtitle}
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 font-medium shadow-sm">
              {userName}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 min-h-0">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SupervisorLayout;
