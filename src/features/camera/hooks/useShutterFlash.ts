import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { CameraMotion } from '../constants/camera.constants';

/** Brief white flash over the preview when a photo is taken. */
export function useShutterFlash() {
  const opacity = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const fire = () => {
    opacity.set(withSequence(withTiming(1, { duration: 0 }), withTiming(0, { duration: CameraMotion.shutterFlash })));
  };
  return { style, fire };
}
