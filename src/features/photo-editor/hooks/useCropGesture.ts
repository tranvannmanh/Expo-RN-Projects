import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, type DerivedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { DEFAULT_GEOMETRY, MIN_CROP } from '../constants/editor.constants';
import { EditorLayout } from '../constants/layout.constants';
import type { CropRect, Geometry } from '../types/editor.types';

export type FrameRect = { x: number; y: number; width: number; height: number };

const DragMode = {
  None: 0,
  Move: 1,
  TopLeft: 2,
  TopRight: 3,
  BottomLeft: 4,
  BottomRight: 5,
} as const;

type DragModeValue = (typeof DragMode)[keyof typeof DragMode];

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

function resizeFromCorner(
  start: CropRect,
  mode: DragModeValue,
  dx: number,
  dy: number,
  ratio: number | null,
): CropRect {
  'worklet';
  const left = mode === DragMode.TopLeft || mode === DragMode.BottomLeft;
  const top = mode === DragMode.TopLeft || mode === DragMode.TopRight;
  const anchorX = left ? start.x + start.width : start.x;
  const anchorY = top ? start.y + start.height : start.y;
  const pointX = clamp((left ? start.x : start.x + start.width) + dx, 0, 1);
  const pointY = clamp((top ? start.y : start.y + start.height) + dy, 0, 1);
  const maxW = left ? anchorX : 1 - anchorX;
  const maxH = top ? anchorY : 1 - anchorY;

  let width = clamp(Math.abs(anchorX - pointX), MIN_CROP, maxW);
  let height = clamp(Math.abs(anchorY - pointY), MIN_CROP, maxH);
  if (ratio !== null) {
    height = width / ratio;
    if (height > maxH) {
      height = maxH;
      width = height * ratio;
    }
  }
  return {
    x: left ? anchorX - width : anchorX,
    y: top ? anchorY - height : anchorY,
    width,
    height,
  };
}

/**
 * Drag corners to resize (respecting the locked aspect), drag inside to move.
 * `aspect` is the pixel ratio (w/h) or null for free crop.
 */
export function useCropGesture(
  geometry: SharedValue<Geometry>,
  frameRect: DerivedValue<FrameRect>,
  aspect: number | null,
  onCommit: () => void,
) {
  const mode = useSharedValue<DragModeValue>(DragMode.None);
  const start = useSharedValue<CropRect>(DEFAULT_GEOMETRY.crop);

  return Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      const f = frameRect.get();
      const c = geometry.get().crop;
      const l = f.x + c.x * f.width;
      const t = f.y + c.y * f.height;
      const r = l + c.width * f.width;
      const b = t + c.height * f.height;
      const hit = EditorLayout.cropHandleHit;
      const near = (px: number, py: number) => Math.abs(e.x - px) < hit && Math.abs(e.y - py) < hit;

      start.set(c);
      if (near(l, t)) mode.set(DragMode.TopLeft);
      else if (near(r, t)) mode.set(DragMode.TopRight);
      else if (near(l, b)) mode.set(DragMode.BottomLeft);
      else if (near(r, b)) mode.set(DragMode.BottomRight);
      else if (e.x > l && e.x < r && e.y > t && e.y < b) mode.set(DragMode.Move);
      else mode.set(DragMode.None);
    })
    .onUpdate((e) => {
      const m = mode.get();
      if (m === DragMode.None) return;
      const f = frameRect.get();
      const s = start.get();
      const dx = e.translationX / f.width;
      const dy = e.translationY / f.height;
      const crop =
        m === DragMode.Move
          ? { ...s, x: clamp(s.x + dx, 0, 1 - s.width), y: clamp(s.y + dy, 0, 1 - s.height) }
          : resizeFromCorner(s, m, dx, dy, aspect === null ? null : (aspect * f.height) / f.width);
      geometry.set({ ...geometry.get(), crop });
    })
    .onEnd(() => {
      if (mode.get() !== DragMode.None) scheduleOnRN(onCommit);
      mode.set(DragMode.None);
    });
}
