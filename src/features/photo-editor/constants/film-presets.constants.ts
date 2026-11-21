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

/** Classic panchromatic response (Kodak Tri-X): a little more red than Acros. */
const TRIX_MIX: Vec3 = [0.32, 0.56, 0.12];

const film = (preset: Partial<FilmPreset> & Pick<FilmPreset, 'id' | 'name'>): FilmPreset => ({
  matrix: IDENTITY_MATRIX,
  shadowTint: NO_TINT,
  highlightTint: NO_TINT,
  saturation: 1,
  ...preset,
  curves: { ...IDENTITY_CURVES, ...preset.curves },
});

/**
 * Approximations of Fujifilm film simulations, Kodak film stocks and the
 * Hasselblad natural colour look, built from a channel mixer, per-channel
 * tone curves, split toning and saturation. Grouped by brand.
 */
export const FILM_PRESETS: FilmPreset[] = [
  film({ id: 'none', name: 'Gốc' }),

  // ── Fujifilm ─────────────────────────────────────────────────────────────
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

  // ── Kodak ────────────────────────────────────────────────────────────────
  film({
    // Fine-grain portrait negative: low contrast, soft pastel colour, warm skin.
    id: 'portra-160',
    name: 'Portra 160',
    saturation: 0.9,
    highlightTint: [0.015, 0.008, -0.01],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0.03], [0.25, 0.27], [0.75, 0.76], [1, 0.98]),
      r: curve([0, 0], [0.5, 0.515], [1, 1]),
      b: curve([0, 0.01], [0.5, 0.49], [1, 0.98]),
    },
  }),
  film({
    // The wedding classic: warm, creamy highlights, gentle contrast, a touch more colour.
    id: 'portra-400',
    name: 'Portra 400',
    saturation: 0.97,
    shadowTint: [0.005, 0.01, 0.0],
    highlightTint: [0.025, 0.012, -0.018],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0.035], [0.25, 0.26], [0.75, 0.775], [1, 0.98]),
      r: curve([0, 0], [0.5, 0.525], [1, 1]),
      g: curve([0, 0], [0.5, 0.505], [1, 1]),
      b: curve([0, 0.015], [0.5, 0.48], [1, 0.97]),
    },
  }),
  film({
    // Landscape negative: the most saturated Kodak, punchy reds, deep blue skies.
    id: 'ektar-100',
    name: 'Ektar 100',
    saturation: 1.3,
    matrix: [
      [1.1, -0.06, -0.04],
      [-0.03, 1.06, -0.03],
      [-0.03, -0.05, 1.08],
    ],
    shadowTint: [-0.005, 0, 0.012],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0], [0.25, 0.2], [0.75, 0.81], [1, 1]),
    },
  }),
  film({
    // Consumer film: golden warmth, yellow highlights, slightly faded blacks.
    id: 'gold-200',
    name: 'Gold 200',
    saturation: 1.1,
    shadowTint: [0.01, 0.005, -0.01],
    highlightTint: [0.04, 0.025, -0.035],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0.04], [0.25, 0.25], [0.75, 0.79], [1, 0.99]),
      r: curve([0, 0], [0.5, 0.53], [1, 1]),
      b: curve([0, 0], [0.5, 0.46], [1, 0.95]),
    },
  }),
  film({
    // Everyday 400: warm and contrasty, a little green in the shadows.
    id: 'ultramax-400',
    name: 'UltraMax 400',
    saturation: 1.15,
    shadowTint: [-0.005, 0.012, 0.0],
    highlightTint: [0.03, 0.015, -0.02],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0.02], [0.25, 0.22], [0.75, 0.8], [1, 0.99]),
      r: curve([0, 0], [0.5, 0.52], [1, 1]),
    },
  }),
  film({
    // Slide film: clean, neutral-cool, crisp contrast and clear blues.
    id: 'ektachrome',
    name: 'Ektachrome',
    saturation: 1.18,
    matrix: [
      [1.03, -0.02, -0.01],
      [-0.02, 1.04, -0.02],
      [-0.01, -0.03, 1.06],
    ],
    shadowTint: [-0.008, 0, 0.012],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0], [0.25, 0.2], [0.75, 0.81], [1, 1]),
      b: curve([0, 0.01], [0.5, 0.52], [1, 1]),
    },
  }),
  film({
    // Kodachrome 64: dense blacks, rich reds and yellows, cyan-leaning blues.
    id: 'kodachrome',
    name: 'Kodachrome',
    saturation: 1.2,
    matrix: [
      [1.12, -0.08, -0.04],
      [-0.02, 1.02, 0.0],
      [-0.04, 0.06, 0.98],
    ],
    shadowTint: [0.005, -0.004, 0.006],
    highlightTint: [0.02, 0.012, -0.02],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0], [0.2, 0.13], [0.5, 0.5], [0.8, 0.84], [1, 0.98]),
    },
  }),
  film({
    // Tri-X 400: punchy black & white with deep blacks and bright, clean whites.
    id: 'tri-x',
    name: 'Tri-X 400',
    saturation: 0,
    matrix: [TRIX_MIX, TRIX_MIX, TRIX_MIX],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0], [0.2, 0.12], [0.5, 0.52], [0.8, 0.88], [1, 1]),
    },
  }),

  // ── Hasselblad ───────────────────────────────────────────────────────────
  film({
    // Natural Colour Solution look: accurate hues, smooth highlight roll-off.
    id: 'hasselblad',
    name: 'Hasselblad',
    saturation: 1.03,
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0.01], [0.25, 0.24], [0.6, 0.62], [0.85, 0.86], [1, 0.97]),
    },
  }),
  film({
    // Medium-format portrait rendering: warmer skin, softer contrast, gentle colour.
    id: 'hasselblad-portrait',
    name: 'HB Portrait',
    saturation: 0.95,
    highlightTint: [0.018, 0.01, -0.012],
    curves: {
      ...IDENTITY_CURVES,
      rgb: curve([0, 0.02], [0.25, 0.26], [0.6, 0.62], [0.85, 0.85], [1, 0.97]),
      r: curve([0, 0], [0.5, 0.515], [1, 1]),
    },
  }),
];

export const DEFAULT_FILM_ID = 'none';

export const getFilmPreset = (id: string): FilmPreset =>
  FILM_PRESETS.find((p) => p.id === id) ?? FILM_PRESETS[0];
