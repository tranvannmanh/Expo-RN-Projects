import HardwareKeys from '@modules/hardware-keys';
import { useEffect, useEffectEvent } from 'react';

type HardwareShutterOptions = {
  enabled: boolean;
  /** Half-press of a two-stage shutter key (Xperia): focus / meter. */
  onHalfPress: () => void;
  /** Full press of the camera key: take the photo. */
  onShutter: () => void;
};

/**
 * Physical shutter key support (e.g. Sony Xperia two-stage shutter) while the
 * camera screen is active. Volume keys are left to the system.
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
      else if (key === 'shutter') handleShutter();
    });
    return () => {
      subscription.remove();
      HardwareKeys?.setEnabled(false);
    };
  }, [enabled]);
}
