import type { SharedValue } from 'react-native-reanimated';

import { useAdjustmentControl } from '../hooks/useAdjustmentControl';
import type { AdjustmentDefinition, Adjustments } from '../types/editor.types';
import { ValueSlider } from './ValueSlider';

type AdjustmentSliderProps = {
  definition: AdjustmentDefinition;
  adjustments: SharedValue<Adjustments>;
};

export function AdjustmentSlider({ definition, adjustments }: AdjustmentSliderProps) {
  const control = useAdjustmentControl(definition.key, adjustments);
  return (
    <ValueSlider
      label={definition.label}
      min={definition.min}
      max={definition.max}
      step={definition.step}
      decimals={definition.decimals}
      defaultValue={definition.defaultValue}
      {...control}
    />
  );
}
