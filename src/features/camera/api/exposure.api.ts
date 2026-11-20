import { Platform } from 'react-native';
import type { CameraController } from 'react-native-vision-camera';

import type { ExposureReading } from '../types/camera.types';

/**
 * Returns the sensor to continuous auto exposure.
 * Android: the patched VisionCamera treats `setExposureLocked(0, 0)` as "unlock".
 * iOS: resetting focus/metering restores continuous AE.
 */
export async function releaseExposure(controller: CameraController): Promise<void> {
  if (Platform.OS === 'android') {
    await controller.setExposureLocked(0, 0);
  } else if (controller.exposureMode === 'locked') {
    await controller.resetFocus();
  }
}

export function lockExposure(controller: CameraController, duration: number, iso: number) {
  return controller.setExposureLocked(duration, iso);
}

export async function setExposureBias(controller: CameraController, ev: number) {
  const { device } = controller;
  if (!device.supportsExposureBias) return;
  const clamped = Math.min(device.maxExposureBias, Math.max(device.minExposureBias, ev));
  await controller.setExposureBias(clamped);
}

/** Current sensor exposure, or null while the camera has not reported values yet. */
export function readExposure(controller: CameraController): ExposureReading | null {
  const { iso, exposureDuration } = controller;
  return iso > 0 && exposureDuration > 0 ? { iso, duration: exposureDuration } : null;
}

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
