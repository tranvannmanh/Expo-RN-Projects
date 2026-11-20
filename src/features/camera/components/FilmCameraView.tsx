import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import {
  Camera,
  type CameraController,
  type CameraDevice,
  type CameraOutput,
  type CameraRef,
} from 'react-native-vision-camera';
import { SkiaCamera, type SkiaCameraRef } from 'react-native-vision-camera-skia';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Radius, Spacing } from '@/constants/theme';

import {
  CAMERA_ASPECT,
  CameraLayout,
  LIVE_FILM_PREVIEW,
  PREVIEW_PIXEL_FORMAT,
  PREVIEW_RESOLUTION,
} from '../constants/camera.constants';
import { useCameraFocus } from '../hooks/useCameraFocus';
import type { FrameRenderer } from '../lib/film-frame';

type FilmCameraViewProps = {
  device: CameraDevice;
  outputs: CameraOutput[];
  onFrame: FrameRenderer;
  isActive: boolean;
  shutterFlashStyle: AnimatedStyle<ViewStyle>;
  onController: (controller: CameraController) => void;
  /** Overlays drawn on top of the preview (grid, lens switch, info strip). */
  children?: ReactNode;
};

type Box = { width: number; height: number };

/** Largest 3:4 box that fits the available space. */
function fitBox({ width, height }: Box): Box {
  const w = Math.min(width, height * CAMERA_ASPECT);
  return { width: w, height: w / CAMERA_ASPECT };
}

/** 4:3 live preview rendered through the film shader, with tap-to-focus. */
export function FilmCameraView({
  device,
  outputs,
  onFrame,
  isActive,
  shutterFlashStyle,
  onController,
  children,
}: FilmCameraViewProps) {
  const skiaCamera = useRef<SkiaCameraRef>(null);
  const nativeCamera = useRef<CameraRef>(null);
  const [box, setBox] = useState<Box | null>(null);
  const { gesture, ringStyle } = useCameraFocus(
    (point) => (skiaCamera.current ?? nativeCamera.current)?.focusTo(point),
  );

  const onStarted = () => {
    const controller = (skiaCamera.current ?? nativeCamera.current)?.controller;
    if (controller) onController(controller);
  };
  const onLayout = (e: LayoutChangeEvent) => setBox(fitBox(e.nativeEvent.layout));

  return (
    <View style={styles.area} onLayout={onLayout}>
      {box ? (
        <GestureDetector gesture={gesture}>
          <View style={[styles.frame, box]}>
            {LIVE_FILM_PREVIEW ? (
              <SkiaCamera
                ref={skiaCamera}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive}
                outputs={outputs}
                onFrame={onFrame}
                onStarted={onStarted}
                targetResolution={PREVIEW_RESOLUTION}
                pixelFormat={PREVIEW_PIXEL_FORMAT}
              />
            ) : (
              <>
                <Camera
                  ref={nativeCamera}
                  style={StyleSheet.absoluteFill}
                  device={device}
                    isActive={isActive}
                  outputs={outputs}
                  onStarted={onStarted}
                  resizeMode="cover"
                />
                <View style={styles.notice} pointerEvents="none">
                  <ThemedText type="small" style={styles.noticeText}>
                    Máy ảo không hỗ trợ xem trước màu phim — ảnh chụp vẫn được áp dụng.
                  </ThemedText>
                </View>
              </>
            )}
            <View style={styles.overlay} pointerEvents="box-none">
              {children}
            </View>
            <Animated.View pointerEvents="none" style={[styles.focusRing, ringStyle]} />
            <Animated.View pointerEvents="none" style={[styles.flash, shutterFlashStyle]} />
          </View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    overflow: 'hidden',
    backgroundColor: EditorColors.surface,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  notice: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    top: '45%',
    padding: Spacing.two,
    borderRadius: Radius.medium,
    backgroundColor: EditorColors.overlay,
    opacity: CameraLayout.noticeOpacity,
  },
  noticeText: {
    color: EditorColors.text,
    textAlign: 'center',
  },
  focusRing: {
    position: 'absolute',
    width: CameraLayout.focusRingSize,
    height: CameraLayout.focusRingSize,
    borderRadius: CameraLayout.focusRingSize / 2,
    borderWidth: CameraLayout.focusRingBorder,
    borderColor: EditorColors.accent,
  },
  flash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: EditorColors.accent,
    opacity: 0,
  },
});
