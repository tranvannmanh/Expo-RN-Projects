import { useIsFocused, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { usePhotoOutput, type CameraController } from 'react-native-vision-camera';

import { useEditorStore } from '@/features/photo-editor';

import { PHOTO_QUALITY, PHOTO_RESOLUTION } from '../constants/camera.constants';
import { useCameraStore } from '../store/camera.store';
import type { CameraPanel } from '../types/camera.types';
import { useCameraLenses } from './useCameraLenses';
import { useCapturePhoto } from './useCapturePhoto';
import { useExposureControl } from './useExposureControl';
import { useFilmFrameRenderer } from './useFilmFrameRenderer';
import { useFilmSample } from './useFilmSample';
import { useFnMenu } from './useFnMenu';
import { useShutterFlash } from './useShutterFlash';

/** Wires lens, exposure mode, film rendering and capture for the camera screen. */
export function useFilmCamera() {
  const router = useRouter();
  const filmId = useCameraStore((s) => s.filmId);
  const flashMode = useCameraStore((s) => s.flashMode);
  const facing = useCameraStore((s) => s.facing);
  const lastShot = useCameraStore((s) => s.lastShot);
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
  const onFrame = useFilmFrameRenderer(filmId);
  const exposure = useExposureControl(activeController);
  const capture = useCapturePhoto();
  const shutterFlash = useShutterFlash();
  const isActive = useIsFocused();
  // Flash needs auto exposure; S / M drive the sensor manually.
  const hasFlash = Boolean(device?.hasFlash) && !exposure.isManual;

  const shoot = () => {
    if (capture.isPending) return;
    shutterFlash.fire();
    capture.mutate({ output: photoOutput, filmId, flashMode: hasFlash ? flashMode : 'off' });
  };

  const openLastShot = () => {
    if (!lastShot) return;
    openPhoto(lastShot.photo, { filmId: lastShot.filmId });
    router.push('/editor');
  };

  // Fn toggles the function grid; from any picker it returns to the presets.
  const toggleFn = () => setPanel((current) => (current === 'film' ? 'fn' : 'film'));

  const fnItems = useFnMenu({
    mode: exposure.mode,
    exposure: exposure.exposure,
    hasFlash,
    isManual: exposure.isManual,
    lenses: lens.lenses,
    lensId: lens.selected?.id ?? null,
    selectLens: lens.selectLens,
    remeter: exposure.remeter,
    openPanel: setPanel,
  });

  return {
    device,
    lenses: lens.lenses,
    lensId: lens.selected?.id ?? null,
    selectLens: lens.selectLens,
    outputs,
    onFrame,
    onController: setController,
    isActive,
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
    isCapturing: capture.isPending,
    error: capture.error?.message ?? exposure.error,
    shutterFlashStyle: shutterFlash.style,
  };
}
