import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';
import { EditorLayout } from '@/features/photo-editor';

import { CameraLayout } from '../constants/camera.constants';

type StopDialProps = {
  label: string;
  values: number[];
  index: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
};

/**
 * Sony-style dial: previous / current / next stop, ◀ ▶ to step, or drag
 * horizontally (one stop per `dialStepPx`).
 */
export function StopDial({ label, values, index, format, onChange }: StopDialProps) {
  const startIndex = useRef(index);
  const lastIndex = useRef(index);

  const select = (next: number) => {
    const clamped = Math.min(values.length - 1, Math.max(0, next));
    if (clamped === lastIndex.current) return;
    lastIndex.current = clamped;
    Haptics.selectionAsync();
    onChange(values[clamped]);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-Spacing.two, Spacing.two])
    .onBegin(() => {
      startIndex.current = index;
      lastIndex.current = index;
    })
    .onUpdate((e) => select(startIndex.current - Math.round(e.translationX / CameraLayout.dialStepPx)));

  const prev = values[index - 1];
  const next = values[index + 1];

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <GestureDetector gesture={pan}>
        <View style={styles.row}>
          <Arrow icon="arrow_left" disabled={prev === undefined} onPress={() => select(index - 1)} />
          <Pressable style={styles.side} disabled={prev === undefined} onPress={() => select(index - 1)}>
            <ThemedText numberOfLines={1} style={styles.sideText}>
              {prev !== undefined ? format(prev) : ''}
            </ThemedText>
          </Pressable>
          <View style={styles.center}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.currentText}>
              {values[index] !== undefined ? format(values[index]) : '--'}
            </ThemedText>
            <View style={styles.glow} />
          </View>
          <Pressable style={styles.side} disabled={next === undefined} onPress={() => select(index + 1)}>
            <ThemedText numberOfLines={1} style={styles.sideText}>
              {next !== undefined ? format(next) : ''}
            </ThemedText>
          </Pressable>
          <Arrow icon="arrow_right" disabled={next === undefined} onPress={() => select(index + 1)} />
        </View>
      </GestureDetector>
    </View>
  );
}

function Arrow({
  icon,
  disabled,
  onPress,
}: {
  icon: 'arrow_left' | 'arrow_right';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      hitSlop={Spacing.two}
      disabled={disabled}
      onPress={onPress}
      style={[styles.arrow, disabled && styles.arrowDisabled]}>
      <SymbolView name={{ android: icon, ios: 'circle' }} size={EditorLayout.iconSize} tintColor={EditorColors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  label: {
    color: EditorColors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  arrow: {
    width: EditorLayout.filmArrowWidth,
    alignItems: 'center',
  },
  arrowDisabled: {
    opacity: 0,
  },
  side: {
    width: CameraLayout.dialValueWidth,
    alignItems: 'center',
  },
  sideText: {
    color: EditorColors.textMuted,
    fontSize: EditorLayout.valueFontSize + 3,
  },
  center: {
    width: CameraLayout.dialValueWidth,
    alignItems: 'center',
    gap: Spacing.one,
  },
  currentText: {
    color: EditorColors.accent,
    fontSize: EditorLayout.valueFontSize + 5,
  },
  glow: {
    width: CameraLayout.dialGlowWidth,
    height: CameraLayout.dialGlowHeight,
    borderRadius: CameraLayout.dialGlowHeight,
    backgroundColor: EditorColors.accent,
  },
});
