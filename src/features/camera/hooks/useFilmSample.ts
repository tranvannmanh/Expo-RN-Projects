import { useImage, type SkImage } from '@shopify/react-native-skia';
import { useCallback, useState } from 'react';

const FALLBACK_SAMPLE = require('@/assets/images/film-sample.jpg');

/**
 * Image shown in the preset cards: a recent live frame when the Skia preview
 * runs, otherwise a bundled sample scene. Old samples are tiny CPU images and
 * are left to GC, since cards may still be drawing them during the swap.
 */
export function useFilmSample() {
  const fallback = useImage(FALLBACK_SAMPLE);
  const [live, setLive] = useState<SkImage | null>(null);
  const onSample = useCallback((sample: SkImage) => setLive(sample), []);
  return { sample: live ?? fallback, onSample };
}
