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
import { useCameraStore } from '../store/camera.store';
import type { CapturedShot, FlashMode } from '../types/camera.types';

type CaptureInput = {
  output: CameraPhotoOutput;
  filmId: string;
  flashMode: FlashMode;
};

/**
 * Shutter: captures the full-resolution photo, renders the film through the
 * export pipeline (same shader as the preview) and saves it to the gallery.
 */
export function useCapturePhoto() {
  const settings = useEditorSettingsStore((s) => s.exportSettings);
  const setLastShot = useCameraStore((s) => s.setLastShot);

  return useMutation({
    mutationFn: async ({ output, filmId, flashMode }: CaptureInput): Promise<CapturedShot> => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await capturePhoto(output, flashMode);
      const recipe = { ...createDefaultRecipe(), filmId };
      const { thumb } = await exportPhoto({
        photo,
        recipe,
        settings,
        thumbMaxEdge: THUMB_MAX_EDGE,
      });
      return { photo, filmId, thumb };
    },
    onSuccess: setLastShot,
  });
}
