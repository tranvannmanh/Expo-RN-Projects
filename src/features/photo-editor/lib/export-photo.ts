import type { SkImage } from '@shopify/react-native-skia';

import { decodeImage, resizeImage, saveJpegToGallery } from '../api/photo.api';
import { EXPORT_MAX_EDGE, PREVIEW_MAX_EDGE } from '../constants/editor.constants';
import type { EditRecipe, ExportSettings, SourcePhoto } from '../types/editor.types';
import { centeredCrop } from './geometry';
import { renderRecipe } from './render-export';

export type ExportInput = {
  photo: SourcePhoto;
  recipe: EditRecipe;
  settings: ExportSettings;
  /** When set, also returns a downscaled copy of the rendered photo. */
  thumbMaxEdge?: number;
  /**
   * Long-edge : short-edge ratio (e.g. 16/9). The photo is center-cropped to it
   * along its own orientation, so a landscape shot gets a landscape crop.
   */
  aspect?: number;
};

export type ExportResult = {
  uri: string;
  thumb: SkImage | null;
  /** The recipe actually rendered (including any aspect crop). */
  recipe: EditRecipe;
};

/** Applies a centered aspect crop that follows the image's orientation. */
function withAspectCrop(recipe: EditRecipe, image: SkImage, aspect: number): EditRecipe {
  const size = { width: image.width(), height: image.height() };
  const ratio = size.width >= size.height ? aspect : 1 / aspect;
  return { ...recipe, geometry: { ...recipe.geometry, crop: centeredCrop(size, ratio) } };
}

/** Decode → GPU render at export size → JPEG → gallery. */
export async function exportPhoto({
  photo,
  recipe: baseRecipe,
  settings,
  thumbMaxEdge,
  aspect,
}: ExportInput): Promise<ExportResult> {
  const full = await decodeImage(photo.uri);
  const originalLongEdge = Math.max(full.width(), full.height());
  const recipe = aspect ? withAspectCrop(baseRecipe, full, aspect) : baseRecipe;
  const source = resizeImage(full, EXPORT_MAX_EDGE[settings.size]);
  if (source !== full) full.dispose();

  const previewLongEdge = Math.min(PREVIEW_MAX_EDGE, originalLongEdge);
  const detailScale = Math.max(source.width(), source.height()) / previewLongEdge;

  const rendered = await renderRecipe(source, recipe, detailScale);
  source.dispose();
  try {
    const thumb = thumbMaxEdge ? resizeImage(rendered, thumbMaxEdge) : null;
    const uri = await saveJpegToGallery(rendered, settings.quality);
    return { uri, thumb, recipe };
  } finally {
    rendered.dispose();
  }
}
