import { useMutation } from '@tanstack/react-query';

import { exportPhoto } from '../lib/export-photo';
import { useEditorSettingsStore } from '../store/editor-settings.store';

/** Full-resolution GPU render + JPEG encode + save to gallery. */
export function useExportPhoto() {
  const setLastRecipe = useEditorSettingsStore((s) => s.setLastRecipe);
  return useMutation({
    mutationFn: exportPhoto,
    onSuccess: (_, input) => setLastRecipe(input.recipe),
  });
}
