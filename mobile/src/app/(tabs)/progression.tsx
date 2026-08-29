import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useChallengeLeaderboard, useCheckinGoal, useGoal } from "@/features/goals/hooks/useGoals";
import type { LeaderboardPeriod } from "@/features/goals/hooks/useGoals";
import {
  addWeightLog,
  clearPendingWeights,
  enqueuePendingWeight,
  getPendingWeights,
  useAddWeight,
  useDeleteWeight,
  useDeleteWeightTarget,
  useSetWeightTarget,
  useWeightLogs,
  useWeightTarget,
} from "@/features/progress/hooks/useProgress";
import { useMyStats } from "@/features/stats/hooks/useStats";
import { isSubscriptionExpiredError } from "@/shared/lib/api-client";
import {
  currentStreak,
  estimateTargetDate,
  isCheckedToday,
  maxStreakOf,
  projectWeight,
  targetProgress,
} from "@/shared/lib/insights";
import { formatDate } from "@/shared/lib/storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, Loader } from "@/components/ui/loader";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Screen } from "@/components/ui/screen";
import { Segmented } from "@/components/ui/segmented";
import { useTheme } from "@/components/ui/theme";
import { WeightChart } from "@/components/ui/weight-chart";
import { ExpiredScreen } from "@/components/expired-screen";
import { F } from "@/fonts";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function ProgressionScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const weightQuery = useWeightLogs(userId);
  const goalQuery = useGoal(userId);
  const isExpired =
    (weightQuery.isError && isSubscriptionExpiredError(weightQuery.error)) ||
    (goalQuery.isError && isSubscriptionExpiredError(goalQuery.error));

  if (isExpired) {
    return <ExpiredScreen />;
  }

  return (
    <Screen
      refreshing={weightQuery.isRefetching}
      onRefresh={() => {
        weightQuery.refetch();
        goalQuery.refetch();
      }}
    >
      <Text style={[styles.screenTitle, { color: colors.text }]}>التقدم وتتبع الأداء</Text>
      <WeightSection />
      <TargetSection />
      <GoalSection />
      <PerformanceSection />
      <ChallengeSection />
    </Screen>
  );
}

/* ----------------------------- الوزن ----------------------------- */

