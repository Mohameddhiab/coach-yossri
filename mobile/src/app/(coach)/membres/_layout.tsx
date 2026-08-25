import { Stack } from "expo-router";
import { useTheme } from "@/components/ui/theme";
import { F } from "@/fonts";

export default function MembresStackLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: F.bold },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "الأعضاء" }} />
      <Stack.Screen name="new" options={{ title: "عضو جديد" }} />
      <Stack.Screen name="[id]" options={{ title: "ملف العضو" }} />
    </Stack>
  );
}