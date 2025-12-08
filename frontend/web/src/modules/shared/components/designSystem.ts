/**
 * Verolux Design System
 * White & Blue Theme
 * Background: #FFFFF0 (ivory/cream)
 * Card/Sub: #002B4B (dark blue)
 */

export const designSystem = {
  colors: {
    // Backgrounds - Custom ivory/cream
    background: {
      primary: "bg-[#FFFFF0]",
      secondary: "bg-[#FFFFF0]",
      surface: "bg-[#FFFFF0]",
      card: "bg-white",
    },
    // Borders
    border: {
      default: "border-slate-300",
      muted: "border-slate-200",
      accent: "border-blue-500",
      danger: "border-red-500",
      card: "border-[#002B4B]",
    },
    // Text
    text: {
      primary: "text-slate-900",
      secondary: "text-slate-700",
      muted: "text-slate-500",
      disabled: "text-slate-400",
      card: "text-[#002B4B]",
      cardMuted: "text-slate-600",
    },
    // Accents - Blue theme
    accent: {
      primary: "bg-blue-500",
      primaryHover: "hover:bg-blue-600",
      danger: "text-red-500",
      dangerBg: "bg-red-50",
      warning: "text-amber-600",
      success: "text-green-600",
    },
  },
  spacing: {
    page: {
      mobile: "p-4",
      desktop: "p-6",
    },
    card: {
      mobile: "p-4",
      desktop: "p-5",
    },
    section: "mb-6",
    element: "gap-4",
  },
  radius: {
    card: "rounded-2xl",
    button: "rounded-xl",
    input: "rounded-xl",
    small: "rounded-lg",
    pill: "rounded-full",
  },
  typography: {
    h1: "text-xl font-semibold tracking-tight",
    h2: "text-lg font-semibold",
    h3: "text-base font-semibold",
    sectionTitle: "text-sm font-semibold",
    kpiValue: "text-3xl font-semibold",
    kpiLabel: "text-xs text-slate-500",
    body: "text-sm",
    caption: "text-xs text-slate-500",
    label: "text-[11px] uppercase tracking-[0.1em] text-slate-500",
  },
  sidebar: {
    width: "w-64",
    bg: "bg-white",
    border: "border-r border-slate-200",
  },
} as const;

export type DesignSystem = typeof designSystem;
