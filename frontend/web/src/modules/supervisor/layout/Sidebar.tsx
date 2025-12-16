// frontend/web/src/modules/supervisor/layout/Sidebar.tsx

import React from "react";
import { NavLink } from "react-router-dom";
import { theme } from "../../shared/components/theme";

const menu = [
  {
    label: "Officer",
    items: [{ label: "Officer List", to: "/supervisor/officers" }],
  },
  {
    label: "Attendance",
    items: [
      { label: "Attendance", to: "/supervisor/attendance" },
      { label: "Simple Attendance", to: "/supervisor/attendance/simple" },
      {
        label: "Attendance Correction",
        to: "/supervisor/attendance/correction",
      },
      { label: "Overtime", to: "/supervisor/attendance/overtime" },
      { label: "Outstation", to: "/supervisor/attendance/outstation" },
      { label: "Leave", to: "/supervisor/attendance/leave" },
      { label: "Approval", to: "/supervisor/attendance/approval" },
    ],
  },
  {
    label: "Patrol/Activity",
    items: [
      {
        label: "Patrol & Activity",
        to: "/supervisor/patrol-activity",
      },
    ],
  },
  {
    label: "Inspectpoint",
    items: [
      {
        label: "Inspect Points",
        to: "/supervisor/inspectpoints",
      },
    ],
  },
  {
    label: "Reports",
    items: [{ label: "Reports", to: "/supervisor/reports" }],
  },
  {
    label: "Sites",
    items: [{ label: "Sites", to: "/supervisor/sites" }],
  },
  {
    label: "Cleaning",
    items: [{ label: "Cleaning Dashboard", to: "/supervisor/cleaning/dashboard" }],
  },
  {
    label: "KTA",
    items: [{ label: "KTA Management", to: "/supervisor/kta" }],
  },
  {
    label: "Admin",
    items: [
      { label: "Roles & Permissions", to: "/supervisor/admin/roles" },
      { label: "Audit Logs", to: "/supervisor/admin/audit-logs" },
    ],
  },
  {
    label: "Patrol",
    items: [
      { label: "Patrol Targets", to: "/supervisor/patrol/targets" },
      { label: "Patrol Teams", to: "/supervisor/patrol/teams" },
    ],
  },
  {
    label: "Calendar",
    items: [{ label: "Activity Calendar", to: "/supervisor/calendar" }],
  },
  {
    label: "Analytics",
    items: [{ label: "Activity Heatmap", to: "/supervisor/heatmap" }],
  },
];

const Sidebar: React.FC = () => {
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
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>Security Management System</div>
        <div style={{ fontSize: 10, color: theme.colors.textSoft }}>Supervisor Panel</div>
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
            <div
              style={{
                padding: "12px 16px 4px",
                fontSize: 11,
                textTransform: "uppercase",
                color: theme.colors.textSoft,
              }}
            >
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  backgroundColor: isActive ? theme.colors.primarySoft : "transparent",
                  color: isActive ? theme.colors.primary : theme.colors.textMain,
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: "none",
                })}
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