function WeightSection() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { data: logs, isLoading } = useWeightLogs(userId);
  const addWeight = useAddWeight(userId);
  const deleteWeight = useDeleteWeight(userId);
  const [poids, setPoids] = useState("");
  const [saved, setSaved] = useState(false);

  const sorted = useMemo(
    () => [...(logs ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [logs],
  );
  const projection = useMemo(() => projectWeight(sorted, 28), [sorted]);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.onLine) return;
    let cancelled = false;
    getPendingWeights()
      .then(async (pending) => {
        if (cancelled || pending.length === 0) return;
        for (const w of pending) {
          await addWeightLog(userId, w.poids_kg, w.note);
        }
        await clearPendingWeights();
        if (!cancelled) {
          queryClient.invalidateQueries({ queryKey: ["weight-logs", userId] });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, queryClient]);

  if (isLoading) return <Loader />;

  const submit = async () => {
    const v = parseFloat(poids.replace(",", "."));
    if (!v || v < 30 || v > 250) return;
    setSaved(false);
    try {
      await addWeight.mutateAsync({ poids_kg: v });
      setPoids("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      await enqueuePendingWeight({ poids_kg: v });
      setPoids("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <Card>
      <Text style={[styles.cardTitle, { color: colors.text }]}>منحنى الوزن</Text>
      {sorted.length >= 2 ? (
        <WeightChart logs={sorted} />
      ) : (
        <EmptyState title="سجّل قياس وزنك الأول" description="أضف وزنك اليوم وابدأ بمتابعة تقدمك." />
      )}

      {projection ? (
        <View style={[styles.projectionRow, { backgroundColor: colors.primarySoft }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.projectionLabel, { color: colors.muted }]}>التوقعات بوتيرتك الحالية</Text>
            <Text style={[styles.projectionValue, { color: colors.primary }]}>
              ~{projection.projected} كغم
              <Text style={{ color: colors.muted }}> خلال {projection.daysAhead} يومًا</Text>
            </Text>
          </View>
          <Text style={[styles.projectionDelta, { color: colors.muted }]}>
            {projection.slopePerWeek > 0 ? "+" : ""}
            {projection.slopePerWeek} كغم/أسبوع
          </Text>
        </View>
      ) : null}

      <View style={styles.addRow}>
        <Input
          style={styles.weightInput}
          placeholder="الوزن بالكغم"
          keyboardType="decimal-pad"
          value={poids}
          onChangeText={setPoids}
        />
        <Button loading={addWeight.isPending} onPress={submit} disabled={!poids}>
          إضافة
        </Button>
      </View>
      {saved ? (
        <Text style={[styles.saved, { color: colors.success }]}>تم حفظ الوزن بنجاح ✓</Text>
      ) : null}

      {sorted.length > 0 ? (
        <View style={styles.list}>
          {sorted.slice(0, 6).map((log) => (
            <View key={log.id} style={[styles.logRow, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.logWeight, { color: colors.text }]}>
                  {log.poids_kg.toFixed(1)} كغم
                </Text>
                <Text style={[styles.logDate, { color: colors.muted }]}>
                  {formatDate(log.date)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="حذف هذا الوزن"
                onPress={() => deleteWeight.mutate(log.id)}
                hitSlop={10}
              >
                <Text style={{ color: colors.destructive, fontSize: 18 }}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

/* --------------------------- هدف الوزن --------------------------- */

function TargetSection() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { data: logs } = useWeightLogs(userId);
  const { data: target } = useWeightTarget(userId);
  const setTarget = useSetWeightTarget(userId);
  const deleteTarget = useDeleteWeightTarget(userId);
  const [editing, setEditing] = useState(false);
  const [kg, setKg] = useState("");
  const [date, setDate] = useState("");

  if (!target && !editing) {
    return (
      <Card>
        <View style={styles.targetRow}>
          <ProgressRing progress={0} size={112} centerLabel="—" centerSub="الهدف" />
          <View style={styles.targetInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>هدف الوزن</Text>
            <Text style={[styles.targetMeta, { color: colors.muted }]}>
              لم تحدد هدفًا بعد — حدد وزنك المستهدف لنتابع تقدمك معك
            </Text>
            <View style={styles.targetActions}>
              <Button onPress={() => setEditing(true)}>إضافة هدف</Button>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  const progress = targetProgress(logs ?? [], target ?? null);
  const eta = target ? estimateTargetDate(logs ?? [], target.poids_kg) : null;

  return (
    <Card>
      <View style={styles.targetRow}>
        <ProgressRing
          progress={progress}
          size={112}
          centerLabel={target ? `${target.poids_kg} كغم` : "—"}
          centerSub="الهدف"
        />
        <View style={styles.targetInfo}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>هدف الوزن</Text>
          {target ? (
            <>
              <Text style={[styles.targetMeta, { color: colors.muted }]}>
                {formatDate(target.date)}
              </Text>
              <Text style={[styles.targetMeta, { color: colors.muted }]}>
                الوصول المتوقع: {eta ? formatDate(eta.date) : "—"}
              </Text>
              <View style={styles.targetActions}>
                <Button variant="outline" size="sm" onPress={() => setEditing(true)}>
                  تعديل
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => deleteTarget.mutate()}
                  loading={deleteTarget.isPending}
                >
                  حذف
                </Button>
              </View>
            </>
          ) : null}
        </View>
      </View>

      {editing ? (
        <View style={styles.editCol}>
          <Input
            label="الوزن المستهدف (كغم)"
            keyboardType="decimal-pad"
            value={kg}
            onChangeText={setKg}
            placeholder={target ? String(target.poids_kg) : "78"}
          />
          <Input
            label="التاريخ (AAAA-MM-DD)"
            value={date}
            onChangeText={setDate}
            placeholder={target ? target.date.slice(0, 10) : "2026-10-01"}
            autoCapitalize="none"
          />
          <View style={styles.targetActions}>
            <Button
              size="sm"
              loading={setTarget.isPending}
              disabled={!kg || !date || isNaN(new Date(date).getTime())}
              onPress={async () => {
                const parsed = new Date(date);
                if (isNaN(parsed.getTime())) return;
                try {
                  await setTarget.mutateAsync({
                    poids_kg: parseFloat(kg.replace(",", ".")),
                    date: parsed.toISOString(),
                  });
                  setEditing(false);
                } catch {}
              }}
            >
              حفظ الهدف
            </Button>
            <Button variant="ghost" size="sm" onPress={() => setEditing(false)}>
              إلغاء
            </Button>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

/* -------------------------- هدف الشهر -------------------------- */

function GoalSection() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { data: goal, isLoading } = useGoal(userId);
  const checkin = useCheckinGoal(userId);

  if (isLoading) return <Loader />;
  if (!goal) return null;

  const monthIndex = parseInt(goal.mois.slice(5, 7), 10) - 1;
  const checked = goal.checkins.length;
  const progress = Math.min(100, Math.round((checked / goal.cible) * 100));
  const today = isCheckedToday(goal.checkins);
  const streak = currentStreak(goal.checkins);
  const best = maxStreakOf(goal);

  return (
    <Card>
      <Text style={[styles.cardTitle, { color: colors.text }]}>
        هدف {MONTHS_AR[monthIndex]} — {goal.titre}
      </Text>
      <View style={styles.goalRow}>
        <ProgressRing
          progress={progress}
          size={112}
          centerLabel={`${checked}/${goal.cible}`}
          centerSub="حصص"
        />
        <View style={styles.goalInfo}>
          <Badge label={today ? "تم تسجيل حضورك اليوم بنجاح ✓" : "لم تسجّل حضورك اليوم بعد"} variant={today ? "active" : "trial"} />
          <Text style={[styles.targetMeta, { color: colors.muted }]}>
            سلسلة حالية: {streak} يومًا
          </Text>
          <Text style={[styles.targetMeta, { color: colors.muted }]}>
            أفضل سلسلة: {best} يومًا
          </Text>
          <Button
            size="sm"
            disabled={today}
            loading={checkin.isPending}
            onPress={() => checkin.mutate()}
          >
            {today ? "تم التسجيل اليوم" : "تسجيل الحضور اليوم"}
          </Button>
        </View>
      </View>
    </Card>
  );
}

/* ---------------------- الأداء والإنجازات ---------------------- */

function PerformanceSection() {
  const { colors } = useTheme();
  const { data: stats, isLoading } = useMyStats();
  if (isLoading || !stats) return null;

  const { xp, badges, engagement, fidelity } = stats;
  const unlocked = badges.filter((b) => b.unlocked).length;
  const engColor =
    engagement.color === "green"
      ? colors.success
      : engagement.color === "amber"
        ? "#F59E0B"
        : colors.destructive;
  const xpProgress = Math.min(100, Math.max(0, xp.progress));
  const toNext = Math.max(0, xp.xpForNext - xp.xpIntoLevel);

  return (
    <Card>
      <Text style={[styles.cardTitle, { color: colors.text }]}>الأداء والإنجازات</Text>
      <View style={styles.perfRow}>
        <View style={styles.perfCol}>
          <Text style={[styles.perfValue, { color: colors.primary }]}>{xp.xp}</Text>
          <Text style={[styles.perfLabel, { color: colors.muted }]}>
            نقطة — {xp.level.label}
          </Text>
        </View>
        <View style={styles.perfCol}>
          <Text style={[styles.perfValue, { color: engColor }]}>{engagement.label}</Text>
          <Text style={[styles.perfLabel, { color: colors.muted }]}>
            الالتزام ({engagement.score}/100)
          </Text>
        </View>
        <View style={styles.perfCol}>
          <Text style={[styles.perfValue, { color: colors.accent }]}>
            {unlocked}/{badges.length}
          </Text>
          <Text style={[styles.perfLabel, { color: colors.muted }]}>الأوسمة</Text>
        </View>
      </View>
      <Text style={[styles.perfMeta, { color: colors.muted }]}>
        {xp.next
          ? `المستوى التالي (${xp.next.label}) بعد ${toNext} نقطة`
          : "أعلى مستوى تحقق! 👑"}
      </Text>
      <View style={[styles.xpTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.xpFill,
            { width: `${xpProgress}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
      {fidelity.level ? (
        <Text style={[styles.perfMeta, { color: colors.muted }]}>
          عضو {fidelity.level} · {fidelity.months} شهر من العضوية
        </Text>
      ) : null}
    </Card>
  );
}

/* --------------------------- التحدي --------------------------- */

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "7", label: "7 أيام" },
  { value: "30", label: "30 يوم" },
  { value: "all", label: "الكل" },
];

function ChallengeSection() {
  const { colors } = useTheme();
  const [period, setPeriod] = useState<LeaderboardPeriod>("7");
  const { data, isLoading } = useChallengeLeaderboard(period);
  if (isLoading) return <Loader />;

  const rows = data?.top ?? [];
  const my_rank = data?.my_rank ?? null;
  if (rows.length === 0 && !my_rank) return null;

  const medals = ["🥇", "🥈", "🥉"];
  return (
    <Card>
      <View style={styles.challengeHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>تحدي الحضور</Text>
        {my_rank ? (
          <Text style={[styles.challengeRank, { color: colors.primary }]}>
            ترتيبك: #{my_rank.rank}
            <Text style={{ color: colors.muted }}> ({my_rank.count} حصة)</Text>
          </Text>
        ) : null}
      </View>
      <Segmented
        items={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
        value={period}
        onChange={(v) => setPeriod(v as LeaderboardPeriod)}
      />
      {rows.map((row, i) => (
        <View key={`${row.pseudo}-${i}`} style={[styles.challengeRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.challengePseudo, { color: colors.text }]}>
            {medals[i] ?? `${i + 1}.`} {row.pseudo}
          </Text>
          <Text style={[styles.challengeCount, { color: row.pseudo === "أنت" ? colors.primary : colors.muted }]}>
            {row.count} حصة
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 22, fontFamily: F.extrabold },
  cardTitle: { fontSize: 15, fontFamily: F.bold, marginBottom: 8 },
  addRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  weightInput: { flex: 1 },
  saved: { fontSize: 12, fontFamily: F.medium },
  list: { marginTop: 8 },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  logWeight: { fontSize: 14, fontFamily: F.bold },
  logDate: { fontSize: 11, fontFamily: F.regular },
  targetRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  targetInfo: { flex: 1, gap: 4 },
  targetMeta: { fontSize: 12, fontFamily: F.regular },
  targetActions: { flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" },
  editCol: { gap: 10, marginTop: 12 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  goalInfo: { flex: 1, gap: 6 },
  challengeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  challengePseudo: { fontSize: 13, fontFamily: F.semibold },
  challengeCount: { fontSize: 12, fontFamily: F.bold },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  challengeRank: { fontSize: 13, fontFamily: F.bold },
  projectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  projectionLabel: { fontSize: 11, fontFamily: F.regular },
  projectionValue: { fontSize: 15, fontFamily: F.bold },
  projectionDelta: { fontSize: 12, fontFamily: F.medium },
  perfRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  perfCol: { flex: 1, alignItems: "center", gap: 2 },
  perfValue: { fontSize: 16, fontFamily: F.extrabold },
  perfLabel: { fontSize: 10, fontFamily: F.regular, textAlign: "center" },
  perfMeta: { fontSize: 12, fontFamily: F.regular, marginTop: 2 },
  xpTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 6,
  },
  xpFill: { height: "100%", borderRadius: 999 },
});