import { EV_STEP, ISO_STOPS, SHUTTER_STOPS } from '../constants/camera.constants';
import type { ExposureReading } from '../types/camera.types';

const SUB_SECOND = 0.3;

export function formatShutter(seconds: number): string {
  if (seconds <= 0) return '--';
  if (seconds < SUB_SECOND) return `1/${Math.round(1 / seconds)}`;
  return `${Number(seconds.toFixed(1))}"`;
}

export function formatIso(iso: number): string {
  return iso > 0 ? `ISO ${Math.round(iso)}` : 'ISO --';
}

export function formatEv(ev: number): string {
  const rounded = Math.round(ev * 10) / 10;
  if (rounded === 0) return '±0.0';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(1)}`;
}

export function shutterStops(min: number, max: number): number[] {
  return SHUTTER_STOPS.filter((s) => s >= min && s <= max);
}

export function isoStops(min: number, max: number): number[] {
  return ISO_STOPS.filter((s) => s >= min && s <= max);
}

export function evStops(min: number, max: number): number[] {
  const stops: number[] = [];
  const steps = Math.floor((max - min) / EV_STEP + 1e-6);
  for (let i = 0; i <= steps; i++) stops.push(Math.round((min + i * EV_STEP) * 100) / 100);
  return stops;
}

export function nearest(values: number[], target: number): number {
  return values.reduce(
    (best, v) => (Math.abs(Math.log(v / target)) < Math.abs(Math.log(best / target)) ? v : best),
    values[0] ?? target,
  );
}

/**
 * Shutter priority: keep the metered exposure (ISO × time), shifted by `ev`
 * stops, and solve for ISO at the chosen shutter speed.
 */
export function isoForShutter(
  reference: ExposureReading,
  shutter: number,
  ev: number,
  range: { min: number; max: number },
): number {
  const iso = ((reference.iso * reference.duration) / shutter) * 2 ** ev;
  return Math.min(range.max, Math.max(range.min, Math.round(iso)));
}

/** Light-meter offset (stops) of a manual exposure versus the auto-metered one. */
export function meterOffset(reference: ExposureReading, iso: number, shutter: number): number {
  return Math.log2((iso * shutter) / (reference.iso * reference.duration));
}
