import { Platform } from 'react-native';
import type { CameraController } from 'react-native-vision-camera';

import type { ExposureReading } from '../types/camera.types';

const queues = new WeakMap<CameraController, Promise<unknown>>();

/**
 * Runs exposure commands of one controller strictly one after another.
 * Native calls execute on a multi-threaded pool, so two quick changes (e.g.
 * scrolling the ISO dial) could otherwise reach the sensor in reverse order
 * and leave it on an older value than the one shown.
 */
function serial<T>(controller: CameraController, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(controller) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  queues.set(controller, next);
  return next;
}

/**
 * Returns the sensor to continuous auto exposure.
 * Android: the patched VisionCamera treats `setExposureLocked(0, 0)` as "unlock".
 * iOS: resetting focus/metering restores continuous AE.
 */
export function releaseExposure(controller: CameraController): Promise<void> {
  return serial(controller, async () => {
    if (Platform.OS === 'android') {
      await controller.setExposureLocked(0, 0);
    } else if (controller.exposureMode === 'locked') {
      await controller.resetFocus();
    }
  });
}

export function lockExposure(controller: CameraController, duration: number, iso: number) {
  return serial(controller, () => controller.setExposureLocked(duration, iso));
}

export function setExposureBias(controller: CameraController, ev: number): Promise<void> {
  const { device } = controller;
  if (!device.supportsExposureBias) return Promise.resolve();
  const clamped = Math.min(device.maxExposureBias, Math.max(device.minExposureBias, ev));
  return serial(controller, () => controller.setExposureBias(clamped));
}

/** Current sensor exposure, or null while the camera has not reported values yet. */
export function readExposure(controller: CameraController): ExposureReading | null {
  const { iso, exposureDuration } = controller;
  return iso > 0 && exposureDuration > 0 ? { iso, duration: exposureDuration } : null;
}

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

