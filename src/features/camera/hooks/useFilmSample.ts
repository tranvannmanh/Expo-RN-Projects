import { useImage } from '@shopify/react-native-skia';

const FILM_SAMPLE = require('@/assets/images/film-sample.jpg');

/** Static sample scene that the preset cards render each film on. */
export function useFilmSample() {
  return useImage(FILM_SAMPLE);
}
