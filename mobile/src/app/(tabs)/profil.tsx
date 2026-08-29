import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useWeightLogs, useWeightTarget } from "@/features/progress/hooks/useProgress";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import {
  daysLeft,
  getSubscriptionStatus,
  isPaused,
} from "@/shared/lib/domain";
import { formatDate } from "@/shared/lib/storage";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";

const STATUS_LABEL = {
  ACTIF: "نشط",
  EXPIRE: "منتهي",
  EXPIRE_BIENTOT: "ينتهي قريباً",
  ESSAI: "تجريبي",
} as const;

export default function ProfilScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data: logs } = useWeightLogs(user?.id ?? "");
  const { data: target } = useWeightTarget(user?.id ?? "");
  const { data: sub } = useMySubscription();

  if (!user) return null;

  const last = logs?.[0];
  const status = getSubscriptionStatus(sub?.subscription ?? null);
  const paused = isPaused(sub?.subscription ?? null);

  const stats = [
    { label: "آخر وزن", value: last ? `${last.poids_kg.toFixed(1)} كغم` : "—" },
    { label: "الهدف", value: target ? `${target.poids_kg} كغم` : "—" },
    {
      label: "الأيام المتبقية",
      value: status === "EXPIRE" ? "0" : `${daysLeft(sub?.subscription ?? null)} يومًا`,
    },
  ];

  return (
    <Screen>
      <Text style={[styles.screenTitle, { color: colors.text }]}>الملف الشخصي</Text>

      <Card>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user.prenom.charAt(0)}
            </Text>
          </View>
          <View style={styles.identity}>
            <Text style={[styles.name, { color: colors.text }]}>
              {user.prenom} {user.nom}
            </Text>
            <Text style={[styles.muted, { color: colors.muted }]}>{user.email}</Text>
            <View style={styles.badgeRow}>
              <Badge
                label={paused ? "مجمّد مؤقتًا" : STATUS_LABEL[status]}
                variant={paused ? "frozen" : status === "EXPIRE" ? "expired" : status === "EXPIRE_BIENTOT" ? "soon" : status === "ESSAI" ? "trial" : "active"}
              />
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <InfoRow label="رقم الهاتف" value={user.telephone} />
        <InfoRow label="تاريخ الانضمام" value={formatDate(user.created_at)} />
        {user.referred_by ? (
          <InfoRow label="برنامج الإحالة" value="تمت الإحالة بواسطة صديق ✓" />
        ) : null}
      </Card>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.muted, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 22, fontFamily: F.extrabold },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 26, fontFamily: F.extrabold },
  identity: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontFamily: F.bold },
  muted: { fontSize: 12, fontFamily: F.regular },
  badgeRow: { marginTop: 4 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center", gap: 2, flex: 1 },
  statValue: { fontSize: 16, fontFamily: F.bold },
  statLabel: { fontSize: 11, fontFamily: F.regular },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoValue: { fontSize: 13, fontFamily: F.semibold },
});