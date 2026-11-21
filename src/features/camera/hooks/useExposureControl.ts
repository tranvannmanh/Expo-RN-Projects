import { useEffect, useMemo, useState } from 'react';
import type { CameraController } from 'react-native-vision-camera';

import {
  releaseExposure,
  lockExposure,
  readExposure,
  setExposureBias,
  wait,
} from '../api/exposure.api';
import {
  EV_LIMIT,
  EXPOSURE_POLL_MS,
  MANUAL_MODES,
  MAX_SHUTTER_SECONDS,
  METER_SETTLE_MS,
} from '../constants/camera.constants';
import { previewGainEv } from '../lib/film-frame';
import {
  evStops,
  isoForShutter,
  isoStops,
  nearest,
  previewExposure,
  shutterStops,
} from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';
import type { CaptureMode } from '../types/camera.types';

type Target =
  | { kind: 'auto'; bias: number }
  | { kind: 'manual'; duration: number; iso: number }
  | { kind: 'meter' };

/**
 * Drives the sensor for AUTO / P / S / M:
 * - AUTO: continuous AE.          - P: continuous AE + exposure compensation.
 * - S: chosen shutter, ISO solved from the last auto metering (+ EV).
 * - M: chosen ISO and shutter; the meter shows the offset from auto exposure.
 */
export function useExposureControl(controller: CameraController | undefined) {
  const mode = useCameraStore((s) => s.mode);
  const exposure = useCameraStore((s) => s.exposure);
  const metered = useCameraStore((s) => s.metered);
  const setModeInStore = useCameraStore((s) => s.setMode);
  const setExposure = useCameraStore((s) => s.setExposure);
  const setReading = useCameraStore((s) => s.setReading);
  const setMetered = useCameraStore((s) => s.setMetered);
  const setManualExposure = useCameraStore((s) => s.setManualExposure);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const device = controller?.device;
  const canManual = Boolean(controller && device?.supportsExposureLocking && controller.maxISO > 0);
  const canBias = Boolean(device?.supportsExposureBias);
  const isManual = MANUAL_MODES.includes(mode) && canManual;

  const options = useMemo(
    () => ({
      iso: controller ? isoStops(controller.minISO, controller.maxISO) : [],
      shutter: controller
        ? shutterStops(controller.minExposureDuration, Math.min(controller.maxExposureDuration, MAX_SHUTTER_SECONDS))
        : [],
      ev: device
        ? evStops(Math.max(-EV_LIMIT, device.minExposureBias), Math.min(EV_LIMIT, device.maxExposureBias))
        : [],
    }),
    [controller, device],
  );

  const target: Target = useMemo(() => {
    if (!isManual) return { kind: 'auto', bias: mode === 'p' && canBias ? exposure.ev : 0 };
    if (mode === 'm') return { kind: 'manual', duration: exposure.shutter, iso: exposure.iso };
    if (!metered || !controller) return { kind: 'meter' };
    const range = { min: controller.minISO, max: controller.maxISO };
    return {
      kind: 'manual',
      duration: exposure.shutter,
      iso: isoForShutter(metered, exposure.shutter, exposure.ev, range),
    };
  }, [isManual, mode, canBias, exposure, metered, controller]);
  const targetKey = JSON.stringify(target);

  // Live readout (and auto reference while AE runs).
  useEffect(() => {
    if (!controller) return;
    const id = setInterval(() => {
      const reading = readExposure(controller);
      if (reading) setReading(reading, !isManual);
    }, EXPOSURE_POLL_MS);
    return () => clearInterval(id);
  }, [controller, isManual, setReading]);

  // Push the target exposure to the sensor.
  useEffect(() => {
    if (!controller) return;
    let cancelled = false;
    const target = JSON.parse(targetKey) as Target;
    const apply = async () => {
      if (target.kind !== 'manual') {
        previewGainEv.setBlocking(0);
        setManualExposure(null);
      }
      if (target.kind === 'auto') {
        await releaseExposure(controller);
        await setExposureBias(controller, target.bias);
      } else if (target.kind === 'manual') {
        // The viewfinder simulates the capture exposure at a fluid frame rate.
        const preview = previewExposure(target, { min: controller.minISO, max: controller.maxISO });
        setManualExposure({ duration: target.duration, iso: target.iso });
        previewGainEv.setBlocking(preview.gainEv);
        await lockExposure(controller, preview.duration, preview.iso);
      } else {
        await releaseExposure(controller);
        await wait(METER_SETTLE_MS);
        const reading = readExposure(controller);
        if (reading && !cancelled) setMetered(reading);
      }
    };
    setError(null);
    apply().catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      cancelled = true;
    };
  }, [controller, targetKey, nonce, setMetered, setManualExposure]);

  const setMode = (next: CaptureMode) => {
    const reference = useCameraStore.getState().metered;
    if (reference && next === 'm' && options.iso.length && options.shutter.length) {
      setExposure({
        iso: nearest(options.iso, reference.iso),
        shutter: nearest(options.shutter, reference.duration),
      });
    } else if (reference && next === 's' && options.shutter.length) {
      setExposure({ shutter: nearest(options.shutter, reference.duration), ev: 0 });
    }
    setModeInStore(next);
  };

  /**
   * S / M: switches the sensor from the viewfinder simulation to the real
   * capture exposure and waits until frames use it. Resolves to a function
   * that restores the fluid viewfinder, or null when nothing had to change.
   */
  const prepareCapture = async (): Promise<(() => void) | null> => {
    if (!controller || target.kind !== 'manual') return null;
    const preview = previewExposure(target, { min: controller.minISO, max: controller.maxISO });
    if (preview.duration === target.duration && preview.iso === target.iso) return null;
    // No waiting for viewfinder frames to switch: S / M require MANUAL_SENSOR, whose
    // per-frame control applies these values to the very next request, i.e. the
    // still capture. Waiting would queue the photo behind several long preview frames.
    await lockExposure(controller, target.duration, target.iso);
    previewGainEv.setBlocking(0);
    return () => setNonce((n) => n + 1);
  };

  /** Re-reads the scene with auto exposure, then re-applies S / M. */
  const remeter = async () => {
    if (!controller) return;
    await releaseExposure(controller);
    await wait(METER_SETTLE_MS);
    const reading = readExposure(controller);
    if (reading) setMetered(reading);
    setNonce((n) => n + 1);
  };

  return {
    mode,
    setMode,
    exposure,
    setExposure,
    options,
    canManual,
    canBias,
    isManual,
    remeter,
    prepareCapture,
    error,
  };
}
