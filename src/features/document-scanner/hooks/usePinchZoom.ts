import { useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ZOOM } from '../constants';

type Point = { x: number; y: number };
type ZoomSnapshot = Point & { scale: number };

type UsePinchZoomOptions = {
  /** Pan is only enabled while zoomed so the pager can still swipe at fit size */
  panEnabled: boolean;
  onScaleChange: (scale: number) => void;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

type Size = { width: number; height: number };

/** Size of `aspect` (width / height) content drawn with contentFit="contain" in `container`. */
function fittedSize(container: Size, aspect: number): Size {
  'worklet';
  if (aspect <= 0 || container.height <= 0) return container;
  return container.width / container.height > aspect
    ? { width: container.height * aspect, height: container.height }
    : { width: container.width, height: container.width / aspect };
}

/**
 * Clamps translation so the scaled page never drifts past its own edges.
 * On an axis where the scaled page is smaller than the container it stays centred.
 */
function clampTranslation(point: Point, container: Size, aspect: number, scale: number): Point {
  'worklet';
  const content = fittedSize(container, aspect);
  const boundX = Math.max(0, (content.width * scale - container.width) / 2);
  const boundY = Math.max(0, (content.height * scale - container.height) / 2);
  return { x: clamp(point.x, -boundX, boundX), y: clamp(point.y, -boundY, boundY) };
}

/**
 * Pinch-to-zoom (around the focal point), pan while zoomed and double-tap to toggle zoom.
 * Coordinates are relative to the container centre; scale is relative to "fit".
 */
export function usePinchZoom({ panEnabled, onScaleChange }: UsePinchZoomOptions) {
  const size = useSharedValue<Size>({ width: 0, height: 0 });
  /** Image width / height; 0 until the image reports its size */
  const aspect = useSharedValue(0);
  const scale = useSharedValue<number>(ZOOM.min);
  const translate = useSharedValue<Point>({ x: 0, y: 0 });
  const start = useSharedValue<ZoomSnapshot>({ scale: ZOOM.min, x: 0, y: 0 });
  const focal = useSharedValue<Point>({ x: 0, y: 0 });

  const commit = useCallback(
    (next: number, target: Point, animated = true) => {
      'worklet';
      const s = clamp(next, ZOOM.min, ZOOM.max);
      const config = { duration: animated ? ZOOM.animationMs : 0 };
      scale.value = withTiming(s, config);
      translate.value = withTiming(clampTranslation(target, size.value, aspect.value, s), config);
      scheduleOnRN(onScaleChange, s);
    },
    [aspect, onScaleChange, scale, size, translate],
  );

  /** Zoom so that `point` (container-centre coordinates) stays under the same screen spot. */
  const zoomAround = (current: ZoomSnapshot, next: number, point: Point) => {
    'worklet';
    const s = clamp(next, ZOOM.min, ZOOM.max);
    return {
      x: point.x - (s * (point.x - current.x)) / current.scale,
      y: point.y - (s * (point.y - current.y)) / current.scale,
    };
  };

  const toCentre = (x: number, y: number): Point => {
    'worklet';
    return { x: x - size.value.width / 2, y: y - size.value.height / 2 };
  };

  const snapshot = (): ZoomSnapshot => {
    'worklet';
    return { scale: scale.value, x: translate.value.x, y: translate.value.y };
  };

  const pinch = Gesture.Pinch()
    .onStart((event) => {
      start.value = snapshot();
      focal.value = toCentre(event.focalX, event.focalY);
    })
    .onUpdate((event) => {
      const next = clamp(start.value.scale * event.scale, ZOOM.min, ZOOM.max);
      const target = zoomAround(start.value, next, focal.value);
      scale.value = next;
      translate.value = clampTranslation(target, size.value, aspect.value, next);
    })
    .onEnd(() => {
      commit(scale.value, translate.value);
    });

  const pan = Gesture.Pan()
    .enabled(panEnabled)
    .averageTouches(true)
    .onStart(() => {
      start.value = snapshot();
    })
    .onUpdate((event) => {
      const target = { x: start.value.x + event.translationX, y: start.value.y + event.translationY };
      translate.value = clampTranslation(target, size.value, aspect.value, scale.value);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > ZOOM.min) {
        commit(ZOOM.min, { x: 0, y: 0 });
        return;
      }
      const point = toCentre(event.x, event.y);
      commit(ZOOM.doubleTap, zoomAround(snapshot(), ZOOM.doubleTap, point));
    });

  const gesture = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translate.value.x },
      { translateY: translate.value.y },
      { scale: scale.value },
    ],
  }));

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      size.value = { width, height };
    },
    [size],
  );

  /** Button zoom: scales around the current view centre. */
  const zoomBy = useCallback(
    (factor: number) => {
      const current = snapshot();
      const next = current.scale * factor;
      commit(next, zoomAround(current, next, { x: 0, y: 0 }));
    },
    [commit, snapshot, zoomAround],
  );

  const setContentAspect = useCallback(
    (value: number) => {
      aspect.value = value;
    },
    [aspect],
  );

  const reset = useCallback(() => commit(ZOOM.min, { x: 0, y: 0 }), [commit]);

  return { gesture, animatedStyle, onLayout, setContentAspect, zoomBy, reset };
}
