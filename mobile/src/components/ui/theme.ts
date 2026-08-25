import { useColorScheme } from "react-native";
import { useThemeColors, type ThemeColor } from "@/theme";

export function useTheme() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  return { colors, dark: colorScheme === "dark" };
}

export type { ThemeColor };