// frontend/web/src/stores/themeStore.ts

import { create } from "zustand";

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(mode);
  // Also store in localStorage for persistence
  if (typeof window !== "undefined") {
    localStorage.setItem("theme-mode", mode);
  }
}

// Initialize theme on module load
function initializeTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  
  // Check localStorage first
  const stored = localStorage.getItem("theme-mode");
  if (stored === "light" || stored === "dark") {
    applyTheme(stored);
    return stored;
  }
  
  // Fallback to system preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialMode = prefersDark ? "dark" : "light";
  applyTheme(initialMode);
  return initialMode;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initializeTheme(),
  setMode: (mode) => {
    set({ mode });
    applyTheme(mode);
  },
  toggle: () => {
    const next = get().mode === "dark" ? "light" : "dark";
    set({ mode: next });
    applyTheme(next);
  },
}));

