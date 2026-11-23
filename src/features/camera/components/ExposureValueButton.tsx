import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Spacing } from '@/constants/theme';

import type { ExposureParam } from '../types/camera.types';

type ExposureValueButtonProps = {
  param: ExposureParam;
  /** Formatted value, e.g. "SS 1/100". */
  text: string;
  /** The current mode lets the user set it (otherwise it is drawn dimmed). */
  editable: boolean;
  /** `header`: compact bold label; `strip`: the viewfinder info strip. */
  variant: 'header' | 'strip';
  /** Opens the dial for `param` (switching mode first when needed). */
  onEdit: (param: ExposureParam) => void;
};

/** A shutter / ISO / EV value that opens its dial when tapped. */
export function ExposureValueButton({
  param,
  text,
  editable,
  variant,
  onEdit,
}: ExposureValueButtonProps) {
  return (
    <Pressable
      hitSlop={Spacing.one}
      onPress={() => onEdit(param)}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint={editable ? undefined : 'Chuyển sang chế độ cho phép chỉnh'}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <ThemedText
        type={variant === 'header' ? 'smallBold' : 'default'}
        style={editable ? styles.value : styles.valueAuto}>
        {text}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  value: {
    color: EditorColors.text,
  },
  valueAuto: {
    color: EditorColors.textMuted,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
