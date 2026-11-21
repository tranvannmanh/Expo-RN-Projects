import { useMemo } from 'react';

import { getFilmPreset, useCurveLut, type EffectSelection } from '@/features/photo-editor';

import { createFilmFrameRenderer } from '../lib/film-frame';

/** Frame worklet for the selected film and effects; rebuilt only when they change. */
export function useFilmFrameRenderer(filmId: string, effects: EffectSelection) {
  const film = getFilmPreset(filmId);
  const { lut } = useCurveLut(film);
  return useMemo(() => (lut ? createFilmFrameRenderer(film, lut, effects) : null), [film, lut, effects]);
}
