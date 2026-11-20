import { useMemo } from 'react';
import { useCameraDevice, useCameraDevices } from 'react-native-vision-camera';

import { MAIN_LENS_ID, buildLensOptions } from '../lib/lenses';
import { useCameraStore } from '../store/camera.store';
import type { CameraFacing } from '../types/camera.types';

/** Available lenses (ultra-wide / wide / tele) for the current side and the active one. */
export function useCameraLenses(facing: CameraFacing) {
  const devices = useCameraDevices();
  const main = useCameraDevice(facing);
  const lensId = useCameraStore((s) => s.lensId);
  const setLens = useCameraStore((s) => s.setLens);

  const lenses = useMemo(() => (main ? buildLensOptions(main, devices) : []), [main, devices]);
  const selected =
    lenses.find((l) => l.id === lensId) ?? lenses.find((l) => l.id === MAIN_LENS_ID) ?? null;

  return { lenses, selected, selectLens: setLens };
}
