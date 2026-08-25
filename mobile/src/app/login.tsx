import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { ApiError } from "@/shared/lib/api-client";
import { DEMO_CREDENTIALS } from "@/shared/lib/storage";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e?: string, p?: string) => {
    setError(null);
    setLoading(true);
    try {
      const logged = await login(e ?? email, p ?? password);
      router.replace(logged.role === "COACH" ? "/dashboard" : "/(tabs)/plan");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.center}>
          <Image
            source={require("@/../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="شعار كوتش يوسري"
          />
          <Text style={[styles.brand, { color: colors.text }]}>Coach Yosri</Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            مساحة العضو — تبع خطتك وبرامجك اليومية
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="الإيميل"
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.field}
          />
          <Input
            label="كلمة السر"
            placeholder="••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.field}
          />
          {error ? (
            <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
          ) : null}
          <Button
            size="lg"
            loading={loading}
            onPress={() => submit()}
            disabled={!email || !password}
          >
            دخول
          </Button>

          <View style={styles.demo}>
            <Text style={[styles.demoTitle, { color: colors.muted }]}>حساب تجريبي:</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="دخول بالحساب التجريبي"
              onPress={() => submit(DEMO_CREDENTIALS.user.email, DEMO_CREDENTIALS.user.password)}
            >
              <Text style={[styles.demoText, { color: colors.primary }]}>
                {DEMO_CREDENTIALS.user.email} — {DEMO_CREDENTIALS.user.password}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: "center", paddingVertical: 24 },
  center: { alignItems: "center", marginBottom: 32 },
  logo: { width: 84, height: 84, borderRadius: 20, marginBottom: 12 },
  brand: { fontSize: 34, fontFamily: F.extrabold, marginBottom: 4 },
  tagline: { fontSize: 13, fontFamily: F.regular, textAlign: "center" },
  form: { width: "100%" },
  field: { marginBottom: 14 },
  error: { fontSize: 12, fontFamily: F.medium, marginTop: 4, marginBottom: 14 },
  demo: { alignItems: "center", marginTop: 22 },
  demoTitle: { fontSize: 12, fontFamily: F.medium, marginBottom: 4 },
  demoText: { fontSize: 13, fontFamily: F.semibold },
});