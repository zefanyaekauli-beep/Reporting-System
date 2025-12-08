// frontend/web/src/modules/shared/components/MobileLayout.tsx

import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { theme } from "./theme";
import { useAuthStore } from "../../../stores/authStore";
import { getGreeting } from "../../../utils/getGreeting";
import { useTranslation } from "../../../i18n/useTranslation";
import ThemeToggle from "./ui/ThemeToggle";

interface MobileLayoutProps {
  title: string;
  children: ReactNode;
  showBottomNav?: boolean;
}

export function MobileLayout({
  title,
  children,
  showBottomNav = true,
}: MobileLayoutProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState(() => getGreeting(user?.username));

  // Update greeting every minute to reflect time changes
  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreeting(user?.username));
    };

    // Update immediately
    updateGreeting();

    // Update every minute
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, [user?.username]);

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      clear();
      localStorage.removeItem("auth_token"); // Clear any stored tokens
      localStorage.removeItem("userRole"); // Clear user role
      navigate("/login");
    }
  };

  return (
    <div
      className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-900 dark:bg-slate-950"
      style={{ height: "100dvh" }}
    >
      {/* Header - GuardsPro style dark navy */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/20 bg-slate-900 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950" style={{ paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}>
        <div className="text-base font-bold text-white">
          {greeting}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/30"
            title={t("auth.logout")}
          >
            <span>🚪</span>
            <span>{t("auth.logout")}</span>
          </button>
        </div>
      </header>

      {/* Content - white cards on light background */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden rounded-t-2xl bg-slate-50 p-3 dark:bg-slate-950"
        style={{
          paddingBottom: showBottomNav
            ? "max(72px, calc(72px + env(safe-area-inset-bottom, 0px)))"
            : "max(12px, calc(12px + env(safe-area-inset-bottom, 0px)))",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="mx-auto max-w-md">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
