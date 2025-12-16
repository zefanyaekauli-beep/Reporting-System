// frontend/web/src/modules/shared/components/theme.ts

export const theme = {
  colors: {
    // Backgrounds - New Verolux Theme
    appBg: "#FFFFF0", // ivory/cream background
    background: "#FFFFF0", // ivory/cream app background
    surface: "#FFFFFF", // white cards
    bgSecondary: "#F8FAFC", // light gray for secondary backgrounds
    
    // Brand
    brand: "#2563EB", // blue (kept for compatibility)
    primary: "#2563EB", // blue accent
    primarySoft: "#DBEAFE", // light blue for backgrounds
    secondary: "#1F2937", // deep gray text / some icons
    
    // Text - For white cards, use dark blue
    textMain: "#002B4B", // dark blue text on white cards
    textMuted: "#475569", // gray for muted text
    textSoft: "#64748B", // softer gray
    
    // Status
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    
    // Borders - For white cards
    border: "#002B4B", // dark blue for borders
    borderStrong: "#001A2E", // even darker for strong borders
    
    // Navigation (kept for compatibility)
    navActive: "#2563EB", // blue for active nav
    navInactive: "#6B7280",
  },
  radius: {
    card: 14,
    pill: 9999,
  },
  shadowCard: "0 4px 12px rgba(15, 23, 42, 0.08)",
  shadowSoft: "0 1px 4px rgba(15, 23, 42, 0.06)",
};

