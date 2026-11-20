import { Canvas, Image } from '@shopify/react-native-skia';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';

import { CameraLayout } from '../constants/camera.constants';
import type { CapturedShot } from '../types/camera.types';

type ShutterBarProps = {
  lastShot: CapturedShot | null;
  isCapturing: boolean;
  /** No camera or permission yet. */
  disabled: boolean;
  /** Fn menu (or a picker opened from it) is showing. */
  fnActive: boolean;
  onFn: () => void;
  onShoot: () => void;
  onOpenLastShot: () => void;
};

const THUMB = CameraLayout.thumbSize;

export function ShutterBar({
  lastShot,
  isCapturing,
  disabled,
  fnActive,
  onFn,
  onShoot,
  onOpenLastShot,
}: ShutterBarProps) {
  const thumb = lastShot?.thumb;

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onOpenLastShot}
        disabled={!lastShot}
        style={({ pressed }) => [styles.thumb, pressed && styles.pressed]}>
        {thumb ? (
          <Canvas style={styles.thumbCanvas}>
            <Image image={thumb} x={0} y={0} width={THUMB} height={THUMB} fit="cover" />
          </Canvas>
        ) : null}
      </Pressable>

      <Pressable
        onPress={onShoot}
        disabled={isCapturing || disabled}
        style={({ pressed }) => [
          styles.shutter,
          disabled && styles.disabled,
          pressed && styles.shutterPressed,
        ]}>
        <View style={styles.shutterCore}>
          {isCapturing ? <ActivityIndicator color={EditorColors.accentText} /> : null}
        </View>
      </Pressable>

      <View style={styles.side}>
        <Pressable
          onPress={onFn}
          style={({ pressed }) => [styles.fn, fnActive && styles.fnActive, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={fnActive ? styles.fnTextActive : styles.fnText}>
            Fn
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: Radius.medium,
    overflow: 'hidden',
    borderWidth: CameraLayout.thumbBorder,
    borderColor: EditorColors.border,
    backgroundColor: EditorColors.surfaceHigh,
  },
  thumbCanvas: {
    width: THUMB,
    height: THUMB,
  },
  pressed: {
    opacity: Motion.pressedOpacity,
  },
  shutter: {
    width: CameraLayout.shutterSize,
    height: CameraLayout.shutterSize,
    borderRadius: Radius.pill,
    borderWidth: CameraLayout.shutterBorder,
    borderColor: EditorColors.accent,
    padding: CameraLayout.shutterInset,
  },
  disabled: {
    opacity: Motion.disabledOpacity,
  },
  shutterPressed: {
    transform: [{ scale: Motion.pressedScale }],
  },
  shutterCore: {
    flex: 1,
    borderRadius: Radius.pill,
    backgroundColor: EditorColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  side: {
    width: CameraLayout.fnButtonWidth,
    alignItems: 'center',
  },
  fn: {
    width: CameraLayout.fnButtonWidth,
    height: CameraLayout.fnButtonHeight,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 3,
    borderColor: EditorColors.accent,
  },
  fnActive: {
    backgroundColor: EditorColors.accent,
  },
  fnText: {
    color: EditorColors.accent,
  },
  fnTextActive: {
    color: EditorColors.accentText,
  },
});
