import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { ApiError } from "@/shared/lib/api-client";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";
import { useCreateUser } from "@/features/coach/hooks/useCoach";

export default function NewMemberScreen() {
  const { colors } = useTheme();
  const create = useCreateUser();
  const [email, setEmail] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [essai, setEssai] = useState(false);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [montant, setMontant] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim()) {
      setError("الإيميل خاطي");
      return;
    }
    try {
      const res = await create.mutateAsync({
        email: email.trim(),
        prenom: prenom.trim() || undefined,
        nom: nom.trim() || undefined,
        telephone: telephone.trim() || undefined,
        essai,
        date_debut: essai ? undefined : dateDebut.trim() || undefined,
        date_fin: essai ? undefined : dateFin.trim() || undefined,
        montant: montant ? Number(montant) : undefined,
      });
      Alert.alert(
        "تصيّر الحساب",
        `الإيميل: ${res.user.email}\nكلمة السر المؤقتة: ${res.password}\nأبلغ بيها العضو باش يدخل.`,
        [{ text: "ماشي", onPress: () => router.back() }],
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "صار خطأ");
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={[styles.hint, { color: colors.muted }]}>
          {essai
            ? "العضو بيشوف وصول تجريبي لـ 7 أيام."
            : "دخّل تواريخ الاشتراك (صيغة AAAA-MM-DD) ولا خليهم فارغين باش تتصرّى الحساب فقط."}
        </Text>

        <Input label="الإيميل *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input label="الاسم" value={nom} onChangeText={setNom} />
        <Input label="اللقب" value={prenom} onChangeText={setPrenom} />
        <Input label="الهاتف" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />

        <View style={styles.toggleRow}>
          <Text style={{ color: colors.text, fontFamily: F.semibold, fontSize: 14 }}>اشتراك تجريبي (7 أيام)</Text>
          <Button
            variant={essai ? "primary" : "outline"}
            size="sm"
            onPress={() => setEssai((v) => !v)}
          >
            {essai ? "نعم" : "لا"}
          </Button>
        </View>

        {!essai ? (
          <>
            <Input label="تاريخ البداية (AAAA-MM-DD)" value={dateDebut} onChangeText={setDateDebut} placeholder="2026-08-01" />
            <Input label="تاريخ النهاية (AAAA-MM-DD)" value={dateFin} onChangeText={setDateFin} placeholder="2026-09-01" />
            <Input label="المبلغ (دينار)" value={montant} onChangeText={setMontant} keyboardType="numeric" />
          </>
        ) : null}

        {error ? <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: F.regular }}>{error}</Text> : null}

        <Button onPress={submit} loading={create.isPending}>
          صيّر العضو
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12, fontFamily: F.regular },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});