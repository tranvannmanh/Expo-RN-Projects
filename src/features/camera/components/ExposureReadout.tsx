import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Radius, Spacing } from '@/constants/theme';

import { CAPTURE_MODES } from '../constants/camera.constants';
import { formatIso, formatShutter } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';

/** Live sensor values over the preview, e.g. "P  ISO 320  1/60". */
export function ExposureReadout() {
  const reading = useCameraStore((s) => s.reading);
  const mode = useCameraStore((s) => s.mode);
  const modeLabel = CAPTURE_MODES.find((m) => m.id === mode)?.label ?? '';

  return (
    <View style={styles.box} pointerEvents="none">
      <ThemedText type="smallBold" style={styles.mode}>
        {modeLabel}
      </ThemedText>
      {reading ? (
        <ThemedText type="small" style={styles.value}>
          {`${formatIso(reading.iso)}   ${formatShutter(reading.duration)}`}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.small,
    backgroundColor: EditorColors.overlay,
  },
  mode: {
    color: EditorColors.accent,
  },
  value: {
    color: EditorColors.text,
  },
});
