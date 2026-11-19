import { useEffect } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { useEditorStore } from '../store/editor.store';
import type { Adjustments, Geometry } from '../types/editor.types';

export type EditorSharedValues = {
  adjustments: SharedValue<Adjustments>;
  geometry: SharedValue<Geometry>;
  /** 1 while the user holds "compare" (shows the original). */
  compare: SharedValue<boolean>;
};

/**
 * UI-thread mirrors of the recipe. Sliders and gestures write here every
 * frame (no React re-render); the store is updated once a gesture ends.
 * Store changes (undo/redo, presets) flow back via the effects.
 */
export function useEditorSharedValues(): EditorSharedValues {
  const recipe = useEditorStore((s) => s.recipe);
  const adjustments = useSharedValue(recipe.adjustments);
  const geometry = useSharedValue(recipe.geometry);
  const compare = useSharedValue(false);

  useEffect(() => {
    adjustments.set(recipe.adjustments);
  }, [adjustments, recipe.adjustments]);

  useEffect(() => {
    geometry.set(recipe.geometry);
  }, [geometry, recipe.geometry]);

  return { adjustments, geometry, compare };
}
