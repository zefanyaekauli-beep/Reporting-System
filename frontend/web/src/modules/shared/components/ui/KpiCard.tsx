/**
 * KPI Card Component
 * White & Blue Theme
 */

import React from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "danger" | "warning" | "success";
  icon?: React.ReactNode;
}

export function KpiCard({ title, value, subtitle, variant = "default", icon }: KpiCardProps) {
  const variantStyles = {
    default: "bg-white text-[#002B4B] border-[#002B4B]",
    danger: "border-red-300 text-red-600 bg-red-50",
    warning: "border-amber-300 text-amber-600 bg-amber-50",
    success: "border-green-300 text-green-600 bg-green-50",
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${variantStyles[variant]} transition-transform hover:scale-[1.02] shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`text-xs ${variant === "default" ? "text-[#002B4B]" : "text-slate-500"}`}>{title}</div>
          <div className={`mt-1 text-3xl font-semibold ${variant === "default" ? "text-[#002B4B]" : "text-slate-900"}`}>{value}</div>
          {subtitle && (
            <div className={`mt-1 text-[11px] ${variant === "default" ? "text-slate-600" : "text-slate-500"}`}>{subtitle}</div>
          )}
        </div>
        {icon && <div className="ml-2">{icon}</div>}
      </div>
    </div>
  );
}
