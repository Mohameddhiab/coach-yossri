import { StyleSheet, Text, View, type ViewProps } from "react-native";
import { F } from "@/fonts";
import { useTheme } from "./theme";

export function Card({ children, style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.titleLine} />
        <View style={styles.titleCol}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: { marginBottom: 2 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  titleLine: { width: 4, height: "100%", minHeight: 20, borderRadius: 2, backgroundColor: "#F59E0B" },
  titleCol: { flex: 1 },
  title: { fontSize: 15, fontFamily: F.bold },
  subtitle: { fontSize: 12, fontFamily: F.regular, marginTop: 2 },
});