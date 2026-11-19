import type { Adjustments, FilmPreset, PhotoUniforms, Size } from '../types/editor.types';

type UniformOptions = {
  film: FilmPreset;
  outSize: Size;
  bypass: boolean;
  /** Output pixels per preview pixel; keeps sharpen / grain consistent on export. */
  detailScale: number;
  hasUserCurve: boolean;
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
  };
}
