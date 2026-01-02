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
  onClick?: () => void;
}

export function DashboardCard({ title, children, className = "", headerAction, onClick }: DashboardCardProps) {
  const cardClasses = `rounded-2xl border border-[#002B4B] bg-white p-4 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`;
  
  return (
    <div
      className={cardClasses}
      onClick={onClick}
    >
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h2 
            className={`text-sm font-semibold text-[#002B4B] ${onClick ? "cursor-pointer" : ""}`}
            onClick={onClick}
          >
            {title}
          </h2>
          {headerAction}
        </div>
      )}
      <div className="text-[#002B4B]">
        {children}
      </div>
    </div>
  );
}
