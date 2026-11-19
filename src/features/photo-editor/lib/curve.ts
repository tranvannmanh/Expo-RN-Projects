import { AlphaType, ColorType, Skia, type SkImage } from '@shopify/react-native-skia';

import { LUT_SIZE } from '../constants/editor.constants';
import type { CurvePoint, CurveSet } from '../types/editor.types';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Monotone cubic (Fritsch–Carlson) interpolation: smooth like a spline but
 * never overshoots, so curves cannot invert tones.
 */
export function createCurveSampler(input: CurvePoint[]): (x: number) => number {
  const pts = [...input].sort((a, b) => a.x - b.x);
  const n = pts.length;
  if (n === 0) return (x) => x;
  if (n === 1) return () => pts[0].y;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(Math.max(pts[i + 1].x - pts[i].x, 1e-6));
    slope.push((pts[i + 1].y - pts[i].y) / dx[i]);
  }

  const tangent: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    tangent.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
  }
  tangent.push(slope[n - 2]);

  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangent[i] = t * a * slope[i];
      tangent[i + 1] = t * b * slope[i];
    }
  }

  return (x: number) => {
    if (x <= pts[0].x) return pts[0].y;
    if (x >= pts[n - 1].x) return pts[n - 1].y;
    let i = 0;
    while (i < n - 2 && x > pts[i + 1].x) i++;
    const h = dx[i];
    const t = (x - pts[i].x) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * pts[i].y +
      (t3 - 2 * t2 + t) * h * tangent[i] +
      (-2 * t3 + 3 * t2) * pts[i + 1].y +
      (t3 - t2) * h * tangent[i + 1]
    );
  };
}

const isIdentityCurve = (points: CurvePoint[]) =>
  points.length === 2 &&
  points.some((p) => p.x === 0 && p.y === 0) &&
  points.some((p) => p.x === 1 && p.y === 1);

export const isIdentityCurveSet = (curves: CurveSet) =>
  isIdentityCurve(curves.rgb) &&
  isIdentityCurve(curves.r) &&
  isIdentityCurve(curves.g) &&
  isIdentityCurve(curves.b);

function writeCurveRow(bytes: Uint8Array, row: number, curves: CurveSet) {
  const master = createCurveSampler(curves.rgb);
  const red = createCurveSampler(curves.r);
  const green = createCurveSampler(curves.g);
  const blue = createCurveSampler(curves.b);
  const last = LUT_SIZE - 1;
  for (let i = 0; i < LUT_SIZE; i++) {
    const m = clamp01(master(i / last));
    const offset = (row * LUT_SIZE + i) * 4;
    bytes[offset] = Math.round(clamp01(red(m)) * 255);
    bytes[offset + 1] = Math.round(clamp01(green(m)) * 255);
    bytes[offset + 2] = Math.round(clamp01(blue(m)) * 255);
    bytes[offset + 3] = 255;
  }
}

/** Builds the 256x2 lookup texture: row 0 = film curve, row 1 = user curve. */
export function makeCurveLut(filmCurves: CurveSet, userCurves: CurveSet): SkImage | null {
  const bytes = new Uint8Array(LUT_SIZE * 2 * 4);
  writeCurveRow(bytes, 0, filmCurves);
  writeCurveRow(bytes, 1, userCurves);
  return Skia.Image.MakeImage(
    {
      width: LUT_SIZE,
      height: 2,
      alphaType: AlphaType.Opaque,
      colorType: ColorType.RGBA_8888,
    },
    Skia.Data.fromBytes(bytes),
    LUT_SIZE * 4,
  );
}

/** Samples a curve into a polyline for drawing. */
export function sampleCurvePath(points: CurvePoint[], samples: number): CurvePoint[] {
  const sampler = createCurveSampler(points);
  return Array.from({ length: samples + 1 }, (_, i) => {
    const x = i / samples;
    return { x, y: clamp01(sampler(x)) };
  });
}
