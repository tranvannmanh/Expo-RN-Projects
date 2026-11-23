import { useEffect, useEffectEvent, useRef } from 'react';
import type { CameraController } from 'react-native-vision-camera';

import { CONTROLLER_SYNC_MS } from '../constants/camera.constants';

/**
 * Reports the camera view's current controller whenever it changes.
 *
 * `onStarted` alone is not enough: VisionCamera re-creates the controller on
 * every session reconfigure (other lens, pixel-format fallback), and the
 * started event may fire before the view exposes the new instance, or not at
 * all when the camera stays open. Exposure commands sent to the old instance
 * reach a camera that is no longer bound, so the viewfinder stops reacting.
 */
export function useControllerSync(
  getController: () => CameraController | undefined,
  onController: (controller: CameraController) => void,
  isActive: boolean,
) {
  const reported = useRef<CameraController | undefined>(undefined);

  /** Reports the controller if it differs from the last one (also the view's `onStarted`). */
  const sync = () => {
    const controller = getController();
    if (!controller || controller === reported.current) return;
    reported.current = controller;
    onController(controller);
  };
  const onTick = useEffectEvent(sync);

  useEffect(() => {
    if (!isActive) return;
    onTick();
    const id = setInterval(onTick, CONTROLLER_SYNC_MS);
    return () => clearInterval(id);
  }, [isActive]);

  return sync;
}
