import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiClient } from "@/shared/lib/api-client";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, Spinner } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useAddNote,
  useAddSubscription,
  useCoachCheckin,
  useCoachNotes,
  useCoachUser,
  useDeleteNote,
  useDeleteUser,
  usePauseSubscription,
  useResetPassword,
  useResendVerifyEmail,
  useResumeSubscription,
  useSetGoal,
  useUpdateUser,
  useUserGoal,
  useUserSubscriptions,
} from "@/features/coach/hooks/useCoach";
import { statusBadge } from "@/features/coach/lib/coach-utils";
import { daysLeft, effectiveDateFin, getSubscriptionStatus, isPaused } from "@/shared/lib/domain";
import { formatDate } from "@/shared/lib/storage";
import { isCheckedToday } from "@/shared/lib/insights";
import type { WeightLog } from "@/shared/lib/domain";
import { WeightChart } from "@/components/ui/weight-chart";

export default function MemberDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = String(id ?? "");
  const { user, loading } = useAuth();

  const detail = useCoachUser(userId);
  const notes = useCoachNotes(userId);
  const subs = useUserSubscriptions(userId);
  const goal = useUserGoal(userId);
  const checkin = useCoachCheckin();

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();
  const resendVerifyEmail = useResendVerifyEmail();
  const addNote = useAddNote();
  const deleteNote = useDeleteNote();
  const addSub = useAddSubscription();
  const pauseSub = usePauseSubscription();
  const resumeSub = useResumeSubscription();
  const setGoal = useSetGoal();

  const [editMode, setEditMode] = useState(false);
  const [fNom, setFNom] = useState("");
  const [fPrenom, setFPrenom] = useState("");
  const [fTel, setFTel] = useState("");
  const [noteText, setNoteText] = useState("");
  const [showSubForm, setShowSubForm] = useState(false);
  const [sEssai, setSEssai] = useState(false);
  const [sDebut, setSDebut] = useState("");
  const [sFin, setSFin] = useState("");
  const [sMontant, setSMontant] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [gTitre, setGTitre] = useState("");
  const [gCible, setGCible] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (loading) return <Spinner />;
  if (!user || user.role !== "COACH") return <Redirect href="/(tabs)/plan" />;
  if (detail.isLoading) return <Loader />;

  const member = detail.data;
  if (!member) return null;

  const status = getSubscriptionStatus(member.subscription);
  const badge = statusBadge(status);
  const goalData = goal.data ?? null;

  const startEdit = () => {
    setFNom(member.nom === "—" ? "" : member.nom);
    setFPrenom(member.prenom);
    setFTel(member.telephone ?? "");
    setEditMode(true);
  };

  const saveEdit = async () => {
    setError(null);
    try {
      await updateUser.mutateAsync({ id: userId, patch: { nom: fNom, prenom: fPrenom, telephone: fTel } });
      setEditMode(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "حدث خطأ أثناء تحديث البيانات");
    }
  };

  const submitNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addNote.mutateAsync({ userId, contenu: noteText.trim() });
      setNoteText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "حدث خطأ أثناء إضافة الملاحظة");
    }
  };

  const submitSub = async () => {
    setError(null);
    try {
      await addSub.mutateAsync({
        userId,
        payload: {
          essai: sEssai,
          date_debut: sEssai ? undefined : sDebut.trim() || undefined,
          date_fin: sEssai ? undefined : sFin.trim() || undefined,
          montant: sMontant ? Number(sMontant) : undefined,
        },
      });
      setShowSubForm(false);
      setSDebut("");
      setSFin("");
      setSMontant("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "حدث خطأ أثناء إضافة الاشتراك");
    }
  };

  const submitGoal = async () => {
    const cible = Number(gCible);
    if (!gTitre.trim() || !cible) return;
    try {
      await setGoal.mutateAsync({ userId, titre: gTitre.trim(), cible });
      setShowGoalForm(false);
      setGTitre("");
      setGCible("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "حدث خطأ أثناء تعيين الهدف");
    }
  };

  const onCheckin = async () => {
    if (goalData && isCheckedToday(goalData.checkins)) return;
    try {
      await checkin.mutateAsync(userId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "حدث خطأ أثناء تسجيل الحضور");
    }
  };

  const onResetPassword = () => {
    Alert.alert("إعادة تعيين كلمة المرور", "سيتم إنشاء كلمة مرور عشوائية جديدة للمشترك.", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "تأكيد التعيين",
        onPress: async () => {
          const res = await resetPassword.mutateAsync(userId);
          Alert.alert("كلمة المرور الجديدة", `يُرجى إبلاغ المشترك بكلمة المرور: ${res.password}`, [{ text: "حسنًا" }]);
        },
      },
    ]);
  };

  const onDelete = () => {
    Alert.alert("حذف المشترك نهائيًا", `هل أنت متأكد من حذف ${member.prenom} ${member.nom} نهائيًا بكافة بياناته وسجلاته؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف نهائي",
        style: "destructive",
        onPress: async () => {
          await deleteUser.mutateAsync(userId);
          router.back();
        },
      },
    ]);
  };

  const resendVerification = async () => {
    try {
      await resendVerifyEmail.mutateAsync(userId);
      Alert.alert("تم الإرسال", "تم إعادة إرسال رابط تأكيد البريد الإلكتروني.", [{ text: "حسنًا" }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر إرسال الرابط — حاول مجددًا");
    }
  };

  const sortedSubs = [...(subs.data ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <Screen>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
            <Text style={{ color: colors.primary, fontFamily: F.bold, fontSize: 20 }}>
              {member.prenom.charAt(0)}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.name, { color: colors.text }]}>
              {member.prenom} {member.nom}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{member.email}</Text>
            {member.telephone ? (
              <Text style={[styles.meta, { color: colors.muted }]}>{member.telephone}</Text>
            ) : null}
            {member.email_verified === false ? (
              <View style={styles.verifyRow}>
                <Badge label="بريد غير مؤكد" variant="expired" />
                <Button
                  size="sm"
                  variant="outline"
                  onPress={resendVerification}
                  loading={resendVerifyEmail.isPending}
                >
                  إعادة إرسال التفعيل
                </Button>
              </View>
            ) : null}
          </View>
          <Badge label={badge.label} variant={badge.variant} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: colors.text }]}>
              {status === "EXPIRE" || status === "EXPIRE_BIENTOT"
                ? daysLeft(member.subscription)
                : member.subscription
                  ? formatDate(effectiveDateFin(member.subscription).toISOString())
                  : "—"}
            </Text>
            <Text style={[styles.statLbl, { color: colors.muted }]}>
              {status === "EXPIRE" || status === "EXPIRE_BIENTOT" ? "الأيام المتبقية" : "ينتهي في"}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: colors.text }]}>
              {member.last_weight ? `${member.last_weight.poids_kg} كغم` : "—"}
            </Text>
            <Text style={[styles.statLbl, { color: colors.muted }]}>
              {member.last_weight ? `آخر قياس منذ ${member.days_since_last_weight} يومًا` : "لا يوجد قياس مسجل"}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: colors.text }]}>
              {member.plan_version ? `v${member.plan_version}` : "—"}
            </Text>
            <Text style={[styles.statLbl, { color: colors.muted }]}>نسخة الخطة</Text>
          </View>
        </View>
      </Card>

      {error ? (
        <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: F.regular }}>{error}</Text>
      ) : null}

      <Card>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>المعلومات الشخصية</Text>
          {!editMode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تعديل المعلومات الشخصية"
              onPress={startEdit}
              style={{ padding: 4 }}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
        {editMode ? (
          <>
            <Input label="الاسم الأول" value={fPrenom} onChangeText={setFPrenom} />
            <Input label="اسم العائلة" value={fNom} onChangeText={setFNom} />
            <Input label="رقم الهاتف" value={fTel} onChangeText={setFTel} keyboardType="phone-pad" />
            <Button onPress={saveEdit} loading={updateUser.isPending} size="sm">
              حفظ
            </Button>
          </>
        ) : (
          <Text style={[styles.meta, { color: colors.muted }]}>
            {member.prenom} {member.nom} · {member.telephone || "دون هاتف"} · مشترك منذ{" "}
            {formatDate(member.created_at)}
          </Text>
        )}
      </Card>

      <Card>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>هدف الشهر</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showGoalForm ? "إغلاق نموذج الهدف" : "إضافة هدف شهري"}
            onPress={() => setShowGoalForm((v) => !v)}
            style={{ padding: 4 }}
          >
            <Ionicons
              name={showGoalForm ? "chevron-up" : "add-circle-outline"}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>
        {goalData ? (
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.text, fontFamily: F.medium, fontSize: 14 }}>{goalData.titre}</Text>
            <Text style={{ color: colors.muted, fontFamily: F.regular, fontSize: 12 }}>
              {goalData.checkins.length} / {goalData.cible} حصص · شهر {goalData.mois}
            </Text>
            <Button
              size="sm"
              variant="outline"
              onPress={onCheckin}
              loading={checkin.isPending}
              disabled={goalData ? isCheckedToday(goalData.checkins) : false}
            >
              {isCheckedToday(goalData?.checkins ?? []) ? "تم تسجيل الحضور اليوم ✓" : "تسجيل الحضور الآن"}
            </Button>
          </View>
        ) : (
          <Text style={[styles.meta, { color: colors.muted }]}>لا يوجد هدف مسجل لهذا الشهر</Text>
        )}
        {showGoalForm ? (
          <>
            <Input
              label="عنوان الهدف"
              value={gTitre}
              onChangeText={setGTitre}
              placeholder="مثال: 8 حصص هذا الشهر"
            />
            <Input label="عدد الحصص" value={gCible} onChangeText={setGCible} keyboardType="numeric" />
            <Button onPress={submitGoal} loading={setGoal.isPending} size="sm">
              حفظ الهدف
            </Button>
          </>
        ) : null}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>سجل أوزان المشترك</Text>
        <MemberWeights userId={userId} />
      </Card>

      <Card>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>الاشتراكات</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showSubForm ? "إغلاق نموذج الاشتراك" : "إضافة اشتراك جديد"}
            onPress={() => setShowSubForm((v) => !v)}
            style={{ padding: 4 }}
          >
            <Ionicons
              name={showSubForm ? "chevron-up" : "add-circle-outline"}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>
        {sortedSubs.length === 0 ? (
          <Text style={[styles.meta, { color: colors.muted }]}>لا توجد اشتراكات مسجلة</Text>
        ) : (
          sortedSubs.map((s) => {
            const paused = isPaused(s);
            const subBadge = statusBadge(getSubscriptionStatus(s));
            const isLatest = s.id === sortedSubs[0]?.id;
            return (
              <View key={s.id} style={styles.subRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: colors.text, fontFamily: F.medium, fontSize: 13 }}>
                    {formatDate(s.date_debut)} ← {formatDate(s.date_fin)}
                  </Text>
                  <Text style={{ color: colors.muted, fontFamily: F.regular, fontSize: 12 }}>
                    {s.montant} د.ت · {s.mode_paiement === "ESSAI" ? "تجريبي" : "نقداً"}
                    {paused ? ` · مجمّد منذ ${formatDate(s.pause_start!)}` : ""}
                  </Text>
                </View>
                <Badge
                  label={paused ? "مجمّد" : subBadge.label}
                  variant={paused ? "frozen" : subBadge.variant}
                />
                {isLatest && !paused && status !== "EXPIRE" ? (
                  <Button size="sm" variant="outline" onPress={() => pauseSub.mutate({ userId, subId: s.id })}>
                    تجميد
                  </Button>
                ) : null}
                {paused ? (
                  <Button size="sm" variant="outline" onPress={() => resumeSub.mutate({ userId, subId: s.id })}>
                    إلغاء التجميد
                  </Button>
                ) : null}
              </View>
            );
          })
        )}
        {showSubForm ? (
          <>
            <View style={styles.toggleRow}>
              <Text style={{ color: colors.text, fontFamily: F.semibold, fontSize: 14 }}>تجريبي (7 أيام)</Text>
              <Button variant={sEssai ? "primary" : "outline"} size="sm" onPress={() => setSEssai((v) => !v)}>
                {sEssai ? "نعم" : "لا"}
              </Button>
            </View>
            {!sEssai ? (
              <>
                <Input
                  label="تاريخ البداية (AAAA-MM-DD)"
                  value={sDebut}
                  onChangeText={setSDebut}
                  placeholder="2026-08-01"
                />
                <Input
                  label="تاريخ النهاية (AAAA-MM-DD)"
                  value={sFin}
                  onChangeText={setSFin}
                  placeholder="2026-09-01"
                />
                <Input label="المبلغ (دينار تونسي)" value={sMontant} onChangeText={setSMontant} keyboardType="numeric" />
              </>
            ) : null}
            <Button onPress={submitSub} loading={addSub.isPending} size="sm">
              تأكيد إضافة الاشتراك
            </Button>
          </>
        ) : null}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>ملاحظات المدرب الخاصة</Text>
        {(notes.data ?? []).map((n) => (
          <View key={n.id} style={styles.noteRow}>
            <Text style={{ flex: 1, color: colors.text, fontFamily: F.regular, fontSize: 13 }}>
              {n.contenu}
            </Text>
            <Text style={{ color: colors.muted, fontFamily: F.regular, fontSize: 11 }}>
              {formatDate(n.created_at)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="حذف الملاحظة"
              onPress={() => deleteNote.mutate({ userId, noteId: n.id })}
              style={{ padding: 4 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
            </Pressable>
          </View>
        ))}
        {notes.data?.length === 0 ? (
          <Text style={[styles.meta, { color: colors.muted }]}>لا توجد ملاحظات مسجلة بعد</Text>
        ) : null}
        <Input placeholder="اكتب ملاحظة خاصة عن المشترك…" value={noteText} onChangeText={setNoteText} />
        <Button size="sm" onPress={submitNote} loading={addNote.isPending}>
          إضافة ملاحظة
        </Button>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>إجراءات</Text>
        <Button variant="outline" onPress={onResetPassword} loading={resetPassword.isPending}>
          إعادة تعيين كلمة المرور
        </Button>
        <Button variant="danger" onPress={onDelete} loading={deleteUser.isPending}>
          حذف المشترك نهائيًا
        </Button>
      </Card>
    </Screen>
  );
}

function MemberWeights({ userId }: { userId: string }) {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [poids, setPoids] = useState("");
  const [error, setError] = useState<string | null>(null);

  const logs = useQuery({
    queryKey: ["coach", "users", userId, "weights"],
    queryFn: () => apiClient<WeightLog[]>("GET", `/users/${userId}/weight-logs`),
  });

  const add = useMutation({
    mutationFn: (poids_kg: number) => apiClient<WeightLog>("POST", `/users/${userId}/weight-logs`, { poids_kg }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach", "users", userId, "weights"] });
      qc.invalidateQueries({ queryKey: ["coach", "users"] });
    },
  });

  const remove = useMutation({
    mutationFn: (logId: string) => apiClient("DELETE", `/weight-logs/${logId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach", "users", userId, "weights"] });
      qc.invalidateQueries({ queryKey: ["coach", "users"] });
    },
  });

  const submit = async () => {
    setError(null);
    const value = Number(poids);
    if (!value || value < 30 || value > 250) {
      setError("أدخل قيمة وزن صحيحة (٣٠ - ٢٥٠ كغم)");
      return;
    }
    try {
      await add.mutateAsync(value);
      setPoids("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "حدث خطأ أثناء حفظ الوزن");
    }
  };

  return (
    <View style={{ gap: 8 }}>
      {(logs.data ?? []).length >= 2 ? (
        <WeightChart logs={logs.data ?? []} height={180} />
      ) : null}
      {(logs.data ?? []).slice(0, 5).map((w) => (
        <View key={w.id} style={styles.subRow}>
          <Text style={{ flex: 1, color: colors.text, fontFamily: F.medium, fontSize: 13 }}>
            {w.poids_kg} كغم
          </Text>
          <Text style={{ color: colors.muted, fontFamily: F.regular, fontSize: 12 }}>
            {formatDate(w.date)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="حذف الوزن"
            onPress={() => remove.mutate(w.id)}
            style={{ padding: 4 }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.destructive} />
          </Pressable>
        </View>
      ))}
      {logs.data?.length === 0 ? (
        <Text style={[styles.meta, { color: colors.muted }]}>لا توجد أوزان مسجلة بعد</Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Input
            placeholder="الوزن اليوم (كغم)"
            value={poids}
            onChangeText={setPoids}
            keyboardType="numeric"
          />
        </View>
        <Button size="sm" onPress={submit} loading={add.isPending}>
          إضافة
        </Button>
      </View>
      {error ? (
        <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: F.regular }}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: { gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1 },
  name: { fontSize: 17, fontFamily: F.bold },
  meta: { fontSize: 12, fontFamily: F.regular, marginTop: 2 },
  verifyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
    paddingTop: 10,
  },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 15, fontFamily: F.bold },
  statLbl: { fontSize: 10, fontFamily: F.regular, marginTop: 2, textAlign: "center" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 15, fontFamily: F.bold, marginBottom: 6 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
});