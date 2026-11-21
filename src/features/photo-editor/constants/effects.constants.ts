import type {
  AdjustmentDefinition,
  EffectOption,
  EffectSelection,
  LensEffectId,
  LightFilterId,
} from '../types/editor.types';

/** Modes must match the `lensMode` branches of the photo shader. */
export const LENS_EFFECTS: EffectOption<LensEffectId>[] = [
  { id: 'none', label: 'Không', mode: 0 },
  { id: 'fisheye', label: 'Fish-eye', mode: 1 },
  { id: 'circular', label: 'Mắt cá tròn', mode: 2 },
  { id: 'tiltShift', label: 'Tilt-shift', mode: 3 },
  { id: 'zoomBurst', label: 'Zoom burst', mode: 4 },
  { id: 'vintage', label: 'Lens cổ', mode: 5 },
  { id: 'toy', label: 'Toy / Lomo', mode: 6 },
  { id: 'anamorphic', label: 'Anamorphic', mode: 7 },
];

/** Modes must match the `filterMode` branches of the photo shader. */
export const LIGHT_FILTERS: EffectOption<LightFilterId>[] = [
  { id: 'none', label: 'Không', mode: 0 },
  { id: 'proMist', label: 'Pro-Mist', mode: 1 },
  { id: 'halation', label: 'Halation', mode: 2 },
  { id: 'prism', label: 'Prism', mode: 3 },
  { id: 'lightLeak', label: 'Light leak', mode: 4 },
];

export const NO_EFFECTS: EffectSelection = { lens: 'none', filter: 'none' };

export const LENS_MODES = Object.fromEntries(LENS_EFFECTS.map((e) => [e.id, e.mode])) as Record<
  LensEffectId,
  number
>;

export const FILTER_MODES = Object.fromEntries(LIGHT_FILTERS.map((e) => [e.id, e.mode])) as Record<
  LightFilterId,
  number
>;

const amount = (key: 'lensAmount' | 'filterAmount', label: string): AdjustmentDefinition => ({
  key,
  label,
  min: 0,
  max: 100,
  defaultValue: 60,
  step: 1,
  decimals: 0,
});

export const LENS_AMOUNT_DEFINITION = amount('lensAmount', 'Ống kính');
export const FILTER_AMOUNT_DEFINITION = amount('filterAmount', 'Bộ lọc');

export const getLensEffect = (id: LensEffectId) =>
  LENS_EFFECTS.find((e) => e.id === id) ?? LENS_EFFECTS[0];

export const getLightFilter = (id: LightFilterId) =>
  LIGHT_FILTERS.find((e) => e.id === id) ?? LIGHT_FILTERS[0];

/** Short label of a selection, e.g. "Fish-eye + Halation"; null when nothing is on. */
export function describeEffects(effects: EffectSelection): string | null {
  const parts = [
    effects.lens === 'none' ? null : getLensEffect(effects.lens).label,
    effects.filter === 'none' ? null : getLightFilter(effects.filter).label,
  ].filter(Boolean);
  return parts.length ? parts.join(' + ') : null;
}
