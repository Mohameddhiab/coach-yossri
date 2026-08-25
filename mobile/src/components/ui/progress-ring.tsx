import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { F } from "@/fonts";
import { useTheme } from "./theme";

export function ProgressRing({
  progress,
  size = 128,
  strokeWidth = 10,
  centerLabel,
  centerSub,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  centerLabel: string;
  centerSub?: string;
}) {
  const { colors } = useTheme();
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c - (c * clamped) / 100}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.label, { color: colors.text }]}>{centerLabel}</Text>
        {centerSub ? (
          <Text style={[styles.sub, { color: colors.muted }]}>{centerSub}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: { transform: [{ rotate: "-90deg" }] },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 22, fontFamily: F.extrabold },
  sub: { fontSize: 10, fontFamily: F.regular },
});