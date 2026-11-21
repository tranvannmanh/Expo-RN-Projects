import type { SkImage } from '@shopify/react-native-skia';
import { runOnRuntimeAsync } from 'react-native-worklets';

import { loadImageData, saveJpegToGallery } from '../api/photo.api';
import { EXPORT_MAX_EDGE, PREVIEW_MAX_EDGE } from '../constants/editor.constants';
import { DEFAULT_FILM_ID, getFilmPreset } from '../constants/film-presets.constants';
import type { EditRecipe, ExportSettings, SourcePhoto } from '../types/editor.types';
import { isIdentityCurveSet, makeCurveLut } from './curve';
import { getProcessingRuntime, processPhoto } from './process-photo.worklet';

/** Shown as the editing software in photo viewers. */
const EXIF_SOFTWARE = 'Film-Photo Pro';

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
  /** EXIF written only where the source photo has none (e.g. live sensor values). */
  exifFallbacks?: Record<string, string>;
};

export type ExportResult = {
  uri: string;
  thumb: SkImage | null;
  /** The recipe actually rendered (including any aspect crop). */
  recipe: EditRecipe;
  /** Milliseconds spent in each stage, for the performance HUD. */
  timings: { processMs: number; saveMs: number };
};

/**
 * Load (async) → decode / render / encode on a background runtime → save.
 * The JS thread only does I/O, so the UI stays responsive while exporting.
 */
export async function exportPhoto({
  photo,
  recipe,
  settings,
  thumbMaxEdge,
  aspect,
  exifFallbacks = {},
}: ExportInput): Promise<ExportResult> {
  const film = getFilmPreset(recipe.filmId);
  const lut = makeCurveLut(film.curves, recipe.curves);
  if (!lut) throw new Error('Không tạo được bảng curve');

  const startedAt = Date.now();
  const data = await loadImageData(photo.uri);
  const result = await runOnRuntimeAsync(getProcessingRuntime(), processPhoto, data, {
    recipe,
    film,
    lut,
    hasUserCurve: !isIdentityCurveSet(recipe.curves),
    maxEdge: EXPORT_MAX_EDGE[settings.size],
    previewMaxEdge: PREVIEW_MAX_EDGE,
    quality: settings.quality,
    aspect,
    thumbMaxEdge,
  });
  const processedAt = Date.now();
  const uri = await saveJpegToGallery(result.jpegBase64, {
    sourceUri: photo.uri,
    fallbacks: exifFallbacks,
    overrides: {
      // Pixels are already upright and resized.
      Orientation: '1',
      ImageWidth: String(result.width),
      ImageLength: String(result.height),
      PixelXDimension: String(result.width),
      PixelYDimension: String(result.height),
      Software: EXIF_SOFTWARE,
      ...(film.id === DEFAULT_FILM_ID ? {} : { ImageDescription: `Film: ${film.name}` }),
    },
  });
  return {
    uri,
    thumb: result.thumb,
    recipe: result.recipe,
    timings: { processMs: processedAt - startedAt, saveMs: Date.now() - processedAt },
  };
}
