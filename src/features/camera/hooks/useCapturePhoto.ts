import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { CameraPhotoOutput } from 'react-native-vision-camera';

import {
  THUMB_MAX_EDGE,
  createDefaultRecipe,
  exportPhoto,
  useEditorSettingsStore,
} from '@/features/photo-editor';

import { capturePhoto } from '../api/camera.api';
import { LONG_EXPOSURE_SECONDS } from '../constants/camera.constants';
import { captureExifFallbacks } from '../lib/exif-fallbacks';
import { useCameraStore } from '../store/camera.store';
import type { CapturedShot, FlashMode } from '../types/camera.types';

type CaptureInput = {
  output: CameraPhotoOutput;
  filmId: string;
  flashMode: FlashMode;
  /** Long:short ratio to crop to; undefined keeps the full sensor frame. */
  aspect?: number;
  /** Expected sensor exposure (seconds); long ones show a progress overlay. */
  exposureSeconds: number;
  /** Expected sensor ISO, used for EXIF when the camera does not write it. */
  exposureIso: number;
  /** Switches the sensor to the capture exposure; returns a restore function. */
  prepareExposure: () => Promise<(() => void) | null>;
};

/**
 * Shutter: captures the full-resolution photo, renders the film through the
 * export pipeline (same shader as the preview) and saves it to the gallery.
 */
export function useCapturePhoto() {
  const settings = useEditorSettingsStore((s) => s.exportSettings);
  const setLastShot = useCameraStore((s) => s.setLastShot);
  const setProgress = useCameraStore((s) => s.setCaptureProgress);
  const setLastTimings = useCameraStore((s) => s.setLastTimings);

  return useMutation({
    mutationFn: async ({
      output,
      filmId,
      flashMode,
      aspect,
      exposureSeconds,
      exposureIso,
      prepareExposure,
    }: CaptureInput): Promise<CapturedShot> => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const isLong = exposureSeconds >= LONG_EXPOSURE_SECONDS;
      const startedAt = Date.now();
      if (isLong) setProgress({ phase: 'preparing', duration: exposureSeconds });
      const restoreExposure = await prepareExposure();
      const photo = await capturePhoto(output, flashMode, {
        onWillCapturePhoto: () => {
          if (isLong) setProgress({ phase: 'exposing', duration: exposureSeconds, startedAt: Date.now() });
        },
        onDidCapturePhoto: () => {
          if (isLong) setProgress({ phase: 'processing' });
        },
      }).finally(() => restoreExposure?.());
      const capturedAt = Date.now();
      const recipe = { ...createDefaultRecipe(), filmId };
      const saved = await exportPhoto({
        photo,
        recipe,
        settings,
        thumbMaxEdge: THUMB_MAX_EDGE,
        aspect,
        exifFallbacks: captureExifFallbacks({
          takenAt: new Date(startedAt),
          exposureSeconds,
          iso: exposureIso,
        }),
      });
      setLastTimings({ captureMs: capturedAt - startedAt, ...saved.timings });
      return { photo, filmId, geometry: saved.recipe.geometry, thumb: saved.thumb };
    },
    onSuccess: setLastShot,
    onSettled: () => setProgress(null),
  });
}
