import type { SkImage } from '@shopify/react-native-skia';

import { FilmStrip } from '@/features/photo-editor';

import { useCameraStore } from '../store/camera.store';

type CameraFilmPickerProps = {
  sample: SkImage | null;
};

/** Preset cards rendered on a live frame (or the bundled sample scene). */
export function CameraFilmPicker({ sample }: CameraFilmPickerProps) {
  const filmId = useCameraStore((s) => s.filmId);
  const setFilm = useCameraStore((s) => s.setFilm);
  if (!sample) return null;
  return <FilmStrip image={sample} selectedId={filmId} onSelect={setFilm} />;
}
