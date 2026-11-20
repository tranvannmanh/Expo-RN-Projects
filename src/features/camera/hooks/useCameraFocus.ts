import { Gesture } from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Point } from 'react-native-vision-camera';

import { CameraLayout, CameraMotion } from '../constants/camera.constants';

const RING_OFFSET = CameraLayout.focusRingSize / 2;

/**
 * Tap-to-focus gesture plus the animated focus ring shown at the tap point.
 * `focusTo` receives view coordinates (both camera views accept them).
 */
export function useCameraFocus(focusTo: (point: Point) => Promise<void> | undefined) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);

  const gesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      x.set(e.x - RING_OFFSET);
      y.set(e.y - RING_OFFSET);
      opacity.set(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(0, { duration: CameraMotion.focusRing }),
        ),
      );
      focusTo({ x: e.x, y: e.y })?.catch(() => {
        // Best-effort: devices without focus metering reject the request.
      });
    });

  const ringStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: x.get() }, { translateY: y.get() }],
  }));

  return { gesture, ringStyle };
}
