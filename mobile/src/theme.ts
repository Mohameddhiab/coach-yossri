export const Colors = {
  light: {
    background: "#FAFAF8",
    card: "#FFFFFF",
    border: "#E6E4DF",
    text: "#1C1D21",
    muted: "#6B7280",
    primary: "#B45309",
    primarySoft: "#FDF3E7",
    accent: "#F59E0B",
    destructive: "#DC2626",
    destructiveSoft: "#FEF2F2",
    success: "#10B981",
    successSoft: "#ECFDF5",
    info: "#0EA5E9",
    infoSoft: "#F0F9FF",
    warning: "#D97706",
    warningSoft: "#FFFBEB",
    sky: "#0EA5E9",
    skySoft: "#F0F9FF",
    violet: "#7C3AED",
    violetSoft: "#F5F3FF",
    emerald: "#059669",
    emeraldSoft: "#ECFDF5",
  },
  dark: {
    background: "#141518",
    card: "#1C1D21",
    border: "#2C2E33",
    text: "#F4F4F5",
    muted: "#A1A1AA",
    primary: "#FBBF24",
    primarySoft: "#3A2E15",
    accent: "#F59E0B",
    destructive: "#F87171",
    destructiveSoft: "#3B1D1D",
    success: "#34D399",
    successSoft: "#123129",
    info: "#38BDF8",
    infoSoft: "#0F2B3A",
    warning: "#FBBF24",
    warningSoft: "#3A2E15",
    sky: "#38BDF8",
    skySoft: "#0F2B3A",
    violet: "#A78BFA",
    violetSoft: "#2A2350",
    emerald: "#34D399",
    emeraldSoft: "#123129",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export function useThemeColors(colorScheme: "light" | "dark" | null | undefined | "unspecified") {
  return Colors[colorScheme === "dark" ? "dark" : "light"];
}