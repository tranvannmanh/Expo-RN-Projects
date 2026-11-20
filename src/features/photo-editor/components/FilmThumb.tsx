import { Canvas, Skia, type SkImage } from '@shopify/react-native-skia';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Radius } from '@/constants/theme';

import { DEFAULT_ADJUSTMENTS } from '../constants/adjustments.constants';
import { EditorLayout } from '../constants/layout.constants';
import { useCurveLut } from '../hooks/useCurveLut';
import { buildUniforms } from '../lib/uniforms';
import type { FilmPreset } from '../types/editor.types';
import { PhotoRenderNode } from './PhotoRenderNode';

type FilmThumbProps = {
  film: FilmPreset;
  image: SkImage;
  selected: boolean;
  onPress: (filmId: string) => void;
};

const WIDTH = EditorLayout.filmCardWidth;
const HEIGHT = EditorLayout.filmCardHeight;
const OUT_SIZE = { width: WIDTH, height: HEIGHT };

/** Center-crop the sample image to fill the card. */
function coverMatrix(image: SkImage) {
  const scale = Math.max(WIDTH / image.width(), HEIGHT / image.height());
  const m = Skia.Matrix();
  m.translate((WIDTH - image.width() * scale) / 2, (HEIGHT - image.height() * scale) / 2);
  m.scale(scale, scale);
  return m;
}

/** Preset card: sample rendered with the film, name on a band over the bottom edge. */
export function FilmThumb({ film, image, selected, onPress }: FilmThumbProps) {
  const { lut } = useCurveLut(film);
  const uniforms = buildUniforms(DEFAULT_ADJUSTMENTS, {
    film,
    outSize: OUT_SIZE,
    bypass: false,
    detailScale: 1,
    hasUserCurve: false,
  });

  return (
    <Pressable
      onPress={() => onPress(film.id)}
      style={[styles.card, selected && styles.cardSelected]}>
      {lut ? (
        <Canvas style={styles.canvas}>
          <PhotoRenderNode
            image={image}
            lut={lut}
            uniforms={uniforms}
            matrix={coverMatrix(image)}
            width={WIDTH}
            height={HEIGHT}
          />
        </Canvas>
      ) : null}
      <View style={[styles.band, selected && styles.bandSelected]}>
        <ThemedText
          type="smallBold"
          numberOfLines={1}
          style={selected ? styles.labelSelected : styles.label}>
          {film.name}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: WIDTH + EditorLayout.selectedBorder * 2,
    height: HEIGHT + EditorLayout.selectedBorder * 2,
    borderRadius: Radius.small,
    borderWidth: EditorLayout.selectedBorder,
    borderColor: EditorColors.surfaceHigh,
    overflow: 'hidden',
    backgroundColor: EditorColors.surface,
  },
  cardSelected: {
    borderColor: EditorColors.accent,
  },
  canvas: {
    width: WIDTH,
    height: HEIGHT,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: EditorLayout.filmLabelHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EditorColors.cardLabel,
  },
  bandSelected: {
    backgroundColor: EditorColors.accent,
  },
  label: {
    color: EditorColors.text,
  },
  labelSelected: {
    color: EditorColors.accentText,
  },
});
