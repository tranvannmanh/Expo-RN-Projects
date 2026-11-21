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
  CameraLayout,
  FALLBACK_PIXEL_FORMAT,
  LIVE_FILM_PREVIEW,
  PHOTO_ORIENTATION_SOURCE,
  PREVIEW_PIXEL_FORMAT,
  PREVIEW_RESOLUTION,
} from '../constants/camera.constants';
import { useCameraFocus } from '../hooks/useCameraFocus';
import type { FrameRenderer } from '../lib/film-frame';

type FilmCameraViewProps = {
  /** Viewfinder width / height (portrait UI: short / long edge of the crop). */
  aspect: number;
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

/** Largest box of the given aspect (width / height) that fits the available space. */
function fitBox({ width, height }: Box, aspect: number): Box {
  const w = Math.min(width, height * aspect);
  return { width: w, height: w / aspect };
}

/**
 * Live preview rendered through the film shader, framed to the chosen aspect
 * ratio (the 4:3 feed is center-cropped like the saved photo), with tap-to-focus.
 */
export function FilmCameraView({
  aspect,
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
  const [area, setArea] = useState<Box | null>(null);
  const [pixelFormat, setPixelFormat] = useState(PREVIEW_PIXEL_FORMAT);
  const box = area ? fitBox(area, aspect) : null;
  const { gesture, ringStyle } = useCameraFocus(
    (point) => (skiaCamera.current ?? nativeCamera.current)?.focusTo(point),
  );

  const onStarted = () => {
    const controller = (skiaCamera.current ?? nativeCamera.current)?.controller;
    if (controller) onController(controller);
  };
  const onLayout = (e: LayoutChangeEvent) => setArea(e.nativeEvent.layout);

  // Fall back to CPU (YUV) frames when this camera rejects GPU buffers.
  const onSkiaError = (error: Error) => {
    if (pixelFormat !== FALLBACK_PIXEL_FORMAT && /PRIVATE|format/i.test(error.message)) {
      setPixelFormat(FALLBACK_PIXEL_FORMAT);
    }
  };

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
                orientationSource={PHOTO_ORIENTATION_SOURCE}
                targetResolution={PREVIEW_RESOLUTION}
                pixelFormat={pixelFormat}
                onError={onSkiaError}
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
                  orientationSource={PHOTO_ORIENTATION_SOURCE}
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
