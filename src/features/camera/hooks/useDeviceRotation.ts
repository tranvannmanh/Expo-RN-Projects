import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useOrientation } from 'react-native-vision-camera';

import { CameraMotion, ORIENTATION_UI_DEGREES } from '../constants/camera.constants';

/**
 * The UI is locked to portrait; this rotates an overlay so it reads upright in
 * however the phone is held (accelerometer), like a camera's rotating icons.
 */
export function useDeviceRotation() {
  const orientation = useOrientation('device') ?? 'up';
  const degrees = useSharedValue<number>(ORIENTATION_UI_DEGREES[orientation]);

  useEffect(() => {
    degrees.set(withTiming(ORIENTATION_UI_DEGREES[orientation], { duration: CameraMotion.rotate }));
  }, [orientation, degrees]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${degrees.get()}deg` }] }));
  return { orientation, style };
}

/** The phone is held sideways (the UI itself stays portrait). */
export function useIsLandscape() {
  const orientation = useOrientation('device') ?? 'up';
  return orientation === 'left' || orientation === 'right';
}
