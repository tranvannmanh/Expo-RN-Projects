import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Radius, Spacing } from '@/constants/theme';

import { EXPOSURE_TICK_MS } from '../constants/camera.constants';
import { useDeviceRotation } from '../hooks/useDeviceRotation';
import { formatShutter } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';
import { ProgressRing } from './ProgressRing';

/**
 * Over the viewfinder during a long exposure: preparing → circular progress
 * with elapsed / total time → processing. Turns with the phone so it stays
 * readable when shooting in landscape.
 */
export function LongExposureOverlay() {
  const progress = useCameraStore((s) => s.captureProgress);
  const rotation = useDeviceRotation();
  if (!progress) return null;

  return (
    <View style={styles.backdrop} pointerEvents="none">
      <Animated.View style={[styles.card, rotation.style]}>
        {progress.phase === 'exposing' ? (
          <ExposingBody duration={progress.duration} startedAt={progress.startedAt} />
        ) : (
          <>
            <ActivityIndicator color={EditorColors.accent} />
            <ThemedText type="smallBold" style={styles.title}>
              {progress.phase === 'preparing'
                ? `Chuẩn bị phơi sáng ${formatShutter(progress.duration)}`
                : 'Đang xử lý ảnh…'}
            </ThemedText>
          </>
        )}
        {progress.phase === 'processing' ? null : (
          <ThemedText type="small" style={styles.hint}>
            Giữ yên máy
          </ThemedText>
        )}
      </Animated.View>
    </View>
  );
}

function ExposingBody({ duration, startedAt }: { duration: number; startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  const fill = useSharedValue(0);

  useEffect(() => {
    const done = Math.min(1, (Date.now() - startedAt) / (duration * 1000));
    const remaining = Math.max(0, duration * 1000 - (Date.now() - startedAt));
    fill.set(done);
    fill.set(withTiming(1, { duration: remaining, easing: Easing.linear }));
    const id = setInterval(
      () => setElapsed(Math.min(duration, (Date.now() - startedAt) / 1000)),
      EXPOSURE_TICK_MS,
    );
    return () => clearInterval(id);
  }, [duration, startedAt, fill]);

  return (
    <>
      <ThemedText type="smallBold" style={styles.title}>
        Đang phơi sáng
      </ThemedText>
      <ProgressRing progress={fill}>
        <View style={styles.timeRow}>
          <ThemedText style={styles.elapsed}>{elapsed.toFixed(1)}</ThemedText>
          <ThemedText style={styles.total}>{`/${formatShutter(duration)}`}</ThemedText>
        </View>
      </ProgressRing>
    </>
  );
}

const ELAPSED_FONT_SIZE = 30;
const TOTAL_FONT_SIZE = 16;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EditorColors.overlay,
  },
  card: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.large,
    backgroundColor: EditorColors.surface,
  },
  title: {
    color: EditorColors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  elapsed: {
    color: EditorColors.accent,
    fontSize: ELAPSED_FONT_SIZE,
    lineHeight: ELAPSED_FONT_SIZE + Spacing.one,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  total: {
    color: EditorColors.textMuted,
    fontSize: TOTAL_FONT_SIZE,
  },
  hint: {
    color: EditorColors.textMuted,
  },
});
