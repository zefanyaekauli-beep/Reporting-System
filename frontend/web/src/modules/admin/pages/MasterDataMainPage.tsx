// frontend/web/src/modules/admin/pages/MasterDataMainPage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../shared/components/theme";
import { AppIcons } from "../../../icons/AppIcons";
import { usePermissions } from "../../../hooks/usePermissions";
import { PermissionGate } from "../../../components/PermissionGate";

interface MasterDataMenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  requiredPermission?: {
    resource: string;
    action: string;
  };
}

const MasterDataMainPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  const masterDataMenus: MasterDataMenuItem[] = [
    {
      id: "roles",
      label: "Roles",
      description: "Manage user roles and permissions",
      icon: AppIcons.officers(),
      route: "/supervisor/admin/master-data/roles",
      requiredPermission: { resource: "master_data", action: "read" },
    },
    {
      id: "permissions",
      label: "Permissions",
      description: "Manage system permissions",
      icon: AppIcons.reports(),
      route: "/supervisor/admin/master-data/permissions",
      requiredPermission: { resource: "master_data", action: "read" },
    },
    {
      id: "sites",
      label: "Sites",
      description: "Manage sites and locations",
      icon: AppIcons.dashboard(),
      route: "/supervisor/admin/master-data/sites",
      requiredPermission: { resource: "sites", action: "read" },
    },
    {
      id: "zones",
      label: "Zones",
      description: "Manage zones and areas",
      icon: AppIcons.patrol(),
      route: "/supervisor/admin/master-data/zones",
      requiredPermission: { resource: "master_data", action: "read" },
    },
    {
      id: "incident-types",
      label: "Incident Types",
      description: "Manage incident categories and types",
      icon: AppIcons.reports(),
      route: "/supervisor/admin/master-data/incident-types",
      requiredPermission: { resource: "master_data", action: "read" },
    },
    {
      id: "status-types",
      label: "Status Types",
      description: "Manage status categories",
      icon: AppIcons.checklist(),
      route: "/supervisor/admin/master-data/status-types",
      requiredPermission: { resource: "master_data", action: "read" },
    },
    {
      id: "vehicle-types",
      label: "Vehicle Types",
      description: "Manage vehicle categories",
      icon: AppIcons.patrol(),
      route: "/supervisor/admin/master-data/vehicle-types",
      requiredPermission: { resource: "master_data", action: "read" },
    },
    {
      id: "visitor-categories",
      label: "Visitor Categories",
      description: "Manage visitor categories",
      icon: AppIcons.reports(),
      route: "/supervisor/admin/master-data/visitor-categories",
      requiredPermission: { resource: "master_data", action: "read" },
    },
    {
      id: "other",
      label: "Other Master Data",
      description: "Manage other master data categories",
      icon: AppIcons.checklist(),
      route: "/supervisor/admin/master-data/other",
      requiredPermission: { resource: "master_data", action: "read" },
    },
  ];

  const handleMenuClick = (route: string) => {
    navigate(route);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: "100%",
        padding: "16px",
        paddingBottom: "2rem",
        backgroundColor: theme.colors.background,
      }}
      className="overflow-y-auto"
    >
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Master Data Management</h2>
        <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
          Centralized management for all master data categories. Select a category to manage its data.
        </p>
      </div>

      {!isAdmin && (
        <div
          style={{
            padding: 12,
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          Admin access required to manage master data.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {masterDataMenus.map((menu) => {
          const content = (
            <div
              onClick={() => handleMenuClick(menu.route)}
              style={{
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 8,
                padding: 20,
                border: `1px solid ${theme.colors.border}`,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 140,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.background;
                e.currentTarget.style.borderColor = theme.colors.primary;
                e.currentTarget.style.boxShadow = `0 2px 8px ${theme.colors.primary}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: theme.colors.primary + "20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.colors.primary,
                  }}
                >
                  {menu.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textMain }}>
                    {menu.label}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, lineHeight: 1.5 }}>
                {menu.description}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: theme.colors.primary,
                  fontWeight: 500,
                  marginTop: "auto",
                }}
              >
                Manage →
              </div>
            </div>
          );

          if (menu.requiredPermission) {
            return (
              <PermissionGate
                key={menu.id}
                resource={menu.requiredPermission.resource}
                action={menu.requiredPermission.action}
              >
                {content}
              </PermissionGate>
            );
          }

          return <React.Fragment key={menu.id}>{content}</React.Fragment>;
        })}
      </div>
    </div>
  );
};

export default MasterDataMainPage;

