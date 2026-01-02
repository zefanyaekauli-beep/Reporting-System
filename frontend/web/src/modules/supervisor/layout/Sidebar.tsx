// frontend/web/src/modules/supervisor/layout/Sidebar.tsx

import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { theme } from "../../shared/components/theme";

// Menu item interface
interface MenuItem {
  label: string;
  to?: string;
  children?: MenuItem[];
}

// Menu structure with all available routes
const menu: MenuItem[] = [
  {
    label: "Dashboard",
    to: "/supervisor/dashboard",
  },
  {
    label: "Officer",
    children: [
      { label: "Officer List", to: "/supervisor/officers" },
      { label: "Manpower", to: "/supervisor/manpower" },
    ],
  },
  {
    label: "Attendance",
    children: [
      { label: "Attendance Overview", to: "/supervisor/attendance" },
      { label: "Simple Attendance", to: "/supervisor/attendance/simple" },
      { label: "Attendance Correction", to: "/supervisor/attendance/correction" },
      { label: "Overtime", to: "/supervisor/attendance/overtime" },
      { label: "Outstation", to: "/supervisor/attendance/outstation" },
      { label: "Leave Requests", to: "/supervisor/attendance/leave" },
      { label: "Approval Queue", to: "/supervisor/attendance/approval" },
    ],
  },
  {
    label: "Reporting",
    children: [
      { label: "All Reports", to: "/supervisor/reports" },
      { label: "DAR (Daily Activity)", to: "/supervisor/reporting/dar" },
      { label: "Visitor Reports", to: "/supervisor/reporting/visitors" },
      { label: "Intelligence Reports", to: "/supervisor/reporting/intelligent" },
      { label: "Compliance Reports", to: "/supervisor/reporting/compliance" },
    ],
  },
  {
    label: "Patrol Management",
    children: [
      { label: "Patrol Activity", to: "/supervisor/patrol-activity" },
      { label: "Patrol Schedule", to: "/supervisor/patrol/schedule" },
      { label: "Patrol Assignment", to: "/supervisor/patrol/assignment" },
      { label: "Security Patrol", to: "/supervisor/patrol/security" },
      { label: "Joint Patrol", to: "/supervisor/patrol/joint" },
      { label: "Patrol Report", to: "/supervisor/patrol/report" },
      { label: "Patrol Targets", to: "/supervisor/patrol/targets" },
      { label: "Patrol Teams", to: "/supervisor/patrol/teams" },
    ],
  },
  {
    label: "Incident Management",
    children: [
      { label: "LK-LP (Laporan Kejadian)", to: "/supervisor/incident/lk-lp" },
      { label: "BAP (Berita Acara)", to: "/supervisor/incident/bap" },
      { label: "STPLK", to: "/supervisor/incident/stplk" },
      { label: "Findings", to: "/supervisor/incident/findings" },
      { label: "Incident Recap", to: "/supervisor/incident/recap" },
      { label: "Perpetrators", to: "/supervisor/incidents/perpetrators" },
    ],
  },
  {
    label: "Checklist & Inspection",
    children: [
      { label: "Checklists", to: "/supervisor/checklists" },
      { label: "Checklist Templates", to: "/supervisor/checklist-templates" },
      { label: "Inspect Points", to: "/supervisor/inspectpoints" },
    ],
  },
  {
    label: "Training",
    children: [
      { label: "Training Overview", to: "/supervisor/training" },
      { label: "Training Plan", to: "/supervisor/training/plan" },
      { label: "Participants", to: "/supervisor/training/participant" },
    ],
  },
  {
    label: "KPI & Analytics",
    children: [
      { label: "KPI Patrol", to: "/supervisor/kpi/patrol" },
      { label: "KPI Report", to: "/supervisor/kpi/report" },
      { label: "KPI CCTV", to: "/supervisor/kpi/cctv" },
      { label: "KPI Training", to: "/supervisor/kpi/training" },
      { label: "Activity Heatmap", to: "/supervisor/heatmap" },
    ],
  },
  {
    label: "Sites & Locations",
    children: [
      { label: "Sites Management", to: "/supervisor/sites" },
    ],
  },
  {
    label: "Division Dashboards",
    children: [
      { label: "Cleaning Dashboard", to: "/supervisor/cleaning/dashboard" },
    ],
  },
  {
    label: "Scheduling",
    children: [
      { label: "Shifts Calendar", to: "/supervisor/shifts" },
      { label: "Activity Calendar", to: "/supervisor/calendar" },
    ],
  },
  {
    label: "Master Data",
    children: [
      { label: "Master Data Main", to: "/supervisor/admin/master-data" },
      { label: "Workers", to: "/supervisor/master/worker" },
      { label: "Business Units", to: "/supervisor/master/business-unit" },
      { label: "Departments", to: "/supervisor/master/department" },
      { label: "Patrol Points", to: "/supervisor/master/patrol-points" },
      { label: "Job Positions", to: "/supervisor/master/job-position" },
      { label: "Assets", to: "/supervisor/master/asset" },
      { label: "Asset Categories", to: "/supervisor/master/asset-category" },
      { label: "CCTV Zones", to: "/supervisor/master/cctv-zone" },
    ],
  },
  {
    label: "Information",
    children: [
      { label: "Documents", to: "/supervisor/information/document" },
      { label: "CCTV Status", to: "/supervisor/information/cctv" },
      { label: "Notifications", to: "/supervisor/information/notification" },
    ],
  },
  {
    label: "Administration",
    children: [
      { label: "User Management", to: "/supervisor/admin/users" },
      { label: "User Access Control", to: "/supervisor/admin/user-access" },
      { label: "Roles & Permissions", to: "/supervisor/admin/roles" },
      { label: "Employees", to: "/supervisor/admin/employees" },
      { label: "Incident Access", to: "/supervisor/admin/incident-access" },
      { label: "Translation", to: "/supervisor/admin/translation" },
      { label: "Audit Logs", to: "/supervisor/admin/audit-logs" },
      { label: "KTA Management", to: "/supervisor/kta" },
    ],
  },
  {
    label: "Control Center",
    children: [
      { label: "Control Center", to: "/supervisor/control-center" },
    ],
  },
];

