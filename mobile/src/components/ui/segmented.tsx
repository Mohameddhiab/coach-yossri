import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { F } from "@/fonts";
import { useTheme } from "./theme";

export interface SegmentItem {
  value: string;
  label: string;
}

export function Segmented({
  items,
  value,
  onChange,
}: {
  items: SegmentItem[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors, dark } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.primary : colors.card,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: selected ? (dark ? "#1C1D21" : "#FFFFFF") : colors.text,
                fontSize: 12,
                fontFamily: selected ? F.bold : F.medium,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
});