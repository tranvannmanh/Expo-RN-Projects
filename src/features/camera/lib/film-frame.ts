import { FilterMode, MipmapMode, Skia, TileMode, type SkImage } from '@shopify/react-native-skia';
import type { CameraOrientation, Frame } from 'react-native-vision-camera';
import type { SkiaOnFrameState } from 'react-native-vision-camera-skia';
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets';

import {
  DEFAULT_ADJUSTMENTS,
  buildUniforms,
  flattenUniforms,
  photoEffect,
  type FilmPreset,
} from '@/features/photo-editor';

import { SAMPLE_INTERVAL_MS, SAMPLE_MAX_EDGE } from '../constants/camera.constants';

export type FrameRenderer = (
  frame: Frame,
  render: (onDraw: (state: SkiaOnFrameState) => void) => void,
) => void;

const ORIENTATION_DEGREES: Record<CameraOrientation, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

/** Last time (ms) an unfiltered sample was sent to JS; shared across frame callbacks. */
const lastSampleAt = createSynchronizable(0);

/** Small upright, unfiltered copy of the frame (CPU image, safe to hand to JS). */
function makeSample(frame: Frame, texture: SkImage): SkImage | null {
  'worklet';
  const srcW = texture.width();
  const srcH = texture.height();
  const landscape = frame.orientation === 'left' || frame.orientation === 'right';
  const uprightW = landscape ? srcH : srcW;
  const uprightH = landscape ? srcW : srcH;
  const scale = SAMPLE_MAX_EDGE / Math.max(uprightW, uprightH);
  const width = Math.round(uprightW * scale);
  const height = Math.round(uprightH * scale);
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) return null;

  const canvas = surface.getCanvas();
  canvas.translate(width / 2, height / 2);
  if (frame.isMirrored) canvas.scale(-1, 1);
  canvas.rotate(-ORIENTATION_DEGREES[frame.orientation], 0, 0);
  canvas.scale(scale, scale);
  canvas.drawImageRectOptions(
    texture,
    Skia.XYWHRect(0, 0, srcW, srcH),
    Skia.XYWHRect(-srcW / 2, -srcH / 2, srcW, srcH),
    FilterMode.Linear,
    MipmapMode.None,
  );
  const sample = surface.makeImageSnapshot().makeNonTextureImage();
  surface.dispose();
  return sample;
}

/**
 * Builds the camera-thread worklet that draws each frame through the same
 * SkSL film pipeline used by the editor and export, so the live preview
 * matches the saved photo. Periodically hands an unfiltered sample to
 * `onSample` for the preset cards.
 */
export function createFilmFrameRenderer(
  film: FilmPreset,
  lut: SkImage,
  onSample: (sample: SkImage) => void,
): FrameRenderer {
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

      const now = performance.now();
      if (now - lastSampleAt.getBlocking() >= SAMPLE_INTERVAL_MS) {
        lastSampleAt.setBlocking(now);
        const sample = makeSample(frame, frameTexture);
        if (sample) scheduleOnRN(onSample, sample);
      }
    });
    frame.dispose();
  };
}
