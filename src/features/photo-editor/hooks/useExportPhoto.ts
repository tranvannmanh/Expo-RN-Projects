import { useMutation } from '@tanstack/react-query';

import { decodeImage, resizeImage, saveJpegToGallery } from '../api/photo.api';
import { EXPORT_MAX_EDGE, PREVIEW_MAX_EDGE } from '../constants/editor.constants';
import { renderRecipe } from '../lib/render-export';
import { useEditorSettingsStore } from '../store/editor-settings.store';
import type { EditRecipe, ExportSettings, SourcePhoto } from '../types/editor.types';

type ExportInput = {
  photo: SourcePhoto;
  recipe: EditRecipe;
  settings: ExportSettings;
};

async function exportPhoto({ photo, recipe, settings }: ExportInput) {
  const full = await decodeImage(photo.uri);
  const originalLongEdge = Math.max(full.width(), full.height());
  const source = resizeImage(full, EXPORT_MAX_EDGE[settings.size]);
  if (source !== full) full.dispose();

  const previewLongEdge = Math.min(PREVIEW_MAX_EDGE, originalLongEdge);
  const detailScale = Math.max(source.width(), source.height()) / previewLongEdge;

  const rendered = await renderRecipe(source, recipe, detailScale);
  source.dispose();
  try {
    return await saveJpegToGallery(rendered, settings.quality);
  } finally {
    rendered.dispose();
  }
}

/** Full-resolution GPU render + JPEG encode + save to gallery. */
export function useExportPhoto() {
  const setLastRecipe = useEditorSettingsStore((s) => s.setLastRecipe);
  return useMutation({
    mutationFn: exportPhoto,
    onSuccess: (_, input) => setLastRecipe(input.recipe),
  });
}
