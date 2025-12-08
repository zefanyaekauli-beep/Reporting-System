// frontend/web/src/modules/shared/components/ui/ThemeToggle.tsx

import { useThemeStore } from "../../../../stores/themeStore";

export default function ThemeToggle() {
  const { mode, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 rounded-full border border-slate-300/30 bg-slate-200/10 px-2 py-1 text-[10px] font-medium text-slate-200 hover:bg-slate-200/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
    >
      <span className="inline-block h-3 w-3 rounded-full bg-amber-400 dark:hidden" />
      <span className="hidden h-3 w-3 rounded-full bg-sky-400 dark:inline-block" />
      <span>{mode === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}

