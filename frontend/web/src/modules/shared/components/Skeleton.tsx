// frontend/web/src/modules/shared/components/Skeleton.tsx

import { CSSProperties } from "react";
import { theme } from "./theme";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
  rounded?: boolean;
}

export function Skeleton({
  width = "100%",
  height = 20,
  style,
  rounded = false,
}: SkeletonProps) {
  const baseStyle: CSSProperties = {
    width,
    height,
    backgroundColor: theme.colors.border,
    borderRadius: rounded ? 9999 : 6,
    animation: "pulse 1.5s ease-in-out infinite",
    ...style,
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
      <div style={baseStyle} />
    </>
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        boxShadow: theme.shadowCard,
        marginBottom: 12,
      }}
    >
      <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
      <Skeleton width="80%" height={14} />
    </div>
  );
}

