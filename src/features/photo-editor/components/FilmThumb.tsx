import { Canvas, Skia, type SkImage } from '@shopify/react-native-skia';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Radius, Spacing } from '@/constants/theme';

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

const SIZE = EditorLayout.filmThumbSize;

/** Center-crop the thumbnail into a square. */
function coverMatrix(image: SkImage) {
  const scale = SIZE / Math.min(image.width(), image.height());
  const m = Skia.Matrix();
  m.translate((SIZE - image.width() * scale) / 2, (SIZE - image.height() * scale) / 2);
  m.scale(scale, scale);
  return m;
}

export function FilmThumb({ film, image, selected, onPress }: FilmThumbProps) {
  const { lut } = useCurveLut(film);
  const uniforms = buildUniforms(DEFAULT_ADJUSTMENTS, {
    film,
    outSize: { width: SIZE, height: SIZE },
    bypass: false,
    detailScale: 1,
    hasUserCurve: false,
  });

  return (
    <Pressable onPress={() => onPress(film.id)} style={styles.item}>
      <View style={[styles.frame, selected && styles.selected]}>
        {lut ? (
          <Canvas style={styles.canvas}>
            <PhotoRenderNode
              image={image}
              lut={lut}
              uniforms={uniforms}
              matrix={coverMatrix(image)}
              width={SIZE}
              height={SIZE}
            />
          </Canvas>
        ) : null}
      </View>
      <ThemedText type="small" numberOfLines={1} style={selected ? styles.labelActive : styles.label}>
        {film.name}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    width: SIZE + Spacing.two,
    alignItems: 'center',
    gap: Spacing.one,
  },
  frame: {
    borderRadius: Radius.medium,
    overflow: 'hidden',
    borderWidth: EditorLayout.selectedBorder,
    borderColor: EditorColors.background,
  },
  selected: {
    borderColor: EditorColors.accent,
  },
  canvas: {
    width: SIZE,
    height: SIZE,
  },
  label: {
    color: EditorColors.textMuted,
  },
  labelActive: {
    color: EditorColors.accent,
  },
});
