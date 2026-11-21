import { useEffect, useState } from 'react';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { frameStats } from '../lib/film-frame';

export type PerfStats = {
  /** Viewfinder frames rendered per second (camera thread). */
  cameraFps: number;
  /** Average time to render one viewfinder frame (ms). */
  frameMs: number;
  uiFps: number;
  jsFps: number;
};

const SAMPLE_MS = 1000;

/** Samples camera, UI and JS frame rates once per second while `enabled`. */
export function usePerfStats(enabled: boolean): PerfStats | null {
  const [stats, setStats] = useState<PerfStats | null>(null);
  const uiFrames = useSharedValue(0);

  const uiCounter = useFrameCallback(() => {
    uiFrames.set(uiFrames.get() + 1);
  }, false);

  // `autostart` is only read on mount; follow later HUD toggles explicitly.
  useEffect(() => {
    uiCounter.setActive(enabled);
  }, [enabled, uiCounter]);

  useEffect(() => {
    if (!enabled) return;
    let jsFrames = 0;
    let raf = 0;
    const tick = () => {
      jsFrames += 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let last = Date.now();
    frameStats.setBlocking({ frames: 0, renderMs: 0 });
    uiFrames.set(0);
    const id = setInterval(() => {
      const now = Date.now();
      const seconds = (now - last) / 1000;
      last = now;
      const camera = frameStats.getBlocking();
      frameStats.setBlocking({ frames: 0, renderMs: 0 });
      setStats({
        cameraFps: camera.frames / seconds,
        frameMs: camera.frames ? camera.renderMs / camera.frames : 0,
        uiFps: uiFrames.get() / seconds,
        jsFps: jsFrames / seconds,
      });
      uiFrames.set(0);
      jsFrames = 0;
    }, SAMPLE_MS);

    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, [enabled, uiFrames]);

  return enabled ? stats : null;
}
