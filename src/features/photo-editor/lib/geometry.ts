import { Skia, type SkMatrix } from '@shopify/react-native-skia';

import type { CropRect, Geometry, Size } from '../types/editor.types';

const FULL_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 };

/** Size of the frame after quarter-turn rotation. */
export function orientedSize(source: Size, rotation: number): Size {
  'worklet';
  return rotation % 2 === 1
    ? { width: source.height, height: source.width }
    : { width: source.width, height: source.height };
}

/** Scale that keeps a straightened image covering its whole frame (no empty corners). */
export function straightenCoverScale(frame: Size, degrees: number): number {
  'worklet';
  const theta = Math.abs((degrees * Math.PI) / 180);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return Math.max(
    cos + (frame.height / frame.width) * sin,
    cos + (frame.width / frame.height) * sin,
  );
}

/** Output pixel size. When `ignoreCrop` is set the full frame is returned (crop mode). */
export function outputSize(source: Size, geometry: Geometry, ignoreCrop: boolean): Size {
  'worklet';
  const frame = orientedSize(source, geometry.rotation);
  const crop = ignoreCrop ? FULL_CROP : geometry.crop;
  return {
    width: Math.max(1, Math.round(frame.width * crop.width)),
    height: Math.max(1, Math.round(frame.height * crop.height)),
  };
}

/**
 * Matrix mapping source image pixels to output pixels:
 * crop · straighten · orient (flip + quarter turns).
 */
export function imageMatrix(source: Size, geometry: Geometry, ignoreCrop: boolean): SkMatrix {
  'worklet';
  const frame = orientedSize(source, geometry.rotation);
  const crop = ignoreCrop ? FULL_CROP : geometry.crop;
  const scale = straightenCoverScale(frame, geometry.straighten);
  const m = Skia.Matrix();
  m.translate(-crop.x * frame.width, -crop.y * frame.height);
  m.translate(frame.width / 2, frame.height / 2);
  m.rotate((geometry.straighten * Math.PI) / 180);
  m.scale(scale, scale);
  m.scale(geometry.flipH ? -1 : 1, geometry.flipV ? -1 : 1);
  m.rotate((geometry.rotation * Math.PI) / 2);
  m.translate(-source.width / 2, -source.height / 2);
  return m;
}

export type FitTransform = { scale: number; x: number; y: number };

/** Contain-fit of `content` inside `container`. */
export function fitContain(content: Size, container: Size, padding: number): FitTransform {
  'worklet';
  const availW = Math.max(1, container.width - padding * 2);
  const availH = Math.max(1, container.height - padding * 2);
  const scale = Math.min(availW / content.width, availH / content.height);
  return {
    scale,
    x: (container.width - content.width * scale) / 2,
    y: (container.height - content.height * scale) / 2,
  };
}

export function rotateCropClockwise(crop: CropRect): CropRect {
  return { x: 1 - (crop.y + crop.height), y: crop.x, width: crop.height, height: crop.width };
}

/** Largest centered crop with the given pixel aspect ratio inside `frame`. */
export function centeredCrop(frame: Size, ratio: number): CropRect {
  'worklet';
  const frameRatio = frame.width / frame.height;
  if (ratio >= frameRatio) {
    const height = frameRatio / ratio;
    return { x: 0, y: (1 - height) / 2, width: 1, height };
  }
  const width = ratio / frameRatio;
  return { x: (1 - width) / 2, y: 0, width, height: 1 };
}
