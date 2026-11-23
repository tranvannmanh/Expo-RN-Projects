import { Platform } from 'react-native';
import type { CameraController } from 'react-native-vision-camera';

import type { ExposureReading } from '../types/camera.types';

/** Lock / release share one sensor setting, so they supersede each other. */
const SENSOR = 'sensor';

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

type Task = () => Promise<void>;
type Slot = { task: Task; done: Promise<void> };
const latestSlots = new WeakMap<CameraController, Map<string, Slot>>();

/**
 * Like `serial`, but a command that has not started yet is replaced by a newer
 * one of the same kind. Dragging the EV ruler or ISO dial fires a value per
 * tick; the camera then gets the value it is currently on plus the last one,
 * instead of working through a backlog of every intermediate step.
 */
function latest(controller: CameraController, key: string, task: Task): Promise<void> {
  let slots = latestSlots.get(controller);
  if (!slots) {
    slots = new Map();
    latestSlots.set(controller, slots);
  }
  const waiting = slots.get(key);
  if (waiting) {
    waiting.task = task;
    return waiting.done;
  }
  const slot: Slot = {
    task,
    done: serial(controller, () => {
      slots.delete(key);
      return slot.task();
    }),
  };
  slots.set(key, slot);
  return slot.done;
}

/**
 * Returns the sensor to continuous auto exposure.
 * Android: the patched VisionCamera treats `setExposureLocked(0, 0)` as "unlock".
 * iOS: resetting focus/metering restores continuous AE.
 */
export function releaseExposure(
  controller: CameraController,
  onApplied?: () => void,
): Promise<void> {
  return latest(controller, SENSOR, async () => {
    if (Platform.OS === 'android') {
      await controller.setExposureLocked(0, 0);
    } else if (controller.exposureMode === 'locked') {
      await controller.resetFocus();
    }
    onApplied?.();
  });
}

/**
 * Viewfinder exposure; superseded by newer values while waiting. `onApplied`
 * runs once the camera has taken these values (and is dropped with them), so
 * anything paired with them, like the viewfinder gain, never runs ahead.
 */
export function lockExposure(
  controller: CameraController,
  duration: number,
  iso: number,
  onApplied?: () => void,
) {
  return latest(controller, SENSOR, async () => {
    await controller.setExposureLocked(duration, iso);
    onApplied?.();
  });
}

/** Still-capture exposure: never dropped in favour of a later viewfinder value. */
export function lockCaptureExposure(controller: CameraController, duration: number, iso: number) {
  return serial(controller, () => controller.setExposureLocked(duration, iso));
}

export function setExposureBias(controller: CameraController, ev: number): Promise<void> {
  const { device } = controller;
  if (!device.supportsExposureBias) return Promise.resolve();
  const clamped = Math.min(device.maxExposureBias, Math.max(device.minExposureBias, ev));
  return latest(controller, 'bias', () => controller.setExposureBias(clamped));
}

/** Current sensor exposure, or null while the camera has not reported values yet. */
export function readExposure(controller: CameraController): ExposureReading | null {
  const { iso, exposureDuration } = controller;
  return iso > 0 && exposureDuration > 0 ? { iso, duration: exposureDuration } : null;
}

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

