import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useChangePassword, usePrefs, useSavePrefs } from "@/features/users/hooks/useUsers";
import { ApiError } from "@/shared/lib/api-client";
import type { NotificationPrefs } from "@/shared/lib/domain";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";

const PREFS: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: "rappel_poids", label: "تذكير الوزن", desc: "تذكير دوري لتسجيل قياس الوزن" },
  { key: "motivation", label: "رسائل التحفيز", desc: "رسائل تحفيزية يومية من المدرب" },
  { key: "expiration_proche", label: "تنبيه نهاية الاشتراك", desc: "تنبيه قبل موعد انتهاء الاشتراك" },
  { key: "nouveau_plan", label: "إشعار خطة جديدة", desc: "إشعار فوري عند تحديث الخطة الغذائية أو التدريبية" },
];

const DEFAULT_PREFS: NotificationPrefs = {
  rappel_poids: true,
  motivation: true,
  expiration_proche: true,
  nouveau_plan: true,
};

export default function ReglagesScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { data: prefs } = usePrefs();
  const savePrefs = useSavePrefs();
  const changePassword = useChangePassword();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const effectivePrefs = prefs ?? DEFAULT_PREFS;

  const toggle = (key: keyof NotificationPrefs, value: boolean) => {
    savePrefs.mutate({ ...effectivePrefs, [key]: value });
  };

  const submitPassword = async () => {
    setPwMsg(null);
    setPwError(null);
    if (next !== confirm) {
      setPwError("كلمتا المرور غير متطابقتين");
      return;
    }
    try {
      await changePassword.mutateAsync({ current, next });
      setPwMsg("تم تغيير كلمة المرور بنجاح ✓");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "حدث خطأ أثناء تغيير كلمة المرور");
    }
  };

  const confirmLogout = () => {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد من رغبتك في تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "تسجيل الخروج", style: "destructive", onPress: () => void logout() },
    ]);
  };

  return (
    <Screen>
      <Text style={[styles.screenTitle, { color: colors.text }]}>الإعدادات</Text>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>الإشعارات</Text>
        {PREFS.map((p) => (
          <View key={p.key} style={styles.prefRow}>
            <View style={styles.prefCol}>
              <Text style={[styles.prefLabel, { color: colors.text }]}>{p.label}</Text>
              <Text style={[styles.prefDesc, { color: colors.muted }]}>{p.desc}</Text>
            </View>
            <Switch
              value={effectivePrefs[p.key]}
              onValueChange={(v) => toggle(p.key, v)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>تغيير كلمة المرور</Text>
        <Input
          label="كلمة المرور الحالية"
          secureTextEntry
          value={current}
          onChangeText={setCurrent}
          placeholder="••••••"
        />
        <Input
          label="كلمة المرور الجديدة"
          secureTextEntry
          value={next}
          onChangeText={setNext}
          placeholder="٦ أحرف على الأقل"
        />
        <Input
          label="تأكيد كلمة المرور الجديدة"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          placeholder="••••••"
        />
        {pwMsg ? <Text style={[styles.ok, { color: colors.success }]}>{pwMsg}</Text> : null}
        {pwError ? <Text style={[styles.err, { color: colors.destructive }]}>{pwError}</Text> : null}
        <Button
          loading={changePassword.isPending}
          disabled={!current || !next || !confirm}
          onPress={submitPassword}
        >
          تحديث كلمة المرور
        </Button>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>الحساب</Text>
        <Text style={[styles.prefDesc, { color: colors.muted }]}>
          مسجل باسم {user?.prenom} {user?.nom}
        </Text>
        <Button variant="danger" onPress={confirmLogout}>
          تسجيل الخروج
        </Button>
      </Card>

      <Text style={[styles.footer, { color: colors.muted }]}>
        Coach Yosri 1.0.0 — نسخة تجريبية محلية
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 22, fontFamily: F.extrabold },
  cardTitle: { fontSize: 15, fontFamily: F.bold, marginBottom: 8 },
  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  prefCol: { flex: 1, gap: 2 },
  prefLabel: { fontSize: 13, fontFamily: F.semibold },
  prefDesc: { fontSize: 11, fontFamily: F.regular },
  ok: { fontSize: 12, fontFamily: F.medium },
  err: { fontSize: 12, fontFamily: F.medium },
  footer: { textAlign: "center", fontSize: 11, fontFamily: F.regular },
});