import {
  FilterMode,
  ImageShader,
  MipmapMode,
  Rect,
  Shader,
  type AnimatedProp,
  type SkImage,
  type SkMatrix,
} from '@shopify/react-native-skia';

import { photoEffect } from '../lib/photo.shader';
import type { PhotoUniforms } from '../types/editor.types';

type PhotoRenderNodeProps = {
  image: SkImage;
  lut: SkImage;
  uniforms: AnimatedProp<PhotoUniforms>;
  matrix: AnimatedProp<SkMatrix>;
  width: AnimatedProp<number>;
  height: AnimatedProp<number>;
};

const SAMPLING = { filter: FilterMode.Linear, mipmap: MipmapMode.None };

/**
 * Draws the edited photo in output coordinates (0,0 → width,height).
 * Shared by the live preview, film thumbnails and the full-size export.
 */
export function PhotoRenderNode({ image, lut, uniforms, matrix, width, height }: PhotoRenderNodeProps) {
  return (
    <Rect x={0} y={0} width={width} height={height}>
      <Shader source={photoEffect} uniforms={uniforms}>
        <ImageShader image={image} matrix={matrix} tx="clamp" ty="clamp" sampling={SAMPLING} />
        <ImageShader image={lut} tx="clamp" ty="clamp" sampling={SAMPLING} />
      </Shader>
    </Rect>
  );
}
