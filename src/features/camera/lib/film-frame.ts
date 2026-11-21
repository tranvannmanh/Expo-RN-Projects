import { FilterMode, MipmapMode, Skia, TileMode, type SkImage } from '@shopify/react-native-skia';
import type { Frame } from 'react-native-vision-camera';
import type { SkiaOnFrameState } from 'react-native-vision-camera-skia';
import { createSynchronizable } from 'react-native-worklets';

import {
  DEFAULT_ADJUSTMENTS,
  buildUniforms,
  flattenUniforms,
  photoEffect,
  type FilmPreset,
} from '@/features/photo-editor';

/**
 * Viewfinder counters written on the camera thread and read (then reset) by the
 * performance HUD: frames rendered and total time spent rendering them.
 */
export const frameStats = createSynchronizable({ frames: 0, renderMs: 0 });

/** Exposure gain (stops) added to viewfinder frames only, set by S / M exposure simulation. */
export const previewGainEv = createSynchronizable(0);

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
    const startedAt = performance.now();
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
      const uniforms = flattenUniforms({
        ...base,
        exposure: base.exposure + previewGainEv.getBlocking(),
        outSize: [width, height],
      });
      const paint = Skia.Paint();
      paint.setShader(photoEffect.makeShaderWithChildren(uniforms, [image, curves]));
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), paint);
    });
    const elapsed = performance.now() - startedAt;
    frameStats.setBlocking((s) => ({ frames: s.frames + 1, renderMs: s.renderMs + elapsed }));
    frame.dispose();
  };
}
