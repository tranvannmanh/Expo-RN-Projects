import HardwareKeys from '@modules/hardware-keys';
import { useEffect, useEffectEvent } from 'react';

type HardwareShutterOptions = {
  enabled: boolean;
  /** Half-press of a two-stage shutter key (Xperia): focus / meter. */
  onHalfPress: () => void;
  /** Full press of the camera key, or a volume key: take the photo. */
  onShutter: () => void;
};

/**
 * Physical shutter support while the camera screen is active. The native side
 * only swallows these keys while enabled, so volume keys behave normally elsewhere.
 */
export function useHardwareShutter({ enabled, onHalfPress, onShutter }: HardwareShutterOptions) {
  const handleHalfPress = useEffectEvent(onHalfPress);
  const handleShutter = useEffectEvent(onShutter);

  useEffect(() => {
    if (!HardwareKeys || !enabled) return;
    HardwareKeys.setEnabled(true);
    const subscription = HardwareKeys.addListener('onKey', ({ key, action }) => {
      if (action !== 'down') return;
      if (key === 'focus') handleHalfPress();
      else handleShutter();
    });
    return () => {
      subscription.remove();
      HardwareKeys?.setEnabled(false);
    };
  }, [enabled]);
}
