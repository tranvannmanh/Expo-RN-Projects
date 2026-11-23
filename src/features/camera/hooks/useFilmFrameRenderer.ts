import { useMemo } from 'react';

import { getFilmPreset, useCurveLut, type EffectSelection } from '@/features/photo-editor';

import { createFilmFrameRenderer } from '../lib/film-frame';
import type { ColorShift } from '../lib/white-balance';

/** Frame worklet for the selected film, effects and colour shift; rebuilt only when they change. */
export function useFilmFrameRenderer(
  filmId: string,
  effects: EffectSelection,
  colorShift: ColorShift,
) {
  const film = getFilmPreset(filmId);
  const { lut } = useCurveLut(film);
  const { temperature, tint } = colorShift;
  return useMemo(
    () => (lut ? createFilmFrameRenderer(film, lut, effects, { temperature, tint }) : null),
    [film, lut, effects, temperature, tint],
  );
}
