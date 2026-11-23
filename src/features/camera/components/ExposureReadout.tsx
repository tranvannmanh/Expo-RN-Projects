import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';

import { useIsLandscape } from '../hooks/useDeviceRotation';
import { useExposureDisplay } from '../hooks/useExposureDisplay';
import { activeParams } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';

type ExposureReadoutProps = {
  /** The lens really runs S / M manually (false on lenses without manual control). */
  isManual: boolean;
};

/**
 * Sony-style info strip at the bottom of the viewfinder: shutter, EV and ISO.
 * Held sideways, shutter and ISO move to the header buttons; EV shows only in
 * modes where it can be set (not in M).
 */
export function ExposureReadout({ isManual }: ExposureReadoutProps) {
  const display = useExposureDisplay();
  const mode = useCameraStore((s) => s.mode);
  const showShutterIso = !useIsLandscape();
  const showEv = activeParams(mode, isManual).includes('ev');

  if (!showShutterIso && !showEv) return null;

  return (
    <View style={styles.bar} pointerEvents="none">
      {showShutterIso ? <ThemedText style={styles.value}>{display.shutter}</ThemedText> : null}
      {showEv ? <ThemedText style={styles.value}>{display.ev}</ThemedText> : null}
      {showShutterIso ? <ThemedText style={styles.value}>{display.iso}</ThemedText> : null}
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
