// frontend/web/src/components/ActionButton.tsx
// Button component dengan permission checking

import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { RoleBasedAccess } from "./RoleBasedAccess";
import { theme } from "../modules/shared/components/theme";

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  to?: string;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  requiredPermission?: { resource: string; action: string };
  allowedRoles?: string[];
  allowedDivisions?: string[];
  disabled?: boolean;
  className?: string;
}

export function ActionButton({
  children,
  onClick,
  to,
  variant = "primary",
  size = "md",
  requiredPermission,
  allowedRoles,
  allowedDivisions,
  disabled = false,
  className = "",
}: ActionButtonProps) {
  const { hasPermission, hasRole, isDivision } = usePermissions();

  // Check permissions
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return null;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return null;
  }

  if (allowedDivisions && !isDivision(allowedDivisions)) {
    return null;
  }

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      color: "white",
      hover: theme.colors.primary + "dd",
    },
    secondary: {
      backgroundColor: theme.colors.background,
      color: theme.colors.textMain,
      hover: theme.colors.border,
    },
    danger: {
      backgroundColor: theme.colors.danger,
      color: "white",
      hover: theme.colors.danger + "dd",
    },
    success: {
      backgroundColor: theme.colors.success,
      color: "white",
      hover: theme.colors.success + "dd",
    },
  };

  const sizeStyles = {
    sm: { padding: "6px 12px", fontSize: 12 },
    md: { padding: "8px 16px", fontSize: 13 },
    lg: { padding: "12px 24px", fontSize: 14 },
  };

  const style = {
    ...sizeStyles[size],
    ...variantStyles[variant],
    borderRadius: theme.radius.button,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    fontWeight: 500,
    transition: "all 0.2s",
  };

  if (to) {
    return (
      <Link
        to={to}
        style={{
          ...style,
          display: "inline-block",
          textDecoration: "none",
          textAlign: "center",
        }}
        className={className}
        onClick={disabled ? (e: any) => e.preventDefault() : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={className}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = variantStyles[variant].hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor;
        }
      }}
    >
      {children}
    </button>
  );
}

