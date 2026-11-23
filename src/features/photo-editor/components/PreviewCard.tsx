import { Canvas, Skia, type SkImage } from '@shopify/react-native-skia';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Radius } from '@/constants/theme';

import { EditorLayout } from '../constants/layout.constants';
import type { PhotoUniforms } from '../types/editor.types';
import { PhotoRenderNode } from './PhotoRenderNode';

type PreviewCardProps = {
  image: SkImage;
  /** Curve texture for the shader; the card stays blank until it is ready. */
  lut: SkImage | null;
  uniforms: PhotoUniforms;
  label: string;
  selected: boolean;
  onPress: () => void;
};

const WIDTH = EditorLayout.filmCardWidth;
const HEIGHT = EditorLayout.filmCardHeight;

/** Center-crop the sample image to fill the card. */
function coverMatrix(image: SkImage) {
  const scale = Math.max(WIDTH / image.width(), HEIGHT / image.height());
  const m = Skia.Matrix();
  m.translate((WIDTH - image.width() * scale) / 2, (HEIGHT - image.height() * scale) / 2);
  m.scale(scale, scale);
  return m;
}

/** Sample image rendered through the photo shader, name on a band over the bottom edge. */
export function PreviewCard({ image, lut, uniforms, label, selected, onPress }: PreviewCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
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
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

/** Output size every preview card renders at. */
export const PREVIEW_CARD_SIZE = { width: WIDTH, height: HEIGHT };

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
