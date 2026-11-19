import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Spacing } from '@/constants/theme';

import { EditorLayout } from '../constants/layout.constants';
import type { AndroidIcon } from '../types/editor.types';

type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: AndroidIcon;
  label?: string;
  active?: boolean;
};

export function IconButton({ icon, label, active = false, disabled, ...rest }: IconButtonProps) {
  const color = active ? EditorColors.accent : EditorColors.text;
  return (
    <Pressable
      hitSlop={Spacing.two}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}>
      <SymbolView name={{ android: icon, ios: 'circle' }} size={EditorLayout.iconSize} tintColor={color} />
      {label ? (
        <ThemedText type="small" style={active ? styles.activeLabel : styles.label}>
          {label}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    gap: Spacing.half,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
  disabled: {
    opacity: Motion.disabledOpacity,
  },
  label: {
    color: EditorColors.textMuted,
  },
  activeLabel: {
    color: EditorColors.accent,
  },
});
