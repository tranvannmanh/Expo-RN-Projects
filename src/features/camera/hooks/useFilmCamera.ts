import { useIsFocused, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { VisionCamera, usePhotoOutput, type CameraController } from 'react-native-vision-camera';

import { useEditorStore } from '@/features/photo-editor';

import {
  DEFAULT_ASPECT_ID as ASPECT_FULL_FRAME,
  PHOTO_QUALITY,
  PHOTO_RESOLUTION,
  getAspectOption,
} from '../constants/camera.constants';
import { useCameraStore } from '../store/camera.store';
import type { CameraPanel } from '../types/camera.types';
import { useAppActive } from './useAppActive';
import { useCameraLenses } from './useCameraLenses';
import { useCapturePhoto } from './useCapturePhoto';
import { useExposureControl } from './useExposureControl';
import { useFilmFrameRenderer } from './useFilmFrameRenderer';
import { useFilmSample } from './useFilmSample';
import { useFnMenu } from './useFnMenu';
import { useHardwareShutter } from './useHardwareShutter';
import { useShutterFlash } from './useShutterFlash';

/** Wires lens, exposure mode, film rendering and capture for the camera screen. */
export function useFilmCamera() {
  const router = useRouter();
  const filmId = useCameraStore((s) => s.filmId);
  const effects = useCameraStore((s) => s.effects);
  const flashMode = useCameraStore((s) => s.flashMode);
  const facing = useCameraStore((s) => s.facing);
  const lastShot = useCameraStore((s) => s.lastShot);
  const isSaving = useCameraStore((s) => s.isSaving);
  const aspect = getAspectOption(useCameraStore((s) => s.aspectId));
  const openPhoto = useEditorStore((s) => s.openPhoto);

  const [controller, setController] = useState<CameraController>();
  const [panel, setPanel] = useState<CameraPanel>('film');
  const lens = useCameraLenses(facing);
  const device = lens.selected?.device;
  const activeController = controller?.device.id === device?.id ? controller : undefined;
  const zoom = lens.selected?.zoom ?? 1;

  // Lens options on a logical multi-camera are zoom ratios (e.g. 0.5x = ultra-wide).
  useEffect(() => {
    activeController?.setZoom(zoom).catch(() => {
      // The session may restart while switching lenses; the next start re-applies zoom.
    });
  }, [activeController, zoom]);

  const photoOutput = usePhotoOutput({
    targetResolution: PHOTO_RESOLUTION,
    quality: PHOTO_QUALITY,
  });
  const outputs = useMemo(() => [photoOutput], [photoOutput]);
  const sample = useFilmSample();
  const onFrame = useFilmFrameRenderer(filmId, effects);
  const exposure = useExposureControl(activeController);
  const capture = useCapturePhoto();
  const shutterFlash = useShutterFlash();
  const isFocused = useIsFocused();
  const app = useAppActive();
  // Release the camera when the screen is left or the app goes to the background.
  const isActive = isFocused && app.isActive;
  // Flash needs auto exposure; S / M drive the sensor manually.
  const hasFlash = Boolean(device?.hasFlash) && !exposure.isManual;

  /** Manual shutter in S / M; otherwise the auto exposure currently metered. */
  const expectedExposureSeconds = () =>
    exposure.isManual
      ? exposure.exposure.shutter
      : (useCameraStore.getState().reading?.duration ?? 0);

  const expectedExposureIso = () => {
    const state = useCameraStore.getState();
    return (exposure.isManual ? state.manualExposure?.iso : state.reading?.iso) ?? 0;
  };

  const shoot = () => {
    if (capture.isPending) return;
    shutterFlash.fire();
    capture.mutate({
      output: photoOutput,
      filmId,
      effects,
      flashMode: hasFlash ? flashMode : 'off',
      exposureSeconds: expectedExposureSeconds(),
      exposureIso: expectedExposureIso(),
      prepareExposure: exposure.prepareCapture,
      // 4:3 is the sensor frame itself; no crop needed.
      aspect: aspect.id === ASPECT_FULL_FRAME ? undefined : aspect.ratio,
    });
  };

  /** Half-press: refocus and re-meter on the center, like a camera's AF-ON. */
  const focusCenter = () => {
    if (!activeController) return;
    Haptics.selectionAsync();
    const center = VisionCamera.createNormalizedMeteringPoint(0.5, 0.5);
    activeController.focusTo(center, {}).catch(() => {
      // Devices without focus metering reject the request.
    });
  };

  useHardwareShutter({
    enabled: isActive && Boolean(device),
    onHalfPress: focusCenter,
    onShutter: shoot,
  });

  const openLastShot = () => {
    if (!lastShot) return;
    openPhoto(lastShot.photo, {
      filmId: lastShot.filmId,
      effects: lastShot.effects,
      geometry: lastShot.geometry,
    });
    router.push('/editor');
  };

  // Fn toggles the function grid; from any picker it returns to the presets.
  const toggleFn = () => setPanel((current) => (current === 'film' ? 'fn' : 'film'));

  const fnItems = useFnMenu({
    mode: exposure.mode,
    exposure: exposure.exposure,
    hasFlash,
    aspect,
    isManual: exposure.isManual,
    lenses: lens.lenses,
    lensId: lens.selected?.id ?? null,
    selectLens: lens.selectLens,
    remeter: exposure.remeter,
    openPanel: setPanel,
  });

  return {
    aspect,
    device,
    lenses: lens.lenses,
    lensId: lens.selected?.id ?? null,
    selectLens: lens.selectLens,
    outputs,
    onFrame,
    onController: setController,
    isActive,
    /** Changes on every return to the foreground: remount the viewfinder. */
    sessionKey: app.resumeCount,
    hasFlash,
    sample,
    exposure,
    panel,
    setPanel,
    toggleFn,
    fnItems,
    shoot,
    openLastShot,
    lastShot,
    /** The sensor is capturing (saving is reported separately). */
    isCapturing: capture.isPending && !isSaving,
    isSaving,
    error: capture.error?.message ?? exposure.error,
    shutterFlashStyle: shutterFlash.style,
  };
}
