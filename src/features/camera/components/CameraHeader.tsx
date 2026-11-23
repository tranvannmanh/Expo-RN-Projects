import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Spacing } from '@/constants/theme';
import { EditorLayout, IconButton } from '@/features/photo-editor';

import {
  CAPTURE_MODES,
  FLASH_ICONS,
  PERF_TOOLS_ENABLED,
  SELF_TIMER_ICONS,
  formatSelfTimer,
} from '../constants/camera.constants';
import { useIsLandscape } from '../hooks/useDeviceRotation';
import { useExposureDisplay } from '../hooks/useExposureDisplay';
import { activeParams } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';
import type { CameraPanel } from '../types/camera.types';

type CameraHeaderProps = {
  /** The lens really runs S / M manually (false on lenses without manual control). */
  isManual: boolean;
  /** Flash usable now (the camera has one and the mode uses auto exposure). */
  hasFlash: boolean;
  onClose: () => void;
  onPanel: (panel: CameraPanel) => void;
};

type QuickSetting = { param: 'shutter' | 'iso'; text: string };

const MODE_FONT_SIZE = 30;

/**
 * Close on the left; flash (tap cycles off / auto / on), self-timer and the shooting mode
 * as a large letter on the right, like Sony.
 * Held sideways, SS and ISO lead the right-hand group as buttons that open their dials
 * (or the mode picker when the current mode sets them automatically).
 */
export function CameraHeader({ isManual, hasFlash, onClose, onPanel }: CameraHeaderProps) {
  const mode = useCameraStore((s) => s.mode);
  const togglePerfHud = useCameraStore((s) => s.togglePerfHud);
  const flashMode = useCameraStore((s) => s.flashMode);
  const cycleFlash = useCameraStore((s) => s.cycleFlash);
  const selfTimer = useCameraStore((s) => s.selfTimer);
  const cycleSelfTimer = useCameraStore((s) => s.cycleSelfTimer);
  const display = useExposureDisplay();
  const label = CAPTURE_MODES.find((m) => m.id === mode)?.label ?? '';
  const isLandscape = useIsLandscape();
  const params = activeParams(mode, isManual);

  const quick: QuickSetting[] = [
    // Formatted values already carry their "SS" / "ISO" prefix.
    { param: 'shutter', text: display.shutter },
    { param: 'iso', text: display.iso },
  ];

  return (
    <View style={styles.header}>
      <IconButton icon="close" onPress={onClose} />
      <View style={styles.right}>
        {/* Held sideways, SS / ISO lead the group, before flash and timer. */}
        {isLandscape
          ? quick.map((q) => {
              const editable = params.includes(q.param);
              return (
                <Pressable
                  key={q.param}
                  hitSlop={Spacing.one}
                  onPress={() => onPanel(editable ? q.param : 'mode')}
                  accessibilityRole="button"
                  accessibilityLabel={q.text}
                  accessibilityHint={editable ? undefined : 'Chọn chế độ S hoặc M để chỉnh'}
                  style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={editable ? styles.chipValue : styles.chipValueAuto}>
                    {q.text}
                  </ThemedText>
                </Pressable>
              );
            })
          : null}
        <IconButton
          icon={FLASH_ICONS[hasFlash ? flashMode : 'off']}
          disabled={!hasFlash}
          onPress={cycleFlash}
          accessibilityLabel={`Flash ${hasFlash ? flashMode : 'off'}`}
        />
        <Pressable
          hitSlop={Spacing.two}
          onPress={cycleSelfTimer}
          accessibilityRole="button"
          accessibilityLabel={selfTimer ? `Hẹn giờ ${selfTimer} giây` : 'Hẹn giờ tắt'}
          style={({ pressed }) => [styles.timer, pressed && styles.pressed]}>
          <SymbolView
            name={{ android: SELF_TIMER_ICONS[selfTimer], ios: 'timer' }}
            size={EditorLayout.iconSize}
            tintColor={EditorColors.text}
          />
          {selfTimer ? (
            <ThemedText type="smallBold" style={styles.timerText}>
              {formatSelfTimer(selfTimer)}
            </ThemedText>
          ) : null}
        </Pressable>
        <Pressable
          hitSlop={Spacing.two}
          onPress={() => onPanel('mode')}
          onLongPress={PERF_TOOLS_ENABLED ? togglePerfHud : undefined}
          style={({ pressed }) => [styles.mode, pressed && styles.pressed]}>
          <ThemedText style={styles.modeText}>{label}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: EditorLayout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chipValue: {
    color: EditorColors.text,
  },
  chipValueAuto: {
    color: EditorColors.textMuted,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    padding: Spacing.one,
  },
  timerText: {
    color: EditorColors.text,
  },
  mode: {
    paddingHorizontal: Spacing.two,
  },
  modeText: {
    color: EditorColors.text,
    fontSize: MODE_FONT_SIZE,
    lineHeight: MODE_FONT_SIZE + Spacing.one,
    fontWeight: '600',
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
