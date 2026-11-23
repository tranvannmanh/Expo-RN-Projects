import { WB_SHIFT_UNIT } from '../constants/camera.constants';
import type { WhiteBalanceSettings } from '../types/camera.types';

/** Editor adjustments (temperature / tint, ±100) that carry the A–B / G–M fine shift. */
export type ColorShift = { temperature: number; tint: number };

/**
 * The fine shift is applied in the film shader, so the viewfinder and the
 * saved photo match and the editor can still change it later.
 * A (amber) warms, B (blue) cools; M removes green, G adds it.
 */
export function colorShiftOf(wb: WhiteBalanceSettings): ColorShift {
  return { temperature: -wb.ab * WB_SHIFT_UNIT, tint: wb.gm * WB_SHIFT_UNIT };
}

/** Dial label of a shift step: A3 · 0 · B2, or G1 · 0 · M4. */
export function formatShift(step: number, negative: string, positive: string): string {
  if (step === 0) return '0';
  return step < 0 ? `${negative}${-step}` : `${positive}${step}`;
}
