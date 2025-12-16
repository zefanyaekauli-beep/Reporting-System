// frontend/web/src/components/UserRoleBadge.tsx

import { usePermissions } from "../hooks/usePermissions";
import { theme } from "../modules/shared/components/theme";

export function UserRoleBadge() {
  const { role, division, isAdmin, isSupervisor } = usePermissions();

  const getRoleInfo = () => {
    if (isAdmin) {
      return { label: "Admin", color: theme.colors.danger, bgColor: theme.colors.danger + "20" };
    }
    if (isSupervisor) {
      return { label: "Supervisor", color: theme.colors.primary, bgColor: theme.colors.primary + "20" };
    }
    const divisionLabel = division ? division.charAt(0).toUpperCase() + division.slice(1) : "User";
    return { label: divisionLabel, color: theme.colors.success, bgColor: theme.colors.success + "20" };
  };

  const roleInfo = getRoleInfo();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        borderRadius: theme.radius.badge,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: roleInfo.bgColor,
        color: roleInfo.color,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {roleInfo.label}
    </span>
  );
}

