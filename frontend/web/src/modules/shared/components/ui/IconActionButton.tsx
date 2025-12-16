/**
 * Icon Action Button Component
 * Icon on top, small text below
 * Compatible with both Tailwind and inline styles
 */

import React from "react";
import { theme } from "../theme";

interface IconActionButtonProps {
  label: string;
  onClick?: () => void;
  icon: React.ReactNode;
  variant?: "default" | "primary" | "danger" | "success";
  disabled?: boolean;
}

export function IconActionButton({
  label,
  onClick,
  icon,
  variant = "default",
  disabled = false,
}: IconActionButtonProps) {
  let buttonStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: theme.radius.card,
    // border: `1px solid ${theme.colors.border}`,
    // padding: "12px 8px",
    // minWidth: "80px",

    transition: "all 0.2s",
    cursor: disabled ? "not-allowed" : "pointer",
  };

  if (disabled) {
    buttonStyle = {
      ...buttonStyle,
      borderColor: theme.colors.border,
      color: theme.colors.textSoft,
      // backgroundColor: theme.colors.background,
      opacity: 0.5,
    };
  } else if (variant === "primary") {
    buttonStyle = {
      ...buttonStyle,
      backgroundColor: theme.colors.primary,
      // borderColor: theme.colors.primary,
      color: "#FFFFFF",
      boxShadow: theme.shadowCard,
    };
  } else if (variant === "danger") {
    buttonStyle = {
      ...buttonStyle,
      // borderColor: theme.colors.danger,
      color: theme.colors.danger,
      backgroundColor: theme.colors.surface,
    };
  } else if (variant === "success") {
    buttonStyle = {
      ...buttonStyle,
      // borderColor: theme.colors.success,
      color: theme.colors.success,
      backgroundColor: theme.colors.surface,
    };
  } else {
    buttonStyle = {
      ...buttonStyle,
      // borderColor: theme.colors.border,
      color: theme.colors.textMain,
      backgroundColor: theme.colors.surface,
    };
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      type="button"
      onMouseEnter={(e) => {
        if (!disabled && variant !== "primary") {
          e.currentTarget.style.backgroundColor = theme.colors.background;
          // e.currentTarget.style.borderColor = theme.colors.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant !== "primary") {
          e.currentTarget.style.backgroundColor = theme.colors.surface;
          // e.currentTarget.style.borderColor = theme.colors.border;
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", minHeight: "32px"}}>
        {icon}
      </div>
      <span style={{ fontSize: "10px", fontWeight: 600, textAlign: "center", lineHeight: 1.2, }}>
        {label}
      </span>
    </button>
  );
}

