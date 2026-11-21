import { FILTER_MODES, LENS_MODES } from '../constants/effects.constants';
import type {
  Adjustments,
  EffectSelection,
  FilmPreset,
  PhotoUniforms,
  Size,
} from '../types/editor.types';

type UniformOptions = {
  film: FilmPreset;
  outSize: Size;
  bypass: boolean;
  /** Output pixels per preview pixel; keeps sharpen / grain consistent on export. */
  detailScale: number;
  hasUserCurve: boolean;
  /** Lens / light filter simulation; omitted = none. */
  effects?: EffectSelection;
};

const MIN_GRAIN_CELL = 1;
const GRAIN_CELL_RANGE = 2.5;

/** Converts slider values (UI ranges) into shader units. */
export function buildUniforms(adj: Adjustments, options: UniformOptions): PhotoUniforms {
  'worklet';
  const p = (v: number) => v / 100;
  const { film } = options;
  const filmStrength = film.id === 'none' ? 0 : p(adj.filmStrength);
  return {
    outSize: [options.outSize.width, options.outSize.height],
    bypass: options.bypass ? 1 : 0,
    exposure: adj.exposure,
    brightness: p(adj.brightness),
    contrast: p(adj.contrast),
    highlights: p(adj.highlights),
    shadows: p(adj.shadows),
    whites: p(adj.whites),
    blacks: p(adj.blacks),
    temperature: p(adj.temperature),
    tint: p(adj.tint),
    saturation: p(adj.saturation),
    vibrance: p(adj.vibrance),
    sharpen: p(adj.sharpen),
    clarity: p(adj.clarity),
    needLocal: adj.clarity !== 0 || adj.highlights !== 0 || adj.shadows !== 0 ? 1 : 0,
    detailScale: Math.max(1, options.detailScale),
    fade: p(adj.fade),
    vignette: p(adj.vignette),
    grain: p(adj.grain),
    grainSize: MIN_GRAIN_CELL + p(adj.grainSize) * GRAIN_CELL_RANGE,
    filmR: film.matrix[0],
    filmG: film.matrix[1],
    filmB: film.matrix[2],
    shadowTint: film.shadowTint,
    highlightTint: film.highlightTint,
    filmSat: film.saturation,
    filmStrength,
    userCurve: options.hasUserCurve ? 1 : 0,
    lensMode: options.effects ? (LENS_MODES[options.effects.lens] ?? 0) : 0,
    lensAmount: p(adj.lensAmount),
    filterMode: options.effects ? (FILTER_MODES[options.effects.filter] ?? 0) : 0,
    filterAmount: p(adj.filterAmount),
  };
}

/**
 * Packs uniforms into the flat float array expected by
 * `RuntimeEffect.makeShaderWithChildren`, in SkSL declaration order.
 */
export function flattenUniforms(u: PhotoUniforms): number[] {
  'worklet';
  return [
    ...u.outSize,
    u.bypass,
    u.exposure,
    u.brightness,
    u.contrast,
    u.highlights,
    u.shadows,
    u.whites,
    u.blacks,
    u.temperature,
    u.tint,
    u.saturation,
    u.vibrance,
    u.sharpen,
    u.clarity,
    u.needLocal,
    u.detailScale,
    u.fade,
    u.vignette,
    u.grain,
    u.grainSize,
    ...u.filmR,
    ...u.filmG,
    ...u.filmB,
    ...u.shadowTint,
    ...u.highlightTint,
    u.filmSat,
    u.filmStrength,
    u.userCurve,
    u.lensMode,
    u.lensAmount,
    u.filterMode,
    u.filterAmount,
  ];
}
