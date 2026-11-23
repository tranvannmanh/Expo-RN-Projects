import * as Haptics from 'expo-haptics';
import { useEffect, useEffectEvent, useState } from 'react';

import { useCameraStore } from '../store/camera.store';

const TICK_MS = 1000;

/**
 * Shutter with an optional self-timer. `trigger` shoots at once when the timer
 * is off; otherwise it starts a countdown (a press while counting cancels it).
 * Leaving the screen or the app cancels a running countdown.
 */
export function useSelfTimer(shoot: () => void, isActive: boolean) {
  const delay = useCameraStore((s) => s.selfTimer);
  /** Seconds left, or null when no countdown is running. */
  const [remaining, setRemaining] = useState<number | null>(null);
  const fire = useEffectEvent(shoot);

  useEffect(() => {
    if (remaining === null) return;
    const id = setTimeout(() => {
      if (remaining <= 1) {
        setRemaining(null);
        fire();
      } else {
        Haptics.selectionAsync();
        setRemaining(remaining - 1);
      }
    }, TICK_MS);
    return () => clearTimeout(id);
  }, [remaining]);

  // The camera was released (screen left, app in background): drop the countdown.
  useEffect(() => {
    if (!isActive) return;
    return () => setRemaining(null);
  }, [isActive]);

  const trigger = () => {
    if (remaining !== null) {
      setRemaining(null);
      return;
    }
    if (delay === 0) {
      shoot();
      return;
    }
    Haptics.selectionAsync();
    setRemaining(delay);
  };

  return { remaining, trigger };
}
