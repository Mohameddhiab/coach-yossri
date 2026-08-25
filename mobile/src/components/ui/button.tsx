import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { F } from "@/fonts";
import { useTheme } from "./theme";

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  style,
  disabled,
  ...rest
}: PressableProps & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, dark } = useTheme();
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const bg = isPrimary
    ? colors.primary
    : isDanger
      ? colors.destructive
      : "transparent";
  const fg = isPrimary ? (dark ? "#1C1D21" : "#FFFFFF") : isDanger ? "#FFFFFF" : colors.text;
  const border = variant === "outline" ? colors.border : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingVertical: size === "sm" ? 8 : size === "lg" ? 15 : 11,
          paddingHorizontal: size === "sm" ? 10 : size === "lg" ? 20 : 14,
          borderRadius: size === "sm" ? 9 : 12,
          opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Text
          style={{
            color: fg,
            fontSize: size === "sm" ? 12 : size === "lg" ? 16 : 14,
            fontFamily: F.bold,
          }}
        >
          {typeof children === "string" ? children : null}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
});