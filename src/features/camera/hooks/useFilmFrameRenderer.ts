import type { SkImage } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { getFilmPreset, useCurveLut } from '@/features/photo-editor';

import { createFilmFrameRenderer } from '../lib/film-frame';

/** Frame worklet for the selected film; rebuilt only when the film changes. */
export function useFilmFrameRenderer(filmId: string, onSample: (sample: SkImage) => void) {
  const film = getFilmPreset(filmId);
  const { lut } = useCurveLut(film);
  return useMemo(
    () => (lut ? createFilmFrameRenderer(film, lut, onSample) : null),
    [film, lut, onSample],
  );
}
