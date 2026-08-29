import { Linking, StyleSheet, Text, View } from "react-native";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import { daysLeft, getSubscriptionStatus, isPaused, isTrial } from "@/shared/lib/domain";
import { formatDate } from "@/shared/lib/storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Loader } from "@/components/ui/loader";
import { Screen } from "@/components/ui/screen";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";

const STATUS_LABEL = {
  ACTIF: "نشط",
  EXPIRE: "منتهي",
  EXPIRE_BIENTOT: "ينتهي قريباً",
  ESSAI: "تجريبي",
} as const;

const PAYMENT_LABEL = {
  ESPECE: "نقداً",
  ESSAI: "تجربة",
} as const;

export default function AbonnementScreen() {
  const { colors } = useTheme();
  const { data, isLoading } = useMySubscription();

  if (isLoading) return <Loader />;
  if (!data) {
    return (
      <Screen>
        <EmptyState title="لا توجد معلومات حول الاشتراك حاليًا" />
      </Screen>
    );
  }

  const { subscription, history, coach } = data;
  const status = getSubscriptionStatus(subscription);
  const left = daysLeft(subscription);
  const paused = isPaused(subscription);
  const trial = isTrial(subscription);
  const showCountdown = status === "EXPIRE_BIENTOT" && !paused && left > 0 && left <= 7;

  return (
    <Screen>
      <Text style={[styles.screenTitle, { color: colors.text }]}>الاشتراك</Text>

      {subscription ? (
        <Card>
          <View style={styles.statusRow}>
            <View style={styles.statusCol}>
              <Badge
                label={paused ? "مجمّد مؤقتًا" : STATUS_LABEL[status]}
                variant={paused ? "frozen" : status === "EXPIRE" ? "expired" : status === "EXPIRE_BIENTOT" ? "soon" : trial ? "trial" : "active"}
              />
              <Text style={[styles.statusDesc, { color: colors.muted }]}>
                {paused
                  ? `مجمّد منذ ${formatDate(subscription.pause_start ?? subscription.date_debut)}`
                  : status === "EXPIRE"
                    ? "انتهت صلاحية اشتراكك — يُرجى التجديد للاستمرار"
                    : `ينتهي في ${formatDate(subscription.date_fin)}`}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{left}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>يومًا متبقيًا</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {subscription.montant} د.ت
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>الدفع</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {PAYMENT_LABEL[subscription.mode_paiement]}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>الطريقة</Text>
            </View>
          </View>
        </Card>
      ) : (
        <Card>
          <EmptyState title="لا يوجد اشتراك نشط" description="تواصل مع مدربك لتفعيل الاشتراك." />
        </Card>
      )}

      {showCountdown ? (
        <Card style={{ backgroundColor: colors.warningSoft }}>
          <Text style={[styles.countdownTitle, { color: colors.warning }]}>
            ⏳ ينتهي اشتراكك خلال {left} يومًا
          </Text>
          <Text style={[styles.countdownText, { color: colors.muted }]}>
            جدّد اشتراكك الآن لتضمن استمرار خطتك وسجل تقدمك دون انقطاع.
          </Text>
          {coach?.telephone ? (
            <View style={styles.contactRow}>
              <Button variant="outline" size="sm" onPress={() => Linking.openURL(`tel:${coach.telephone}`)}>
                اتصال هاتفي
              </Button>
              <Button size="sm" onPress={() => Linking.openURL(`https://wa.me/216${coach.telephone}`)}>
                مراسلة عبر واتساب
              </Button>
            </View>
          ) : null}
        </Card>
      ) : null}

      {paused && subscription ? (
        <Card>
          <Text style={[styles.countdownTitle, { color: colors.info }]}>
            اشتراكك مجمّد حاليًا
          </Text>
          <Text style={[styles.countdownText, { color: colors.muted }]}>
            تتم إضافة أيام التجميد تلقائيًا إلى نهاية فترة الاشتراك. تواصل مع مدربك لإلغاء التجميد.
          </Text>
        </Card>
      ) : null}

      {history.length > 0 ? (
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>سجل الاشتراكات</Text>
          {history.map((s) => (
            <View key={s.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.historyMain, { color: colors.text }]}>
                  {s.montant} د.ت — {PAYMENT_LABEL[s.mode_paiement]}
                </Text>
                <Text style={[styles.historySub, { color: colors.muted }]}>
                  {formatDate(s.date_debut)} ← {formatDate(s.date_fin)}
                </Text>
              </View>
              <Badge
                label={getSubscriptionStatus(s) === "EXPIRE" ? "منتهي" : "نشط"}
                variant={getSubscriptionStatus(s) === "EXPIRE" ? "expired" : "active"}
              />
            </View>
          ))}
        </Card>
      ) : null}

      {coach ? (
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>المدرب الخاص بك</Text>
          <Text style={[styles.coachName, { color: colors.text }]}>
            {coach.prenom} {coach.nom}
          </Text>
          <Text style={[styles.historySub, { color: colors.muted }]}>{coach.telephone}</Text>
          {coach.telephone ? (
            <View style={styles.contactRow}>
              <Button variant="outline" size="sm" onPress={() => Linking.openURL(`tel:${coach.telephone}`)}>
                اتصال هاتفي
              </Button>
              <Button size="sm" onPress={() => Linking.openURL(`https://wa.me/216${coach.telephone}`)}>
                واتساب
              </Button>
            </View>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 22, fontFamily: F.extrabold },
  statusRow: { flexDirection: "row", justifyContent: "space-between" },
  statusCol: { gap: 6 },
  statusDesc: { fontSize: 12, fontFamily: F.regular },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  stat: { alignItems: "center", gap: 2, flex: 1 },
  statValue: { fontSize: 16, fontFamily: F.bold },
  statLabel: { fontSize: 11, fontFamily: F.regular },
  countdownTitle: { fontSize: 15, fontFamily: F.bold },
  countdownText: { fontSize: 12, fontFamily: F.regular },
  contactRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  cardTitle: { fontSize: 15, fontFamily: F.bold, marginBottom: 8 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  historyMain: { fontSize: 13, fontFamily: F.bold },
  historySub: { fontSize: 11, fontFamily: F.regular },
  coachName: { fontSize: 15, fontFamily: F.bold },
});