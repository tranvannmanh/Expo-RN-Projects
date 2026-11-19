import type { SkImage } from '@shopify/react-native-skia';
import { FlatList, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';

import { FILM_STRENGTH_DEFINITION } from '../constants/adjustments.constants';
import { FILM_PRESETS } from '../constants/film-presets.constants';
import { useEditorStore } from '../store/editor.store';
import type { Adjustments } from '../types/editor.types';
import { AdjustmentSlider } from './AdjustmentSlider';
import { FilmThumb } from './FilmThumb';

type FilmPanelProps = {
  thumb: SkImage;
  adjustments: SharedValue<Adjustments>;
};

export function FilmPanel({ thumb, adjustments }: FilmPanelProps) {
  const filmId = useEditorStore((s) => s.recipe.filmId);
  const selectFilm = useEditorStore((s) => s.selectFilm);

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={FILM_PRESETS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        initialNumToRender={6}
        renderItem={({ item }) => (
          <FilmThumb film={item} image={thumb} selected={item.id === filmId} onPress={selectFilm} />
        )}
      />
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
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  strength: {
    paddingHorizontal: Spacing.four,
  },
});
