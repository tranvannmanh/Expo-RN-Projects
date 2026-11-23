import type { SkImage } from '@shopify/react-native-skia';

import { DEFAULT_ADJUSTMENTS } from '../constants/adjustments.constants';
import { useCurveLut } from '../hooks/useCurveLut';
import { buildUniforms } from '../lib/uniforms';
import type { FilmPreset } from '../types/editor.types';
import { PREVIEW_CARD_SIZE, PreviewCard } from './PreviewCard';

type FilmThumbProps = {
  film: FilmPreset;
  image: SkImage;
  selected: boolean;
  onPress: (filmId: string) => void;
};

/** Preset card: the sample rendered with this film. */
export function FilmThumb({ film, image, selected, onPress }: FilmThumbProps) {
  const { lut } = useCurveLut(film);
  const uniforms = buildUniforms(DEFAULT_ADJUSTMENTS, {
    film,
    outSize: PREVIEW_CARD_SIZE,
    bypass: false,
    detailScale: 1,
    hasUserCurve: false,
  });

  return (
    <PreviewCard
      image={image}
      lut={lut}
      uniforms={uniforms}
      label={film.name}
      selected={selected}
      onPress={() => onPress(film.id)}
    />
  );
}
