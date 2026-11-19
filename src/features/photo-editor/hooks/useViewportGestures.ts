import { useEffect } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { DOUBLE_TAP_ZOOM, MAX_ZOOM } from '../constants/editor.constants';

export type Viewport = {
  zoom: SharedValue<number>;
  panX: SharedValue<number>;
  panY: SharedValue<number>;
};

/**
 * Pinch-zoom, pan, double-tap zoom and long-press "compare with original".
 * Everything runs as worklets on the UI thread.
 */
export function useViewportGestures(compare: SharedValue<boolean>, enabled: boolean) {
  const zoom = useSharedValue(1);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const startZoom = useSharedValue(1);
  const startPanX = useSharedValue(0);
  const startPanY = useSharedValue(0);

  const resetViewport = () => {
    'worklet';
    zoom.set(withTiming(1));
    panX.set(withTiming(0));
    panY.set(withTiming(0));
  };

  // Crop mode disables the viewport: always show the whole frame there.
  useEffect(() => {
    zoom.set(1);
    panX.set(0);
    panY.set(0);
  }, [enabled, zoom, panX, panY]);

  const pinch = Gesture.Pinch()
    .enabled(enabled)
    .onBegin(() => {
      startZoom.set(zoom.get());
    })
    .onUpdate((e) => {
      zoom.set(Math.min(MAX_ZOOM, Math.max(1, startZoom.get() * e.scale)));
    })
    .onEnd(() => {
      if (zoom.get() <= 1.01) resetViewport();
    });

  const pan = Gesture.Pan()
    .enabled(enabled)
    .minPointers(1)
    .averageTouches(true)
    .onBegin(() => {
      startPanX.set(panX.get());
      startPanY.set(panY.get());
    })
    .onUpdate((e) => {
      if (zoom.get() <= 1) return;
      panX.set(startPanX.get() + e.translationX);
      panY.set(startPanY.get() + e.translationY);
    });

  const doubleTap = Gesture.Tap()
    .enabled(enabled)
    .numberOfTaps(2)
    .onEnd(() => {
      if (zoom.get() > 1) {
        resetViewport();
      } else {
        zoom.set(withTiming(DOUBLE_TAP_ZOOM));
      }
    });

  const hold = Gesture.LongPress()
    .enabled(enabled)
    .minDuration(250)
    .onStart(() => {
      compare.set(true);
    })
    .onFinalize(() => {
      compare.set(false);
    });

  const gesture = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, hold));

  return { gesture, viewport: { zoom, panX, panY } satisfies Viewport };
}
