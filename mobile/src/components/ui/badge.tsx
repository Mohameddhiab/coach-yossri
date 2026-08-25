import { StyleSheet, Text, View } from "react-native";
import { F } from "@/fonts";
import { useTheme } from "./theme";

const STYLES = {
  active: {
    bg: "#FDF3E7",
    darkBg: "#3A2E15",
    fg: "#B45309",
    darkFg: "#FBBF24",
    border: "rgba(180,83,9,0.35)",
  },
  trial: {
    bg: "#F0F9FF",
    darkBg: "#0F2B3A",
    fg: "#0369A1",
    darkFg: "#38BDF8",
    border: "rgba(2,132,199,0.35)",
  },
  soon: {
    bg: "#FFFBEB",
    darkBg: "#3A2E15",
    fg: "#D97706",
    darkFg: "#FBBF24",
    border: "rgba(217,119,6,0.35)",
  },
  expired: {
    bg: "#FEF2F2",
    darkBg: "#3B1D1D",
    fg: "#DC2626",
    darkFg: "#F87171",
    border: "rgba(220,38,38,0.35)",
  },
  frozen: {
    bg: "#F0F9FF",
    darkBg: "#0F2B3A",
    fg: "#0369A1",
    darkFg: "#38BDF8",
    border: "rgba(2,132,199,0.35)",
  },
  neutral: {
    bg: "#F4F4F5",
    darkBg: "#2C2E33",
    fg: "#52525B",
    darkFg: "#D4D4D8",
    border: "rgba(82,82,91,0.3)",
  },
} as const;

export type BadgeVariant = keyof typeof STYLES;

export function Badge({ label, variant = "neutral" }: { label: string; variant?: BadgeVariant }) {
  const { dark } = useTheme();
  const s = STYLES[variant];
  return (
    <View
      style={{
        backgroundColor: dark ? s.darkBg : s.bg,
        borderColor: s.border,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: dark ? s.darkFg : s.fg, fontSize: 11, fontFamily: F.bold }}>
        {label}
      </Text>
    </View>
  );
}