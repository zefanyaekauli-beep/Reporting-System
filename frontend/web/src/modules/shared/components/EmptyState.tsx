// frontend/web/src/modules/shared/components/EmptyState.tsx

import { ReactNode } from "react";
import { theme } from "./theme";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({
  icon = "📭",
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "40px 20px",
        color: theme.colors.textMuted,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 8,
          color: theme.colors.textMain,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
        {message}
      </div>
      {action && action}
    </div>
  );
}

