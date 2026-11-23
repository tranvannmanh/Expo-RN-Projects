import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';

export type SegmentOption<T extends string> = {
  id: T;
  label: string;
  /** Spoken name when it differs from the label (e.g. "Thủ công" for "M"). */
  accessibilityLabel?: string;
  disabled?: boolean;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Span the available width with equal segments (default: hug the labels). */
  fill?: boolean;
};

const SEGMENT_MIN_WIDTH = 68;
const SEGMENT_HEIGHT = 34;
const OUTLINE = StyleSheet.hairlineWidth * 3;

/** One outlined capsule split by thin dividers; the selected segment is filled. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fill = false,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.bar, fill && styles.barFill]} accessibilityRole="radiogroup">
      {options.map((o, i) => {
        const selected = o.id === value;
        return (
          <Pressable
            key={o.id}
            disabled={o.disabled}
            onPress={() => onChange(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: Boolean(o.disabled) }}
            accessibilityLabel={o.accessibilityLabel ?? o.label}
            style={({ pressed }) => [
              styles.item,
              fill && styles.itemFill,
              i > 0 && styles.divider,
              selected && styles.itemSelected,
              o.disabled && styles.disabled,
              pressed && !selected && styles.itemPressed,
            ]}>
            <ThemedText type="smallBold" style={selected ? styles.labelSelected : styles.label}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    borderWidth: OUTLINE,
    borderColor: EditorColors.textMuted,
    overflow: 'hidden',
  },
  barFill: {
    alignSelf: 'stretch',
    marginHorizontal: Spacing.four,
  },
  itemFill: {
    flex: 1,
  },
  item: {
    minWidth: SEGMENT_MIN_WIDTH,
    height: SEGMENT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  divider: {
    borderLeftWidth: OUTLINE,
    borderLeftColor: EditorColors.textMuted,
  },
  itemSelected: {
    backgroundColor: EditorColors.accent,
  },
  itemPressed: {
    backgroundColor: EditorColors.surfaceHigh,
  },
  label: {
    color: EditorColors.text,
  },
  labelSelected: {
    color: EditorColors.accentText,
  },
  disabled: {
    opacity: Motion.disabledOpacity,
  },
});
