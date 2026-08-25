import { Linking, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMySubscription } from "@/features/subscriptions/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";

export function ExpiredScreen() {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const { data } = useMySubscription();
  const coach = data?.coach;

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={[styles.emoji, { color: colors.destructive }]}>⏸</Text>
        <Text style={[styles.title, { color: colors.text }]}>اشتراكك خلص</Text>
        <Text style={[styles.desc, { color: colors.muted }]}>
          تواصل مع كوتشك باش تجدّد اشتراكك وترجع تتابع خطتك وتقدمك من جديد.
        </Text>
      </View>

      <Card>
        <Text style={[styles.coachLabel, { color: colors.muted }]}>كوتشك:</Text>
        {coach ? (
          <Text style={[styles.coachName, { color: colors.text }]}>
            {coach.prenom} {coach.nom}
          </Text>
        ) : null}
        {coach?.telephone ? (
          <View style={styles.actions}>
            <Button
              variant="outline"
              onPress={() => Linking.openURL(`tel:${coach.telephone}`)}
            >
              اتصل بالكوتش
            </Button>
            <Button
              onPress={() =>
                Linking.openURL(`https://wa.me/216${coach.telephone}`)
              }
            >
              واتساب
            </Button>
          </View>
        ) : null}
      </Card>

      <Button variant="ghost" onPress={logout}>
        اخرج
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", gap: 8, paddingTop: 24, paddingBottom: 8 },
  emoji: { fontSize: 44 },
  title: { fontSize: 20, fontFamily: F.bold },
  desc: { fontSize: 13, fontFamily: F.regular, textAlign: "center" },
  coachLabel: { fontSize: 12, fontFamily: F.medium },
  coachName: { fontSize: 16, fontFamily: F.bold },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
});