// frontend/web/src/modules/shared/components/Card.tsx

import { ReactNode, CSSProperties } from "react";
import { theme } from "./theme";

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  hover?: boolean;
}

export function Card({ children, onClick, style, hover = true }: CardProps) {
  const baseStyle: CSSProperties = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius?.card || 12,
    padding: 16,
    boxShadow: theme.shadowCard,
    border: `1px solid ${theme.colors.border}`,
    cursor: onClick ? "pointer" : "default",
    transition: hover ? "all 0.2s ease" : "none",
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover && onClick) {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = theme.shadowCard;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover && onClick) {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = theme.shadowCard;
    }
  };

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

