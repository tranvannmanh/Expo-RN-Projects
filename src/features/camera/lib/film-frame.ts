import { FilterMode, MipmapMode, Skia, TileMode, type SkImage } from '@shopify/react-native-skia';
import type { Frame } from 'react-native-vision-camera';
import type { SkiaOnFrameState } from 'react-native-vision-camera-skia';

import {
  DEFAULT_ADJUSTMENTS,
  buildUniforms,
  flattenUniforms,
  photoEffect,
  type FilmPreset,
} from '@/features/photo-editor';

export type FrameRenderer = (
  frame: Frame,
  render: (onDraw: (state: SkiaOnFrameState) => void) => void,
) => void;

/**
 * Builds the camera-thread worklet that draws each frame through the same
 * SkSL film pipeline used by the editor and export, so the live preview
 * matches the saved photo.
 */
export function createFilmFrameRenderer(film: FilmPreset, lut: SkImage): FrameRenderer {
  const base = buildUniforms(DEFAULT_ADJUSTMENTS, {
    film,
    outSize: { width: 1, height: 1 },
    bypass: false,
    detailScale: 1,
    hasUserCurve: false,
  });

  return (frame, render) => {
    'worklet';
    render(({ canvas, frameTexture }) => {
      const width = frameTexture.width();
      const height = frameTexture.height();
      const image = frameTexture.makeShaderOptions(
        TileMode.Clamp,
        TileMode.Clamp,
        FilterMode.Linear,
        MipmapMode.None,
      );
      const curves = lut.makeShaderOptions(
        TileMode.Clamp,
        TileMode.Clamp,
        FilterMode.Linear,
        MipmapMode.None,
      );
      const uniforms = flattenUniforms({ ...base, outSize: [width, height] });
      const paint = Skia.Paint();
      paint.setShader(photoEffect.makeShaderWithChildren(uniforms, [image, curves]));
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), paint);
    });
    frame.dispose();
  };
}
