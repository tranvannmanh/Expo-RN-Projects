import { ScrollView, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';

import { FILTER_AMOUNT_DEFINITION, LENS_AMOUNT_DEFINITION } from '../constants/effects.constants';
import { useEditorStore } from '../store/editor.store';
import type { Adjustments } from '../types/editor.types';
import { AdjustmentSlider } from './AdjustmentSlider';
import { EffectPicker } from './EffectPicker';

type EffectsPanelProps = {
  adjustments: SharedValue<Adjustments>;
};

/** Editor tool: lens / light filter selection with a strength slider for each. */
export function EffectsPanel({ adjustments }: EffectsPanelProps) {
  const effects = useEditorStore((s) => s.recipe.effects);
  const setEffects = useEditorStore((s) => s.setEffects);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <EffectPicker value={effects} onChange={setEffects} />
      <View style={styles.sliders}>
        {effects.lens !== 'none' ? (
          <AdjustmentSlider definition={LENS_AMOUNT_DEFINITION} adjustments={adjustments} />
        ) : null}
        {effects.filter !== 'none' ? (
          <AdjustmentSlider definition={FILTER_AMOUNT_DEFINITION} adjustments={adjustments} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  sliders: {
    paddingHorizontal: Spacing.four,
  },
});
