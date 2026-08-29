import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Spinner } from "@/components/ui/loader";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoachUsers, useCoachLeaderboard } from "@/features/coach/hooks/useCoach";
import { statusBadge } from "@/features/coach/lib/coach-utils";
import { daysLeft, getSubscriptionStatus } from "@/shared/lib/domain";
import { formatDate } from "@/shared/lib/storage";

const STALE_DAYS = 14;

export default function CoachDashboard() {
  const { colors } = useTheme();
  const { user, loading } = useAuth();
  const users = useCoachUsers();
  const leaderboard = useCoachLeaderboard();

  if (loading) return <Spinner />;
  if (!user || user.role !== "COACH") return <Redirect href="/(tabs)/plan" />;

  if (users.isLoading || leaderboard.isLoading) return <Loader />;

  const all = users.data ?? [];
  const actifs = all.filter(
    (u) => u.subscription && ["ACTIF", "ESSAI"].includes(getSubscriptionStatus(u.subscription)),
  ).length;
  const expiresSoon = all.filter(
    (u) => getSubscriptionStatus(u.subscription) === "EXPIRE_BIENTOT",
  ).length;
  const expired = all.filter((u) => getSubscriptionStatus(u.subscription) === "EXPIRE").length;

  const alerts = all
    .filter((u) => {
      const s = getSubscriptionStatus(u.subscription);
      if (s === "EXPIRE") return true;
      if (s === "EXPIRE_BIENTOT") return true;
      return u.last_weight != null && (u.days_since_last_weight ?? 0) >= STALE_DAYS;
    })
    .map((u) => {
      const s = getSubscriptionStatus(u.subscription);
      let text = "";
      let variant: "expired" | "soon" | "neutral" = "neutral";
      if (s === "EXPIRE") {
        text = `انتهى اشتراك ${u.prenom} ${u.nom}`;
        variant = "expired";
      } else if (s === "EXPIRE_BIENTOT") {
        text = `ينتهي اشتراك ${u.prenom} ${u.nom} خلال ${daysLeft(u.subscription)} يومًا`;
        variant = "soon";
      } else {
        text = `لم يسجّل ${u.prenom} ${u.nom} وزنه منذ ${u.days_since_last_weight} يومًا`;
      }
      return { id: u.id, text, variant };
    })
    .slice(0, 6);

  const stats = [
    { label: "إجمالي المشتركين", value: all.length, icon: "people-outline" as const, tint: colors.primary },
    { label: "اشتراكات نشطة", value: actifs, icon: "checkmark-circle-outline" as const, tint: "#22C55E" },
    { label: "ينتهي خلال 7 أيام", value: expiresSoon, icon: "time-outline" as const, tint: "#F59E0B" },
    { label: "اشتراكات منتهية", value: expired, icon: "close-circle-outline" as const, tint: colors.destructive },
  ];

  return (
    <Screen>
      <Text style={[styles.pageTitle, { color: colors.text }]}>لوحة التحكم</Text>

      <View style={styles.grid}>
        {stats.map((s) => (
          <Card key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon} size={20} color={s.tint} />
            <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
          </Card>
        ))}
      </View>

      {alerts.length > 0 ? (
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>تنبيهات</Text>
          {alerts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => router.push(`/membres/${a.id}`)}
              style={({ pressed }) => [styles.alertRow, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Badge
                label={a.variant === "expired" ? "تجديد" : a.variant === "soon" ? "قريباً" : "وزن"}
                variant={a.variant}
              />
              <Text style={[styles.alertText, { color: colors.text }]}>{a.text}</Text>
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>تحدي الحضور — الأسبوع</Text>
        {(leaderboard.data?.top ?? []).slice(0, 5).map((row, i) => (
          <View key={`${row.pseudo}-${i}`} style={styles.rankRow}>
            <Text style={[styles.rank, { color: i === 0 ? "#F59E0B" : colors.muted }]}>
              {i + 1}
            </Text>
            <Text style={[styles.rankName, { color: colors.text }]}>{row.pseudo}</Text>
            <Text style={[styles.rankCount, { color: colors.muted }]}>{row.count} حصص</Text>
          </View>
        ))}
        {(leaderboard.data?.top ?? []).length === 0 ? (
          <Text style={{ color: colors.muted, fontFamily: F.regular, fontSize: 13 }}>
            لا توجد بيانات لهذا الأسبوع
          </Text>
        ) : null}
      </Card>

      <Pressable onPress={() => router.push("/membres")} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <View style={[styles.membersLink, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontFamily: F.bold, fontSize: 14 }}>إدارة المشتركين</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 20, fontFamily: F.bold },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { flexBasis: "47%", flexGrow: 1, gap: 6, padding: 14 },
  statValue: { fontSize: 26, fontFamily: F.bold },
  statLabel: { fontSize: 12, fontFamily: F.regular },
  cardTitle: { fontSize: 15, fontFamily: F.bold, marginBottom: 4 },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  alertText: { flex: 1, fontSize: 13, fontFamily: F.regular },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  rank: { width: 22, fontSize: 14, fontFamily: F.bold, textAlign: "center" },
  rankName: { flex: 1, fontSize: 14, fontFamily: F.regular },
  rankCount: { fontSize: 12, fontFamily: F.regular },
  membersLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
});