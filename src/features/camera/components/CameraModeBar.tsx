import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Spacing } from '@/constants/theme';

import { CAPTURE_MODES } from '../constants/camera.constants';
import type { CaptureMode } from '../types/camera.types';

type CameraModeBarProps = {
  mode: CaptureMode;
  canManual: boolean;
  canBias: boolean;
  onChange: (mode: CaptureMode) => void;
};

export function CameraModeBar({ mode, canManual, canBias, onChange }: CameraModeBarProps) {
  const isAvailable = (id: CaptureMode) =>
    id === 'auto' || (id === 'p' ? canBias : canManual);

  return (
    <View style={styles.bar}>
      {CAPTURE_MODES.map((m) => {
        const available = isAvailable(m.id);
        const selected = m.id === mode;
        return (
          <Pressable
            key={m.id}
            disabled={!available}
            hitSlop={Spacing.one}
            onPress={() => onChange(m.id)}
            style={({ pressed }) => [
              styles.item,
              !available && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={selected ? styles.selected : styles.label}>
              {m.label}
            </ThemedText>
            <View style={[styles.dot, selected && styles.dotSelected]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const DOT = 4;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  item: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  label: {
    color: EditorColors.textMuted,
  },
  selected: {
    color: EditorColors.accent,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  dotSelected: {
    backgroundColor: EditorColors.accent,
  },
  disabled: {
    opacity: Motion.disabledOpacity,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
