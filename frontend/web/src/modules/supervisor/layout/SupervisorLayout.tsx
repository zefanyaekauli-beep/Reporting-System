/**
 * Supervisor Layout - Verolux CCTV AI Style
 * Clean, grouped sidebar with proper spacing
 */

import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";
import ThemeToggle from "../../shared/components/ui/ThemeToggle";
import { AppIcons, IconKey } from "../../../icons/AppIcons";
import { usePermissions } from "../../../hooks/usePermissions";
import { RoleBasedAccess } from "../../../components/RoleBasedAccess";
import { UserRoleBadge } from "../../../components/UserRoleBadge";
import { useRoleBasedMenuItems } from "../../../components/RoleBasedMenuItems";
// Design system - using direct Tailwind classes

const menuGroups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/supervisor", icon: "dashboard" as IconKey }],
  },
  {
    label: "Attendance",
    items: [
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
    label: "Patrol",
    items: [
      { label: "Patrol & Activity", to: "/supervisor/patrol-activity", icon: "tasks" as IconKey },
      { label: "Inspect Points", to: "/supervisor/inspectpoints", icon: "tasks" as IconKey },
    ],
  },
  {
    label: "Tasks & Checklists",
    items: [
      { label: "Tasks & Checklists", to: "/supervisor/checklists", icon: "tasks" as IconKey },
      { label: "Checklist Templates", to: "/supervisor/checklist-templates", icon: "tasks" as IconKey },
    ],
  },
  {
    label: "Cleaning",
    items: [
      { label: "Cleaning Dashboard", to: "/supervisor/cleaning/dashboard", icon: "cleaning" as IconKey },
    ],
  },
  {
    label: "Shift & Pengumuman",
    items: [
      { label: "Shift Calendar", to: "/supervisor/shifts", icon: "shifts" as IconKey },
      { label: "Pengumuman", to: "/supervisor/announcements", icon: "announcements" as IconKey },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Officer List", to: "/supervisor/officers", icon: "officers" as IconKey },
      { label: "Reports", to: "/supervisor/reports", icon: "reports" as IconKey },
      { label: "Sites", to: "/supervisor/sites", icon: "dashboard" as IconKey },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Master Data", to: "/supervisor/admin/master-data", icon: "dashboard" as IconKey },
      { label: "Roles & Permissions", to: "/supervisor/admin/roles", icon: "officers" as IconKey },
      { label: "Audit Logs", to: "/supervisor/admin/audit-logs", icon: "reports" as IconKey },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Activity Heatmap", to: "/supervisor/heatmap", icon: "dashboard" as IconKey },
    ],
  },
];

const SupervisorLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clear: clearAuth } = useAuthStore();
  const { role, isAdmin } = usePermissions();
  const roleBasedMenuItems = useRoleBasedMenuItems();
  const userName = user?.username || "Supervisor";
  
  const isDashboard = location.pathname === "/supervisor" || location.pathname === "/supervisor/";

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      clearAuth();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-6 px-4 pt-6 border-b border-slate-200 pb-4">
        <div className="text-base font-semibold mb-1 text-slate-900">
          Verolux Management System
        </div>
        <div className="text-xs text-slate-500">
          Supervisor Panel
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 text-sm min-h-0">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-[11px] uppercase tracking-[0.1em] text-slate-500">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = AppIcons[item.icon];
                const isActive = location.pathname === item.to;
                
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive: navIsActive }) =>
                        `flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                          navIsActive || isActive
                            ? `bg-blue-50 text-blue-700 border-l-2 border-blue-500`
                            : `text-slate-700 hover:bg-slate-50 hover:text-slate-900`
                        }`
                      }
                    >
                      {Icon && <span className="text-base flex-shrink-0">{Icon()}</span>}
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        
        {/* Role-based Additional Menu Items */}
        {roleBasedMenuItems.length > 0 && (
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.1em] text-slate-500">
              Additional Features
            </div>
            <ul className="space-y-1">
              {roleBasedMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive: navIsActive }) =>
                        `flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                          navIsActive || isActive
                            ? `bg-blue-50 text-blue-700 border-l-2 border-blue-500`
                            : `text-slate-700 hover:bg-slate-50 hover:text-slate-900`
                        }`
                      }
                    >
                      {item.icon && <span className="text-base flex-shrink-0">{item.icon}</span>}
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* User Profile & Logout */}
      <div className="shrink-0 mt-auto border-t border-slate-200 px-4 py-4 bg-slate-50">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-slate-900">{userName}</div>
            <div className="flex items-center gap-2 mt-1">
              <UserRoleBadge />
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:border-blue-500 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FFFFF0] text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 bg-white border-r border-slate-200 md:flex md:flex-col shadow-sm h-screen">
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
        {/* Top Bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <button
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
                className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <span>←</span>
                <span>Dashboard</span>
              </button>
            )}
            
            <div>
              <div className={`text-sm font-semibold ${isDashboard ? "text-slate-900" : "cursor-pointer text-blue-600 hover:underline"}`}
                onClick={!isDashboard ? () => navigate("/supervisor") : undefined}
              >
                Supervisor Dashboard
              </div>
              <div className="text-xs text-slate-400">
                Overview, attendance & patrol control
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700">
              {userName}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#FFFFF0] p-6 min-h-0">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SupervisorLayout;
