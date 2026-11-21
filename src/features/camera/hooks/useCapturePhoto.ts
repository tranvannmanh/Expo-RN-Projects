import { useMutation } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import type { CameraPhotoOutput } from 'react-native-vision-camera';

import {
  THUMB_MAX_EDGE,
  createDefaultRecipe,
  exportPhoto,
  useEditorSettingsStore,
} from '@/features/photo-editor';
import { useAddToLibrary } from '@/features/library';

import { capturePhoto } from '../api/camera.api';
import { LONG_EXPOSURE_SECONDS, PERF_TOOLS_ENABLED } from '../constants/camera.constants';
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
  const setLongCapture = useCameraStore((s) => s.setLongCapture);
  const setSaving = useCameraStore((s) => s.setSaving);
  const addToLibrary = useAddToLibrary();
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
      // The busy overlay covers only the sensor capture; saving shows on the thumbnail.
      setLongCapture(isLong);
      const restoreExposure = await prepareExposure();
      const preparedAt = Date.now();
      const photo = await capturePhoto(output, flashMode).finally(() => {
        restoreExposure?.();
        setLongCapture(false);
      });
      const capturedAt = Date.now();
      setSaving(true);
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
        keepFile: true,
      });
      const entry = await addToLibrary({
        fileUri: saved.uri,
        sourceUri: photo.uri,
        moveFile: true,
        width: saved.width,
        height: saved.height,
        origin: 'camera',
        filmId,
        recipe: saved.recipe,
      });
      // The album keeps its own copy of the original; drop the camera's temp file.
      new File(photo.uri).delete();
      if (PERF_TOOLS_ENABLED) {
        setLastTimings({
          prepareMs: preparedAt - startedAt,
          captureMs: capturedAt - preparedAt,
          ...saved.timings,
        });
      }
      return {
        photo: { ...photo, uri: entry.sourceUri },
        filmId,
        geometry: saved.recipe.geometry,
        thumb: saved.thumb,
      };
    },
    onSuccess: setLastShot,
    onSettled: () => {
      setLongCapture(false);
      setSaving(false);
    },
  });
}
