import { useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';

import { CURVE_HIT_RADIUS, CURVE_MAX_POINTS } from '../constants/editor.constants';
import { IDENTITY_CURVE } from '../constants/film-presets.constants';
import { EditorLayout } from '../constants/layout.constants';
import { createCurveSampler } from '../lib/curve';
import { useEditorStore } from '../store/editor.store';
import type { CurveChannel, CurvePoint } from '../types/editor.types';

const MIN_GAP = 0.01;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Tap the curve to add a point, drag to move it, drag a middle point out of
 * the box to remove it. Runs on the JS thread: the LUT is tiny (2 KB).
 */
export function useCurveEditor(channel: CurveChannel, boxSize: number) {
  const curves = useEditorStore((s) => s.recipe.curves);
  const checkpoint = useEditorStore((s) => s.checkpoint);
  const setLive = useEditorStore((s) => s.setLive);
  const dragIndex = useRef(-1);
  const removing = useRef(false);

  const points = curves[channel];

  const write = (next: CurvePoint[]) => {
    const latest = useEditorStore.getState().recipe.curves;
    setLive({ curves: { ...latest, [channel]: next } });
  };

  const toNormalized = (x: number, y: number) => ({
    x: x / boxSize,
    y: 1 - y / boxSize,
  });

  const onBegin = (x: number, y: number) => {
    const p = toNormalized(x, y);
    const current = useEditorStore.getState().recipe.curves[channel];
    let index = -1;
    let best = CURVE_HIT_RADIUS;
    current.forEach((pt, i) => {
      const d = Math.hypot(pt.x - p.x, pt.y - p.y);
      if (d < best) {
        best = d;
        index = i;
      }
    });

    checkpoint();
    if (index === -1 && current.length < CURVE_MAX_POINTS) {
      const sorted = [...current].sort((a, b) => a.x - b.x);
      const inserted = { x: clamp01(p.x), y: clamp01(createCurveSampler(sorted)(p.x)) };
      const next = [...sorted, inserted].sort((a, b) => a.x - b.x);
      index = next.indexOf(inserted);
      write(next);
    }
    dragIndex.current = index;
    removing.current = false;
  };

  const onMove = (x: number, y: number) => {
    const index = dragIndex.current;
    if (index === -1) return;
    const p = toNormalized(x, y);
    const current = [...useEditorStore.getState().recipe.curves[channel]].sort((a, b) => a.x - b.x);
    const isEndpoint = index === 0 || index === current.length - 1;
    const outside = p.y < -EditorLayout.curveRemoveDistance || p.y > 1 + EditorLayout.curveRemoveDistance;
    removing.current = outside && !isEndpoint && current.length > 2;

    const minX = index === 0 ? 0 : current[index - 1].x + MIN_GAP;
    const maxX = index === current.length - 1 ? 1 : current[index + 1].x - MIN_GAP;
    current[index] = { x: Math.min(maxX, Math.max(minX, p.x)), y: clamp01(p.y) };
    write(current);
  };

  const onEnd = () => {
    const index = dragIndex.current;
    if (removing.current && index !== -1) {
      const current = [...useEditorStore.getState().recipe.curves[channel]].sort((a, b) => a.x - b.x);
      write(current.filter((_, i) => i !== index));
    }
    dragIndex.current = -1;
    removing.current = false;
  };

  const gesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => onBegin(e.x, e.y))
    .onUpdate((e) => onMove(e.x, e.y))
    .onFinalize(onEnd);

  const resetChannel = () => {
    checkpoint();
    write(IDENTITY_CURVE);
  };

  return { points, curves, gesture, resetChannel };
}
