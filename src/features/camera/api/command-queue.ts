import type { CameraController } from 'react-native-vision-camera';

const queues = new WeakMap<CameraController, Promise<unknown>>();

/**
 * Runs camera commands of one controller strictly one after another.
 * Native calls execute on a multi-threaded pool, so two quick changes (e.g.
 * scrolling the ISO dial) could otherwise reach the sensor in reverse order
 * and leave it on an older value than the one shown.
 */
export function serial<T>(controller: CameraController, task: () => Promise<T>): Promise<T> {
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
export function latest(controller: CameraController, key: string, task: Task): Promise<void> {
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
