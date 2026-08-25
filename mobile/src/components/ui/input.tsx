import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { F } from "@/fonts";
import { useTheme } from "./theme";

export function Input({
  label,
  error,
  style,
  ...rest
}: TextInputProps & { label?: string; error?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.muted }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
            color: colors.text,
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 0 },
  label: { fontSize: 12, fontFamily: F.semibold, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  error: { fontSize: 11, marginTop: 4 },
});