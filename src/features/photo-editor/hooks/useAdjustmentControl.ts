import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { useEditorStore } from '../store/editor.store';
import type { AdjustmentKey, Adjustments } from '../types/editor.types';

/** Binds one adjustment slider to the UI-thread value and the history store. */
export function useAdjustmentControl(key: AdjustmentKey, adjustments: SharedValue<Adjustments>) {
  const setAdjustment = useEditorStore((s) => s.setAdjustment);

  const value = useDerivedValue(() => adjustments.get()[key]);

  const onChange = (next: number) => {
    'worklet';
    adjustments.set({ ...adjustments.get(), [key]: next });
  };

  const onCommit = (next: number) => setAdjustment(key, next);

  return { value, onChange, onCommit };
}
