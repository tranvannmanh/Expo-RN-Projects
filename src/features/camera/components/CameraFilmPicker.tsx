import type { SkImage } from '@shopify/react-native-skia';

import { FilmStrip } from '@/features/photo-editor';

import { useCameraStore } from '../store/camera.store';

type CameraFilmPickerProps = {
  sample: SkImage | null;
};

/** Preset cards: each film rendered on a static sample scene. */
export function CameraFilmPicker({ sample }: CameraFilmPickerProps) {
  const filmId = useCameraStore((s) => s.filmId);
  const setFilm = useCameraStore((s) => s.setFilm);
  if (!sample) return null;
  return <FilmStrip image={sample} selectedId={filmId} onSelect={setFilm} />;
}
