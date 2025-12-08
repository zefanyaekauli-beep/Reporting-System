// frontend/web/src/modules/shared/components/BottomNav.tsx

import { Link, useLocation } from "react-router-dom";
import { theme } from "./theme";

interface NavItem {
  key: string;
  label: string;
  to: string;
}

export function BottomNav() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const division = segments[0]; // "security" | "cleaning" | "parking" | undefined

  if (!division) {
    // e.g. on /login -> hide bottom nav
    return null;
  }

  const base = `/${division}`;
  
  // Only 3 items: Dashboard, Panic, Profile
  const items: NavItem[] = [
    { key: "home", label: "Dashboard", to: `${base}/dashboard` },
    { key: "panic", label: "Panic", to: `${base}/panic` },
    { key: "profile", label: "Profil", to: "/profile" }
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around border-t border-slate-200 bg-slate-50/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
      style={{
        height: `max(64px, calc(64px + env(safe-area-inset-bottom)))`,
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {items.map((item) => {
        // Special handling for dashboard: active if path is exactly base or base/dashboard
        let active = false;
        if (item.key === "home") {
          active = location.pathname === base || location.pathname === `${base}/dashboard` || location.pathname.startsWith(`${base}/dashboard`);
        } else {
          active = location.pathname.startsWith(item.to);
        }
        return (
          <Link
            key={item.key}
            to={item.to}
            className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-1 text-center text-[11px] no-underline ${
              active
                ? "text-sky-600 font-semibold dark:text-sky-400"
                : "text-slate-500 font-medium dark:text-slate-400"
            }`}
          >
            <div className={`text-xl leading-none ${active ? "opacity-100" : "opacity-60"}`}>
              {item.key === "home" && "🏠"}
              {item.key === "panic" && "🚨"}
              {item.key === "profile" && "👤"}
            </div>
            <div>{item.label}</div>
          </Link>
        );
      })}
    </nav>
  );
}