const Sidebar: React.FC = () => {
  // Track which menu groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Dashboard": true, // Dashboard is expanded by default
  });

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  return (
    <aside
      style={{
        width: 256,
        backgroundColor: theme.colors.surface,
        color: theme.colors.textMain,
        borderRight: `1px solid ${theme.colors.border}`,
        display: "flex",
        flexDirection: "column",
        boxShadow: theme.shadowCard,
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          Security Management System
        </div>
        <div style={{ fontSize: 10, color: theme.colors.textSoft }}>
          Supervisor Panel
        </div>
      </div>
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 0",
        }}
      >
        {menu.map((group) => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            {/* Menu group header or single item */}
            {group.to ? (
              // Single menu item without children
              <NavLink
                to={group.to}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  backgroundColor: isActive
                    ? theme.colors.primarySoft
                    : "transparent",
                  color: isActive ? theme.colors.primary : theme.colors.textMain,
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: "none",
                })}
              >
                <span>{group.label}</span>
              </NavLink>
            ) : (
              // Menu group with children
              <>
                <div
                  onClick={() => toggleGroup(group.label)}
                  style={{
                    padding: "10px 16px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    color: theme.colors.textSoft,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    userSelect: "none",
                  }}
                >
                  <span>{group.label}</span>
                  <span
                    style={{
                      transform: expandedGroups[group.label]
                        ? "rotate(90deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s",
                      fontSize: 10,
                    }}
                  >
                    ▶
                  </span>
                </div>
                {/* Children items */}
                {expandedGroups[group.label] &&
                  group.children?.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to!}
                      style={({ isActive }) => ({
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px 8px 32px",
                        fontSize: 12,
                        cursor: "pointer",
                        backgroundColor: isActive
                          ? theme.colors.primarySoft
                          : "transparent",
                        color: isActive
                          ? theme.colors.primary
                          : theme.colors.textMain,
                        fontWeight: isActive ? 600 : 400,
                        textDecoration: "none",
                        borderLeft: isActive
                          ? `3px solid ${theme.colors.primary}`
                          : "3px solid transparent",
                      })}
                    >
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
              </>
            )}
          </div>
        ))}
      </nav>
      <div
        style={{
          padding: "12px 16px",
          borderTop: `1px solid ${theme.colors.border}`,
          fontSize: 10,
          color: theme.colors.textSoft,
          textAlign: "center",
        }}
      >
        v1.0.0 - Verolux System
      </div>
    </aside>
  );
};

export default Sidebar;
