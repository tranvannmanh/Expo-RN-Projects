import { drawAsImage, type SkImage } from '@shopify/react-native-skia';

import { PhotoRenderNode } from '../components/PhotoRenderNode';
import { getFilmPreset } from '../constants/film-presets.constants';
import type { EditRecipe } from '../types/editor.types';
import { isIdentityCurveSet, makeCurveLut } from './curve';
import { imageMatrix, outputSize } from './geometry';
import { buildUniforms } from './uniforms';

/**
 * Renders the recipe onto `source` at its native resolution.
 * `detailScale` = source long edge / preview long edge, so pixel-sized
 * effects (sharpen radius, grain) look the same as in the preview.
 */
export async function renderRecipe(
  source: SkImage,
  recipe: EditRecipe,
  detailScale: number,
): Promise<SkImage> {
  const size = { width: source.width(), height: source.height() };
  const out = outputSize(size, recipe.geometry, false);
  const film = getFilmPreset(recipe.filmId);
  const lut = makeCurveLut(film.curves, recipe.curves);
  if (!lut) throw new Error('Không tạo được bảng curve');

  const uniforms = buildUniforms(recipe.adjustments, {
    film,
    outSize: out,
    bypass: false,
    detailScale,
    hasUserCurve: !isIdentityCurveSet(recipe.curves),
  });

  const result = await drawAsImage(
    <PhotoRenderNode
      image={source}
      lut={lut}
      uniforms={uniforms}
      matrix={imageMatrix(size, recipe.geometry, false)}
      width={out.width}
      height={out.height}
    />,
    out,
  );
  if (!result) throw new Error('Ảnh quá lớn so với bộ nhớ GPU, hãy chọn kích thước nhỏ hơn');
  return result;
}
