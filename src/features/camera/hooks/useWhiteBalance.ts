import { useEffect, useState } from 'react';
import type { CameraController } from 'react-native-vision-camera';

import { applyWhiteBalance, supportsKelvin } from '../api/white-balance.api';
import { EXPOSURE_RETRY_MS } from '../constants/camera.constants';
import { useCameraStore } from '../store/camera.store';

const CAMERA_NOT_ACTIVE = /not active/i;

/**
 * Keeps the sensor's white balance (preset or Kelvin) in sync with the store.
 * The A–B / G–M fine shift is not sent here: it is rendered by the film shader.
 */
export function useWhiteBalance(controller: CameraController | undefined) {
  const preset = useCameraStore((s) => s.whiteBalance.preset);
  const kelvin = useCameraStore((s) => s.whiteBalance.kelvin);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!controller) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const settings = useCameraStore.getState().whiteBalance;
    applyWhiteBalance(controller, settings).catch((e: unknown) => {
      // A camera that is still opening rejects controls: apply again shortly.
      if (!cancelled && CAMERA_NOT_ACTIVE.test(e instanceof Error ? e.message : String(e))) {
        retry = setTimeout(() => setNonce((n) => n + 1), EXPOSURE_RETRY_MS);
      }
    });
    return () => {
      cancelled = true;
      clearTimeout(retry);
    };
  }, [controller, preset, kelvin, nonce]);

  return { canKelvin: Boolean(controller && supportsKelvin(controller)) };
}
