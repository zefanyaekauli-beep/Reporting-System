/**
 * Dashboard Card Component
 * White & Blue Theme
 */

import React from "react";

interface DashboardCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function DashboardCard({ title, children, className = "", headerAction }: DashboardCardProps) {
  return (
    <div
      className={`rounded-2xl border border-[#002B4B] bg-white p-4 shadow-sm ${className}`}
    >
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#002B4B]">{title}</h2>
          {headerAction}
        </div>
      )}
      <div className="text-[#002B4B]">
        {children}
      </div>
    </div>
  );
}
