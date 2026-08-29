import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { F } from "@/fonts";
import type { WeightLog } from "@/shared/lib/domain";
import { useTheme } from "./theme";

export function WeightChart({ logs, height = 220 }: { logs: WeightLog[]; height?: number }) {
  const { colors } = useTheme();
  if (logs.length === 0) return null;

  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const width = 320;
  const padX = 24;
  const padY = 18;
  const minW = Math.min(...sorted.map((l) => l.poids_kg));
  const maxW = Math.max(...sorted.map((l) => l.poids_kg));
  const range = Math.max(maxW - minW, 1);
  const plotH = height - padY * 2;
  const plotW = width - padX * 2;

  const points = sorted.map((l, i) => ({
    x: padX + (i / Math.max(sorted.length - 1, 1)) * plotW,
    y: padY + ((maxW - l.poids_kg) / range) * plotH,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0.25, 0.5, 0.75].map((f) => (
          <Line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={padY + plotH * f}
            y2={padY + plotH * f}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="4 6"
          />
        ))}
        <Circle cx={first.x} cy={first.y} r={4} fill={colors.primary} />
        <Polyline points={polyline} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinejoin="round" />
        <Circle cx={last.x} cy={last.y} r={6} fill={colors.accent} stroke={colors.card} strokeWidth={2} />
      </Svg>
      <View style={styles.legend}>
        <Text style={{ color: colors.muted, fontSize: 11 }}>
          {sorted[0].poids_kg.toFixed(1)} كغم → {sorted[sorted.length - 1].poids_kg.toFixed(1)} كغم
        </Text>
        <Text style={{ color: colors.muted, fontSize: 11 }}>{sorted.length} قياسًا</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
});