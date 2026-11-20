import type { SkImage } from '@shopify/react-native-skia';

import { decodeImage, resizeImage, saveJpegToGallery } from '../api/photo.api';
import { EXPORT_MAX_EDGE, PREVIEW_MAX_EDGE } from '../constants/editor.constants';
import type { EditRecipe, ExportSettings, SourcePhoto } from '../types/editor.types';
import { renderRecipe } from './render-export';

export type ExportInput = {
  photo: SourcePhoto;
  recipe: EditRecipe;
  settings: ExportSettings;
  /** When set, also returns a downscaled copy of the rendered photo. */
  thumbMaxEdge?: number;
};

export type ExportResult = {
  uri: string;
  thumb: SkImage | null;
};

/** Decode → GPU render at export size → JPEG → gallery. */
export async function exportPhoto({
  photo,
  recipe,
  settings,
  thumbMaxEdge,
}: ExportInput): Promise<ExportResult> {
  const full = await decodeImage(photo.uri);
  const originalLongEdge = Math.max(full.width(), full.height());
  const source = resizeImage(full, EXPORT_MAX_EDGE[settings.size]);
  if (source !== full) full.dispose();

  const previewLongEdge = Math.min(PREVIEW_MAX_EDGE, originalLongEdge);
  const detailScale = Math.max(source.width(), source.height()) / previewLongEdge;

  const rendered = await renderRecipe(source, recipe, detailScale);
  source.dispose();
  try {
    const thumb = thumbMaxEdge ? resizeImage(rendered, thumbMaxEdge) : null;
    const uri = await saveJpegToGallery(rendered, settings.quality);
    return { uri, thumb };
  } finally {
    rendered.dispose();
  }
}
