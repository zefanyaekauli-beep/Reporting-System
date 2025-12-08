/**
 * Unified App Shell Component
 * Reusable shell matching Verolux CCTV AI design
 */

import React from "react";
import { Outlet } from "react-router-dom";
import { designSystem } from "./designSystem";

interface AppShellProps {
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
  topBar?: React.ReactNode;
}

export function AppShell({ children, sidebar, topBar }: AppShellProps) {
  return (
    <div className={`flex h-screen ${designSystem.colors.background.primary} ${designSystem.colors.text.primary}`}>
      {sidebar && (
        <aside className={`hidden shrink-0 ${designSystem.sidebar.width} ${designSystem.sidebar.bg} ${designSystem.sidebar.border} md:flex md:flex-col`}>
          {sidebar}
        </aside>
      )}
      
      <div className="flex flex-1 flex-col min-w-0">
        {topBar && (
          <header className={`border-b ${designSystem.colors.border.default} ${designSystem.colors.background.secondary}`}>
            {topBar}
          </header>
        )}
        
        <main className={`flex-1 overflow-y-auto ${designSystem.colors.background.primary}/95 ${designSystem.spacing.page.desktop}`}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

