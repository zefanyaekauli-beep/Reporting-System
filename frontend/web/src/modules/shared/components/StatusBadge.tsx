// frontend/web/src/modules/shared/components/StatusBadge.tsx

import { theme } from "./theme";

interface StatusBadgeProps {
  status?: string;
  severity?: "low" | "medium" | "high";
  label?: string;
}

export function StatusBadge({ status, severity, label }: StatusBadgeProps) {
  const getColor = () => {
    if (severity === "high" || status === "open" || status === "pending") {
      return theme.colors.danger;
    }
    if (severity === "medium" || status === "in_progress") {
      return theme.colors.warning;
    }
    if (severity === "low" || status === "closed" || status === "completed") {
      return theme.colors.success;
    }
    return theme.colors.textMuted;
  };

  const displayText = label || status || severity || "";

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#FFFFFF",
        backgroundColor: getColor(),
        padding: "4px 10px",
        borderRadius: 12,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        display: "inline-block",
      }}
    >
      {displayText}
    </span>
  );
}

