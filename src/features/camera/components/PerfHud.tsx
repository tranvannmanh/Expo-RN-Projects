import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Fonts, Radius, Spacing } from '@/constants/theme';

import { LIVE_FILM_PREVIEW } from '../constants/camera.constants';
import { usePerfStats } from '../hooks/usePerfStats';
import { formatIso, formatShutter } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';

const HUD_FONT_SIZE = 11;

const fps = (v: number) => v.toFixed(1);
const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`);

/** Debug overlay (long-press the mode letter): where viewfinder / capture time goes. */
export function PerfHud() {
  const enabled = useCameraStore((s) => s.showPerfHud);
  const reading = useCameraStore((s) => s.reading);
  const timings = useCameraStore((s) => s.lastTimings);
  const stats = usePerfStats(enabled);
  if (!enabled) return null;

  const lines = [
    LIVE_FILM_PREVIEW
      ? `Camera ${stats ? fps(stats.cameraFps) : '--'} fps · khung ${stats ? ms(stats.frameMs) : '--'}`
      : 'Camera: xem trước gốc (máy ảo)',
    `UI ${stats ? fps(stats.uiFps) : '--'} fps · JS ${stats ? fps(stats.jsFps) : '--'} fps`,
    reading
      ? `Cảm biến ${formatShutter(reading.duration)} · ${formatIso(reading.iso)}`
      : 'Cảm biến --',
    timings
      ? `Chuẩn bị ${ms(timings.prepareMs)} · chụp ${ms(timings.captureMs)} · xử lý ${ms(timings.processMs)} · lưu ${ms(timings.saveMs)}`
      : 'Chưa chụp',
  ];

  return (
    <View style={styles.box} pointerEvents="none">
      {lines.map((line, i) => (
        <ThemedText key={i} style={styles.line}>
          {line}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.small,
    backgroundColor: EditorColors.overlay,
  },
  line: {
    color: EditorColors.text,
    fontSize: HUD_FONT_SIZE,
    lineHeight: HUD_FONT_SIZE + Spacing.one,
    fontFamily: Fonts?.mono,
  },
});
