import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';

import { formatEv, formatIso, formatShutter, meterOffset } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';

/**
 * Sony-style info strip at the bottom of the viewfinder: live shutter, the
 * exposure value (EV comp, or the meter offset in M) and live ISO.
 */
export function ExposureReadout() {
  const reading = useCameraStore((s) => s.reading);
  const metered = useCameraStore((s) => s.metered);
  const mode = useCameraStore((s) => s.mode);
  const exposure = useCameraStore((s) => s.exposure);

  const ev =
    mode === 'm'
      ? metered
        ? meterOffset(metered, exposure.iso, exposure.shutter)
        : 0
      : mode === 'auto'
        ? 0
        : exposure.ev;

  return (
    <View style={styles.bar} pointerEvents="none">
      <ThemedText style={styles.value}>{reading ? formatShutter(reading.duration) : '--'}</ThemedText>
      <ThemedText style={styles.value}>{formatEv(ev)}</ThemedText>
      <ThemedText style={styles.value}>{reading ? formatIso(reading.iso) : 'ISO --'}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: Spacing.one,
    backgroundColor: EditorColors.overlay,
  },
  value: {
    color: EditorColors.text,
  },
});
