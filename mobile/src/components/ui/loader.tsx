import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { F } from "@/fonts";
import { useTheme } from "./theme";

export function Loader({ rows = 3 }: { rows?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={[styles.block, { backgroundColor: colors.card, borderColor: colors.border }]}
        />
      ))}
    </View>
  );
}

export function Spinner() {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.emptyDesc, { color: colors.muted }]}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  block: {
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    opacity: 0.5,
  },
  center: { padding: 40 },
  empty: { alignItems: "center", gap: 6, paddingVertical: 24 },
  emptyTitle: { fontSize: 15, fontFamily: F.bold },
  emptyDesc: { fontSize: 12, textAlign: "center" },
});