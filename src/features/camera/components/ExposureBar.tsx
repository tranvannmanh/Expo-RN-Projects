import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';
import { IconButton } from '@/features/photo-editor';

import { CameraLayout, MODE_PARAMS } from '../constants/camera.constants';
import { formatEv, formatIso, formatShutter, meterOffset } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';
import type { CaptureMode, ExposureParam, ExposureSettings } from '../types/camera.types';

type ExposureBarProps = {
  mode: CaptureMode;
  exposure: ExposureSettings;
  activeParam: ExposureParam | null;
  onToggleParam: (param: ExposureParam) => void;
  onRemeter: () => void;
};

const PARAM_LABEL: Record<ExposureParam, (e: ExposureSettings) => string> = {
  iso: (e) => formatIso(e.iso),
  shutter: (e) => formatShutter(e.shutter),
  ev: (e) => `EV ${formatEv(e.ev)}`,
};

/** Value pills for the parameters the current mode lets the user set. */
export function ExposureBar({ mode, exposure, activeParam, onToggleParam, onRemeter }: ExposureBarProps) {
  const metered = useCameraStore((s) => s.metered);
  const params = MODE_PARAMS[mode];
  if (params.length === 0) return null;

  const offset =
    mode === 'm' && metered ? meterOffset(metered, exposure.iso, exposure.shutter) : null;

  return (
    <View style={styles.row}>
      {params.map((param) => {
        const active = param === activeParam;
        return (
          <Pressable
            key={param}
            onPress={() => onToggleParam(param)}
            style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={active ? styles.textActive : styles.text}>
              {PARAM_LABEL[param](exposure)}
            </ThemedText>
          </Pressable>
        );
      })}
      {offset !== null ? (
        <ThemedText type="small" style={styles.meter}>
          {`${formatEv(offset)} EV`}
        </ThemedText>
      ) : null}
      {mode === 's' || mode === 'm' ? <IconButton icon="exposure" onPress={onRemeter} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pill: {
    height: CameraLayout.pillHeight,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 3,
    borderColor: EditorColors.border,
  },
  pillActive: {
    backgroundColor: EditorColors.accent,
    borderColor: EditorColors.accent,
  },
  text: {
    color: EditorColors.text,
  },
  textActive: {
    color: EditorColors.accentText,
  },
  meter: {
    color: EditorColors.textMuted,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
});
