import { useMutation } from '@tanstack/react-query';

import { exportPhoto, type ExportInput, type ExportResult } from '../lib/export-photo';
import { useEditorSettingsStore } from '../store/editor-settings.store';

/**
 * Full-resolution GPU render + JPEG encode + save to gallery. With `onSaved`
 * the JPEG file is kept and handed over (e.g. to the in-app album).
 */
export function useExportPhoto(onSaved?: (result: ExportResult, input: ExportInput) => Promise<unknown>) {
  const setLastRecipe = useEditorSettingsStore((s) => s.setLastRecipe);
  return useMutation({
    mutationFn: async (input: ExportInput) => {
      const result = await exportPhoto({ ...input, keepFile: Boolean(onSaved) });
      await onSaved?.(result, input);
      return result;
    },
    onSuccess: (_, input) => setLastRecipe(input.recipe),
  });
}
