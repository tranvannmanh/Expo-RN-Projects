import {
  FilterMode,
  ImageFormat,
  MipmapMode,
  Skia,
  TileMode,
  type SkData,
  type SkImage,
} from '@shopify/react-native-skia';
import { createWorkletRuntime, type WorkletRuntime } from 'react-native-worklets';

import type { EditRecipe, FilmPreset, Size } from '../types/editor.types';
import { centeredCrop, imageMatrix, outputSize } from './geometry';
import { photoEffect } from './photo.shader';
import { buildUniforms, flattenUniforms } from './uniforms';

export type ProcessJob = {
  recipe: EditRecipe;
  film: FilmPreset;
  /** 256x2 curve texture (built on the JS thread, a CPU image). */
  lut: SkImage;
  hasUserCurve: boolean;
  /** Long edge cap of the rendered photo. */
  maxEdge: number;
  /** Long edge of the editor preview; keeps sharpen / grain scale consistent. */
  previewMaxEdge: number;
  quality: number;
  /** Long:short ratio for a centered crop that follows the photo's orientation. */
  aspect?: number;
  thumbMaxEdge?: number;
};

export type ProcessResult = {
  /**
   * Encoded JPEG as base64. Binary buffers do not survive the trip back from a
   * worklet runtime (they arrive as empty objects); strings always do.
   */
  jpegBase64: string;
  thumb: SkImage | null;
  recipe: EditRecipe;
  /** Pixel size of the encoded JPEG. */
  width: number;
  height: number;
};

/** Downscale with mipmaps; returns a CPU image (safe to hand across threads). */
function scaled(image: SkImage, maxEdge: number): SkImage {
  'worklet';
  const longEdge = Math.max(image.width(), image.height());
  if (longEdge <= maxEdge) return image;
  const k = maxEdge / longEdge;
  const width = Math.round(image.width() * k);
  const height = Math.round(image.height() * k);
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('Không đủ bộ nhớ GPU để thu nhỏ ảnh');
  surface
    .getCanvas()
    .drawImageRectOptions(
      image,
      Skia.XYWHRect(0, 0, image.width(), image.height()),
      Skia.XYWHRect(0, 0, width, height),
      FilterMode.Linear,
      MipmapMode.Linear,
    );
  const result = surface.makeImageSnapshot().makeNonTextureImage();
  surface.dispose();
  if (!result) throw new Error('Không thu nhỏ được ảnh');
  return result;
}

/**
 * Runs on a background worklet runtime: decode → aspect crop → downscale →
 * film shader → JPEG encode (+ thumbnail). Nothing here touches the JS thread,
 * so the UI stays responsive while a 12–50 MP photo is processed.
 */
export function processPhoto(data: SkData, job: ProcessJob): ProcessResult {
  'worklet';
  const full = Skia.Image.MakeImageFromEncoded(data);
  if (!full) throw new Error('Không đọc được ảnh');
  const originalLongEdge = Math.max(full.width(), full.height());

  let recipe = job.recipe;
  if (job.aspect) {
    const frame: Size = { width: full.width(), height: full.height() };
    const ratio = frame.width >= frame.height ? job.aspect : 1 / job.aspect;
    recipe = { ...recipe, geometry: { ...recipe.geometry, crop: centeredCrop(frame, ratio) } };
  }

  const source = scaled(full, job.maxEdge);
  const size: Size = { width: source.width(), height: source.height() };
  const out = outputSize(size, recipe.geometry, false);
  const detailScale =
    Math.max(size.width, size.height) / Math.min(job.previewMaxEdge, originalLongEdge);

  const uniforms = buildUniforms(recipe.adjustments, {
    film: job.film,
    outSize: out,
    bypass: false,
    detailScale,
    hasUserCurve: job.hasUserCurve,
  });
  const image = source.makeShaderOptions(
    TileMode.Clamp,
    TileMode.Clamp,
    FilterMode.Linear,
    MipmapMode.None,
    imageMatrix(size, recipe.geometry, false),
  );
  const curves = job.lut.makeShaderOptions(
    TileMode.Clamp,
    TileMode.Clamp,
    FilterMode.Linear,
    MipmapMode.None,
  );

  const surface = Skia.Surface.MakeOffscreen(out.width, out.height);
  if (!surface) throw new Error('Ảnh quá lớn so với bộ nhớ GPU, hãy chọn kích thước nhỏ hơn');
  const paint = Skia.Paint();
  paint.setShader(photoEffect.makeShaderWithChildren(flattenUniforms(uniforms), [image, curves]));
  surface.getCanvas().drawRect(Skia.XYWHRect(0, 0, out.width, out.height), paint);
  const rendered = surface.makeImageSnapshot();

  try {
    const jpegBase64 = rendered.encodeToBase64(ImageFormat.JPEG, job.quality);
    const thumb = job.thumbMaxEdge ? scaled(rendered, job.thumbMaxEdge) : null;
    return { jpegBase64, thumb, recipe, width: out.width, height: out.height };
  } finally {
    rendered.dispose();
    surface.dispose();
    if (source !== full) source.dispose();
    full.dispose();
  }
}

let runtime: WorkletRuntime | null = null;

/** Single background runtime for photo processing (created on first use). */
export function getProcessingRuntime(): WorkletRuntime {
  runtime ??= createWorkletRuntime({ name: 'photo-processing' });
  return runtime;
}
