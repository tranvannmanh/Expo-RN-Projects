import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';
import { SegmentedControl } from '@/features/photo-editor';

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
      <SegmentedControl
        options={CAPTURE_MODES.map((m) => ({
          id: m.id,
          label: m.label,
          accessibilityLabel: m.name,
          disabled: !isAvailable(m.id),
        }))}
        value={mode}
        onChange={onChange}
      />
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

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one + Spacing.half,
  },
  caption: {
    alignItems: 'center',
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
});
