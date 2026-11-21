import type { SkImage, SkSize } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { EditorLayout } from '../constants/layout.constants';
import { fitContain, imageMatrix, outputSize } from '../lib/geometry';
import { buildUniforms } from '../lib/uniforms';
import type { EffectSelection, FilmPreset } from '../types/editor.types';
import type { EditorSharedValues } from './useEditorSharedValues';
import type { Viewport } from './useViewportGestures';

type PreviewRenderInput = {
  image: SkImage;
  film: FilmPreset;
  effects: EffectSelection;
  hasUserCurve: boolean;
  cropMode: boolean;
  canvasSize: SharedValue<SkSize>;
  shared: EditorSharedValues;
  viewport: Viewport;
};

/** All per-frame values of the preview canvas, computed on the UI thread. */
export function usePreviewRender({
  image,
  film,
  effects,
  hasUserCurve,
  cropMode,
  canvasSize,
  shared,
  viewport,
}: PreviewRenderInput) {
  const source = { width: image.width(), height: image.height() };

  const outSize = useDerivedValue(() => outputSize(source, shared.geometry.get(), cropMode));
  const width = useDerivedValue(() => outSize.get().width);
  const height = useDerivedValue(() => outSize.get().height);

  const matrix = useDerivedValue(() => imageMatrix(source, shared.geometry.get(), cropMode));

  const uniforms = useDerivedValue(() =>
    buildUniforms(shared.adjustments.get(), {
      film,
      outSize: outSize.get(),
      bypass: shared.compare.get(),
      detailScale: 1,
      hasUserCurve,
      // Distortion would fight the crop handles, so effects are hidden while cropping.
      effects: cropMode ? undefined : effects,
    }),
  );

  const fit = useDerivedValue(() =>
    fitContain(outSize.get(), canvasSize.get(), EditorLayout.canvasPadding),
  );

  /** Display rect of the output frame inside the canvas (used by the crop overlay). */
  const frameRect = useDerivedValue(() => {
    const f = fit.get();
    const out = outSize.get();
    return { x: f.x, y: f.y, width: out.width * f.scale, height: out.height * f.scale };
  });

  const transform = useDerivedValue(() => {
    const f = fit.get();
    const size = canvasSize.get();
    const cx = size.width / 2;
    const cy = size.height / 2;
    const zoom = viewport.zoom.get();
    return [
      { translateX: cx + viewport.panX.get() },
      { translateY: cy + viewport.panY.get() },
      { scale: zoom },
      { translateX: f.x - cx },
      { translateY: f.y - cy },
      { scale: f.scale },
    ];
  });

  return { width, height, matrix, uniforms, transform, frameRect };
}
