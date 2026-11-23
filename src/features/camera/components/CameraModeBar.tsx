import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';

import { CAPTURE_MODES, MANUAL_UNSUPPORTED_NOTE } from '../constants/camera.constants';
import type { CaptureMode } from '../types/camera.types';

type CameraModeBarProps = {
  mode: CaptureMode;
  canManual: boolean;
  canBias: boolean;
  onChange: (mode: CaptureMode) => void;
};

export function CameraModeBar({ mode, canManual, canBias, onChange }: CameraModeBarProps) {
  const isAvailable = (id: CaptureMode) => id === 'auto' || (id === 'p' ? canBias : canManual);

  const current = CAPTURE_MODES.find((m) => m.id === mode);

  return (
    <View style={styles.container}>
      <View style={styles.bar} accessibilityRole="radiogroup">
        {CAPTURE_MODES.map((m, i) => {
          const available = isAvailable(m.id);
          const selected = m.id === mode;
          return (
            <Pressable
              key={m.id}
              disabled={!available}
              onPress={() => onChange(m.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: !available }}
              accessibilityLabel={m.name}
              style={({ pressed }) => [
                styles.item,
                i > 0 && styles.divider,
                selected && styles.itemSelected,
                !available && styles.disabled,
                pressed && !selected && styles.itemPressed,
              ]}>
              <ThemedText type="smallBold" style={selected ? styles.labelSelected : styles.label}>
                {m.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {current ? (
        <View style={styles.caption}>
          <ThemedText type="smallBold" style={styles.captionTitle}>
            {`${current.label} · ${current.name}`}
          </ThemedText>
          <ThemedText type="small" style={styles.captionText}>
            {current.description}
          </ThemedText>
          {!canManual ? (
            <ThemedText type="small" style={styles.captionNote}>
              {MANUAL_UNSUPPORTED_NOTE}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const SEGMENT_WIDTH = 68;
const SEGMENT_HEIGHT = 34;
const OUTLINE = StyleSheet.hairlineWidth * 3;
/** Outline, dividers and the active segment share one color. */
const OUTLINE_COLOR = EditorColors.textMuted;

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one + Spacing.half,
  },
  caption: {
    alignItems: 'center',
    gap: 0,
    paddingHorizontal: Spacing.four,
  },
  captionTitle: {
    color: EditorColors.text,
  },
  captionText: {
    color: EditorColors.textMuted,
    textAlign: 'center',
  },
  captionNote: {
    color: EditorColors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Segmented control: one outlined capsule split by thin dividers; the active segment is filled.
  bar: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    borderWidth: OUTLINE,
    borderColor: OUTLINE_COLOR,
    overflow: 'hidden',
  },
  item: {
    minWidth: SEGMENT_WIDTH,
    height: SEGMENT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  divider: {
    borderLeftWidth: OUTLINE,
    borderLeftColor: OUTLINE_COLOR,
  },
  itemSelected: {
    backgroundColor: OUTLINE_COLOR,
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
