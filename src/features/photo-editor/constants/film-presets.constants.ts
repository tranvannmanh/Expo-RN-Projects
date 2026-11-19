import type { CurvePoint, CurveSet, FilmPreset, Vec3 } from '../types/editor.types';

type Pair = [number, number];

const curve = (...pairs: Pair[]): CurvePoint[] => pairs.map(([x, y]) => ({ x, y }));

export const IDENTITY_CURVE: CurvePoint[] = curve([0, 0], [1, 1]);

export const IDENTITY_CURVES: CurveSet = {
  rgb: IDENTITY_CURVE,
  r: IDENTITY_CURVE,
  g: IDENTITY_CURVE,
  b: IDENTITY_CURVE,
};

const IDENTITY_MATRIX: [Vec3, Vec3, Vec3] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const NO_TINT: Vec3 = [0, 0, 0];

/** Luminance weights of a yellow-green filtered panchromatic B&W stock. */
const MONO_MIX: Vec3 = [0.25, 0.65, 0.1];

const film = (preset: Partial<FilmPreset> & Pick<FilmPreset, 'id' | 'name'>): FilmPreset => ({
  matrix: IDENTITY_MATRIX,
  shadowTint: NO_TINT,
  highlightTint: NO_TINT,
  saturation: 1,
  ...preset,
  curves: { ...IDENTITY_CURVES, ...preset.curves },
});

/**
 * Approximations of Fujifilm film simulations, built from a channel mixer,
 * per-channel tone curves, split toning and saturation.
 */
export const FILM_PRESETS: FilmPreset[] = [
  film({ id: 'none', name: 'Gốc' }),
  film({
    id: 'provia',
    name: 'Provia',
    saturation: 1.08,
    curves: { ...IDENTITY_CURVES, rgb: curve([0, 0], [0.25, 0.22], [0.75, 0.79], [1, 1]) },
  }),
  film({
    id: 'velvia',
    name: 'Velvia',
    saturation: 1.35,
    matrix: [
      [1.08, -0.05, -0.03],
      [-0.04, 1.1, -0.06],
      [-0.02, -0.06, 1.08],
    ],
    shadowTint: [0.01, -0.01, 0.02],
    curves: { ...IDENTITY_CURVES, rgb: curve([0, 0], [0.25, 0.19], [0.75, 0.82], [1, 1]) },
  }),
  film({
    id: 'astia',
    name: 'Astia',
    saturation: 1.1,
    highlightTint: [0.012, 0.004, -0.008],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0], [0.25, 0.235], [0.75, 0.77], [1, 0.99]),
      r: curve([0, 0], [0.5, 0.51], [1, 1]),
    },
  }),
  film({
    id: 'classic-chrome',
    name: 'Classic Chrome',
    saturation: 0.78,
    matrix: [
      [0.95, 0.05, 0],
      [0.02, 0.95, 0.03],
      [0, 0.1, 0.9],
    ],
    shadowTint: [-0.005, 0, 0.01],
    highlightTint: [0.012, 0.006, -0.012],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0.02], [0.2, 0.16], [0.5, 0.5], [0.8, 0.8], [1, 0.96]),
    },
  }),
  film({
    id: 'pro-neg-hi',
    name: 'Pro Neg. Hi',
    saturation: 0.95,
    highlightTint: [0.008, 0.003, -0.004],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0], [0.25, 0.22], [0.75, 0.78], [1, 1]),
      r: curve([0, 0], [0.5, 0.51], [1, 1]),
    },
  }),
  film({
    id: 'pro-neg-std',
    name: 'Pro Neg. Std',
    saturation: 0.88,
    curves: { ...IDENTITY_CURVES, rgb: curve([0, 0.02], [0.25, 0.25], [0.75, 0.74], [1, 0.98]) },
  }),
  film({
    id: 'classic-neg',
    name: 'Classic Neg.',
    saturation: 0.85,
    matrix: [
      [1, 0, 0],
      [0.05, 0.9, 0.05],
      [0, 0, 1],
    ],
    shadowTint: [-0.015, 0.005, 0.01],
    highlightTint: [0.015, 0.005, -0.01],
    curves: {
      rgb: curve([0, 0.03], [0.25, 0.2], [0.5, 0.5], [0.75, 0.8], [1, 0.97]),
      r: curve([0, 0], [0.5, 0.49], [1, 1]),
      g: curve([0, 0.01], [0.5, 0.52], [1, 0.99]),
      b: curve([0, 0.04], [0.5, 0.5], [1, 0.94]),
    },
  }),
  film({
    id: 'eterna',
    name: 'Eterna',
    saturation: 0.72,
    shadowTint: [-0.01, 0.004, 0.012],
    highlightTint: [0.006, 0.004, -0.004],
    curves: { ...IDENTITY_CURVES, rgb: curve([0, 0.05], [0.25, 0.26], [0.75, 0.72], [1, 0.95]) },
  }),
  film({
    id: 'bleach-bypass',
    name: 'Bleach Bypass',
    saturation: 0.4,
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0], [0.2, 0.12], [0.5, 0.5], [0.8, 0.88], [1, 1]),
    },
  }),
  film({
    id: 'nostalgic-neg',
    name: 'Nostalgic Neg.',
    saturation: 1.02,
    highlightTint: [0.025, 0.012, -0.02],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0.03], [0.25, 0.25], [0.75, 0.77], [1, 0.98]),
      r: curve([0, 0], [0.5, 0.52], [1, 1]),
      b: curve([0, 0], [0.5, 0.48], [1, 1]),
    },
  }),
  film({
    id: 'reala-ace',
    name: 'Reala Ace',
    saturation: 1.04,
    curves: { ...IDENTITY_CURVES, rgb: curve([0, 0], [0.25, 0.225], [0.75, 0.78], [1, 1]) },
  }),
  film({
    id: 'acros',
    name: 'Acros',
    saturation: 0,
    matrix: [MONO_MIX, MONO_MIX, MONO_MIX],
    curves: { ...IDENTITY_CURVES, rgb: curve([0, 0], [0.25, 0.2], [0.75, 0.82], [1, 1]) },
  }),
  film({
    id: 'sepia',
    name: 'Sepia',
    saturation: 0,
    matrix: [MONO_MIX, MONO_MIX, MONO_MIX],
    shadowTint: [0.05, 0.015, -0.04],
    highlightTint: [0.07, 0.035, -0.05],
    curves: { ...IDENTITY_CURVES, rgb: curve([0, 0.03], [0.5, 0.52], [1, 0.97]) },
  }),
];

export const DEFAULT_FILM_ID = 'none';

export const getFilmPreset = (id: string): FilmPreset =>
  FILM_PRESETS.find((p) => p.id === id) ?? FILM_PRESETS[0];
