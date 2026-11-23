import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';

import { useDeviceRotation } from '../hooks/useDeviceRotation';

type SelfTimerOverlayProps = {
  /** Seconds left; nothing is drawn when null. */
  remaining: number | null;
};

const COUNT_FONT_SIZE = 96;

/** Large countdown over the viewfinder, upright however the phone is held. */
export function SelfTimerOverlay({ remaining }: SelfTimerOverlayProps) {
  const rotation = useDeviceRotation();
  if (remaining === null) return null;

  return (
    <View style={styles.backdrop} pointerEvents="none">
      <Animated.View style={[styles.content, rotation.style]}>
        <ThemedText style={styles.count}>{remaining}</ThemedText>
        <ThemedText type="small" style={styles.hint}>
          Bấm chụp để huỷ
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  count: {
    color: EditorColors.text,
    fontSize: COUNT_FONT_SIZE,
    lineHeight: COUNT_FONT_SIZE * 1.1,
    fontWeight: '700',
    textShadowColor: EditorColors.overlay,
    textShadowRadius: Spacing.two,
  },
  hint: {
    color: EditorColors.text,
    textShadowColor: EditorColors.overlay,
    textShadowRadius: Spacing.two,
  },
});
