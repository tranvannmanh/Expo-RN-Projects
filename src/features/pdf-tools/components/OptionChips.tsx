import { StyleSheet, View } from 'react-native';

import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type ChipOption<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
};

type OptionChipsProps<T extends string | number> = {
  label: string;
  options: ChipOption<T>[];
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
};

/** Single-choice selector; options with a description render as full-width cards. */
export function OptionChips<T extends string | number>({
  label,
  options,
  value,
  disabled,
  onChange,
}: OptionChipsProps<T>) {
  const asCards = options.some((o) => o.description);

  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View style={asCards ? styles.cards : styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <ThemedPressable
              key={String(option.value)}
              type={selected ? 'primary' : 'backgroundElement'}
              pressedType={selected ? 'primaryPressed' : 'backgroundSelected'}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={asCards ? styles.card : styles.chip}>
              <ThemedText type="smallBold" themeColor={selected ? 'onPrimary' : 'text'}>
                {option.label}
              </ThemedText>
              {option.description && (
                <ThemedText type="small" themeColor={selected ? 'onPrimary' : 'textSecondary'}>
                  {option.description}
                </ThemedText>
              )}
            </ThemedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  cards: {
    gap: Spacing.two,
  },
  card: {
    gap: Spacing.half,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
