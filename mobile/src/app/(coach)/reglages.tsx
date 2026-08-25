import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { ApiError } from "@/shared/lib/api-client";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { Loader, Spinner } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoachSettings, useSaveCoachSettings } from "@/features/coach/hooks/useCoach";

export default function CoachSettingsScreen() {
  const { colors } = useTheme();
  const { user, loading } = useAuth();
  const settings = useCoachSettings();
  const save = useSaveCoachSettings();

  const [message, setMessage] = useState("");
  const [interval, setInterval] = useState("7");
  const [send, setSend] = useState(true);
  const [templates, setTemplates] = useState<string[]>([]);
  const [newTemplate, setNewTemplate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings.data) {
      setMessage(settings.data.motivation_message);
      setInterval(String(settings.data.rappel_interval_jours));
      setSend(settings.data.send_motivation);
      setTemplates(settings.data.message_templates);
    }
  }, [settings.data]);

  if (loading) return <Spinner />;
  if (!user || user.role !== "COACH") return <Redirect href="/(tabs)/plan" />;
  if (settings.isLoading) return <Loader />;

  const submit = async () => {
    setError(null);
    setSaved(false);
    const days = Number(interval);
    if (!days || days < 1) {
      setError("فترة التذكير لازم تكون رقم موجب");
      return;
    }
    try {
      await save.mutateAsync({
        motivation_message: message,
        rappel_interval_jours: days,
        send_motivation: send,
        message_templates: templates,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "صار خطأ");
    }
  };

  const addTemplate = () => {
    const t = newTemplate.trim();
    if (!t) return;
    setTemplates((prev) => [...prev, t]);
    setNewTemplate("");
  };

  const removeTemplate = (index: number) => {
    setTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Screen>
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>رسالة التحفيز</Text>
        <Input
          label="تتسيف للعضو مع التذكير بالتدريب"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <Input
          label="فترة التذكير (بالأيام)"
          value={interval}
          onChangeText={setInterval}
          keyboardType="numeric"
        />
        <View style={styles.toggleRow}>
          <Text style={{ color: colors.text, fontFamily: F.semibold, fontSize: 14 }}>
            إرسال رسائل التحفيز
          </Text>
          <Button variant={send ? "primary" : "outline"} size="sm" onPress={() => setSend((v) => !v)}>
            {send ? "مفعّل" : "متوقف"}
          </Button>
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>قوالب الرسائل</Text>
        {templates.map((t, i) => (
          <View key={`${t}-${i}`} style={styles.templateRow}>
            <Text style={{ flex: 1, color: colors.text, fontFamily: F.regular, fontSize: 13 }}>{t}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="حذف القالب"
              onPress={() => removeTemplate(i)}
              style={{ padding: 4 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
            </Pressable>
          </View>
        ))}
        {templates.length === 0 ? (
          <Text style={{ color: colors.muted, fontFamily: F.regular, fontSize: 12 }}>مازال ما كاينش قوالب</Text>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Input placeholder="نص القالب…" value={newTemplate} onChangeText={setNewTemplate} />
          </View>
          <Button size="sm" variant="outline" onPress={addTemplate}>
            زيد
          </Button>
        </View>
      </Card>

      {error ? (
        <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: F.regular }}>{error}</Text>
      ) : null}
      {saved ? (
        <Text style={{ color: "#22C55E", fontSize: 12, fontFamily: F.regular }}>تسجّل حفظ الإعدادات ✓</Text>
      ) : null}

      <Button onPress={submit} loading={save.isPending}>
        حفظ الإعدادات
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontFamily: F.bold, marginBottom: 6 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  templateRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
});