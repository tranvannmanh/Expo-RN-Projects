import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Radius, Spacing } from '@/constants/theme';

import { useDeviceRotation } from '../hooks/useDeviceRotation';
import { useCameraStore } from '../store/camera.store';
import { BusySpinner } from './BusySpinner';

/**
 * Single busy notice over the viewfinder for a long exposure, from the shutter
 * press until the photo is saved. Turns with the phone so it reads upright in
 * landscape.
 */
export function LongExposureOverlay() {
  const isLongCapture = useCameraStore((s) => s.isLongCapture);
  const rotation = useDeviceRotation();
  if (!isLongCapture) return null;

  return (
    <View style={styles.backdrop} pointerEvents="none">
      <Animated.View style={[styles.card, rotation.style]}>
        <BusySpinner>
          <ThemedText type="smallBold" style={styles.label}>
            Đang chụp
          </ThemedText>
        </BusySpinner>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EditorColors.overlay,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Radius.large,
    backgroundColor: EditorColors.surface,
  },
  label: {
    color: EditorColors.text,
  },
});
