/**
 * Quick Action Button Component
 * White & Blue Theme
 */

import React from "react";

interface QuickActionProps {
  label: string;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function QuickAction({
  label,
  onClick,
  primary = false,
  danger = false,
  icon,
  disabled = false,
}: QuickActionProps) {
  let baseClasses = `w-full rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all`;
  
  if (disabled) {
    baseClasses += " border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50";
  } else if (primary) {
    baseClasses += ` bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-sm`;
  } else if (danger) {
    baseClasses += ` border-red-300 text-red-600 bg-white hover:bg-red-50`;
  } else {
    baseClasses += ` border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-blue-300`;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
    >
      <div className="flex items-center gap-2">
        {icon && <span>{icon}</span>}
        <span className={icon ? "text-xs" : ""}>{label}</span>
      </div>
    </button>
  );
}
