import type { SkImage } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';

import { FILM_STRENGTH_DEFINITION } from '../constants/adjustments.constants';
import { useEditorStore } from '../store/editor.store';
import type { Adjustments } from '../types/editor.types';
import { AdjustmentSlider } from './AdjustmentSlider';
import { FilmStrip } from './FilmStrip';

type FilmPanelProps = {
  thumb: SkImage;
  adjustments: SharedValue<Adjustments>;
};

export function FilmPanel({ thumb, adjustments }: FilmPanelProps) {
  const filmId = useEditorStore((s) => s.recipe.filmId);
  const selectFilm = useEditorStore((s) => s.selectFilm);

  return (
    <View style={styles.container}>
      <FilmStrip image={thumb} selectedId={filmId} onSelect={selectFilm} />
      {filmId !== 'none' ? (
        <View style={styles.strength}>
          <AdjustmentSlider definition={FILM_STRENGTH_DEFINITION} adjustments={adjustments} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  strength: {
    paddingHorizontal: Spacing.four,
  },
});
