import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';

type ChipButtonProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function ChipButton({ label, selected = false, onPress }: ChipButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      <ThemedText type="small" style={selected ? styles.selectedText : styles.text}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.pill,
    backgroundColor: EditorColors.surfaceHigh,
  },
  selected: {
    backgroundColor: EditorColors.accent,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
  text: {
    color: EditorColors.text,
  },
  selectedText: {
    color: EditorColors.accentText,
  },
});
