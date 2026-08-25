import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDeferredValue, useState } from "react";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, Spinner } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCoachUsers } from "@/features/coach/hooks/useCoach";
import { lastWeightText, statusBadge } from "@/features/coach/lib/coach-utils";
import { daysLeft, getSubscriptionStatus, type SubscriptionStatus } from "@/shared/lib/domain";

const FILTERS: { value: SubscriptionStatus | "TOUS"; label: string }[] = [
  { value: "TOUS", label: "الكل" },
  { value: "ACTIF", label: "مفعّل" },
  { value: "EXPIRE_BIENTOT", label: "قريب الانتهاء" },
  { value: "EXPIRE", label: "منتهي" },
];

export default function MembresList() {
  const { colors } = useTheme();
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filter, setFilter] = useState<string>("TOUS");

  const users = useCoachUsers(
    deferredSearch,
    filter === "TOUS" ? undefined : filter,
  );

  if (loading) return <Spinner />;
  if (!user || user.role !== "COACH") return <Redirect href="/(tabs)/plan" />;

  return (
    <Screen scroll={false}>
      <Input
        placeholder="بحث بالاسم ولا الإيميل ولا الهاتف…"
        aria-label="بحث عن عضو"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <Segmented
        items={FILTERS}
        value={filter}
        onChange={setFilter}
      />

      <Button onPress={() => router.push("/membres/new")} style={styles.addBtn} size="md">
        + زيد عضو
      </Button>

      {users.isLoading ? (
        <Loader rows={4} />
      ) : (
        <FlatList
          data={users.data ?? []}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => {
            const status = getSubscriptionStatus(item.subscription);
            const badge = statusBadge(status);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.prenom} ${item.nom}`}
                onPress={() => router.push(`/membres/${item.id}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Card style={styles.memberCard}>
                  <View style={styles.memberHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
                      <Text style={{ color: colors.primary, fontFamily: F.bold, fontSize: 16 }}>
                        {item.prenom.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, { color: colors.text }]}>
                        {item.prenom} {item.nom}
                      </Text>
                      <Text style={[styles.memberMeta, { color: colors.muted }]}>{item.email}</Text>
                    </View>
                    <Badge label={badge.label} variant={badge.variant} />
                  </View>
                  <View style={styles.memberFooter}>
                    <Text style={[styles.memberMeta, { color: colors.muted }]}>
                      {status === "EXPIRE" || status === "EXPIRE_BIENTOT"
                        ? `${daysLeft(item.subscription)} يوم باقي`
                        : lastWeightText(item.last_weight, item.days_since_last_weight)}
                    </Text>
                    <Text style={[styles.memberMeta, { color: colors.muted }]}>
                      {item.notes_count > 0 ? `${item.notes_count} ملاحظة` : ""}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          }}
          refreshing={users.isRefetching}
          onRefresh={() => users.refetch()}
          ListEmptyComponent={
            !users.isLoading ? (
              <Text style={{ color: colors.muted, fontFamily: F.regular, fontSize: 13, textAlign: "center", marginTop: 20 }}>
                ما كاينش أعضاء مطابقين
              </Text>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: 0 },
  addBtn: { flexDirection: "row" },
  memberCard: { gap: 8 },
  memberHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontFamily: F.bold },
  memberMeta: { fontSize: 12, fontFamily: F.regular, marginTop: 1 },
  memberFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  listContent: { gap: 14, paddingBottom: 40 },
});